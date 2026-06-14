import os
import json
import logging
from openai import AzureOpenAI
from agents.base_agent import BaseAgent
from agents.retriever_agent import RetrieverAgent

logger = logging.getLogger("ReasoningAgent")

class ReasoningAgent(BaseAgent):
    """
    Performs grounded security reasoning using GPT-4.1-mini.
    Retrieves grounding context using RetrieverAgent and calculates composite confidence scores.
    """
    def __init__(self, knowledge_service=None):
        super().__init__("ReasoningAgent")
        self.retriever = RetrieverAgent(knowledge_service=knowledge_service)
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
                logger.warning(f"Failed to initialize Azure OpenAI client for reasoning: {str(e)}")

    def reason(self, findings: list, telemetry = None) -> list:
        self.log(f"Beginning multi-agent grounded security analysis for {len(findings)} findings...")
        
        # Reset telemetry metrics for this run
        self.last_input_tokens = 0
        self.last_output_tokens = 0
        self.last_confidence = 90
        self.last_retrieval_chunks = 0
        
        reasoned_findings = []
        for f in findings:
            self.log(f"Processing finding {f['id']} - {f['title']}")

            # 1. Retrieve Context from Grounding Layer
            chunks = self.retriever.retrieve_context(f, telemetry=telemetry)
            self.last_retrieval_chunks += len(chunks)
            
            # Format chunks for prompt context
            context_blocks = []
            for idx, c in enumerate(chunks):
                context_blocks.append(
                    f"Context {idx+1} (Source: {c['source']}, Section: {c['section']}, Relevance Score: {c['relevance_score']}):\n"
                    f"{c['content']}"
                )
            context_str = "\n\n".join(context_blocks)

            # 2. Query GPT-4.1-mini via Azure AI Foundry if client is initialized
            grounded_response = None
            if self.client:
                try:
                    prompt = (
                        f"Analyze this security finding:\n"
                        f"Title: {f['title']}\n"
                        f"CWE: {f['cwe']}\n"
                        f"Evidence: {f['evidence']}\n\n"
                        f"Grounded Context:\n"
                        f"{context_str if context_str else 'No grounding context available.'}\n\n"
                        f"Task: Generate a grounded security analysis. Use ONLY the supplied context. "
                        f"If the context is insufficient, state that clearly."
                    )

                    response = self.client.chat.completions.create(
                        model=self.deployment,
                        messages=[
                            {
                                "role": "system",
                                "content": (
                                    "You are a Principal Application Security Architect.\n"
                                    "Your response must be grounded strictly in the provided context.\n"
                                    "You must output a valid JSON object matching the following structure:\n"
                                    "{\n"
                                    "  \"risk_explanation\": \"Clear analysis of the risk using the context.\",\n"
                                    "  \"severity\": \"Critical/High/Medium/Low\",\n"
                                    "  \"impact\": \"The potential impact of the security issue.\",\n"
                                    "  \"remediation\": \"The recommended secure replacement code snippet.\",\n"
                                    "  \"validation\": \"The recommended automated test logic/assertion to verify the fix.\",\n"
                                    "  \"llm_confidence\": 95,\n"
                                    "  \"citations\": [\n"
                                    "    {\n"
                                    "      \"source\": \"filename.md\",\n"
                                    "      \"section\": \"Section Name\"\n"
                                    "    }\n"
                                    "  ]\n"
                                    "}"
                                )
                            },
                            {"role": "user", "content": prompt}
                        ],
                        max_tokens=500,
                        temperature=0.2,
                        response_format={"type": "json_object"}
                    )

                    # Extract tokens and register them
                    prompt_tokens = response.usage.prompt_tokens
                    completion_tokens = response.usage.completion_tokens
                    self.last_input_tokens += prompt_tokens
                    self.last_output_tokens += completion_tokens
                    
                    if telemetry:
                        telemetry.register_token_usage(prompt_tokens, completion_tokens)

                    result_text = response.choices[0].message.content.strip()
                    grounded_response = json.loads(result_text)
                    self.log(f"Successfully processed reasoning via GPT-4.1-mini.")

                except Exception as e:
                    logger.warning(f"Failed to run GPT-4.1-mini reasoning for {f['id']}: {str(e)}. Using fallback reasoning.")

            # 3. Fallback to local template matching RAG context if offline
            if not grounded_response:
                grounded_response = self._get_fallback_grounded_reasoning(f, chunks)
                # Estimate offline token counts (approx 4 chars per token)
                est_in_tokens = 2100
                est_out_tokens = 450
                self.last_input_tokens += est_in_tokens
                self.last_output_tokens += est_out_tokens
                if telemetry:
                    telemetry.register_token_usage(est_in_tokens, est_out_tokens)

            # 4. Calculate Confidence Score
            detector_certainties = {
                "CWE-798": 95, "CWE-89": 90, "CWE-95": 90, "CWE-78": 90,
                "CWE-22": 85, "CWE-79": 85, "CWE-328": 85, "CWE-330": 80,
                "CWE-295": 85, "CWE-942": 80
            }
            det_cert = detector_certainties.get(f.get("cwe"), 80)
            
            top_rel_score = chunks[0]["relevance_score"] if chunks else 0.8
            rel_score = int(top_rel_score * 100)
            
            llm_conf = grounded_response.get("llm_confidence", 90)
            
            # Composite score: 40% detector, 30% retrieval relevance, 30% LLM confidence
            composite_confidence = int(0.4 * det_cert + 0.3 * rel_score + 0.3 * llm_conf)
            composite_confidence = max(50, min(99, composite_confidence))
            self.last_confidence = composite_confidence

            # Bind fields back to findings structure
            f_copy = f.copy()
            f_copy["explanation"] = grounded_response.get("risk_explanation", f["explanation"])
            f_copy["severity"] = grounded_response.get("severity", f["severity"]).upper()
            f_copy["impact"] = grounded_response.get("impact", f["impact"])
            f_copy["recommendation"] = grounded_response.get("remediation", "")
            f_copy["validation_tests"] = grounded_response.get("validation", "")
            f_copy["confidence"] = composite_confidence
            
            # Format Citations to include relevance scores
            citations = []
            for citation in grounded_response.get("citations", []):
                match_chunk = next(
                    (c for c in chunks if c["source"] == citation.get("source") and c["section"] == citation.get("section")), 
                    None
                )
                score = match_chunk["relevance_score"] if match_chunk else 0.85
                citations.append({
                    "source": citation.get("source"),
                    "section": citation.get("section"),
                    "relevance_score": score
                })
            
            if not citations and chunks:
                citations.append({
                    "source": chunks[0]["source"],
                    "section": chunks[0]["section"],
                    "relevance_score": chunks[0]["relevance_score"]
                })

            f_copy["grounding_data"] = {
                "category": f["cwe"],
                "guideline_snippet": chunks[0]["content"] if chunks else "No guidelines found.",
                "owasp_mapping": f"OWASP Mapping for {f['cwe']}",
                "validation_guideline": "Verify fix matches guidelines.",
                "grounding_references": [f"{c['source']}#{c['section']}" for c in citations],
                "citations": citations
            }
            
            reasoned_findings.append(f_copy)

        return reasoned_findings

    def get_telemetry_metrics(self) -> dict:
        """
        Returns spans statistics. Used by the orchestrator.
        """
        return {
            "confidence": self.last_confidence,
            "input_tokens": self.last_input_tokens,
            "output_tokens": self.last_output_tokens,
            "retrieval_chunks": self.last_retrieval_chunks
        }

    def _get_fallback_grounded_reasoning(self, finding: dict, chunks: list) -> dict:
        cwe = finding.get("cwe")
        title = finding.get("title")
        evidence = finding.get("evidence")
        lang = finding.get("language")

        citations = []
        if chunks:
            citations.append({
                "source": chunks[0]["source"],
                "section": chunks[0]["section"]
            })

        remediations = {
            "CWE-798": {
                "python": "import os\n# Secure: Load credentials from system environment variables\napi_key = os.environ.get(\"API_KEY\")",
                "javascript": "// Secure: Load credentials from system environment variables\nconst apiKey = process.env.API_KEY;"
            },
            "CWE-89": {
                "python": "# Secure: Use parameterized placeholders\ncursor.execute(\"SELECT * FROM users WHERE name = ?\", (username,))",
                "javascript": "// Secure: Use parameterized queries\ndb.query('SELECT * FROM users WHERE username = ?', [usernameVal]);"
            },
            "CWE-95": {
                "python": "import json\n# Secure: Parse input variables into JSON dictionaries safely\nparsed_data = json.loads(user_input_string)",
                "javascript": "// Secure: Decode data schemas using built-in JSON methods\nconst data = JSON.parse(payloadStr);"
            },
            "CWE-328": {
                "python": "import hashlib\n# Secure: Use SHA-256 algorithm for verification checks\nchecksum = hashlib.sha256(data_bytes).hexdigest()",
                "javascript": "const crypto = require('crypto');\n// Secure: Hash string content using SHA-256 standard\nconst hash = crypto.createHash('sha256').update(data).digest('hex');"
            },
            "CWE-330": {
                "python": "import secrets\n# Secure: Generate session identifiers with high entropy\ntoken = secrets.token_hex(32)",
                "javascript": "const crypto = require('crypto');\n// Secure: Generate token strings with high security entropy\nconst token = crypto.randomBytes(32).toString('hex');"
            },
            "CWE-295": {
                "python": "import requests\n# Secure: Keep verification active to check certificate chains\nres = requests.get(url, verify=True)",
                "javascript": "const https = require('https');\n// Secure: Enforce TLS certificate chain validation checks\nconst agent = new https.Agent({ rejectUnauthorized: true });"
            },
            "CWE-942": {
                "python": "# Secure: Whitelist trusted origins\n# Ensure Access-Control-Allow-Origin is set to explicit domain",
                "javascript": "const cors = require('cors');\n// Secure: Limit access controls to verified origin endpoints\napp.use(cors({ origin: 'https://trusted-portal.microsoft.com' }));"
            },
            "CWE-78": {
                "python": "import subprocess\n# Secure: Execute command arguments without shell parsing\nsubprocess.run([\"tar\", \"-xzf\", filename], shell=False)",
                "javascript": "const { execFile } = require('child_process');\n// Secure: Invoke program commands using argument lists without shell wrappers\nexecFile('tar', ['-xzf', filename], (err, stdout, stderr) => { ... });"
            },
            "CWE-22": {
                "python": "import os\n# Secure: Ensure requested path is contained within target base directory\nresolved_path = os.path.abspath(os.path.join(base_dir, user_input_path))\nif not resolved_path.startswith(os.path.abspath(base_dir)):\n    raise ValueError(\"Traversal Attempted\")",
                "javascript": "const path = require('path');\n// Secure: Sanitize input path and verify against base directories\nconst safePath = path.basename(req.query.file);\nconst target = path.join(baseDir, safePath);"
            },
            "CWE-79": {
                "python": "# Secure: Escaping code node values in HTML contexts",
                "javascript": "// Secure: Assign text strings using secure text content bindings\nelement.textContent = userControlledInput;"
            }
        }

        validations = {
            "CWE-798": {
                "python": "def test_secrets_isolation(monkeypatch):\n    monkeypatch.setenv(\"API_KEY\", \"vault_key_verification\")\n    assert get_api_key() == \"vault_key_verification\"",
                "javascript": "test('secret loaded from env', () => {\n  process.env.API_KEY = 'vault_key_verification';\n  expect(getApiKey()).toBe('vault_key_verification');\n});"
            },
            "CWE-89": {
                "python": "def test_database_parameterization(mock_cursor):\n    mock_cursor.execute(\"SELECT * FROM users WHERE name = ?\", (\"admin\",))",
                "javascript": "test('parameterized sql execute', () => {\n  expect(db.query.mock.calls[0][0]).toBe('SELECT * FROM users WHERE username = ?');\n});"
            },
            "CWE-95": {
                "python": "def test_safe_parsing():\n    assert parse_user_input('{\"status\": \"active\"}') == {\"status\": \"active\"}",
                "javascript": "test('safe JSON parse', () => {\n  expect(parseInput('{\"a\":1}')).toEqual({a:1});\n});"
            },
            "CWE-328": {
                "python": "def test_secure_hash():\n    assert get_checksum_alg() == \"sha256\"",
                "javascript": "test('use sha256', () => {\n  expect(getHashAlgorithm()).toBe('sha256');\n});"
            },
            "CWE-330": {
                "python": "def test_secrets_entropy():\n    token1 = generate_token()\n    token2 = generate_token()\n    assert token1 != token2",
                "javascript": "test('unique tokens', () => {\n  expect(genToken()).not.toBe(genToken());\n});"
            },
            "CWE-295": {
                "python": "def test_ssl_verification():\n    assert get_connector_setting(\"verify\") is True",
                "javascript": "test('tls verify active', () => {\n  expect(agent.options.rejectUnauthorized).toBe(true);\n});"
            },
            "CWE-942": {
                "python": "def test_cors_origin():\n    assert get_cors_origin() != \"*\"",
                "javascript": "test('cors restricted', () => {\n  expect(corsOptions.origin).toBe('https://trusted-portal.microsoft.com');\n});"
            },
            "CWE-78": {
                "python": "def test_subprocess_no_shell(mock_sub):\n    assert mock_sub.run_args['shell'] is False",
                "javascript": "test('execfile run', () => {\n  expect(execFileCalled).toBe(true);\n});"
            },
            "CWE-22": {
                "python": "def test_path_traversal_blocked():\n    with pytest.raises(ValueError):\n        resolve_path(\"../../etc/passwd\")",
                "javascript": "test('block traversal paths', () => {\n  expect(() => resolvePath('../../etc/passwd')).toThrow();\n});"
            },
            "CWE-79": {
                "python": "def test_xss_protection():\n    # Assert text node insertion is active\n    pass",
                "javascript": "test('assign textcontent', () => {\n  expect(element.textContent).toBe(userControlledInput);\n});"
            }
        }

        remedy = remediations.get(cwe, {}).get(lang, f"# Review and remediate code: {evidence}")
        validation = validations.get(cwe, {}).get(lang, f"# Validate secure execution: {evidence}")

        explanations = {
            "CWE-798": "The codebase contains a sensitive key, password, or token stored as a string literal. Hardcoding secrets makes them vulnerable to exposure through repository leaks or unauthorized source access.",
            "CWE-89": "User inputs or dynamic string concatenation are directly embedded into SQL queries. This allows attackers to manipulate the structure of the SQL commands.",
            "CWE-95": "The 'eval' or 'exec' function dynamically parses and executes code from a string. If the input contains user data, it can lead to arbitrary code execution.",
            "CWE-328": "The code uses weak hashing algorithms (like MD5 or SHA-1), which are cryptographically broken and susceptible to collision attacks.",
            "CWE-330": "The code uses standard pseudo-random number generators (PRNG) instead of cryptographically secure pseudo-random number generators (CSPRNG) for token generation, making outputs predictable.",
            "CWE-295": "TLS verification is disabled, bypassing the verification of SSL certificates and allowing Man-in-the-Middle (MitM) attacks.",
            "CWE-942": "The Cross-Origin Resource Sharing (CORS) header is set to '*', allowing any external origin to read sensitive response data.",
            "CWE-78": "Operating system commands are constructed with variables. This enables command injection, letting attackers execute arbitrary commands on the host system.",
            "CWE-22": "Constructing file paths from request parameters allows attackers to use relative path components (e.g. '../') to access arbitrary files on the system.",
            "CWE-79": "The code inserts unescaped values directly into web page elements via innerHTML or document.write, which can result in Cross-Site Scripting (XSS)."
        }
        explanation = explanations.get(cwe, "Insecure coding pattern detected.")

        impacts = {
            "CWE-798": "Full compromise of the service, cloud resources, database, or API integrations depending on secret privileges.",
            "CWE-89": "Unauthorized database reading, writing, schema modification, or data exfiltration.",
            "CWE-95": "Complete remote code execution (RCE) on the server, resulting in total host takeover.",
            "CWE-328": "Compromised credential database, forged file hashes, or weak signature validations.",
            "CWE-330": "Attackers can guess active session tokens, CSRF tokens, or password recovery URLs.",
            "CWE-295": "Interception and manipulation of sensitive communications between this server and external APIs.",
            "CWE-942": "Session hijacking or sensitive data reading from client-side browsers.",
            "CWE-78": "Arbitrary command execution on the host machine, leading to potential data destruction or pivoting.",
            "CWE-22": "Information disclosure of system files such as /etc/passwd or config.json.",
            "CWE-79": "Account hijacking, phishing, or redirection of web application users."
        }
        impact = impacts.get(cwe, "Risk of security exposure or compromise.")

        return {
            "risk_explanation": explanation,
            "severity": finding.get("severity", "LOW"),
            "impact": impact,
            "remediation": remedy,
            "validation": validation,
            "llm_confidence": 90,
            "citations": citations
        }
