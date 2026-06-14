# SecureCode Reasoning Agent Safe File (Python)
# Synthetically generated for demo and verification purposes.

import hashlib
import secrets
import os
import requests
import subprocess
import sqlite3
import json

# 1. Remediation: Fetch secret key from environment variables or vault instead of hardcoding
API_KEY = os.getenv("API_KEY")

def get_user_data(username_val):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    # 2. Remediation: Use parameterized query parameters to separate SQL instructions from input values
    cursor.execute("SELECT * FROM users WHERE username = %s", (username_val,))
    return cursor.fetchall()

def execute_calculator(input_expression):
    # 3. Remediation: Replace unsafe eval/exec with safe json loading or lookup dictionary
    # Assuming the input is structured JSON config, not raw Python statements
    return json.loads(input_expression)

def hash_user_password(password):
    # 4. Remediation: Replace weak MD5/SHA1 with secure SHA256 (plus salt if password storing)
    hasher = hashlib.sha256()
    hasher.update(password.encode('utf-8'))
    return hasher.hexdigest()

def generate_session_token():
    # 5. Remediation: Use secrets module (CSPRNG) for password reset or session tokens
    return secrets.token_hex(16)

def fetch_external_config(url):
    # 6. Remediation: Set verify=True to enable proper SSL certificate validation
    response = requests.get(url, verify=True)
    return response.json()

def compress_logs(filename):
    # 7. Remediation: Avoid shell=True. Pass command arguments as a structured array
    # Sanitize and list arguments to run tar safely
    subprocess.run(["tar", "-xzf", filename], shell=False)

def read_user_profile(user_input_path):
    # 8. Remediation: Sanitize path using basename and verify containment inside target directory
    base_dir = "/app/data/profiles"
    safe_filename = os.path.basename(user_input_path)
    filepath = os.path.join(base_dir, safe_filename)
    
    # Assert traversal protection
    if not os.path.abspath(filepath).startswith(os.path.abspath(base_dir)):
        raise ValueError("Directory traversal attempt blocked.")
        
    with open(filepath, "r") as f:
        return f.read()
