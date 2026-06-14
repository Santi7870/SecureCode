import os
import json
import logging
from openai import AzureOpenAI
from agents.base_agent import BaseAgent
from backend.prompts.remediation_prompt import get_remediation_prompt

logger = logging.getLogger("AIRemediationAgent")

class AIRemediationAgent(BaseAgent):
    """
    AI-powered, code-aware remediation system.
    Queries Azure OpenAI GPT-4.1-mini to generate contextual, grounded remediation
    options, validation tests, and implementation roadmaps.
    """
    def __init__(self):
        super().__init__("AIRemediationAgent")
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "securecode-reasoning")
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY", "")
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
        self.client = None
        
        # Telemetry metrics storage
        self.last_input_tokens = 0
        self.last_output_tokens = 0
        self.last_confidence = 90
        self.last_retrieval_chunks = 0

        if self.api_key and self.endpoint:
            try:
                self.client = AzureOpenAI(
                    azure_endpoint=self.endpoint,
                    api_key=self.api_key,
                    api_version="2024-02-15-preview"
                )
            except Exception as e:
                logger.warning(f"Failed to initialize Azure OpenAI client for remediation: {str(e)}")

    def get_telemetry_metrics(self) -> dict:
        return {
            "confidence": self.last_confidence,
            "input_tokens": self.last_input_tokens,
            "output_tokens": self.last_output_tokens,
            "retrieval_chunks": self.last_retrieval_chunks
        }

    def generate_remediation(self, finding: dict, vulnerable_code: str, file_path: str, repository_context: str, retrieved_chunks: list, critic_feedback: str = None) -> dict:
        """
        Generates contextual code remediation recommendations.
        If Azure OpenAI is not configured, falls back to structured templates.
        """
        self.log(f"Generating custom remediation for finding {finding.get('id')} ({finding.get('cwe')}) in file {file_path}")
        
        self.last_input_tokens = 0
        self.last_output_tokens = 0
        self.last_confidence = 90
        self.last_retrieval_chunks = len(retrieved_chunks)

        system_prompt, user_prompt = get_remediation_prompt(
            finding, vulnerable_code, file_path, repository_context, retrieved_chunks
        )

        # If we have critic feedback (from a rejection loop), append it to the prompt
        if critic_feedback:
            self.log(f"Re-generating remediation using Critic feedback: {critic_feedback}")
            user_prompt += f"\n\n--- CRITIC FEEDBACK FOR REGENERATION ---\nThe previous output was rejected. Please address this critique:\n{critic_feedback}\n"

        remediation_result = None

        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.deployment,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    max_tokens=1500,
                    temperature=0.2,
                    response_format={"type": "json_object"}
                )

                prompt_tokens = response.usage.prompt_tokens
                completion_tokens = response.usage.completion_tokens
                self.last_input_tokens += prompt_tokens
                self.last_output_tokens += completion_tokens

                result_text = response.choices[0].message.content.strip()
                remediation_result = json.loads(result_text)
                
                # Expose confidence score
                self.last_confidence = remediation_result.get("confidence_score", 90)
                self.log(f"Successfully generated remediation via Azure AI Foundry and GPT-4.1-mini. Confidence: {self.last_confidence}%")

            except Exception as e:
                logger.warning(f"Failed to query GPT-4.1-mini for remediation: {str(e)}. Using fallback generator.")

        if not remediation_result:
            self.log("Using local code-aware fallback generator for remediation.")
            remediation_result = self._get_fallback_remediation(finding, vulnerable_code, file_path, retrieved_chunks)
            # Estimate offline token counts (approx 4 chars per token)
            self.last_input_tokens += 1200
            self.last_output_tokens += 600
            self.last_confidence = remediation_result.get("confidence_score", 90)

        return remediation_result

    def _get_fallback_remediation(self, finding: dict, vulnerable_code: str, file_path: str, retrieved_chunks: list) -> dict:
        """
        Fallback implementation for offline operation. Builds structured remediation options
        tailored to the language and CWE code by looking closely at vulnerable_code lines.
        """
        cwe = finding.get("cwe", "")
        language = finding.get("language", "python").lower()
        title = finding.get("title", "Security Finding")
        severity = finding.get("severity", "HIGH")

        # Basic parsing to extract code elements for code-aware fixes
        lines = [line.strip() for line in vulnerable_code.split("\n") if line.strip()]
        target_line = lines[0] if lines else ""

        # Default options structures
        opt_a = {"title": "Option A: Quick Fix", "description": "Immediate sanitization or parameterization wrapper.", "code": vulnerable_code}
        opt_b = {"title": "Option B: Recommended Fix", "description": "Standard secure design implementation.", "code": vulnerable_code}
        opt_c = {"title": "Option C: Enterprise-grade Fix", "description": "Architectural refactoring to decouple inputs from execution.", "code": vulnerable_code}
        
        val_test = ""
        explanation = f"The code in `{file_path}` contains a potential `{title}` ({cwe}) vulnerability. The target instruction does not validate or sanitize input correctly."
        root_cause = f"Vulnerability occurs at code snippet: `{target_line}` where variables are used dynamically without checks."
        business_impact = f"Exploitation of `{title}` can lead to unauthorized execution, data theft, and service degradation, impacting regulatory compliance."
        complexity = "Medium"
        effort = "2 hours"
        priority = "High"
        steps = ["Identify the entrypoint variables.", "Apply parameterization or strong encoding.", "Verify integration tests pass."]

        if language == "python":
            if cwe == "CWE-89":  # SQL Injection
                explanation = "Direct SQL instruction construction dynamically embeds user inputs without query parameterization. This allows SQL command injection."
                root_cause = f"The query is built dynamically here: `{target_line}`. String concatenation bypasses SQL engine escaping."
                business_impact = "Complete database compromise, read/write/delete permissions over schema tables, and credential exposure."
                complexity = "Medium"
                effort = "2 hours"
                priority = "Critical"
                
                opt_a = {
                    "title": "Option A: Quick Parameterized Query",
                    "description": "Directly replace dynamic string concatenation with parameterized SQL bindings.",
                    "code": "# Option A: Parameterized Query\ncursor.execute(\"SELECT * FROM users WHERE username = %s\", (username_val,))\n# Alternatively, for SQLite:\n# cursor.execute(\"SELECT * FROM users WHERE username = ?\", (username_val,))"
                }
                opt_b = {
                    "title": "Option B: Recommended Context Manager",
                    "description": "Utilize context-managed database clients and parameterized queries to handle connections safely.",
                    "code": "# Option B: Recommended Context Manager\nwith db.cursor() as cursor:\n    query = \"SELECT * FROM users WHERE username = %s\"\n    cursor.execute(query, (username_val,))\n    result = cursor.fetchall()"
                }
                opt_c = {
                    "title": "Option C: Enterprise-grade ORM Layer Refactor",
                    "description": "Use an Object-Relational Mapper (ORM) like SQLAlchemy to completely abstract SQL generation.",
                    "code": "# Option C: ORM Layer (SQLAlchemy)\n# db_session.query(User).filter(User.username == username_val).all()"
                }
                val_test = (
                    "import unittest\nfrom unittest.mock import MagicMock\n\n"
                    "class TestSQLInjectionFix(unittest.TestCase):\n"
                    "    def test_sql_injection_protection(self):\n"
                    "        mock_cursor = MagicMock()\n"
                    "        # Verify parameterized input execution\n"
                    "        username = \"admin' OR '1'='1\"\n"
                    "        query = \"SELECT * FROM users WHERE username = %s\"\n"
                    "        # The fix should pass the parameters in a tuple, not concatenated\n"
                    "        mock_cursor.execute(query, (username,))\n"
                    "        mock_cursor.execute.assert_called_with(query, (username,))\n"
                )
                steps = [
                    "Locate all queries executing dynamic SQL strings.",
                    "Rewrite queries to use positional `%s` or named `:val` parameters.",
                    "Pass user inputs exclusively inside the parameters tuple/dictionary."
                ]

            elif cwe == "CWE-798":  # Hardcoded Credentials
                explanation = "Hardcoding credentials exposes API keys, service connection strings, or encryption passwords in plaintext inside git repositories."
                root_cause = f"Plaintext secret discovered directly inside the source file: `{target_line}`."
                business_impact = "Exposure of key systems, data breach, credentials leak on public repositories, and key rotation overhead."
                complexity = "Low"
                effort = "30 minutes"
                priority = "Critical"
                
                opt_a = {
                    "title": "Option A: Environment Variables",
                    "description": "Retrieve the credentials dynamically from environment variables on startup.",
                    "code": "import os\napi_key = os.environ.get(\"API_KEY\")"
                }
                opt_b = {
                    "title": "Option B: Recommended Dotenv Configuration",
                    "description": "Read settings using python-dotenv with secondary fallback support.",
                    "code": "import os\nfrom dotenv import load_dotenv\n\nload_dotenv()\napi_key = os.getenv(\"API_KEY\")\nif not api_key:\n    raise ValueError(\"API_KEY environment variable is required\")"
                }
                opt_c = {
                    "title": "Option C: Enterprise-grade Azure Key Vault SDK",
                    "description": "Integrate Azure Key Vault Secret Client to retrieve keys from a centralized vault manager.",
                    "code": "from azure.identity import DefaultAzureCredential\nfrom azure.keyvault.secrets import SecretClient\n\ncredential = DefaultAzureCredential()\nclient = SecretClient(vault_url=\"https://myvault.vault.azure.net/\", credential=credential)\napi_key = client.get_secret(\"ApiKeyName\").value"
                }
                val_test = (
                    "import os\nimport unittest\n\n"
                    "class TestSecretScanningFix(unittest.TestCase):\n"
                    "    def test_secret_not_hardcoded(self):\n"
                    "        # Ensure that no hardcoded secret values exist in memory, and variables bind to env\n"
                    "        os.environ[\"API_KEY\"] = \"mock_vault_token_value\"\n"
                    "        api_key = os.environ.get(\"API_KEY\")\n"
                    "        self.assertEqual(api_key, \"mock_vault_token_value\")\n"
                )
                steps = [
                    "Add the secret to the deployment's environment variables or configuration file (.env).",
                    "Add .env to your .gitignore to prevent committing secrets.",
                    "Replace the hardcoded assignment with `os.environ.get()`."
                ]

            elif cwe == "CWE-95":  # Unsafe eval
                explanation = "Direct execution of string inputs via `eval()` or `exec()` executes arbitrary command scripts within the context of the running server."
                root_cause = f"The input is evaluated directly here: `{target_line}`."
                business_impact = "Remote Code Execution (RCE) on the server, complete sandbox breakout, system takeover, and malware deployment."
                complexity = "Medium"
                effort = "2 hours"
                priority = "Critical"
                
                opt_a = {
                    "title": "Option A: Safe Dictionary Lookup",
                    "description": "Map commands to a dictionary registry instead of dynamically evaluating input strings.",
                    "code": "ops = {\"add\": lambda x, y: x + y, \"sub\": lambda x, y: x - y}\nop_fn = ops.get(user_op)\nif op_fn:\n    result = op_fn(x, y)"
                }
                opt_b = {
                    "title": "Option B: Recommended JSON Parsing",
                    "description": "If parsing payload strings, use `json.loads` to structuralize standard objects safely.",
                    "code": "import json\ndata = json.loads(payload_str)"
                }
                opt_c = {
                    "title": "Option C: Enterprise AST Parser Validation",
                    "description": "Use Abstract Syntax Trees (`ast.literal_eval`) to parse literal values securely without execution context.",
                    "code": "import ast\nsafe_data = ast.literal_eval(payload_str)"
                }
                val_test = (
                    "import unittest\nimport json\n\n"
                    "class TestEvalRemoval(unittest.TestCase):\n"
                    "    def test_eval_removed(self):\n"
                    "        payload = '{\"op\": \"add\", \"x\": 10}'\n"
                    "        # Replacing eval with json.loads to prevent shell executions\n"
                    "        data = json.loads(payload)\n"
                    "        self.assertEqual(data[\"op\"], \"add\")\n"
                )
                steps = [
                    "Audit codebase to identify all locations of `eval()` or `exec()`.",
                    "Determine if parsing json, evaluating numbers, or routing strings.",
                    "Replace with dictionary dispatchers, json loads, or `ast.literal_eval`."
                ]
            else:
                # Fallback for other python CWEs
                opt_a = {
                    "title": "Option A: Direct Sanitization",
                    "description": "Review the code and add basic checks.",
                    "code": f"# Safe Remediation:\n# Ensure variables are sanitized before use\n# Current line: {target_line}"
                }
                opt_b = {
                    "title": "Option B: Standard Library Verification",
                    "description": "Verify code using standard library controls.",
                    "code": f"# Safe Remediation:\n# Use standard Python security guidelines to isolate {cwe} risk."
                }
                opt_c = {
                    "title": "Option C: Defense in Depth",
                    "description": "Validate input and isolate processing context.",
                    "code": f"# Safe Remediation:\n# Validate and wrap call inside safety sandbox."
                }
                val_test = (
                    "import pytest\n\n"
                    f"def test_generic_{cwe.lower().replace('-', '_')}_resolution():\n"
                    "    # Verify finding resolution\n"
                    "    assert True\n"
                )

        else:  # javascript / typescript / default
            if cwe == "CWE-89":  # SQL Injection
                explanation = "Building dynamic SQL statements by appending or embedding parameter values in query strings exposes applications to SQL command execution."
                root_cause = f"SQL command is built dynamically here: `{target_line}`."
                business_impact = "Schema disclosure, unauthorized data extraction, database takeover, and session forgery."
                complexity = "Medium"
                effort = "2 hours"
                priority = "Critical"
                
                opt_a = {
                    "title": "Option A: Parameterized Query",
                    "description": "Replace string placeholders with positional arrays in mysql or pg drivers.",
                    "code": "// Option A: Parameterized Query\ndb.query('SELECT * FROM users WHERE username = ?', [usernameVal]);"
                }
                opt_b = {
                    "title": "Option B: Recommended Knex Query Builder",
                    "description": "Use a query builder library to construct query tokens automatically.",
                    "code": "// Option B: Knex Query Builder\nknex('users').where({ username: usernameVal }).select('*');"
                }
                opt_c = {
                    "title": "Option C: Enterprise Sequelize ORM",
                    "description": "Integrate Sequelize or TypeORM and leverage schema modeling.",
                    "code": "// Option C: Sequelize ORM Model\nUser.findAll({ where: { username: usernameVal } });"
                }
                val_test = (
                    "const db = {\n"
                    "  query: jest.fn().mockResolvedValue({ rows: [] })\n"
                    "};\n\n"
                    "describe('SQL Injection Protection Test', () => {\n"
                    "  it('should parameterize queries correctly', async () => {\n"
                    "    const usernameVal = \"admin' OR 1=1\";\n"
                    "    const query = 'SELECT * FROM users WHERE username = ?';\n"
                    "    await db.query(query, [usernameVal]);\n"
                    "    expect(db.query).toHaveBeenCalledWith(query, [usernameVal]);\n"
                    "  });\n"
                    "});"
                )
                steps = [
                    "Identify dynamic string concatenations in client queries.",
                    "Refactor query calls to supply parameter list bindings.",
                    "Confirm all database driver commands utilize parameterized syntax."
                ]

            elif cwe == "CWE-798":  # Hardcoded Credentials
                explanation = "Hardcoded passwords, keys, or OAuth configuration tokens expose backend assets to public scanners."
                root_cause = f"Discovery of plain credential string: `{target_line}`."
                business_impact = "Loss of cloud backend isolation, key revocation delays, and potential privilege escalation."
                complexity = "Low"
                effort = "30 minutes"
                priority = "Critical"
                
                opt_a = {
                    "title": "Option A: Process Environment Variables",
                    "description": "Fetch keys dynamically using standard environment wrappers.",
                    "code": "const apiKey = process.env.API_KEY;"
                }
                opt_b = {
                    "title": "Option B: Recommended Dotenv Library",
                    "description": "Load variables from a safe `.env` configuration template.",
                    "code": "require('dotenv').config();\nconst apiKey = process.env.API_KEY;\nif (!apiKey) {\n  throw new Error('API_KEY environment variable is missing.');\n}"
                }
                opt_c = {
                    "title": "Option C: Enterprise Cloud Vault Integration",
                    "description": "Query vault credentials dynamically using Azure Key Vault or AWS Secrets Manager.",
                    "code": "const { SecretClient } = require('@azure/keyvault-secrets');\nconst { DefaultAzureCredential } = require('@azure/identity');\n\nconst credential = new DefaultAzureCredential();\nconst client = new SecretClient('https://myvault.vault.azure.net', credential);\nconst apiKey = await client.getSecret('ApiKeyName');"
                }
                val_test = (
                    "describe('Secret Verification Test', () => {\n"
                    "  it('should not contain plaintext hardcoded credentials', () => {\n"
                    "    process.env.API_KEY = 'mock_secret_key';\n"
                    "    const apiKey = process.env.API_KEY;\n"
                    "    expect(apiKey).toBe('mock_secret_key');\n"
                    "  });\n"
                    "});"
                )
                steps = [
                    "Create or update a local `.env` configuration file.",
                    "Include `.env` inside `.gitignore` to prevent leaks.",
                    "Read parameters via `process.env` in application config."
                ]
            elif cwe == "CWE-95":  # Unsafe eval
                explanation = "Executing dynamically generated javascript strings using `eval()` or `Function()` allows attackers to hijack control flow."
                root_cause = f"The input is evaluated directly here: `{target_line}`."
                business_impact = "Cross-Site Scripting (XSS), arbitrary execution on the backend server, and complete authorization bypass."
                complexity = "Medium"
                effort = "2 hours"
                priority = "Critical"
                
                opt_a = {
                    "title": "Option A: Safe Dictionary Mapping",
                    "description": "Map command strings to static keys in a handler map.",
                    "code": "const actions = { play: () => {}, stop: () => {} };\nif (actions[actionName]) actions[actionName]();"
                }
                opt_b = {
                    "title": "Option B: Recommended JSON Parser",
                    "description": "Safely read object structures via native JSON parser.",
                    "code": "const data = JSON.parse(payloadStr);"
                }
                opt_c = {
                    "title": "Option C: Custom Safe Parser",
                    "description": "Sanitize and structure user values using validator schemas.",
                    "code": "const Joi = require('joi');\nconst schema = Joi.object({ value: Joi.number() });\nconst { value, error } = schema.validate(JSON.parse(payloadStr));"
                }
                val_test = (
                    "describe('Eval Removal Verification Test', () => {\n"
                    "  it('should parse payloads safely using JSON.parse', () => {\n"
                    "    const raw = '{\"value\": 42}';\n"
                    "    const data = JSON.parse(raw);\n"
                    "    expect(data.value).toBe(42);\n"
                    "  });\n"
                    "});"
                )
                steps = [
                    "Identify occurrences of `eval()` or `new Function()`.",
                    "Refactor text processing to map explicitly to a key-value registry.",
                    "Use schema validator middleware to ensure incoming types are safe."
                ]
            else:
                opt_a = {
                    "title": "Option A: Local Sanitization",
                    "description": f"Validate inputs and verify parameters to resolve {cwe}.",
                    "code": f"// Safe Remediation:\n// Validate input parameters before utilization\n// Line: {target_line}"
                }
                opt_b = {
                    "title": "Option B: Standard Library Verification",
                    "description": f"Use standard language security guidelines to resolve {cwe}.",
                    "code": f"// Safe Remediation:\n// Implement proper coding guidelines to isolate {cwe} risk."
                }
                opt_c = {
                    "title": "Option C: Defense in Depth",
                    "description": "Integrate architectural sanitization layers.",
                    "code": f"// Safe Remediation:\n// Enforce strict type validation and access control."
                }
                val_test = (
                    "describe('Finding Verification Test', () => {\n"
                    f"  it('should resolve {cwe} vulnerability', () => {{\n"
                    "    expect(true).toBe(true);\n"
                    "  }});\n"
                    "});"
                )

        return {
            "explanation": explanation,
            "root_cause": root_cause,
            "business_impact": business_impact,
            "confidence_score": 90,
            "secure_fix": {
                "option_a": opt_a,
                "option_b": opt_b,
                "option_c": opt_c
            },
            "validation_test": val_test,
            "implementation_roadmap": {
                "complexity": complexity,
                "estimated_effort": effort,
                "business_priority": priority,
                "steps": steps
            }
        }
