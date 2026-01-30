-- Migration: Create PostgreSQL triggers for Content Pipeline
-- Date: 2026-01-30

-- ============================================================
-- TRIGGER 1: Prevent duplicate articles (BEFORE INSERT)
-- ============================================================
CREATE OR REPLACE FUNCTION check_duplicate_article()
RETURNS TRIGGER AS $func$
DECLARE
    existing_id INTEGER;
BEGIN
    -- Only check for parent articles (not translations)
    IF NEW.parent_article_id IS NULL THEN
        -- Check duplicate title
        SELECT id INTO existing_id FROM articles
        WHERE original_title = NEW.original_title
          AND parent_article_id IS NULL
          AND id != COALESCE(NEW.id, 0)
        LIMIT 1;

        IF existing_id IS NOT NULL THEN
            RETURN NULL; -- Silently skip duplicate
        END IF;

        -- Check duplicate source_url
        IF NEW.source_url IS NOT NULL THEN
            SELECT id INTO existing_id FROM articles
            WHERE source_url = NEW.source_url
              AND parent_article_id IS NULL
              AND id != COALESCE(NEW.id, 0)
            LIMIT 1;

            IF existing_id IS NOT NULL THEN
                RETURN NULL; -- Silently skip duplicate
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_duplicate_article_trigger ON articles;
CREATE TRIGGER check_duplicate_article_trigger
BEFORE INSERT ON articles
FOR EACH ROW
EXECUTE FUNCTION check_duplicate_article();

-- ============================================================
-- TRIGGER 2: Notify on new article insert (AFTER INSERT)
-- ============================================================
CREATE OR REPLACE FUNCTION notify_new_article()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'scraped' THEN
        PERFORM pg_notify('new_article', json_build_object(
            'id', NEW.id,
            'title', NEW.original_title,
            'provider_id', NEW.provider_id
        )::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS article_insert_trigger ON articles;
CREATE TRIGGER article_insert_trigger
AFTER INSERT ON articles
FOR EACH ROW
EXECUTE FUNCTION notify_new_article();

-- ============================================================
-- TRIGGER 3: Notify on transform request (AFTER UPDATE)
-- ============================================================
CREATE OR REPLACE FUNCTION notify_transform_request()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pending_transform' AND OLD.status != 'pending_transform' THEN
        PERFORM pg_notify('transform_article', json_build_object(
            'id', NEW.id,
            'title', NEW.original_title
        )::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS article_transform_trigger ON articles;
CREATE TRIGGER article_transform_trigger
AFTER UPDATE ON articles
FOR EACH ROW
EXECUTE FUNCTION notify_transform_request();

-- ============================================================
-- TRIGGER 4: Notify for translation when transformed (AFTER UPDATE)
-- ============================================================
CREATE OR REPLACE FUNCTION notify_translation_needed()
RETURNS TRIGGER AS $$
BEGIN
    -- Only translate parent articles (not translations themselves)
    IF NEW.parent_article_id IS NULL THEN
        PERFORM pg_notify('translate_article', json_build_object(
            'id', NEW.id,
            'title', COALESCE(NEW.transformed_title, NEW.original_title),
            'language', NEW.language
        )::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS article_translation_trigger ON articles;
CREATE TRIGGER article_translation_trigger
AFTER UPDATE ON articles
FOR EACH ROW
WHEN (NEW.status = 'transformed' AND OLD.status IS DISTINCT FROM 'transformed')
EXECUTE FUNCTION notify_translation_needed();

-- ============================================================
-- Summary of triggers:
-- 1. check_duplicate_article_trigger - BEFORE INSERT - Prevents duplicates
-- 2. article_insert_trigger - AFTER INSERT - Queues transformation
-- 3. article_transform_trigger - AFTER UPDATE - Queues transformation
-- 4. article_translation_trigger - AFTER UPDATE - Queues translation to all languages
-- ============================================================
