-- Check if MingPao source exists in news_sources table
SELECT id, source_key, name, base_url, is_active
FROM news_sources
WHERE source_key = 'mingpao';

-- Check if there are any MingPao categories in scraper_categories table
SELECT 
  sc.id,
  sc.slug,
  sc.name,
  sc.priority,
  sc.is_enabled,
  sc.last_run_at,
  sc.metadata
FROM scraper_categories sc
JOIN news_sources ns ON sc.source_id = ns.id
WHERE ns.source_key = 'mingpao'
ORDER BY sc.priority DESC;
