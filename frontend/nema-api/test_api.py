"""
Test script for NEMA Compliance API
Run this to verify API functionality
"""

import requests
import json


BASE_URL = "http://localhost:8000"


def test_health_check():
    """Test health check endpoint"""
    print("\n🏥 Testing Health Check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.status_code == 200


def test_compliance_check():
    """Test compliance check endpoint"""
    print("\n✅ Testing Compliance Check...")
    
    # Sample site in Uganda (should be near Kampala)
    test_site = {
        "site_geojson": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [32.5, 0.3],
                            [32.51, 0.3],
                            [32.51, 0.31],
                            [32.5, 0.31],
                            [32.5, 0.3]
                        ]]
                    },
                    "properties": {
                        "name": "Test Site"
                    }
                }
            ]
        },
        "buffer_zone_m": 200.0,
        "include_distance": True,
        "include_wetland_names": True
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/compliance/check",
        json=test_site
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(json.dumps(result, indent=2))
        print(f"\n🎯 Result: {result['risk_level']} - {result['message']}")
    else:
        print(f"Error: {response.text}")
    
    return response.status_code == 200


def test_wetlands_search():
    """Test wetlands search endpoint"""
    print("\n🗺️  Testing Wetlands Search...")
    
    # Search near Kampala
    search_request = {
        "point": {
            "lon": 32.5,
            "lat": 0.3,
            "radius_km": 20
        },
        "limit": 10
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/wetlands/search",
        json=search_request
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Found {result['count']} wetlands")
    else:
        print(f"Error: {response.text}")
    
    return response.status_code == 200


def test_batch_processing():
    """Test batch compliance check"""
    print("\n📦 Testing Batch Processing...")
    
    batch_request = {
        "sites": [
            {
                "name": "Site A",
                "geojson": {
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [32.5, 0.3]
                        },
                        "properties": {}
                    }]
                }
            },
            {
                "name": "Site B",
                "geojson": {
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [32.6, 0.4]
                        },
                        "properties": {}
                    }]
                }
            }
        ],
        "buffer_zone_m": 200.0,
        "include_distance": True
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/compliance/batch",
        json=batch_request
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Processed {result['total_sites']} sites in {result['processing_time_s']}s")
        print(f"Compliant: {result['compliant_sites']}, Non-compliant: {result['non_compliant_sites']}")
    else:
        print(f"Error: {response.text}")
    
    return response.status_code == 200


def test_report_generation():
    """Test report generation"""
    print("\n📄 Testing Report Generation...")
    
    # First get a compliance result
    compliance_result = {
        "in_wetland": False,
        "wetland_names": [],
        "min_distance_m": 450.5,
        "risk_level": "LOW",
        "compliant": True,
        "message": "Site is 450.5m from nearest wetland",
        "recommendation": "No wetland compliance issues detected",
        "buffer_violation": False,
        "checked_at": "2024-01-15T10:30:00Z"
    }
    
    report_request = {
        "site_name": "Test Development Site",
        "site_geojson": {
            "type": "FeatureCollection",
            "features": []
        },
        "compliance_result": compliance_result,
        "applicant_info": {
            "name": "John Doe",
            "email": "john@example.com",
            "organization": "Test Company Ltd"
        },
        "format": "markdown"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/report/generate",
        json=report_request
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"\n📋 Generated Report:\n")
        print(result['report_content'][:500] + "...")
    else:
        print(f"Error: {response.text}")
    
    return response.status_code == 200


def run_all_tests():
    """Run all API tests"""
    print("=" * 60)
    print("🧪 NEMA Compliance API Test Suite")
    print("=" * 60)
    
    tests = [
        ("Health Check", test_health_check),
        ("Compliance Check", test_compliance_check),
        ("Wetlands Search", test_wetlands_search),
        ("Batch Processing", test_batch_processing),
        ("Report Generation", test_report_generation),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))
        except requests.exceptions.ConnectionError:
            print(f"\n❌ {test_name} - Connection Error")
            print("   Make sure the API is running: uvicorn main:app --reload")
            results.append((test_name, False))
        except Exception as e:
            print(f"\n❌ {test_name} - Error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n{passed}/{total} tests passed")
    print("=" * 60)


if __name__ == "__main__":
    run_all_tests()
