import os
import json

CATEGORIES = [
    "SQL Injection",
    "Hardcoded Secrets",
    "Weak Hashing",
    "Unsafe Eval",
    "Command Injection",
    "Path Traversal",
    "Insecure Randomness",
    "Disabled TLS Verification",
    "Permissive CORS",
    "XSS"
]

# Base templates dict mapping category -> language -> vuln/safe -> template string
TEMPLATES = {
    "SQL Injection": {
        "python": {
            "vuln": 'def get_user(db_conn, username):\n    # VULNERABLE: Direct SQL string interpolation\n    cursor = db_conn.cursor()\n    query = f"SELECT * FROM users WHERE username = \'{username}\'"\n    cursor.execute(query)\n    return cursor.fetchall()\n',
            "safe": 'def get_user(db_conn, username):\n    # SAFE: Parameterized database queries\n    cursor = db_conn.cursor()\n    query = "SELECT * FROM users WHERE username = %s"\n    cursor.execute(query, (username,))\n    return cursor.fetchall()\n'
        },
        "javascript": {
            "vuln": 'function getUser(db, username) {\n    // VULNERABLE: Raw SQL interpolation\n    const query = `SELECT * FROM users WHERE username = \'${username}\'`;\n    return db.query(query);\n}\n',
            "safe": 'function getUser(db, username) {\n    // SAFE: Prepared statement placeholders\n    const query = "SELECT * FROM users WHERE username = ?";\n    return db.query(query, [username]);\n}\n'
        }
    },
    "Hardcoded Secrets": {
        "python": {
            "vuln": '# VULNERABLE: Hardcoded credential tokens\nCLIENT_API_KEY = "xoxb-9812739812-738912739812-abc123xyz"\n',
            "safe": 'import os\n# SAFE: Loading secrets from configuration context\nCLIENT_API_KEY = os.environ.get("SLACK_API_KEY")\n'
        },
        "javascript": {
            "vuln": '// VULNERABLE: Embedded secret strings\nconst gitHubToken = "ghp_172a8b9c10d11e12f13g14h15i16j17k18l1";\n',
            "safe": '// SAFE: Read secrets from system process environment variables\nconst gitHubToken = process.env.GITHUB_TOKEN;\n'
        }
    },
    "Weak Hashing": {
        "python": {
            "vuln": 'import hashlib\ndef hash_password(password):\n    # VULNERABLE: Obsolete md5 hashing function\n    return hashlib.md5(password.encode()).hexdigest()\n',
            "safe": 'import hashlib\ndef hash_password(password):\n    # SAFE: Strong cryptographically secure hashing\n    return hashlib.sha256(password.encode()).hexdigest()\n'
        },
        "javascript": {
            "vuln": 'const crypto = require("crypto");\nfunction hashPassword(password) {\n    // VULNERABLE: Weak MD5 digest\n    return crypto.createHash("md5").update(password).digest("hex");\n}\n',
            "safe": 'const crypto = require("crypto");\nfunction hashPassword(password) {\n    // SAFE: Strong SHA256 digest\n    return crypto.createHash("sha256").update(password).digest("hex");\n}\n'
        }
    },
    "Unsafe Eval": {
        "python": {
            "vuln": 'def calculate_expression(expression):\n    # VULNERABLE: Execution of untrusted inputs\n    return eval(expression)\n',
            "safe": 'import json\ndef parse_expression(expression_str):\n    # SAFE: Secure JSON parsing instead of raw execution\n    return json.loads(expression_str)\n'
        },
        "javascript": {
            "vuln": 'function executeScript(script) {\n    // VULNERABLE: Unsafe eval statement execution\n    return eval(script);\n}\n',
            "safe": 'function executeScript(script) {\n    // SAFE: Standard JSON parsing\n    return JSON.parse(script);\n}\n'
        }
    },
    "Command Injection": {
        "python": {
            "vuln": 'import os\ndef ping_host(ip_address):\n    # VULNERABLE: OS command execution via string concat\n    os.system("ping -c 1 " + ip_address)\n',
            "safe": 'import subprocess\ndef ping_host(ip_address):\n    # SAFE: Parameter array execution without shell context\n    subprocess.run(["ping", "-c", "1", ip_address], shell=False)\n'
        },
        "javascript": {
            "vuln": 'const { exec } = require("child_process");\nfunction pingHost(ip) {\n    // VULNERABLE: Command execution shell shell=true\n    exec("ping -c 1 " + ip);\n}\n',
            "safe": 'const { execFile } = require("child_process");\nfunction pingHost(ip) {\n    // SAFE: Executable files with array parameters\n    execFile("ping", ["-c", "1", ip]);\n}\n'
        }
    },
    "Path Traversal": {
        "python": {
            "vuln": 'import os\ndef read_user_file(filename):\n    # VULNERABLE: Arbitrary file path concatenation traversal\n    filepath = os.path.join("/var/www/uploads", filename)\n    with open(filepath, "r") as f:\n        return f.read()\n',
            "safe": 'import os\ndef read_user_file(filename):\n    # SAFE: Restricting filepath inputs using base directory check\n    base_dir = "/var/www/uploads"\n    safe_name = os.path.basename(filename)\n    filepath = os.path.join(base_dir, safe_name)\n    return filepath\n'
        },
        "javascript": {
            "vuln": 'const path = require("path");\nconst fs = require("fs");\nfunction readUserFile(filename) {\n    // VULNERABLE: Path concatenation\n    const filepath = path.join("/var/www/uploads", filename);\n    return fs.readFileSync(filepath, "utf8");\n}\n',
            "safe": 'const path = require("path");\nfunction readUserFile(filename) {\n    // SAFE: Extracting basename to lock path containment\n    const safeName = path.basename(filename);\n    const filepath = path.join("/var/www/uploads", safeName);\n    return filepath;\n}\n'
        }
    },
    "Insecure Randomness": {
        "python": {
            "vuln": 'import random\ndef generate_session_token():\n    # VULNERABLE: Weak pseudo-random number generator\n    return str(random.random())\n',
            "safe": 'import secrets\ndef generate_session_token():\n    # SAFE: Cryptographically secure random tokens\n    return secrets.token_hex(32)\n'
        },
        "javascript": {
            "vuln": 'function generateSessionToken() {\n    // VULNERABLE: Math.random is not secure for credentials\n    return Math.random().toString(36).substring(2);\n}\n',
            "safe": 'const crypto = require("crypto");\nfunction generateSessionToken() {\n    // SAFE: Cryptographically secure random bytes\n    return crypto.randomBytes(32).toString("hex");\n}\n'
        }
    },
    "Disabled TLS Verification": {
        "python": {
            "vuln": 'import requests\ndef fetch_data(url):\n    # VULNERABLE: Disabled TLS verification\n    return requests.get(url, verify=False)\n',
            "safe": 'import requests\ndef fetch_data(url):\n    # SAFE: Verifying TLS certificates\n    return requests.get(url, verify=True)\n'
        },
        "javascript": {
            "vuln": 'const axios = require("axios");\nconst https = require("https");\nfunction fetchData(url) {\n    // VULNERABLE: Disabling SSL certificate validation\n    const agent = new https.Agent({ rejectUnauthorized: false });\n    return axios.get(url, { httpsAgent: agent });\n}\n',
            "safe": 'const axios = require("axios");\nfunction fetchData(url) {\n    // SAFE: Default TLS validation enabled\n    return axios.get(url);\n}\n'
        }
    },
    "Permissive CORS": {
        "python": {
            "vuln": 'from fastapi.middleware.cors import CORSMiddleware\ndef setup_cors(app):\n    # VULNERABLE: Wildcard origin mapping\n    app.add_middleware(CORSMiddleware, allow_origins=["*"])\n',
            "safe": 'from fastapi.middleware.cors import CORSMiddleware\ndef setup_cors(app):\n    # SAFE: Restricting CORS origin to verified hosts\n    app.add_middleware(CORSMiddleware, allow_origins=["https://secure.example.com"])\n'
        },
        "javascript": {
            "vuln": 'const cors = require("cors");\nfunction setupCors(app) {\n    // VULNERABLE: Wildcard headers CORS mapping\n    app.use(cors({ origin: "*" }));\n}\n',
            "safe": 'const cors = require("cors");\nfunction setupCors(app) {\n    // SAFE: White-listed domain headers\n    app.use(cors({ origin: "https://secure.example.com" }));\n}\n'
        }
    },
    "XSS": {
        "python": {
            "vuln": 'def render_greeting(username):\n    # VULNERABLE: Direct string interpolation into raw HTML\n    return f"<div><h1>Welcome {username}!</h1></div>"\n',
            "safe": 'import html\ndef render_greeting(username):\n    # SAFE: HTML escaping user payloads\n    escaped_user = html.escape(username)\n    return f"<div><h1>Welcome {escaped_user}!</h1></div>"\n'
        },
        "javascript": {
            "vuln": 'function renderGreeting(element, username) {\n    // VULNERABLE: DOM injection via innerHTML\n    element.innerHTML = "<div>" + username + "</div>";\n}\n',
            "safe": 'function renderGreeting(element, username) {\n    // SAFE: textContent locks HTML parsing\n    element.textContent = username;\n}\n'
        }
    }
}

def setup_evaluation_dirs():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    dirs = [
        os.path.join(base_dir, "templates", "vulnerable"),
        os.path.join(base_dir, "templates", "safe"),
        os.path.join(base_dir, "vulnerable"),
        os.path.join(base_dir, "safe"),
        os.path.join(base_dir, "expected_results"),
        os.path.join(base_dir, "reports"),
        os.path.join(base_dir, "benchmark_history"),
    ]
    
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    
    return base_dir

def generate_dataset():
    base_dir = setup_evaluation_dirs()
    print("Generating deterministical Benchmark Dataset v1.0...")

    # 1. Write core templates for reference/visibility
    for category, langs in TEMPLATES.items():
        cat_slug = category.lower().replace(" ", "_")
        for lang, states in langs.items():
            ext = "py" if lang == "python" else "js"
            
            # Vulnerable template
            vuln_tpl_path = os.path.join(base_dir, "templates", "vulnerable", f"{cat_slug}_{lang}_tpl.txt")
            with open(vuln_tpl_path, "w", encoding="utf-8") as f:
                f.write(states["vuln"])
                
            # Safe template
            safe_tpl_path = os.path.join(base_dir, "templates", "safe", f"{cat_slug}_{lang}_tpl.txt")
            with open(safe_tpl_path, "w", encoding="utf-8") as f:
                f.write(states["safe"])

    # Count parameters
    vuln_count = 0
    safe_count = 0

    # 2. Assembles 200 files (10 vulnerable and 10 safe files per category)
    # Mixes: 5 Python and 5 JavaScript for each vuln/safe state per category
    for category, langs in TEMPLATES.items():
        cat_slug = category.lower().replace(" ", "_")
        
        # 10 Vulnerable files (5 Python, 5 JS)
        for idx in range(1, 6):
            # Python Vuln
            py_code = f"# Benchmark Testcase: {category} (Python Vuln {idx})\n" + langs["python"]["vuln"]
            filename = f"{cat_slug}_py_{idx}.py"
            filepath = os.path.join(base_dir, "vulnerable", filename)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(py_code)
            
            # Expected JSON vuln
            expected_filepath = os.path.join(base_dir, "expected_results", f"{cat_slug}_py_{idx}.json")
            with open(expected_filepath, "w", encoding="utf-8") as f:
                json.dump({"expected_findings": [category]}, f, indent=2)
            vuln_count += 1
            
            # JS Vuln
            js_code = f"// Benchmark Testcase: {category} (JS Vuln {idx})\n" + langs["javascript"]["vuln"]
            filename = f"{cat_slug}_js_{idx}.js"
            filepath = os.path.join(base_dir, "vulnerable", filename)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(js_code)
                
            # Expected JSON vuln
            expected_filepath = os.path.join(base_dir, "expected_results", f"{cat_slug}_js_{idx}.json")
            with open(expected_filepath, "w", encoding="utf-8") as f:
                json.dump({"expected_findings": [category]}, f, indent=2)
            vuln_count += 1

        # 10 Safe files (5 Python, 5 JS)
        for idx in range(1, 6):
            # Python Safe
            py_code = f"# Benchmark Testcase: {category} (Python Safe {idx})\n" + langs["python"]["safe"]
            filename = f"{cat_slug}_safe_py_{idx}.py"
            filepath = os.path.join(base_dir, "safe", filename)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(py_code)
            
            # Expected JSON safe
            expected_filepath = os.path.join(base_dir, "expected_results", f"{cat_slug}_safe_py_{idx}.json")
            with open(expected_filepath, "w", encoding="utf-8") as f:
                json.dump({"expected_findings": []}, f, indent=2)
            safe_count += 1
            
            # JS Safe
            js_code = f"// Benchmark Testcase: {category} (JS Safe {idx})\n" + langs["javascript"]["safe"]
            filename = f"{cat_slug}_safe_js_{idx}.js"
            filepath = os.path.join(base_dir, "safe", filename)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(js_code)
                
            # Expected JSON safe
            expected_filepath = os.path.join(base_dir, "expected_results", f"{cat_slug}_safe_js_{idx}.json")
            with open(expected_filepath, "w", encoding="utf-8") as f:
                json.dump({"expected_findings": []}, f, indent=2)
            safe_count += 1

    print(f"Completed! Generated {vuln_count} vulnerable and {safe_count} safe benchmark files (total 200).")

if __name__ == "__main__":
    generate_dataset()
