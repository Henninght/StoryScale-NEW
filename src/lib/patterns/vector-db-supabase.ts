/**
 * Supabase Vector Database Implementation using pgvector
 * Leverages Supabase's built-in vector similarity search capabilities
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface VectorDocument {
  id: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export interface VectorSearchResult {
  id: string;
  similarity: number;
  metadata: Record<string, any>;
}

export interface SupabaseVectorConfig {
  supabaseUrl: string;
  supabaseKey: string;
  tableName?: string;
  embeddingDimension?: number;
}

/**
 * SQL to create the pattern embeddings table with pgvector
 * Run this in Supabase SQL editor first:
 * 
 * -- Enable pgvector extension
 * CREATE EXTENSION IF NOT EXISTS vector;
 * 
 * -- Create pattern embeddings table
 * CREATE TABLE pattern_embeddings (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     pattern_id UUID REFERENCES user_patterns(id) ON DELETE CASCADE,
 *     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
 *     embedding vector(1536), -- OpenAI ada-002 dimension
 *     metadata JSONB DEFAULT '{}',
 *     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- Create indexes for efficient similarity search
 * CREATE INDEX pattern_embeddings_embedding_idx ON pattern_embeddings 
 * USING ivfflat (embedding vector_cosine_ops)
 * WITH (lists = 100);
 * 
 * CREATE INDEX pattern_embeddings_user_id_idx ON pattern_embeddings(user_id);
 * CREATE INDEX pattern_embeddings_pattern_id_idx ON pattern_embeddings(pattern_id);
 * 
 * -- Function to search similar patterns
 * CREATE OR REPLACE FUNCTION search_similar_patterns(
 *     query_embedding vector(1536),
 *     match_threshold float DEFAULT 0.7,
 *     match_count int DEFAULT 10,
 *     filter_user_id uuid DEFAULT NULL
 * )
 * RETURNS TABLE (
 *     id uuid,
 *     pattern_id uuid,
 *     user_id uuid,
 *     similarity float,
 *     metadata jsonb
 * )
 * LANGUAGE plpgsql
 * AS $$
 * BEGIN
 *     RETURN QUERY
 *     SELECT 
 *         pe.id,
 *         pe.pattern_id,
 *         pe.user_id,
 *         1 - (pe.embedding <=> query_embedding) as similarity,
 *         pe.metadata
 *     FROM pattern_embeddings pe
 *     WHERE 
 *         (filter_user_id IS NULL OR pe.user_id = filter_user_id)
 *         AND 1 - (pe.embedding <=> query_embedding) > match_threshold
 *     ORDER BY pe.embedding <=> query_embedding
 *     LIMIT match_count;
 * END;
 * $$;
 */

export class SupabaseVectorDB {
  private client: SupabaseClient;
  private tableName: string;
  private dimension: number;

  constructor(config: SupabaseVectorConfig) {
    this.client = createClient(config.supabaseUrl, config.supabaseKey);
    this.tableName = config.tableName || 'pattern_embeddings';
    this.dimension = config.embeddingDimension || 1536; // OpenAI ada-002 default
  }

  /**
   * Initialize the vector database (create table if not exists)
   */
  async initialize(): Promise<void> {
    try {
      // Check if pgvector extension is enabled
      const { data: extensions, error: extError } = await this.client
        .rpc('get_extensions')
        .single();

      if (extError) {
        console.log('Note: pgvector extension needs to be enabled in Supabase dashboard');
      }

      // Check if table exists
      const { data: tables, error: tableError } = await this.client
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', this.tableName)
        .single();

      if (!tables && !tableError) {
        console.log(`Table ${this.tableName} does not exist. Please create it using the SQL provided in comments.`);
      }
    } catch (error) {
      console.error('Error initializing SupabaseVectorDB:', error);
    }
  }

  /**
   * Upsert pattern embeddings
   */
  async upsert(documents: VectorDocument[]): Promise<void> {
    const records = documents.map(doc => ({
      id: doc.id,
      embedding: doc.embedding,
      metadata: doc.metadata,
      pattern_id: doc.metadata.pattern_id,
      user_id: doc.metadata.user_id,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await this.client
      .from(this.tableName)
      .upsert(records, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to upsert embeddings: ${error.message}`);
    }
  }

  /**
   * Search for similar patterns using vector similarity
   */
  async search(
    queryEmbedding: number[],
    options?: {
      threshold?: number;
      topK?: number;
      userId?: string;
    }
  ): Promise<VectorSearchResult[]> {
    const threshold = options?.threshold || 0.7;
    const topK = options?.topK || 10;

    try {
      // Use the RPC function for similarity search
      const { data, error } = await this.client
        .rpc('search_similar_patterns', {
          query_embedding: queryEmbedding,
          match_threshold: threshold,
          match_count: topK,
          filter_user_id: options?.userId || null,
        });

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      return (data || []).map((result: any) => ({
        id: result.pattern_id,
        similarity: result.similarity,
        metadata: result.metadata,
      }));
    } catch (error) {
      console.error('Error searching patterns:', error);
      
      // Fallback to direct query if RPC doesn't exist
      return this.fallbackSearch(queryEmbedding, options);
    }
  }

  /**
   * Fallback search using direct SQL query
   */
  private async fallbackSearch(
    queryEmbedding: number[],
    options?: {
      threshold?: number;
      topK?: number;
      userId?: string;
    }
  ): Promise<VectorSearchResult[]> {
    const threshold = options?.threshold || 0.7;
    const topK = options?.topK || 10;

    // Convert embedding to PostgreSQL array format
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    let query = this.client
      .from(this.tableName)
      .select('*');

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    const { data, error } = await query.limit(topK);

    if (error) {
      throw new Error(`Fallback search failed: ${error.message}`);
    }

    // Calculate similarities client-side (not ideal but works as fallback)
    const results = (data || []).map((row: any) => {
      const similarity = this.cosineSimilarity(queryEmbedding, row.embedding);
      return {
        id: row.pattern_id,
        similarity,
        metadata: row.metadata,
      };
    });

    return results
      .filter(r => r.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Delete pattern embeddings
   */
  async delete(ids: string[]): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .in('pattern_id', ids);

    if (error) {
      throw new Error(`Failed to delete embeddings: ${error.message}`);
    }
  }

  /**
   * Get pattern embedding by pattern ID
   */
  async getEmbedding(patternId: string): Promise<number[] | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('embedding')
      .eq('pattern_id', patternId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.embedding;
  }

  /**
   * Update pattern metadata
   */
  async updateMetadata(patternId: string, metadata: Record<string, any>): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .update({ 
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq('pattern_id', patternId);

    if (error) {
      throw new Error(`Failed to update metadata: ${error.message}`);
    }
  }

  /**
   * Get all patterns for a user
   */
  async getUserPatterns(userId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user patterns: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Batch process patterns for embeddings
   */
  async batchProcessPatterns(
    patterns: Array<{
      id: string;
      userId: string;
      text: string;
      metadata?: Record<string, any>;
    }>,
    generateEmbedding: (text: string) => Promise<number[]>
  ): Promise<void> {
    const batchSize = 10;
    
    for (let i = 0; i < patterns.length; i += batchSize) {
      const batch = patterns.slice(i, i + batchSize);
      
      const documents = await Promise.all(
        batch.map(async (pattern) => ({
          id: pattern.id,
          embedding: await generateEmbedding(pattern.text),
          metadata: {
            ...pattern.metadata,
            pattern_id: pattern.id,
            user_id: pattern.userId,
          },
        }))
      );

      await this.upsert(documents);
    }
  }
}