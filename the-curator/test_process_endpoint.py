import requests
import json

# Test the local endpoint
url = "http://localhost:3000/api/admin/newslist/process"

print("Testing /api/admin/newslist/process endpoint...")
print(f"URL: {url}\n")

try:
    response = requests.post(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")
except requests.exceptions.ConnectionError:
    print("ERROR: Could not connect to localhost:3000")
    print("Please start the dev server with: npm run dev")
except Exception as e:
    print(f"ERROR: {e}")
