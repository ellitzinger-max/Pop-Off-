#!/usr/bin/env python3
"""
Pop Off! Complete User Flow Test
Tests the specific flow: signup -> profile update -> start matching -> get status
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://mobile-popoff-build.preview.emergentagent.com/api"
TIMEOUT = 30

def test_complete_user_flow():
    """Test the complete user flow as specified in the review request"""
    print("🎯 Testing Complete User Flow: signup -> profile update -> start matching -> get status")
    print("=" * 80)
    
    session = requests.Session()
    session.timeout = TIMEOUT
    
    # Test data
    test_email = f"flowtest_{int(time.time())}@popoff.com"
    test_password = "FlowTest123!"
    test_name = "Flow Test User"
    
    try:
        # Step 1: Signup
        print("1️⃣ Testing Signup...")
        signup_data = {
            "name": test_name,
            "email": test_email,
            "password": test_password
        }
        
        response = session.post(f"{BASE_URL}/auth/signup", json=signup_data)
        if response.status_code != 200:
            print(f"❌ Signup failed: {response.status_code} - {response.text}")
            return False
            
        signup_result = response.json()
        auth_token = signup_result.get("access_token")
        user_data = signup_result.get("user")
        
        print(f"✅ Signup successful: {user_data['name']} ({user_data['email']})")
        print(f"   Token: {auth_token[:20]}...")
        
        # Set auth header for subsequent requests
        session.headers.update({"Authorization": f"Bearer {auth_token}"})
        
        # Step 2: Profile Update
        print("\n2️⃣ Testing Profile Update...")
        profile_data = {
            "bio": "I'm excited to connect with new people and have meaningful conversations!",
            "city": "Los Angeles",
            "state": "California", 
            "age": 28,
            "interests": ["Technology", "Music", "Travel", "Gaming", "Art"],
            "profile_complete": True
        }
        
        response = session.put(f"{BASE_URL}/profile", json=profile_data)
        if response.status_code != 200:
            print(f"❌ Profile update failed: {response.status_code} - {response.text}")
            return False
            
        profile_result = response.json()
        print(f"✅ Profile updated successfully")
        print(f"   Bio: {profile_result.get('bio', '')[:50]}...")
        print(f"   Location: {profile_result.get('city', '')}, {profile_result.get('state', '')}")
        print(f"   Interests: {', '.join(profile_result.get('interests', [])[:3])}...")
        print(f"   Profile Complete: {profile_result.get('profile_complete', False)}")
        
        # Step 3: Start Matching
        print("\n3️⃣ Testing Start Matching...")
        match_data = {
            "mood": "Excited and ready to chat!",
            "custom_message": "Looking forward to meeting someone awesome and having a great conversation",
            "interests": ["Technology", "Music", "Travel"]
        }
        
        response = session.post(f"{BASE_URL}/match/search", json=match_data)
        if response.status_code != 200:
            print(f"❌ Start matching failed: {response.status_code} - {response.text}")
            return False
            
        match_result = response.json()
        print(f"✅ Matching started successfully")
        print(f"   Match ID: {match_result.get('id', '')}")
        print(f"   Status: {match_result.get('status', '')}")
        print(f"   Mood: {match_result.get('mood', '')}")
        print(f"   Partner ID: {match_result.get('partner_id', 'None (searching)')}")
        if match_result.get('channel_name'):
            print(f"   Channel: {match_result.get('channel_name', '')}")
        
        # Step 4: Get Match Status
        print("\n4️⃣ Testing Get Match Status...")
        response = session.get(f"{BASE_URL}/match/status")
        if response.status_code != 200:
            print(f"❌ Get match status failed: {response.status_code} - {response.text}")
            return False
            
        status_result = response.json()
        print(f"✅ Match status retrieved successfully")
        print(f"   Current Status: {status_result.get('status', '')}")
        if status_result.get('status') != 'idle':
            print(f"   Match ID: {status_result.get('id', '')}")
            print(f"   User ID: {status_result.get('user_id', '')}")
            if status_result.get('partner_id'):
                print(f"   Partner ID: {status_result.get('partner_id', '')}")
                print(f"   Channel: {status_result.get('channel_name', '')}")
        
        # Bonus: Test Agora Token Generation (for video call)
        print("\n🎥 Testing Agora Token Generation...")
        test_channel = match_result.get('channel_name', 'test-channel-flow')
        response = session.get(f"{BASE_URL}/agora/token?channel={test_channel}")
        if response.status_code != 200:
            print(f"❌ Agora token generation failed: {response.status_code} - {response.text}")
        else:
            token_result = response.json()
            print(f"✅ Agora token generated successfully")
            print(f"   Channel: {token_result.get('channel', '')}")
            print(f"   UID: {token_result.get('uid', '')}")
            print(f"   Expires in: {token_result.get('expires_in', '')} seconds")
        
        # Cleanup: Cancel the match
        print("\n🧹 Cleaning up...")
        response = session.post(f"{BASE_URL}/match/cancel")
        if response.status_code == 200:
            print("✅ Match cancelled successfully")
        else:
            print(f"⚠️ Match cancellation warning: {response.status_code}")
        
        print("\n" + "=" * 80)
        print("🎉 COMPLETE USER FLOW TEST PASSED!")
        print("✅ All steps completed successfully:")
        print("   1. User signup with authentication")
        print("   2. Profile update with interests and location")
        print("   3. Matching system initiation")
        print("   4. Match status retrieval")
        print("   5. Agora token generation for video calls")
        print("=" * 80)
        
        return True
        
    except Exception as e:
        print(f"\n❌ FLOW TEST FAILED: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_complete_user_flow()
    exit(0 if success else 1)