import requests
import json
import time

# Wait for server to be ready
print("Waiting for dev server to be ready...")
time.sleep(3)

# Test the local endpoint
url = "http://localhost:3000/api/admin/newslist/process"

print(f"Testing {url}\n")

# Test 1: With processAllPending=true and limit=1
payload = {
    "processAllPending": True,
    "limit": 1
}

print("Test 1: processAllPending=true, limit=1")
print(f"Payload: {json.dumps(payload, indent=2)}\n")

try:
    response = requests.post(url, json=payload, timeout=30)
    print(f"Status Code: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")
except requests.exceptions.ConnectionError:
    print("ERROR: Could not connect to localhost:3000")
    print("Please ensure dev server is running: npm run dev")
except Exception as e:
    print(f"ERROR: {e}")
    if hasattr(e, 'response'):
        print(f"Response text: {e.response.text}")
