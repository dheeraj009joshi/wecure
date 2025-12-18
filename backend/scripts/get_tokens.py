"""
Get authentication tokens for test users
Run this after seeding the database to get tokens for Postman
"""
import sys
import os
from pathlib import Path
import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
API_PREFIX = "/api/v1"

# Test credentials
USERS = [
    {"email": "patient1@wecure.com", "password": "patient123", "name": "Patient 1"},
    {"email": "patient2@wecure.com", "password": "patient123", "name": "Patient 2"},
    {"email": "doctor1@wecure.com", "password": "doctor123", "name": "Doctor 1"},
    {"email": "doctor2@wecure.com", "password": "doctor123", "name": "Doctor 2"},
    {"email": "doctor3@wecure.com", "password": "doctor123", "name": "Doctor 3"},
    {"email": "admin@wecure.com", "password": "admin123", "name": "Admin"},
]

def get_token(email: str, password: str):
    """Get authentication token for a user"""
    try:
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/auth/login",
            json={"email": email, "password": password}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"❌ Failed to login {email}: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error getting token for {email}: {e}")
        return None

def get_user_ids():
    """Get user IDs for test users"""
    tokens = {}
    ids = {}
    
    print("🔑 Getting authentication tokens...")
    print("=" * 50)
    
    for user in USERS:
        token = get_token(user["email"], user["password"])
        if token:
            # Map to environment variable names
            name_key = user["name"].lower().replace(" ", "")
            if "patient" in name_key:
                if "1" in name_key:
                    tokens["patient1_token"] = token
                    tokens["patient_token"] = token  # Also set main patient token
                elif "2" in name_key:
                    tokens["patient2_token"] = token
            elif "doctor" in name_key:
                if "1" in name_key:
                    tokens["doctor1_token"] = token
                    tokens["doctor_token"] = token  # Also set main doctor token
                elif "2" in name_key:
                    tokens["doctor2_token"] = token
                elif "3" in name_key:
                    tokens["doctor3_token"] = token
            elif "admin" in name_key:
                tokens["admin_token"] = token
            
            print(f"✓ {user['name']}: Token obtained")
            
            # Try to get user ID from /auth/me
            try:
                response = requests.get(
                    f"{BASE_URL}{API_PREFIX}/auth/me",
                    headers={"Authorization": f"Bearer {token}"}
                )
                if response.status_code == 200:
                    data = response.json()
                    user_data = data.get("user", {})
                    user_id = user_data.get("id")
                    
                    # Get doctor/patient ID if applicable
                    if "doctor" in user["name"].lower():
                        doctor_response = requests.get(
                            f"{BASE_URL}{API_PREFIX}/doctors/me",
                            headers={"Authorization": f"Bearer {token}"}
                        )
                        if doctor_response.status_code == 200:
                            doctor_data = doctor_response.json()
                            ids["test_doctor_id"] = doctor_data.get("id")
                    elif "patient" in user["name"].lower():
                        patient_response = requests.get(
                            f"{BASE_URL}{API_PREFIX}/patients/me",
                            headers={"Authorization": f"Bearer {token}"}
                        )
                        if patient_response.status_code == 200:
                            patient_data = patient_response.json()
                            ids["test_patient_id"] = patient_data.get("id")
            except Exception as e:
                print(f"⚠️  Could not get ID for {user['name']}: {e}")
        else:
            print(f"❌ Failed to get token for {user['name']}")
    
    print("=" * 50)
    return tokens, ids

def update_postman_env(tokens: dict, ids: dict):
    """Update Postman environment file"""
    env_file = Path(__file__).parent.parent.parent / "WeCure_Local.postman_environment.json"
    
    if not env_file.exists():
        print(f"❌ Environment file not found: {env_file}")
        return
    
    try:
        with open(env_file, 'r') as f:
            env_data = json.load(f)
        
        # Update tokens
        for key, value in tokens.items():
            for var in env_data.get("values", []):
                if var["key"] == f"{key}_token":
                    var["value"] = value
                    break
            else:
                # Add new variable
                env_data["values"].append({
                    "key": f"{key}_token",
                    "value": value,
                    "enabled": True
                })
        
        # Update IDs
        for key, value in ids.items():
            for var in env_data.get("values", []):
                if var["key"] == key:
                    var["value"] = str(value) if value else ""
                    break
            else:
                env_data["values"].append({
                    "key": key,
                    "value": str(value) if value else "",
                    "enabled": True
                })
        
        with open(env_file, 'w') as f:
            json.dump(env_data, f, indent=2)
        
        print(f"✅ Updated Postman environment file: {env_file}")
        
    except Exception as e:
        print(f"❌ Error updating environment file: {e}")

def main():
    """Main function"""
    print("🚀 WeCure Token Generator")
    print("=" * 50)
    print(f"📡 Connecting to: {BASE_URL}")
    print()
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print("❌ Server is not responding correctly")
            return
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print("💡 Make sure the FastAPI server is running on http://localhost:8000")
        return
    
    tokens, ids = get_user_ids()
    
    if tokens:
        print("\n📝 Tokens obtained:")
        print("-" * 50)
        for key, value in tokens.items():
            print(f"{key}_token: {value[:20]}...")
        
        print("\n🆔 IDs obtained:")
        print("-" * 50)
        for key, value in ids.items():
            print(f"{key}: {value}")
        
        # Update Postman environment
        update_postman_env(tokens, ids)
        
        print("\n✅ Done! You can now use the Postman collection with these tokens.")
    else:
        print("\n❌ No tokens obtained. Please check your credentials and server.")

if __name__ == "__main__":
    main()

