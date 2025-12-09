import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

print("=== Checking newslist ordering ===\n")

# Get first 10 pending articles ordered by created_at
response = supabase.table("newslist") \
    .select("id, url, status, created_at, source:news_sources(source_key)") \
    .eq("status", "pending") \
    .order("created_at", desc=False) \
    .limit(10) \
    .execute()

print(f"First 10 pending articles (oldest first):\n")

for i, article in enumerate(response.data, 1):
    source_info = article.get('source')
    source_key = "unknown"
    if isinstance(source_info, list) and len(source_info) > 0:
        source_key = source_info[0].get('source_key', 'unknown')
    elif isinstance(source_info, dict):
        source_key = source_info.get('source_key', 'unknown')
    
    created_at = article.get('created_at', 'N/A')
    url_short = article['url'][:60] + "..." if len(article['url']) > 60 else article['url']
    
    print(f"{i}. {source_key} | Created: {created_at}")
    print(f"   URL: {url_short}\n")
