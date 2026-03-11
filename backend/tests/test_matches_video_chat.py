"""
Backend API tests for Pop Off! Matches and Video Chat features:
- Matches endpoint (/api/matches)
- Swipe endpoint (/api/matches/swipe) - creating matches when mutual like
- Chat endpoints (/api/chat, /api/chat/{match_id})
- Agora token endpoint (/api/agora/token)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test users from review request
TEST_USER_ALICE = {"email": "alice@test.com", "password": "password123", "name": "Alice Smith"}
TEST_USER_BOB = {"email": "bob@test.com", "password": "password123", "name": "Bob Jones"}
EXISTING_MATCH_ID = "match_a5cd37d4b6c4"


class TestMatchesEndpoint:
    """Test /api/matches endpoint"""
    
    @pytest.fixture
    def alice_session(self):
        """Get authenticated session for Alice"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_ALICE["email"], "password": TEST_USER_ALICE["password"]}
        )
        
        if response.status_code == 401:
            # Try signup first
            signup_response = session.post(
                f"{BASE_URL}/api/auth/signup",
                json=TEST_USER_ALICE
            )
            if signup_response.status_code in [200, 400]:  # Success or already exists
                response = session.post(
                    f"{BASE_URL}/api/auth/login",
                    json={"email": TEST_USER_ALICE["email"], "password": TEST_USER_ALICE["password"]}
                )
        
        if response.status_code != 200:
            pytest.skip(f"Could not authenticate Alice: {response.status_code} - {response.text}")
        
        return session
    
    @pytest.fixture
    def bob_session(self):
        """Get authenticated session for Bob"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_BOB["email"], "password": TEST_USER_BOB["password"]}
        )
        
        if response.status_code == 401:
            # Try signup first
            signup_response = session.post(
                f"{BASE_URL}/api/auth/signup",
                json=TEST_USER_BOB
            )
            if signup_response.status_code in [200, 400]:
                response = session.post(
                    f"{BASE_URL}/api/auth/login",
                    json={"email": TEST_USER_BOB["email"], "password": TEST_USER_BOB["password"]}
                )
        
        if response.status_code != 200:
            pytest.skip(f"Could not authenticate Bob: {response.status_code} - {response.text}")
        
        return session
    
    def test_get_matches_requires_auth(self):
        """Test that /api/matches requires authentication"""
        response = requests.get(f"{BASE_URL}/api/matches")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ /api/matches correctly requires authentication")
    
    def test_get_matches_returns_list(self, alice_session):
        """Test /api/matches returns a list of matches"""
        response = alice_session.get(f"{BASE_URL}/api/matches")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list of matches"
        print(f"✅ /api/matches returns list - found {len(data)} matches")
        
        # If there are matches, verify structure
        if len(data) > 0:
            match = data[0]
            assert "match_id" in match, "Match should have match_id"
            assert "other_user" in match, "Match should have other_user info"
            assert "user_ids" in match, "Match should have user_ids"
            print(f"✅ Match structure correct - match_id: {match['match_id']}")
    
    def test_get_matches_enriched_with_other_user(self, alice_session):
        """Test that matches are enriched with other_user data"""
        response = alice_session.get(f"{BASE_URL}/api/matches")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            match = data[0]
            other_user = match.get("other_user", {})
            
            # Verify other_user has expected fields
            assert "user_id" in other_user, "other_user should have user_id"
            assert "name" in other_user, "other_user should have name"
            print(f"✅ Match enriched with other_user: {other_user.get('name')}")
        else:
            print("⚠️ No matches found to verify enrichment")


class TestSwipeEndpoint:
    """Test /api/matches/swipe endpoint for creating matches"""
    
    @pytest.fixture
    def alice_session(self):
        """Get authenticated session for Alice"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_ALICE["email"], "password": TEST_USER_ALICE["password"]}
        )
        
        if response.status_code == 401:
            signup_response = session.post(
                f"{BASE_URL}/api/auth/signup",
                json=TEST_USER_ALICE
            )
            if signup_response.status_code in [200, 400]:
                response = session.post(
                    f"{BASE_URL}/api/auth/login",
                    json={"email": TEST_USER_ALICE["email"], "password": TEST_USER_ALICE["password"]}
                )
        
        if response.status_code != 200:
            pytest.skip(f"Could not authenticate Alice: {response.status_code}")
        
        return session
    
    @pytest.fixture
    def bob_session(self):
        """Get authenticated session for Bob"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_BOB["email"], "password": TEST_USER_BOB["password"]}
        )
        
        if response.status_code == 401:
            signup_response = session.post(
                f"{BASE_URL}/api/auth/signup",
                json=TEST_USER_BOB
            )
            if signup_response.status_code in [200, 400]:
                response = session.post(
                    f"{BASE_URL}/api/auth/login",
                    json={"email": TEST_USER_BOB["email"], "password": TEST_USER_BOB["password"]}
                )
        
        if response.status_code != 200:
            pytest.skip(f"Could not authenticate Bob: {response.status_code}")
        
        return session
    
    def test_swipe_requires_auth(self):
        """Test that /api/matches/swipe requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/matches/swipe",
            json={"target_user_id": "user_123", "action": "like"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ /api/matches/swipe correctly requires authentication")
    
    def test_swipe_invalid_action(self, alice_session):
        """Test that invalid swipe actions are rejected"""
        response = alice_session.post(
            f"{BASE_URL}/api/matches/swipe",
            json={"target_user_id": "user_123", "action": "invalid_action"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Invalid swipe action correctly rejected")
    
    def test_swipe_like_no_match(self, alice_session):
        """Test single like without mutual like returns no match"""
        # Create a unique test target user id
        target_id = f"user_test_{uuid.uuid4().hex[:8]}"
        
        response = alice_session.post(
            f"{BASE_URL}/api/matches/swipe",
            json={"target_user_id": target_id, "action": "like"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "match" in data, "Response should indicate if match occurred"
        assert data["match"] == False, "Single like should not create match"
        print("✅ Single like correctly returns no match")
    
    def test_swipe_pass(self, alice_session):
        """Test pass action works correctly"""
        target_id = f"user_test_{uuid.uuid4().hex[:8]}"
        
        response = alice_session.post(
            f"{BASE_URL}/api/matches/swipe",
            json={"target_user_id": target_id, "action": "pass"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["match"] == False, "Pass should not create match"
        print("✅ Pass action works correctly")


class TestChatEndpoints:
    """Test chat endpoints for matched users"""
    
    @pytest.fixture
    def alice_session(self):
        """Get authenticated session for Alice"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_ALICE["email"], "password": TEST_USER_ALICE["password"]}
        )
        
        if response.status_code == 401:
            signup_response = session.post(
                f"{BASE_URL}/api/auth/signup",
                json=TEST_USER_ALICE
            )
            if signup_response.status_code in [200, 400]:
                response = session.post(
                    f"{BASE_URL}/api/auth/login",
                    json={"email": TEST_USER_ALICE["email"], "password": TEST_USER_ALICE["password"]}
                )
        
        if response.status_code != 200:
            pytest.skip(f"Could not authenticate Alice: {response.status_code}")
        
        return session
    
    def test_get_chat_messages_requires_auth(self):
        """Test that /api/chat/{match_id} requires authentication"""
        response = requests.get(f"{BASE_URL}/api/chat/{EXISTING_MATCH_ID}")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ /api/chat/{match_id} correctly requires authentication")
    
    def test_send_chat_message_requires_auth(self):
        """Test that POST /api/chat requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"match_id": EXISTING_MATCH_ID, "message": "Hello!"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ POST /api/chat correctly requires authentication")
    
    def test_get_chat_messages_unauthorized_match(self, alice_session):
        """Test that users cannot access chat for matches they're not part of"""
        # Use a fake match_id that the user is not part of
        fake_match_id = f"match_{uuid.uuid4().hex[:12]}"
        
        response = alice_session.get(f"{BASE_URL}/api/chat/{fake_match_id}")
        # Should return 403 (not authorized) since user is not in this match
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✅ Unauthorized chat access correctly rejected")
    
    def test_get_chat_messages_for_valid_match(self, alice_session):
        """Test getting chat messages for a valid match"""
        # First get Alice's matches
        matches_response = alice_session.get(f"{BASE_URL}/api/matches")
        assert matches_response.status_code == 200
        
        matches = matches_response.json()
        if len(matches) == 0:
            print("⚠️ No matches found for Alice - skipping chat message test")
            return
        
        match_id = matches[0]["match_id"]
        
        # Get chat messages
        response = alice_session.get(f"{BASE_URL}/api/chat/{match_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list of messages"
        print(f"✅ Get chat messages working - found {len(data)} messages for match {match_id}")


class TestAgoraTokenEndpoint:
    """Test Agora token generation for video calls"""
    
    @pytest.fixture
    def alice_session(self):
        """Get authenticated session for Alice"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_ALICE["email"], "password": TEST_USER_ALICE["password"]}
        )
        
        if response.status_code == 401:
            signup_response = session.post(
                f"{BASE_URL}/api/auth/signup",
                json=TEST_USER_ALICE
            )
            if signup_response.status_code in [200, 400]:
                response = session.post(
                    f"{BASE_URL}/api/auth/login",
                    json={"email": TEST_USER_ALICE["email"], "password": TEST_USER_ALICE["password"]}
                )
        
        if response.status_code != 200:
            pytest.skip(f"Could not authenticate Alice: {response.status_code}")
        
        return session
    
    def test_agora_token_requires_auth(self):
        """Test that /api/agora/token requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/agora/token",
            json={"channel_name": "test_channel"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ /api/agora/token correctly requires authentication")
    
    def test_agora_token_requires_channel_name(self, alice_session):
        """Test that /api/agora/token requires channel_name"""
        response = alice_session.post(
            f"{BASE_URL}/api/agora/token",
            json={}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ /api/agora/token correctly requires channel_name")
    
    def test_agora_token_generation(self, alice_session):
        """Test Agora token generation for a match video call"""
        # First get Alice's matches
        matches_response = alice_session.get(f"{BASE_URL}/api/matches")
        matches = matches_response.json()
        
        if len(matches) == 0:
            # Use a test channel name
            channel_name = f"match_test_{uuid.uuid4().hex[:8]}"
        else:
            channel_name = f"match_{matches[0]['match_id']}"
        
        response = alice_session.post(
            f"{BASE_URL}/api/agora/token",
            json={"channel_name": channel_name}
        )
        
        # 200 if Agora is configured, 500 if not
        if response.status_code == 200:
            data = response.json()
            assert "token" in data, "Response should contain token"
            assert "channel_name" in data, "Response should contain channel_name"
            assert "user_id" in data, "Response should contain user_id"
            assert data["channel_name"] == channel_name
            print(f"✅ Agora token generation working - channel: {channel_name}")
        elif response.status_code == 500:
            # Expected if Agora not configured
            data = response.json()
            if "not configured" in data.get("detail", "").lower():
                print("⚠️ Agora token endpoint returns 500 - Agora not configured (expected)")
            else:
                pytest.fail(f"Unexpected 500 error: {response.text}")
        else:
            pytest.fail(f"Unexpected response: {response.status_code}: {response.text}")


class TestMatchSuggestionsEndpoint:
    """Test /api/matches/suggestions endpoint"""
    
    @pytest.fixture
    def alice_session(self):
        """Get authenticated session for Alice"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_ALICE["email"], "password": TEST_USER_ALICE["password"]}
        )
        
        if response.status_code == 401:
            signup_response = session.post(
                f"{BASE_URL}/api/auth/signup",
                json=TEST_USER_ALICE
            )
            if signup_response.status_code in [200, 400]:
                response = session.post(
                    f"{BASE_URL}/api/auth/login",
                    json={"email": TEST_USER_ALICE["email"], "password": TEST_USER_ALICE["password"]}
                )
        
        if response.status_code != 200:
            pytest.skip(f"Could not authenticate Alice: {response.status_code}")
        
        return session
    
    def test_suggestions_requires_auth(self):
        """Test that /api/matches/suggestions requires authentication"""
        response = requests.get(f"{BASE_URL}/api/matches/suggestions")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ /api/matches/suggestions correctly requires authentication")
    
    def test_suggestions_returns_list(self, alice_session):
        """Test that /api/matches/suggestions returns a list of candidates"""
        response = alice_session.get(f"{BASE_URL}/api/matches/suggestions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✅ /api/matches/suggestions returns list - found {len(data)} suggestions")
        
        # If there are suggestions, verify structure
        if len(data) > 0:
            suggestion = data[0]
            assert "user_id" in suggestion, "Suggestion should have user_id"
            assert "name" in suggestion, "Suggestion should have name"
            print(f"✅ Suggestion structure correct - first: {suggestion.get('name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
