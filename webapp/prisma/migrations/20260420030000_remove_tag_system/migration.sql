-- Drop tag system tables in FK dependency order.
-- CASCADE removes FKs and indexes; IF EXISTS keeps this idempotent across dev/prod DBs.
DROP TABLE IF EXISTS "SeenItemTag" CASCADE;
DROP TABLE IF EXISTS "TagRule" CASCADE;
DROP TABLE IF EXISTS "KeywordTag" CASCADE;
DROP TABLE IF EXISTS "CircleFollowTag" CASCADE;
DROP TABLE IF EXISTS "Tag" CASCADE;
