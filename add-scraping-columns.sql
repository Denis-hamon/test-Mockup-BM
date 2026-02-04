-- Add scraping method columns to providers table
-- Run on PostgreSQL

-- Add js_render column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'providers' AND column_name = 'js_render') THEN
        ALTER TABLE providers ADD COLUMN js_render BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added js_render column';
    ELSE
        RAISE NOTICE 'js_render column already exists';
    END IF;
END $$;

-- Add scraping_method column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'providers' AND column_name = 'scraping_method') THEN
        ALTER TABLE providers ADD COLUMN scraping_method VARCHAR(50) DEFAULT 'firecrawl';
        RAISE NOTICE 'Added scraping_method column';
    ELSE
        RAISE NOTICE 'scraping_method column already exists';
    END IF;
END $$;

-- Create index on providers for quick lookup
CREATE INDEX IF NOT EXISTS idx_providers_scraping_method ON providers(scraping_method);

-- Verify columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'providers'
  AND column_name IN ('js_render', 'scraping_method');
