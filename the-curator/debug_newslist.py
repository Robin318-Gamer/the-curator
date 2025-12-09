import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

print("=== Checking newslist table for MingPao articles ===\n")

# Get all pending articles with source info
response = supabase.table("newslist") \
    .select("id, source_article_id, url, status, attempt_count, source:news_sources(source_key, name)") \
    .eq("status", "pending") \
    .order("id", desc=False) \
    .limit(10) \
    .execute()

print(f"Found {len(response.data)} pending articles:\n")

for article in response.data:
    source_info = article.get('source')
    source_key = "unknown"
    if isinstance(source_info, list) and len(source_info) > 0:
        source_key = source_info[0].get('source_key', 'unknown')
    elif isinstance(source_info, dict):
        source_key = source_info.get('source_key', 'unknown')
    
    print(f"ID: {article['id']}")
    print(f"  Source: {source_key}")
    print(f"  URL: {article['url'][:80]}...")
    print(f"  Status: {article['status']}")
    print(f"  Attempts: {article['attempt_count']}")
    print()

# Get counts by source
print("\n=== Counts by source and status ===\n")

# Get all sources
sources_response = supabase.table("news_sources").select("id, source_key, name").execute()

for source in sources_response.data:
    source_id = source['id']
    source_key = source['source_key']
    
    # Count pending
    pending_response = supabase.table("newslist") \
        .select("id", count="exact") \
        .eq("source_id", source_id) \
        .eq("status", "pending") \
        .execute()
    
    # Count extracted
    extracted_response = supabase.table("newslist") \
        .select("id", count="exact") \
        .eq("source_id", source_id) \
        .eq("status", "extracted") \
        .execute()
    
    # Count error
    error_response = supabase.table("newslist") \
        .select("id", count="exact") \
        .eq("source_id", source_id) \
        .eq("status", "error") \
        .execute()
    
    print(f"{source_key} (ID: {source_id}):")
    print(f"  Pending: {pending_response.count}")
    print(f"  Extracted: {extracted_response.count}")
    print(f"  Error: {error_response.count}")
    print()
