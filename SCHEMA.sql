-- StoryScale Database Schema
-- Execute this complete script in Supabase SQL Editor

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    provider TEXT DEFAULT 'guest', -- 'guest', 'google', 'email'
    guest_session_id TEXT UNIQUE, -- For guest users
    preferences JSONB DEFAULT '{}',
    quota_usage JSONB DEFAULT '{"documents": 0, "research_calls": 0}',
    subscription_tier TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    migrated_from_guest BOOLEAN DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT valid_provider CHECK (provider IN ('guest', 'google', 'email')),
    CONSTRAINT valid_tier CHECK (subscription_tier IN ('free', 'pro', 'enterprise'))
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Document identification (AI-powered classification)
    type TEXT NOT NULL, -- 'linkedin', 'blog', 'marketing', 'image', 'text'
    media_type TEXT NOT NULL, -- 'text-only', 'image', 'video', 'carousel'
    purpose TEXT NOT NULL, -- 'thought-leadership', 'question', 'value', 'authority'
    format TEXT NOT NULL, -- 'story', 'insight', 'list', 'howto', 'question'
    
    -- Content storage with length variants
    content JSONB NOT NULL DEFAULT '{}', -- {short, medium, long, selected}
    selected_length TEXT DEFAULT 'medium',
    
    -- AI metadata
    ai_confidence DECIMAL(3,2),
    generation_model TEXT,
    processing_time_ms INTEGER,
    
    -- User interaction
    status TEXT DEFAULT 'draft', -- 'draft', 'published', 'archived'
    engagement_data JSONB DEFAULT '{}', -- Platform-specific engagement
    
    -- Pattern learning
    template_id UUID,
    success_score DECIMAL(3,2), -- Based on engagement
    
    -- Generated metadata
    title TEXT GENERATED ALWAYS AS (
        COALESCE(
            content->>'title',
            LEFT(content->>'selected', 50) || '...'
        )
    ) STORED,
    character_count INTEGER GENERATED ALWAYS AS (
        LENGTH(content->>'selected')
    ) STORED,
    emoji TEXT, -- AI-suggested emoji
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Full-text search optimization
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', 
            COALESCE(content->>'selected', '') || ' ' ||
            COALESCE(
                content->>'title',
                LEFT(content->>'selected', 50) || '...'
            ) || ' ' ||
            type || ' ' || purpose || ' ' || format
        )
    ) STORED,
    
    -- Constraints for document identification
    CONSTRAINT valid_type CHECK (type IN ('linkedin', 'blog', 'marketing', 'image', 'text')),
    CONSTRAINT valid_media_type CHECK (media_type IN ('text-only', 'image', 'video', 'carousel')),
    CONSTRAINT valid_purpose CHECK (purpose IN ('thought-leadership', 'question', 'value', 'authority')),
    CONSTRAINT valid_format CHECK (format IN ('story', 'insight', 'list', 'howto', 'question')),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'archived')),
    CONSTRAINT valid_length CHECK (selected_length IN ('short', 'medium', 'long'))
);

-- Sources table for research attribution
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Source identification
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    publication_date DATE,
    source_type TEXT NOT NULL, -- 'article', 'blog', 'social', 'academic', 'news'
    
    -- Content storage for complete attribution
    full_context TEXT NOT NULL, -- Complete extracted content
    used_snippets JSONB NOT NULL DEFAULT '[]', -- Array of used text snippets
    citations JSONB DEFAULT '[]', -- Where in document this source was cited
    
    -- Research metadata
    provider TEXT NOT NULL, -- 'firecrawl', 'tavily', 'manual'
    relevance_score DECIMAL(3,2),
    extraction_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Caching optimization
    cache_key TEXT UNIQUE, -- For deduplication
    cache_expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Content search optimization
    content_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', full_context || ' ' || title)
    ) STORED,
    
    -- Constraints
    CONSTRAINT valid_source_type CHECK (source_type IN ('article', 'blog', 'social', 'academic', 'news')),
    CONSTRAINT valid_provider CHECK (provider IN ('firecrawl', 'tavily', 'manual'))
);

-- User patterns table for AI learning
CREATE TABLE user_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Pattern identification
    pattern_type TEXT NOT NULL, -- 'successful_post', 'template', 'style_preference'
    
    -- Pattern data storage
    pattern_data JSONB NOT NULL,
    
    -- Learning metadata
    confidence_score DECIMAL(3,2),
    sample_size INTEGER DEFAULT 1,
    last_reinforced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_pattern_type CHECK (pattern_type IN ('successful_post', 'template', 'style_preference'))
);

-- Templates table
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pattern_id UUID REFERENCES user_patterns(id),
    
    -- Template identification
    name TEXT NOT NULL,
    description TEXT,
    
    -- Template structure
    structure JSONB NOT NULL,
    
    -- Performance metrics
    use_count INTEGER DEFAULT 0,
    avg_engagement DECIMAL(5,2),
    success_rate DECIMAL(3,2),
    
    -- Template metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_ai_generated BOOLEAN DEFAULT TRUE,
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for documents.template_id
ALTER TABLE documents ADD CONSTRAINT fk_documents_template_id 
    FOREIGN KEY (template_id) REFERENCES templates(id);

-- Document performance tracking
CREATE TABLE document_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Platform-specific metrics
    platform TEXT NOT NULL, -- 'linkedin', 'twitter', 'blog'
    engagement_metrics JSONB NOT NULL,
    
    -- Timing data
    posted_at TIMESTAMP WITH TIME ZONE,
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Computed performance score
    performance_score DECIMAL(3,2) GENERATED ALWAYS AS (
        LEAST(((engagement_metrics->>'total_engagement')::INTEGER / 100.0), 1.0)
    ) STORED,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guest sessions table
CREATE TABLE guest_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    
    -- Session data
    session_data JSONB DEFAULT '{}',
    document_count INTEGER DEFAULT 0,
    research_count INTEGER DEFAULT 0,
    
    -- Expiration management
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Migration tracking
    migrated_to_user_id UUID REFERENCES users(id),
    migrated_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration logs table
CREATE TABLE migration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_session_id TEXT NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    
    -- Migration details
    documents_migrated INTEGER DEFAULT 0,
    patterns_migrated INTEGER DEFAULT 0,
    migration_status TEXT DEFAULT 'pending',
    error_details TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_migration_status CHECK (migration_status IN ('pending', 'completed', 'failed'))
);

-- Performance indexes
CREATE INDEX idx_documents_user_type ON documents(user_id, type);
CREATE INDEX idx_documents_user_status ON documents(user_id, status);
CREATE INDEX idx_documents_user_created ON documents(user_id, created_at DESC);
CREATE INDEX idx_documents_search_vector ON documents USING GIN(search_vector);
CREATE INDEX idx_documents_purpose_format ON documents(purpose, format);

-- Source optimization indexes
CREATE INDEX idx_sources_document ON sources(document_id);
CREATE INDEX idx_sources_cache_key ON sources(cache_key) WHERE cache_key IS NOT NULL;
CREATE INDEX idx_sources_cache_expires ON sources(cache_expires_at) WHERE cache_expires_at IS NOT NULL;
CREATE INDEX idx_sources_content_vector ON sources USING GIN(content_vector);
CREATE INDEX idx_sources_url_hash ON sources(md5(url));

-- Pattern learning indexes
CREATE INDEX idx_user_patterns_user ON user_patterns(user_id, pattern_type);
CREATE INDEX idx_user_patterns_updated ON user_patterns(user_id, updated_at DESC);
CREATE INDEX idx_templates_user_active ON templates(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_document_performance_document ON document_performance(document_id);

-- Session management indexes
CREATE INDEX idx_guest_sessions_expires ON guest_sessions(expires_at);
CREATE INDEX idx_guest_sessions_session_id ON guest_sessions(session_id);
CREATE INDEX idx_users_guest_session ON users(guest_session_id) WHERE guest_session_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own record" ON users
    FOR SELECT USING (auth.uid() = id OR (provider = 'guest' AND auth.uid() IS NULL));

CREATE POLICY "Users can update own record" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (EXISTS (
            SELECT 1 FROM users 
            WHERE id = documents.user_id 
            AND provider = 'guest' 
            AND auth.uid() IS NULL
        ))
    );

CREATE POLICY "Users can create documents" ON documents
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view sources of own documents" ON sources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = sources.document_id 
            AND (d.user_id = auth.uid() OR 
                 EXISTS (
                     SELECT 1 FROM users u 
                     WHERE u.id = d.user_id 
                     AND u.provider = 'guest' 
                     AND auth.uid() IS NULL
                 ))
        )
    );

CREATE POLICY "Users can manage own patterns" ON user_patterns
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage own templates" ON templates
    FOR ALL USING (user_id = auth.uid());