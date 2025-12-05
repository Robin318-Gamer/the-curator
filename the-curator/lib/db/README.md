# Database Migration Instructions

## Overview
The schema defined in `lib/db/migrations.sql` is the ground truth for The Curator. Running the file drops every existing table, creates the `newslist`/`news_sources`/`articles` stack needed for scraping, wires the scheduling tables, and publishes the `reset_curator_schema` stored procedure that can be invoked manually or from the admin reset endpoint.

## Running the Migration

1. Open the Supabase dashboard for project `xulrcvbfwhhdtggkpcge` and navigate to SQL Editor.
2. Paste the contents of `lib/db/migrations.sql` into a new query and run it. The script automatically drops old tables, defines the new schema, and seeds the `hk01` source.
3. When execution completes, `public.reset_curator_schema()` has already run once. If you prefer to rerun, issue `SELECT public.reset_curator_schema();` (requires the service role key).

## Schema Highlights

- `news_sources`: configuration for each scraper (source key, base URL, selectors).
- `scraper_categories`: scheduler metadata used by `CategoryScheduler` to pick which category to run next.
- `newslist`: queue of discovered article URLs with status tracking for `app/api/scraper/article`.
- `articles` + `article_images`: normalized storage for imported article data and media.
- `automation_history`: audit trail for automation runs (status, errors, processed counts).

Each table has `ROW LEVEL SECURITY` policies so only authenticated or service-role clients can mutate sensitive records, while public reads are intentionally open for downstream analytics.

## Testing Automation Endpoints

The automation UI/API lives in The Curator app: use the `/api/automation/bulk-save/[slug]` route (see `app/api/automation/bulk-save/[slug]/route.ts`) to seed `newslist` with the latest HK01 or Ming Pao links, then trigger `/api/scraper/article` to process them. Each call also records entries in `automation_history` so you can monitor the status of automation runs.

## Rollback

If you need to start over:

```sql
SELECT public.reset_curator_schema();
```

This function exists so you do not have to manually drop tables again; it cleans everything and recreates the schema in one statement.
