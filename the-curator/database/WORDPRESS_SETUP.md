# WordPress Tables Setup

The WordPress publishing feature requires 3 tables to be created in your Supabase database.

## Quick Setup

### Option 1: Supabase SQL Editor (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/xulrcvbfwhhdtggkpcge
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of [`wordpress_public_schema.sql`](./wordpress_public_schema.sql)
5. Click **Run** to execute

### Option 2: Local psql

```bash
psql postgresql://postgres:[YOUR-PASSWORD]@db.xulrcvbfwhhdtggkpcge.supabase.co:5432/postgres -f database/wordpress_public_schema.sql
```

## Tables Created

The script creates 3 tables in the `public` schema with `wordpress_` prefix:

### 1. `wordpress_config`
- Stores WordPress site configuration (URL, credentials)
- Credentials are encrypted using AES-256-GCM
- Only one active configuration allowed

### 2. `wordpress_published_articles`
- Tracks articles published to WordPress
- Maintains local snapshot for audit trail
- References WordPress post ID and URL
- Supports soft delete

### 3. `wordpress_publish_audit_log`
- Complete audit trail of all WordPress operations
- Tracks who did what and when
- Stores old/new data for change tracking
- Records WordPress API responses

## Verification

After running the script, verify tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'wordpress_%';
```

You should see:
- `wordpress_config`
- `wordpress_published_articles`
- `wordpress_publish_audit_log`

## Why Public Schema?

Originally designed to use a separate `wordpress` schema for isolation, but Supabase's free tier doesn't expose custom schemas via the API. Using `public` schema with `wordpress_` prefix achieves the same goal:

- ✅ No naming conflicts with existing tables
- ✅ Works with Supabase free tier
- ✅ Easy to identify WordPress-related tables
- ✅ Can still use RLS for security

## Next Steps

After creating the tables:

1. Restart your dev server: `npm run dev`
2. Navigate to http://localhost:3000/admin/wordpress-config
3. Configure your WordPress site connection
4. Test the connection
5. Start publishing!

## Troubleshooting

**Error: relation "wordpress_config" does not exist**
- Run the SQL script in Supabase SQL Editor
- Verify tables were created using the verification query above

**Error: The schema must be one of the following: public, graphql_public**
- This means you're trying to use a custom schema
- Use the `wordpress_public_schema.sql` file instead (not the wordpress_schema.sql)

**Error: permission denied for table wordpress_config**
- Check RLS policies are properly configured
- Ensure you're using the service role key for admin operations
