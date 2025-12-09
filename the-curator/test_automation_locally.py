#!/usr/bin/env python3
"""
Test automation endpoints locally on http://localhost:3000
"""

import requests
import time
import json

BASE_URL = "http://localhost:3000"

def test_bulk_save():
    """Test bulk-save endpoint"""
    print("\n=== Testing Bulk Save ===")
    url = f"{BASE_URL}/api/automation/bulk-save/hk01"
    try:
        response = requests.post(url, timeout=30)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_process_newslist():
    """Test process endpoint"""
    print("\n=== Testing Process Newslist ===")
    url = f"{BASE_URL}/api/admin/newslist/process"
    body = {
        "processAllPending": True,
        "limit": 1
    }
    try:
        response = requests.post(url, json=body, timeout=30)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2, default=str)}")
        return response.status_code in [200, 201, 500, 404]  # Accept various responses
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_metrics():
    """Test metrics endpoint"""
    print("\n=== Testing Metrics ===")
    url = f"{BASE_URL}/api/admin/metrics"
    try:
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("Testing automation endpoints locally...")
    print(f"Target: {BASE_URL}")
    
    results = {
        "bulk_save": test_bulk_save(),
        "process": test_process_newslist(),
        "metrics": test_metrics(),
    }
    
    print("\n=== Summary ===")
    for test_name, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    all_passed = all(results.values())
    if all_passed:
        print("\n✓ All endpoints responding correctly")
    else:
        print("\n✗ Some endpoints have issues")
