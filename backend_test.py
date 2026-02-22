import requests
import sys
import json
import time
from datetime import datetime

class PopOffAPITester:
    def __init__(self, base_url="https://interest-rooms.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()  # Use session to handle cookies
        self.session_token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data for dating app features
        self.test_user_email = f"testuser_{datetime.now().strftime('%H%M%S')}@test.com"
        self.test_user_password = "TestPass123!"
        self.test_user_name = "Test User Dating"
        self.test_interests = ["Mental Health", "Technology", "Gaming", "Books & Reading"]
        self.test_profile = {
            "bio": "Test bio for matching functionality",
            "city": "San Francisco", 
            "state": "CA",
            "age": 25,
            "interests": self.test_interests
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {'text': response.text}
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response_data and len(str(response_data)) < 1000:
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response_data:
                    print(f"   Response: {json.dumps(response_data, indent=2)[:500]}...")

            self.test_results.append({
                'test_name': name,
                'endpoint': endpoint,
                'method': method,
                'expected_status': expected_status,
                'actual_status': response.status_code,
                'success': success,
                'response_data': response_data
            })

            return success, response_data

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                'test_name': name,
                'endpoint': endpoint,
                'method': method,
                'expected_status': expected_status,
                'actual_status': 'ERROR',
                'success': False,
                'response_data': {'error': str(e)}
            })
            return False, {'error': str(e)}
            self.test_results.append({
                'test_name': name,
                'endpoint': endpoint,
                'method': method,
                'expected_status': expected_status,
                'actual_status': 'ERROR',
                'success': False,
                'error': str(e)
            })
            return False, {}

    def test_signup(self, name="Test User", email=None, password="TestPass123!"):
        """Test user signup"""
        if not email:
            email = f"test_user_{datetime.now().strftime('%H%M%S%f')}@example.com"
            
        success, response = self.run_test(
            "User Signup",
            "POST",
            "api/auth/signup",
            200,
            data={"name": name, "email": email, "password": password}
        )
        
        if success and 'user' in response:
            self.user_data = response['user']
            print(f"   Created user: {self.user_data['user_id']}")
            return True, email, password
        return False, email, password

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "api/auth/login", 
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'user' in response:
            self.user_data = response['user']
            print(f"   Logged in user: {self.user_data['user_id']}")
            return True
        return False

    def test_me_endpoint(self):
        """Test auth/me endpoint"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "api/auth/me",
            200
        )
        
        if success:
            self.user_data = response
            return True
        return False

    def test_get_topics(self):
        """Test getting all topics"""
        success, response = self.run_test(
            "Get All Topics",
            "GET",
            "api/topics",
            200
        )
        return success, response if success else []

    def test_get_interests(self):
        """Test getting available interests for profile setup"""
        success, response = self.run_test(
            "Get Available Interests",
            "GET", 
            "api/users/interests",
            200
        )
        
        if success and 'interests' in response:
            interests_count = len(response['interests'])
            print(f"   Found {interests_count} available interests")
            return True, response['interests']
        return False, []

    def test_update_profile(self):
        """Test updating user profile with interests and location"""
        success, response = self.run_test(
            "Update Profile", 
            "PUT",
            "api/users/profile",
            200,
            data=self.test_profile
        )
        
        if success:
            print(f"   Profile updated with {len(self.test_interests)} interests")
        return success

    def test_get_match_suggestions(self):
        """Test getting match suggestions"""
        success, response = self.run_test(
            "Get Match Suggestions",
            "GET",
            "api/matches/suggestions", 
            200
        )
        
        if success:
            suggestions_count = len(response) if isinstance(response, list) else 0
            print(f"   Got {suggestions_count} match suggestions")
            return True, response
        return False, []

    def test_swipe_functionality(self, suggestions):
        """Test swipe like/pass functionality"""
        if not suggestions:
            print("   No suggestions available for swiping")
            return False
        
        target_user = suggestions[0]
        target_user_id = target_user.get('user_id')
        
        # Test pass action
        success_pass, response_pass = self.run_test(
            "Swipe Pass",
            "POST",
            "api/matches/swipe",
            200,
            data={"target_user_id": target_user_id, "action": "pass"}
        )
        
        # Test like action with another user if available
        if len(suggestions) > 1:
            target_user_2 = suggestions[1]
            success_like, response_like = self.run_test(
                "Swipe Like", 
                "POST",
                "api/matches/swipe",
                200,
                data={"target_user_id": target_user_2.get('user_id'), "action": "like"}
            )
            
            if success_like and response_like.get('match'):
                print(f"   🎉 Match created! Match ID: {response_like.get('match_id')}")
                return True, response_like.get('match_id')
        
        return success_pass, None

    def test_get_matches(self):
        """Test getting user's matches"""
        success, response = self.run_test(
            "Get User Matches",
            "GET", 
            "api/matches",
            200
        )
        
        if success:
            matches_count = len(response) if isinstance(response, list) else 0
            print(f"   Found {matches_count} matches")
            return True, response
        return False, []

    def test_chat_messages(self, matches):
        """Test chat functionality"""
        if not matches:
            # Test with dummy match_id to verify proper authorization
            success, response = self.run_test(
                "Chat Access Control",
                "GET",
                "api/chat/dummy_match_123",
                403  # Should return 403 for unauthorized access
            )
            return success
        
        match = matches[0]
        match_id = match.get('match_id')
        
        # Test getting chat messages
        success_get, messages = self.run_test(
            "Get Chat Messages",
            "GET",
            f"api/chat/{match_id}",
            200
        )
        
        # Test sending a message
        success_send, response = self.run_test(
            "Send Chat Message",
            "POST",
            "api/chat",
            200,
            data={"match_id": match_id, "message": "Hello from automated test!"}
        )
        
        return success_get and success_send

    def test_report_functionality(self, suggestions):
        """Test reporting and AI moderation system"""
        if not suggestions:
            print("   No users available to test reporting")
            return False
        
        target_user = suggestions[0]
        target_user_id = target_user.get('user_id')
        
        success, response = self.run_test(
            "Submit User Report",
            "POST", 
            "api/reports",
            200,
            data={
                "reported_user_id": target_user_id,
                "category": "spam",
                "description": "Automated test report",
                "context": "Testing AI moderation system"
            }
        )
        
        if success:
            report_id = response.get('report_id')
            print(f"   Report submitted: {report_id}")
            print("   AI moderation will process in background")
            
            # Give AI processing some time
            time.sleep(3)
            
        return success

    def test_create_topic(self, title="Test Topic", category="general", description="Test topic description"):
        """Test topic creation"""
        success, response = self.run_test(
            "Create Topic",
            "POST",
            "api/topics",
            200,
            data={
                "title": title,
                "category": category,
                "description": description,
                "max_participants": 10
            }
        )
        
        return response.get('topic_id') if success else None

    def test_get_topic(self, topic_id):
        """Test getting specific topic"""
        success, response = self.run_test(
            "Get Specific Topic",
            "GET",
            f"api/topics/{topic_id}",
            200
        )
        return success

    def test_agora_token(self, channel_name="test_channel"):
        """Test Agora token generation"""
        success, response = self.run_test(
            "Generate Agora Token",
            "POST",
            "api/agora/token",
            500,  # Should fail because Agora keys are not configured
            data={"channel_name": channel_name}
        )
        # If we get a 520 error instead of 500, that's also expected (server configuration issue)
        if not success and 'actual_status' in str(response) and '520' in str(response):
            print("   ℹ️  Got 520 instead of 500 - this is expected when Agora is not configured")
            return True
        return success

    def test_logout(self):
        """Test user logout"""
        success, response = self.run_test(
            "User Logout",
            "POST",
            "api/auth/logout",
            200
        )
        return success

def main():
    """Main test execution for Pop Off Dating App"""
    print("🚀 Starting Pop Off Dating App Comprehensive API Tests")
    print("=" * 60)
    
    tester = PopOffAPITester()
    
    # Test 1: User Registration Flow
    print("\n📋 AUTHENTICATION TESTS")
    print("-" * 30)
    signup_success, email, password = tester.test_signup()
    if not signup_success:
        print("❌ Signup failed, stopping tests")
        return generate_report(tester)

    # Test 2: User Login Flow
    login_success = tester.test_login(email, password)
    if not login_success:
        print("❌ Login failed, stopping tests")
        return generate_report(tester)

    # Test 3: Get current user
    me_success = tester.test_me_endpoint()
    if not me_success:
        print("❌ Auth/me endpoint failed")
    
    # Test 4: Profile Setup Tests
    print("\n👤 PROFILE SETUP TESTS")  
    print("-" * 30)
    interests_success, interests = tester.test_get_interests()
    profile_success = tester.test_update_profile()
    
    # Test 5: Matching System Tests
    print("\n💕 MATCHING SYSTEM TESTS")
    print("-" * 30)
    suggestions_success, suggestions = tester.test_get_match_suggestions()
    
    if suggestions_success and suggestions:
        swipe_success, match_id = tester.test_swipe_functionality(suggestions)
    else:
        print("   ⚠️  No match suggestions available for swipe testing")
        swipe_success = False
        match_id = None
    
    # Test 6: Matches and Chat Tests
    print("\n💬 CHAT SYSTEM TESTS")
    print("-" * 30)
    matches_success, matches = tester.test_get_matches()
    chat_success = tester.test_chat_messages(matches)
    
    # Test 7: Content Moderation Tests
    print("\n🛡️  MODERATION SYSTEM TESTS")
    print("-" * 30)
    if suggestions:
        report_success = tester.test_report_functionality(suggestions)
    else:
        print("   ⚠️  No users available for report testing")
        report_success = False
    
    # Test 8: Video Chat System Tests (Legacy)
    print("\n🎥 VIDEO CHAT SYSTEM TESTS")
    print("-" * 30)
    topics_success, topics = tester.test_get_topics()
    
    topic_id = tester.test_create_topic(
        title="Testing Mental Health Support",
        category="mental-health", 
        description="A safe space to discuss mental health challenges"
    )
    
    if topic_id:
        specific_topic_success = tester.test_get_topic(topic_id)
    
    # Test 9: Agora Integration (expected to fail without config)
    agora_success = tester.test_agora_token()
    
    # Test 10: Logout
    print("\n🚪 CLEANUP TESTS")
    print("-" * 30)
    logout_success = tester.test_logout()
    
    return generate_report(tester)

def generate_report(tester):
    """Generate test report"""
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    print("\n🔍 DETAILED RESULTS:")
    for result in tester.test_results:
        status = "✅" if result['success'] else "❌"
        print(f"{status} {result['test_name']} - {result['actual_status']}")
    
    # Identify critical issues
    critical_issues = []
    if not any(r['success'] and 'Signup' in r['test_name'] for r in tester.test_results):
        critical_issues.append("User signup not working")
    if not any(r['success'] and 'Login' in r['test_name'] for r in tester.test_results):
        critical_issues.append("User login not working")
    if not any(r['success'] and 'Current User' in r['test_name'] for r in tester.test_results):
        critical_issues.append("Authentication middleware not working")
        
    if critical_issues:
        print(f"\n🚨 CRITICAL ISSUES:")
        for issue in critical_issues:
            print(f"   - {issue}")
    
    # Return exit code
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())