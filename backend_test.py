#!/usr/bin/env python3
"""
Pop Off! Backend API Testing Suite
Tests all backend endpoints for the mobile app
"""

import requests
import json
import base64
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://mobile-popoff-build.preview.emergentagent.com/api"
TIMEOUT = 30

class PopOffAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.auth_token = None
        self.user_data = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> requests.Response:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if self.auth_token:
            request_headers["Authorization"] = f"Bearer {self.auth_token}"
            
        if headers:
            request_headers.update(headers)
            
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=request_headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=request_headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=request_headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
    
    def test_health_check(self):
        """Test basic health endpoints"""
        try:
            # Test root endpoint
            response = self.make_request("GET", "/")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Root Endpoint", True, f"API running: {data.get('message', '')}")
            else:
                self.log_test("Root Endpoint", False, f"Status: {response.status_code}")
                
            # Test health endpoint
            response = self.make_request("GET", "/health")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Health Check", True, f"Status: {data.get('status', '')}")
            else:
                self.log_test("Health Check", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Health Check", False, f"Error: {str(e)}")
    
    def test_authentication_flow(self):
        """Test complete authentication flow"""
        # Test data
        test_email = f"testuser_{int(time.time())}@popoff.com"
        test_password = "SecurePass123!"
        test_name = "Test User"
        
        try:
            # 1. Test Signup
            signup_data = {
                "name": test_name,
                "email": test_email,
                "password": test_password
            }
            
            response = self.make_request("POST", "/auth/signup", signup_data)
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.user_data = data.get("user")
                self.log_test("User Signup", True, f"User created: {data['user']['name']}")
            else:
                error_msg = response.json().get("detail", "Unknown error") if response.content else f"Status: {response.status_code}"
                self.log_test("User Signup", False, f"Failed: {error_msg}")
                return
                
            # 2. Test Login
            login_data = {
                "email": test_email,
                "password": test_password
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")  # Update token
                self.log_test("User Login", True, f"Login successful for: {data['user']['email']}")
            else:
                error_msg = response.json().get("detail", "Unknown error") if response.content else f"Status: {response.status_code}"
                self.log_test("User Login", False, f"Failed: {error_msg}")
                
            # 3. Test Get Current User
            response = self.make_request("GET", "/auth/me")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Get Current User", True, f"Retrieved user: {data.get('name', '')}")
            else:
                error_msg = response.json().get("detail", "Unknown error") if response.content else f"Status: {response.status_code}"
                self.log_test("Get Current User", False, f"Failed: {error_msg}")
                
        except Exception as e:
            self.log_test("Authentication Flow", False, f"Error: {str(e)}")
    
    def test_profile_management(self):
        """Test profile update and photo upload"""
        if not self.auth_token:
            self.log_test("Profile Management", False, "No auth token available")
            return
            
        try:
            # 1. Test Profile Update
            profile_data = {
                "bio": "I love connecting with new people and sharing experiences!",
                "city": "San Francisco",
                "state": "California",
                "age": 25,
                "interests": ["Technology", "Music", "Travel", "Gaming"],
                "profile_complete": True
            }
            
            response = self.make_request("PUT", "/profile", profile_data)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Profile Update", True, f"Profile updated for: {data.get('name', '')}")
            else:
                error_msg = response.json().get("detail", "Unknown error") if response.content else f"Status: {response.status_code}"
                self.log_test("Profile Update", False, f"Failed: {error_msg}")
                
            # 2. Test Photo Upload (base64)
            # Create a small test image in base64
            test_image_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            
            photo_data = {"photo": test_image_b64}
            response = self.make_request("POST", "/profile/photo", photo_data)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Photo Upload", True, f"Photo uploaded: {data.get('message', '')}")
            else:
                error_msg = response.json().get("detail", "Unknown error") if response.content else f"Status: {response.status_code}"
                self.log_test("Photo Upload", False, f"Failed: {error_msg}")
                
        except Exception as e:
            self.log_test("Profile Management", False, f"Error: {str(e)}")
    
    def test_topics_api(self):
        """Test topics endpoints"""
        try:
            # 1. Test Get All Topics
            response = self.make_request("GET", "/topics")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_test("Get Topics", True, f"Retrieved {len(data)} topics")
                else:
                    self.log_test("Get Topics", False, "No topics returned")
            else:
                self.log_test("Get Topics", False, f"Status: {response.status_code}")
                
            # 2. Test Get Topic Categories
            response = self.make_request("GET", "/topics/categories")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict) and len(data) > 0:
                    categories = list(data.keys())
                    self.log_test("Get Topic Categories", True, f"Retrieved {len(categories)} categories: {', '.join(categories[:3])}...")
                else:
                    self.log_test("Get Topic Categories", False, "No categories returned")
            else:
                self.log_test("Get Topic Categories", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Topics API", False, f"Error: {str(e)}")
    
    def test_matching_system(self):
        """Test matching system endpoints"""
        if not self.auth_token:
            self.log_test("Matching System", False, "No auth token available")
            return
            
        try:
            # 1. Test Start Matching
            match_data = {
                "mood": "Excited to chat!",
                "custom_message": "Looking forward to meeting someone new",
                "interests": ["Technology", "Music"]
            }
            
            response = self.make_request("POST", "/match/search", match_data)
            if response.status_code == 200:
                data = response.json()
                match_status = data.get("status", "")
                self.log_test("Start Matching", True, f"Match started with status: {match_status}")
            else:
                error_msg = response.json().get("detail", "Unknown error") if response.content else f"Status: {response.status_code}"
                self.log_test("Start Matching", False, f"Failed: {error_msg}")
                
            # 2. Test Get Match Status
            response = self.make_request("GET", "/match/status")
            if response.status_code == 200:
                data = response.json()
                status = data.get("status", "")
                self.log_test("Get Match Status", True, f"Current status: {status}")
            else:
                error_msg = response.json().get("detail", "Unknown error") if response.content else f"Status: {response.status_code}"
                self.log_test("Get Match Status", False, f"Failed: {error_msg}")
                
            # 3. Test Cancel Match
            response = self.make_request("POST", "/match/cancel")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Cancel Match", True, f"Match cancelled: {data.get('message', '')}")
            else:
                error_msg = response.json().get("detail", "Unknown error") if response.content else f"Status: {response.status_code}"
                self.log_test("Cancel Match", False, f"Failed: {error_msg}")
                
            # 4. Test End Call
            response = self.make_request("POST", "/match/end")
            if response.status_code == 200:
                data = response.json()
                self.log_test("End Call", True, f"Call ended: {data.get('message', '')}")
            else:
                error_msg = response.json().get("detail", "Unknown error") if response.content else f"Status: {response.status_code}"
                self.log_test("End Call", False, f"Failed: {error_msg}")
                
        except Exception as e:
            self.log_test("Matching System", False, f"Error: {str(e)}")
    
    def test_agora_integration(self):
        """Test Agora token and app ID endpoints"""
        if not self.auth_token:
            self.log_test("Agora Integration", False, "No auth token available")
            return
            
        try:
            # 1. Test Get Agora Token
            test_channel = "test-channel-123"
            response = self.make_request("GET", f"/agora/token?channel={test_channel}")
            if response.status_code == 200:
                data = response.json()
                token = data.get("token", "")
                channel = data.get("channel", "")
                uid = data.get("uid", "")
                self.log_test("Get Agora Token", True, f"Token generated for channel: {channel}, UID: {uid}")
            else:
                error_msg = response.json().get("detail", "Unknown error") if response.content else f"Status: {response.status_code}"
                self.log_test("Get Agora Token", False, f"Failed: {error_msg}")
                
            # 2. Test Get Agora App ID
            response = self.make_request("GET", "/agora/app-id")
            if response.status_code == 200:
                data = response.json()
                app_id = data.get("app_id", "")
                self.log_test("Get Agora App ID", True, f"App ID retrieved: {app_id[:10]}..." if app_id else "App ID retrieved")
            else:
                error_msg = response.json().get("detail", "Unknown error") if response.content else f"Status: {response.status_code}"
                self.log_test("Get Agora App ID", False, f"Failed: {error_msg}")
                
        except Exception as e:
            self.log_test("Agora Integration", False, f"Error: {str(e)}")
    
    def test_history_and_trending(self):
        """Test match history and hot topics"""
        if not self.auth_token:
            self.log_test("History & Trending", False, "No auth token available")
            return
            
        try:
            # 1. Test Get Match History
            response = self.make_request("GET", "/matches/history")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Match History", True, f"Retrieved {len(data)} match records")
                else:
                    self.log_test("Get Match History", False, "Invalid response format")
            else:
                error_msg = response.json().get("detail", "Unknown error") if response.content else f"Status: {response.status_code}"
                self.log_test("Get Match History", False, f"Failed: {error_msg}")
                
            # 2. Test Get Hot Topics
            response = self.make_request("GET", "/hot")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Hot Topics", True, f"Retrieved {len(data)} hot topics")
                else:
                    self.log_test("Get Hot Topics", False, "Invalid response format")
            else:
                error_msg = response.json().get("detail", "Unknown error") if response.content else f"Status: {response.status_code}"
                self.log_test("Get Hot Topics", False, f"Failed: {error_msg}")
                
        except Exception as e:
            self.log_test("History & Trending", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all test suites"""
        print(f"🚀 Starting Pop Off! Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Run test suites in order
        self.test_health_check()
        print()
        
        self.test_authentication_flow()
        print()
        
        self.test_profile_management()
        print()
        
        self.test_topics_api()
        print()
        
        self.test_matching_system()
        print()
        
        self.test_agora_integration()
        print()
        
        self.test_history_and_trending()
        print()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
        
        print("\n🎯 CRITICAL ISSUES:")
        critical_failures = []
        for result in self.test_results:
            if not result["success"] and any(keyword in result["test"].lower() for keyword in ["signup", "login", "auth", "match"]):
                critical_failures.append(result)
        
        if critical_failures:
            for failure in critical_failures:
                print(f"  🔥 {failure['test']}: {failure['details']}")
        else:
            print("  ✅ No critical failures detected")

if __name__ == "__main__":
    tester = PopOffAPITester()
    tester.run_all_tests()