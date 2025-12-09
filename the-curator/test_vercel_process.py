import requests
import json

# Test the PRODUCTION endpoint with the correct payload
url = "https://the-curator-inky.vercel.app/api/admin/newslist/process"

print(f"Testing {url}\n")

payload = {
    "processAllPending": True,
    "limit": 1
}

print(f"Payload: {json.dumps(payload, indent=2)}\n")

try:
    response = requests.post(url, json=payload, timeout=60)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}\n")
    
    try:
        data = response.json()
        print(f"Response JSON:\n{json.dumps(data, indent=2)}")
    except:
        print(f"Response Text:\n{response.text}")
        
except Exception as e:
    print(f"ERROR: {e}")
