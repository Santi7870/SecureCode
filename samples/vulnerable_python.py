# SecureCode Reasoning Agent Mock Vulnerable File (Python)
# Synthetically generated for demo and verification purposes.

import hashlib
import random
import os
import requests
import subprocess
import sqlite3

# 1. Hardcoded Secret (CWE-798)
API_KEY = "AIzaSyD-fakeKeyForHackathonDemo123456"

def get_user_data(username_val):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    # 2. SQL Injection through string formatting (CWE-89)
    query = f"SELECT * FROM users WHERE username = '{username_val}'"
    cursor.execute(query)
    return cursor.fetchall()

def execute_calculator(input_expression):
    # 3. Unsafe eval/exec usage (CWE-95)
    return eval(input_expression)

def hash_user_password(password):
    # 4. Weak hashing algorithm (CWE-328)
    hasher = hashlib.md5()
    hasher.update(password.encode('utf-8'))
    return hasher.hexdigest()

def generate_session_token():
    # 5. Insecure random usage for tokens (CWE-330)
    token = ""
    for _ in range(16):
        token += str(random.randint(0, 9))
    return token

def fetch_external_config(url):
    # 6. Disabled TLS verification (CWE-295)
    response = requests.get(url, verify=False)
    return response.json()

def compress_logs(filename):
    # 7. Command injection patterns (CWE-78)
    command = f"tar -xzf {filename}"
    subprocess.run(command, shell=True)

def read_user_profile(user_input_path):
    # 8. Path traversal patterns (CWE-22)
    base_dir = "/app/data/profiles"
    filepath = os.path.join(base_dir, user_input_path)
    with open(filepath, "r") as f:
        return f.read()
