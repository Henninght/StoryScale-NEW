-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create pattern embeddings table
CREATE TABLE IF NOT EXISTS pattern_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_id UUID REFERENCES user_patterns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Vector embedding (1536 dimensions for OpenAI ada-002)
    embedding vector(1536),
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient similarity search
-- Using IVFFlat index for approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS pattern_embeddings_embedding_idx 
ON pattern_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS pattern_embeddings_user_id_idx ON pattern_embeddings(user_id);
CREATE INDEX IF NOT EXISTS pattern_embeddings_pattern_id_idx ON pattern_embeddings(pattern_id);

-- Function to search similar patterns with cosine similarity
CREATE OR REPLACE FUNCTION search_similar_patterns(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    pattern_id uuid,
    user_id uuid,
    similarity float,
    metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pe.id,
        pe.pattern_id,
        pe.user_id,
        1 - (pe.embedding <=> query_embedding) as similarity,
        pe.metadata
    FROM pattern_embeddings pe
    WHERE 
        (filter_user_id IS NULL OR pe.user_id = filter_user_id)
        AND 1 - (pe.embedding <=> query_embedding) > match_threshold
    ORDER BY pe.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to get top patterns for a user
CREATE OR REPLACE FUNCTION get_top_user_patterns(
    target_user_id uuid,
    limit_count int DEFAULT 3
)
RETURNS TABLE (
    pattern_id uuid,
    pattern_type text,
    pattern_data jsonb,
    confidence_score decimal,
    sample_size integer
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id as pattern_id,
        up.pattern_type,
        up.pattern_data,
        up.confidence_score,
        up.sample_size
    FROM user_patterns up
    WHERE 
        up.user_id = target_user_id
        AND up.confidence_score >= 0.7
    ORDER BY up.confidence_score DESC, up.sample_size DESC
    LIMIT limit_count;
END;
$$;

-- Function to update pattern confidence based on reinforcement
CREATE OR REPLACE FUNCTION reinforce_pattern(
    target_pattern_id uuid,
    engagement_score integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    current_confidence decimal;
    current_sample_size integer;
    new_confidence decimal;
BEGIN
    -- Get current values
    SELECT confidence_score, sample_size 
    INTO current_confidence, current_sample_size
    FROM user_patterns 
    WHERE id = target_pattern_id;
    
    -- Calculate new confidence using weighted average
    -- Higher engagement increases confidence
    new_confidence := LEAST(
        1.0,
        current_confidence + (CASE 
            WHEN engagement_score > 1000 THEN 0.1
            WHEN engagement_score > 500 THEN 0.05
            ELSE 0.02
        END)
    );
    
    -- Update pattern
    UPDATE user_patterns
    SET 
        confidence_score = new_confidence,
        sample_size = current_sample_size + 1,
        last_reinforced = NOW()
    WHERE id = target_pattern_id;
END;
$$;

-- Row Level Security for pattern_embeddings
ALTER TABLE pattern_embeddings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own pattern embeddings
CREATE POLICY "Users can view own pattern embeddings" ON pattern_embeddings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own pattern embeddings
CREATE POLICY "Users can insert own pattern embeddings" ON pattern_embeddings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pattern embeddings
CREATE POLICY "Users can update own pattern embeddings" ON pattern_embeddings
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own pattern embeddings
CREATE POLICY "Users can delete own pattern embeddings" ON pattern_embeddings
    FOR DELETE USING (auth.uid() = user_id);