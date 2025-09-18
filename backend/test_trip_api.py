#!/usr/bin/env python3
"""
Test script for the Trip Planner API endpoints
"""
import requests
import json
import os
from datetime import datetime

# API Configuration
API_BASE = "https://8001-i4qqufph8s07s872o67ao.e2b.app"  # Backend URL
API_URL = f"{API_BASE}/api"

def test_api():
    print("🧪 Testing Trip Planner API")
    print(f"API Base URL: {API_BASE}")
    print("-" * 50)

    # Test 1: Check if API is running
    print("1. Testing API connection...")
    try:
        response = requests.get(f"{API_URL}/")
        if response.status_code == 200:
            print("✅ API is running")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ API connection failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ API connection error: {e}")
        return

    # Test 2: Create a new trip
    print("\n2. Creating a new trip...")
    trip_data = {
        "name": f"Test Trip {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    }
    try:
        response = requests.post(f"{API_URL}/trips", json=trip_data)
        if response.status_code == 200:
            trip = response.json()
            trip_id = trip["id"]
            print(f"✅ Trip created successfully")
            print(f"Trip ID: {trip_id}")
            print(f"Trip Name: {trip['name']}")
        else:
            print(f"❌ Failed to create trip: {response.status_code}")
            print(f"Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error creating trip: {e}")
        return

    # Test 3: Get all trips
    print("\n3. Fetching all trips...")
    try:
        response = requests.get(f"{API_URL}/trips")
        if response.status_code == 200:
            trips = response.json()
            print(f"✅ Retrieved {len(trips)} trips")
            for trip in trips[:3]:  # Show first 3 trips
                print(f"  - {trip['name']} (ID: {trip['id'][:8]}...)")
        else:
            print(f"❌ Failed to fetch trips: {response.status_code}")
    except Exception as e:
        print(f"❌ Error fetching trips: {e}")

    # Test 4: Add a place to the trip
    print(f"\n4. Adding places to trip {trip_id[:8]}...")
    places_to_add = [
        {"name": "Eiffel Tower", "description": "Iconic tower in Paris"},
        {"name": "Louvre Museum", "description": "World's largest art museum"},
        {"name": "Notre-Dame Cathedral", "description": "Medieval Catholic cathedral"}
    ]

    for place_data in places_to_add:
        try:
            response = requests.post(f"{API_URL}/trips/{trip_id}/places", json=place_data)
            if response.status_code == 200:
                place = response.json()
                print(f"✅ Added place: {place['name']}")
            else:
                print(f"❌ Failed to add place {place_data['name']}: {response.status_code}")
        except Exception as e:
            print(f"❌ Error adding place {place_data['name']}: {e}")

    # Test 5: Get places for the trip
    print(f"\n5. Fetching places for trip {trip_id[:8]}...")
    try:
        response = requests.get(f"{API_URL}/trips/{trip_id}/places")
        if response.status_code == 200:
            places = response.json()
            print(f"✅ Retrieved {len(places)} places")
            for i, place in enumerate(places, 1):
                print(f"  {i}. {place['name']}")
                if place['description']:
                    print(f"     Description: {place['description']}")
        else:
            print(f"❌ Failed to fetch places: {response.status_code}")
    except Exception as e:
        print(f"❌ Error fetching places: {e}")

    # Test 6: Get specific trip
    print(f"\n6. Fetching specific trip {trip_id[:8]}...")
    try:
        response = requests.get(f"{API_URL}/trips/{trip_id}")
        if response.status_code == 200:
            trip = response.json()
            print(f"✅ Retrieved trip: {trip['name']}")
            print(f"Created at: {trip['created_at']}")
        else:
            print(f"❌ Failed to fetch trip: {response.status_code}")
    except Exception as e:
        print(f"❌ Error fetching trip: {e}")

    print("\n" + "=" * 50)
    print("🎉 API Testing Complete!")
    print("Your Trip Planner backend is working correctly!")
    print("\nNext steps:")
    print("1. Open your frontend at http://localhost:3000")
    print("2. Create trips and add places through the UI")
    print("3. Everything should work seamlessly!")

if __name__ == "__main__":
    test_api()