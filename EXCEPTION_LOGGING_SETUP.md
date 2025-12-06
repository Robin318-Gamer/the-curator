# Exception Logging Setup Guide

## Overview
You now have a comprehensive exception logging system that will capture all errors from your API endpoints in a dedicated `exception_logs` table for easier debugging.

## What's New

### 1. Exception Log Table
A new `exception_logs` table has been created to store detailed error information with rich context about what went wrong.

### 2. Exception Logger Service
A new utility service `lib/services/exceptionLogger.ts` provides:
- `logException()` - Log exceptions to the database
- `extractErrorDetails()` - Extract error type, message, and stack trace

### 3. Updated API Routes
The following API routes now log exceptions:
- `/api/scraper/article` - Logs category selection, article scraping, and critical errors
- `/api/scraper/sources` - Logs source fetching errors

## Setup Instructions

### Step 1: Execute SQL Script in Supabase

Copy and paste the entire content from [database/exception_log_schema.sql](database/exception_log_schema.sql) into your Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Paste the SQL script
5. Click **Run**

This will create:
- `exception_logs` table with all necessary columns
- Indexes for fast querying
- Comments for column documentation

### Step 2: Deploy Updated Code

After creating the table, redeploy your application:

```bash
npm run build
# If building locally, commit and push to Vercel
```

## Querying Exception Logs

### Recent Errors
```sql
SELECT 
  id,
  error_type,
  error_message,
  endpoint,
  operation,
  severity,
  created_at
FROM exception_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Errors by Endpoint
```sql
SELECT 
  endpoint,
  error_type,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM exception_logs
GROUP BY endpoint, error_type
ORDER BY latest DESC;
```

### Unresolved Critical Errors
```sql
SELECT 
  id,
  error_type,
  error_message,
  endpoint,
  operation,
  category_slug,
  source_key,
  created_at
FROM exception_logs
WHERE severity = 'critical' 
  AND is_resolved = false
ORDER BY created_at DESC;
```

### Errors by Category/Source
```sql
SELECT 
  category_slug,
  source_key,
  error_type,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM exception_logs
WHERE category_slug IS NOT NULL
GROUP BY category_slug, source_key, error_type
ORDER BY latest DESC;
```

### Article-Specific Errors
```sql
SELECT 
  article_url,
  error_type,
  error_message,
  operation,
  created_at
FROM exception_logs
WHERE article_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 50;
```

## Logging Information Captured

Each exception log entry includes:

| Field | Description |
|-------|-------------|
| `error_type` | Exception class name (e.g., 'Error', 'TypeError', 'ValidationError') |
| `error_message` | Human-readable error message |
| `error_stack` | Full stack trace for debugging |
| `endpoint` | API route that failed (e.g., '/api/scraper/article') |
| `function_name` | Function where error occurred |
| `operation` | What operation was being performed (e.g., 'category_selection', 'article_scrape') |
| `request_method` | HTTP method (GET, POST, etc.) |
| `request_body` | Request payload (truncated if too large) |
| `category_slug` | Scraper category affected (if applicable) |
| `source_key` | News source affected (e.g., 'hk01') |
| `article_url` | Article URL being processed (if applicable) |
| `severity` | Error level ('debug', 'info', 'warning', 'error', 'critical') |
| `environment` | Environment where error occurred ('development', 'production') |
| `app_version` | Application version |
| `metadata` | Additional context-specific data |
| `created_at` | When error occurred |

## Troubleshooting with Exception Logs

### Example: "Scrape next article" returns 500

1. Test the endpoint on Vercel
2. Go to your Supabase dashboard → SQL Editor
3. Run the **Recent Errors** query above
4. Look for entries with `endpoint = '/api/scraper/article'` and `severity = 'critical'`
5. Check the `error_message` and `error_stack` columns for the actual error

### Example: Specific article keeps failing

1. Run the **Article-Specific Errors** query with the article URL
2. Check the `operation` column (should be 'article_scrape' or 'content_extract')
3. Look at `error_message` to understand why it's failing
4. Check `metadata` for additional context

## Next Steps After Deployment

1. **Create the table** - Run the SQL script in Supabase
2. **Deploy code** - Push the updated code to production
3. **Test the endpoint** - Click "Scrape next article" in the admin panel
4. **Check logs** - Query the `exception_logs` table to see captured errors
5. **Debug** - Use the error details to fix underlying issues

## Notes

- Exception logging is non-blocking - if database logging fails, it won't affect the API response
- Request bodies are automatically truncated if they exceed 10KB
- Stack traces are included for all errors (up to 10,000 characters)
- Logs are automatically timestamped in UTC
- Consider periodically archiving or deleting old logs to manage database size
