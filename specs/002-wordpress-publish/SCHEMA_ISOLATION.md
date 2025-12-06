# WordPress Database Schema - Schema Isolation Strategy

## Overview

The WordPress feature now uses **PostgreSQL schema isolation** within the same Supabase database, avoiding the need for a separate project.

## Architecture

```
Single Supabase Database
├── public schema (Curator Core)
│   ├── news_sources
│   ├── scraper_categories
│   ├── articles
│   ├── article_images
│   └── exception_logs
│
└── wordpress schema (WordPress Feature)
    ├── config
    ├── published_articles
    └── publish_audit_log
```

## Key Benefits

✅ **No extra Supabase project needed** - Stays within free tier limits  
✅ **Complete isolation** - WordPress tables don't interfere with Curator core  
✅ **Clean separation** - Easy to identify which tables belong to which feature  
✅ **Future-proof** - Can add more schemas for other features (e.g., `newsletter`, `analytics`)  
✅ **Shared resources** - Both schemas use same Supabase connection, no extra cost  

## Table Reference

| Table | Full Name | Purpose |
|-------|-----------|---------|
| config | `wordpress.config` | WordPress site URL, auth method, encrypted credentials |
| published_articles | `wordpress.published_articles` | Article snapshots + WordPress post references + sync status |
| publish_audit_log | `wordpress.publish_audit_log` | Complete audit trail of all operations |

## Code Access Pattern

When writing code, reference tables with schema prefix:

```typescript
// Supabase queries
const { data } = await supabase
  .from('wordpress.config')  // Note: schema prefix in table name
  .select('*')
  .eq('is_active', true);
```

## Deployment Steps

1. **Copy the SQL** from [the-curator/database/wordpress_schema.sql](../../the-curator/database/wordpress_schema.sql)
2. **Open Supabase Dashboard** → SQL Editor
3. **Paste and run** the entire migration script
4. **Verify** the `wordpress` schema appears in the left sidebar
5. **See 3 new tables**: config, published_articles, publish_audit_log

## Optional: Enable RLS (Row Level Security)

Uncomment the RLS policy section in the SQL file if you want to restrict access. Currently commented out for easier development.

## Related Files

- **Schema Definition**: [wordpress_schema.sql](../../the-curator/database/wordpress_schema.sql)
- **Implementation Plan**: [specs/002-wordpress-publish/plan.md](./plan.md)
- **Tasks**: [specs/002-wordpress-publish/tasks.md](./tasks.md)

---

**Status**: Ready for deployment to Supabase  
**Created**: December 5, 2025  
**Next Step**: Run Phase 1, Task 1-7 (database setup and validation)
