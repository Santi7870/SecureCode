import os
import re

class FoundryIQKnowledgeBase:
    """
    Mock FoundryIQ Knowledge Base that retrieves secure coding references
    from local synthetic markdown files. This simulates Microsoft Foundry IQ grounding.
    """
    def __init__(self, knowledge_dir: str = None):
        if not knowledge_dir:
            # Default to the sibling "knowledge" directory
            current_dir = os.path.dirname(os.path.abspath(__file__))
            self.knowledge_dir = os.path.join(os.path.dirname(current_dir), "knowledge")
        else:
            self.knowledge_dir = knowledge_dir

    def _read_file(self, filename: str) -> str:
        filepath = os.path.join(self.knowledge_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                return f.read()
        return ""

    def query(self, category: str) -> dict:
        """
        Queries local mock knowledge documents for relevant security patterns,
        OWASP mappings, and validation instructions.
        """
        guidelines = self._read_file("secure_coding_guidelines.md")
        owasp = self._read_file("owasp_reference.md")
        validation = self._read_file("validation_guidelines.md")

        results = {
            "category": category,
            "guideline_snippet": "No specific guideline found.",
            "owasp_mapping": "OWASP mapping not found.",
            "validation_guideline": "No specific validation guidance found.",
            "grounding_references": []
        }

        # Substring or regex keyword extraction based on categories
        cat_lower = category.lower()
        
        # 1. Check Secrets
        if "secret" in cat_lower or "key" in cat_lower or "password" in cat_lower:
            results["guideline_snippet"] = self._extract_section(guidelines, "1. Secrets Management")
            results["owasp_mapping"] = self._extract_section(owasp, "3. Identification and Authentication Failures")
            results["validation_guideline"] = self._extract_section(validation, "2. Validating Secrets Management")
            results["grounding_references"] = [
                "knowledge/secure_coding_guidelines.md#1-secrets-management",
                "knowledge/owasp_reference.md#3-identification-and-authentication-failures",
                "knowledge/validation_guidelines.md#2-validating-secrets-management"
            ]
        # 2. Check Randomness
        elif "random" in cat_lower or "predictable" in cat_lower:
            results["guideline_snippet"] = self._extract_section(guidelines, "2. Cryptographic Randomness")
            results["owasp_mapping"] = self._extract_section(owasp, "2. Cryptographic Failures")
            results["validation_guideline"] = "Use standard secrets module assertions in Python or crypto.randomBytes in Node."
            results["grounding_references"] = [
                "knowledge/secure_coding_guidelines.md#2-cryptographic-randomness",
                "knowledge/owasp_reference.md#2-cryptographic-failures"
            ]
        # 3. Check TLS / SSL
        elif "tls" in cat_lower or "ssl" in cat_lower or "certificate" in cat_lower:
            results["guideline_snippet"] = self._extract_section(guidelines, "3. TLS / SSL Verification")
            results["owasp_mapping"] = self._extract_section(owasp, "2. Cryptographic Failures")
            results["validation_guideline"] = "Ensure request configurations setting 'verify' or equivalent TLS validation properties are True/active."
            results["grounding_references"] = [
                "knowledge/secure_coding_guidelines.md#3-tls--ssl-verification",
                "knowledge/owasp_reference.md#2-cryptographic-failures"
            ]
        # 4. Check CORS
        elif "cors" in cat_lower or "origin" in cat_lower:
            results["guideline_snippet"] = self._extract_section(guidelines, "4. Cross-Origin Resource Sharing")
            results["owasp_mapping"] = self._extract_section(owasp, "4. Security Misconfiguration")
            results["validation_guideline"] = "Verify CORS middleware configurations restrict origins to explicit trusted white-listed domains."
            results["grounding_references"] = [
                "knowledge/secure_coding_guidelines.md#4-cross-origin-resource-sharing",
                "knowledge/owasp_reference.md#4-security-misconfiguration"
            ]
        # 5. Check SQL Injection
        elif "sql" in cat_lower or "injection" in cat_lower and not "command" in cat_lower:
            results["guideline_snippet"] = "Avoid constructing SQL queries via string formatting or concatenation. Use parameterized queries."
            results["owasp_mapping"] = self._extract_section(owasp, "1. Injection")
            results["validation_guideline"] = self._extract_section(validation, "1. Validating SQL Injection Fixes")
            results["grounding_references"] = [
                "knowledge/owasp_reference.md#1-injection",
                "knowledge/validation_guidelines.md#1-validating-sql-injection-fixes"
            ]
        # 6. Check Command Injection
        elif "command" in cat_lower or "subprocess" in cat_lower:
            results["guideline_snippet"] = "Avoid shell=True in subprocess calls. Pass arguments as a list of arguments directly."
            results["owasp_mapping"] = self._extract_section(owasp, "1. Injection")
            results["validation_guideline"] = "Assert that subprocess calls specify executable arguments without invoking the shell."
            results["grounding_references"] = [
                "knowledge/owasp_reference.md#1-injection"
            ]
        # 7. Check Path Traversal
        elif "path" in cat_lower or "traversal" in cat_lower or "directory" in cat_lower:
            results["guideline_snippet"] = "Do not join paths directly with untrusted user input. Resolve path paths and verify containment within directory bounds."
            results["owasp_mapping"] = self._extract_section(owasp, "1. Injection")
            results["validation_guideline"] = "Verify path normalization and base directory check assertions are implemented in tests."
            results["grounding_references"] = [
                "knowledge/owasp_reference.md#1-injection"
            ]
        # 8. Check eval / exec
        elif "eval" in cat_lower or "exec" in cat_lower:
            results["guideline_snippet"] = "Avoid dynamic code execution with eval() or exec() as it can execute arbitrary payloads. Use safe parsing alternatives (json.loads or dictionary mapping)."
            results["owasp_mapping"] = self._extract_section(owasp, "4. Security Misconfiguration")
            results["validation_guideline"] = self._extract_section(validation, "3. Validating Safe Dynamic Code Execution")
            results["grounding_references"] = [
                "knowledge/owasp_reference.md#4-security-misconfiguration",
                "knowledge/validation_guidelines.md#3-validating-safe-dynamic-code-execution"
            ]
        # 9. Check Hashing
        elif "hash" in cat_lower or "md5" in cat_lower or "sha1" in cat_lower:
            results["guideline_snippet"] = "Do not use MD5 or SHA1 for passwords or verification. Use sha256 or bcrypt."
            results["owasp_mapping"] = self._extract_section(owasp, "2. Cryptographic Failures")
            results["validation_guideline"] = "Verify that secure hash utilities check algorithms and block deprecated cryptographic routines."
            results["grounding_references"] = [
                "knowledge/owasp_reference.md#2-cryptographic-failures"
            ]
        # 10. Check XSS / HTML insertion
        elif "xss" in cat_lower or "html" in cat_lower or "dom" in cat_lower:
            results["guideline_snippet"] = "Do not assign untrusted variables to innerHTML or call document.write. Use textContent or safe sanitization tools."
            results["owasp_mapping"] = self._extract_section(owasp, "1. Injection")
            results["validation_guideline"] = "Ensure elements are populated using innerText or textContent instead of innerHTML."
            results["grounding_references"] = [
                "knowledge/owasp_reference.md#1-injection"
            ]

        return results

    def _extract_section(self, text: str, header: str) -> str:
        """
        Helper method to extract a specific section from markdown file text.
        """
        if not text:
            return ""
        # Match header and retrieve up to next header
        pattern = re.compile(rf"##\s+{re.escape(header)}.*?(?=\n##|$)", re.DOTALL | re.IGNORECASE)
        match = pattern.search(text)
        if match:
            return match.group(0).strip()
        return f"Snippet from [{header}] was retrieved dynamically."
