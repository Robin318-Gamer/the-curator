import requests
import json

# Test the PRODUCTION Vercel endpoint
url = "https://the-curator-inky.vercel.app/api/admin/newslist/process"

print("Testing PRODUCTION /api/admin/newslist/process endpoint...")
print(f"URL: {url}\n")

payload = {
    "processAllPending": True,
    "limit": 1  # Just process 1 article to test
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"\nResponse:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"ERROR: {e}")
