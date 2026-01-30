-- Migration 002: Backend Schema for New Frontend Support
-- Date: 2026-01-30
-- Description: Creates activity_log, collection_jobs tables and modifies providers/articles

-- ============================================================
-- TABLE 1: activity_log (nouvelle)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- collection, transformation, translation, error, publish, delete
  message TEXT NOT NULL,
  article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
  provider_id INTEGER REFERENCES providers(id) ON DELETE SET NULL,
  job_id INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(type);
CREATE INDEX IF NOT EXISTS idx_activity_log_article_id ON activity_log(article_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_provider_id ON activity_log(provider_id);

-- ============================================================
-- TABLE 2: collection_jobs (nouvelle)
-- ============================================================
CREATE TABLE IF NOT EXISTS collection_jobs (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'running', -- running, paused, completed, error
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  articles_found INTEGER DEFAULT 0,
  articles_processed INTEGER DEFAULT 0,
  estimated_total INTEGER DEFAULT 0,
  articles_per_hour INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  recent_discoveries JSONB DEFAULT '[]',
  logs JSONB DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_collection_jobs_status ON collection_jobs(status);
CREATE INDEX IF NOT EXISTS idx_collection_jobs_provider_id ON collection_jobs(provider_id);
CREATE INDEX IF NOT EXISTS idx_collection_jobs_started_at ON collection_jobs(started_at DESC);

-- Add foreign key reference from activity_log to collection_jobs
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_job_id_fkey;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_job_id_fkey
  FOREIGN KEY (job_id) REFERENCES collection_jobs(id) ON DELETE SET NULL;

-- ============================================================
-- MODIFY TABLE: providers (nouveaux champs)
-- ============================================================
ALTER TABLE providers ADD COLUMN IF NOT EXISTS domain VARCHAR(255);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'; -- active, paused, scheduled
ALTER TABLE providers ADD COLUMN IF NOT EXISTS last_run TIMESTAMP;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS next_run TIMESTAMP;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS success_rate DECIMAL(5,2) DEFAULT 100.00;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS schedule VARCHAR(20) DEFAULT 'manual'; -- manual, one-time, daily, weekly, monthly
ALTER TABLE providers ADD COLUMN IF NOT EXISTS crawl_depth INTEGER DEFAULT 2;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS include_patterns JSONB DEFAULT '[]';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS exclude_patterns JSONB DEFAULT '[]';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS target_url TEXT;

-- ============================================================
-- MODIFY TABLE: articles (nouveaux champs)
-- ============================================================
ALTER TABLE articles ADD COLUMN IF NOT EXISTS transformed_at TIMESTAMP;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;

-- ============================================================
-- UPDATE triggers: Update transformed_at when status changes
-- ============================================================
CREATE OR REPLACE FUNCTION update_article_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Set transformed_at when status becomes 'transformed'
    IF NEW.status = 'transformed' AND (OLD.status IS NULL OR OLD.status != 'transformed') THEN
        NEW.transformed_at = CURRENT_TIMESTAMP;
    END IF;

    -- Set published_at when status becomes 'published'
    IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
        NEW.published_at = CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS article_timestamp_trigger ON articles;
CREATE TRIGGER article_timestamp_trigger
BEFORE UPDATE ON articles
FOR EACH ROW
EXECUTE FUNCTION update_article_timestamps();

-- ============================================================
-- Populate domain field for existing providers
-- ============================================================
UPDATE providers SET domain =
  CASE
    WHEN base_urls::text LIKE '%hostinger%' THEN 'hostinger.com'
    WHEN base_urls::text LIKE '%digitalocean%' THEN 'digitalocean.com'
    WHEN base_urls::text LIKE '%linode%' THEN 'linode.com'
    WHEN base_urls::text LIKE '%vultr%' THEN 'vultr.com'
    WHEN base_urls::text LIKE '%hetzner%' THEN 'hetzner.com'
    ELSE slug || '.com'
  END
WHERE domain IS NULL;

-- ============================================================
-- Create settings table for app configuration
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('autoTransform', '{"enabled": true}'),
  ('autoTranslate', '{"enabled": true, "targetLanguages": ["fr", "en", "es", "de", "it", "pt", "nl", "pl"]}'),
  ('ovhAi', '{"endpoint": "https://deepseek-r1-distill-llama-70b.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1", "model": "DeepSeek-R1-Distill-Llama-70B"}'),
  ('firecrawl', '{"url": "http://91.134.72.199:3002"}')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Summary of changes:
-- 1. Created activity_log table for tracking all events
-- 2. Created collection_jobs table for job tracking
-- 3. Added columns to providers: domain, status, last_run, next_run, success_rate, schedule, crawl_depth, include_patterns, exclude_patterns
-- 4. Added columns to articles: transformed_at, published_at, seo_score
-- 5. Created trigger for automatic timestamp updates
-- 6. Created settings table for app configuration
-- ============================================================
