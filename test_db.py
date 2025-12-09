#!/usr/bin/env python3
import os
import json
from supabase import create_client, Client

# Load env variables
from dotenv import load_dotenv
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing Supabase credentials in .env.local")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Check news_sources table
print("=== NEWS_SOURCES TABLE ===")
sources = supabase.table('news_sources').select('*').execute()
print(json.dumps(sources.data, indent=2, default=str))

# Check newslist table - pending status
print("\n=== NEWSLIST TABLE (PENDING) ===")
newslist = supabase.table('newslist').select('id, source_id, url, status, source:news_sources(source_key, name)').eq('status', 'pending').limit(10).execute()
print(f"Total pending: {len(newslist.data)}")
print(json.dumps(newslist.data, indent=2, default=str))

# Check by source
print("\n=== NEWSLIST COUNT BY STATUS ===")
all_news = supabase.table('newslist').select('status, source_id, news_sources(source_key)', count='exact').execute()
print(f"Total records: {all_news.count}")
# Group by status
statuses = {}
for record in all_news.data:
    status = record.get('status')
    if status not in statuses:
        statuses[status] = []
    statuses[status].append(record)

for status, records in statuses.items():
    print(f"{status}: {len(records)}")
