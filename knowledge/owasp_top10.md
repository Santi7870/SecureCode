# OWASP Top 10 Grounding References

This reference document outlines the core categories of the OWASP Top 10 (2021) and their mappings to specific software security vulnerabilities.

## A01:2021-Broken Access Control
Access control enforces policy such that users cannot act outside of their intended permissions. Failures typically lead to unauthorized information disclosure, modification, or destruction of all data, or performing a business function outside the user's limits.
- **CWE-942: Permissive CORS Configuration**: Overly permissive Cross-Origin Resource Sharing (CORS) policies allow malicious external sites to read sensitive response data. Whitelist trusted domains rather than using wildcard "*" headers when handling authenticated sessions.

## A02:2021-Cryptographic Failures
The first symptom is sensitive data exposure or system compromise due to weak encryption algorithms, weak keys, predictable generation, or certificate errors.
- **CWE-328: Use of Weak Hash**: Utilizing cryptographically broken hashing algorithms like MD5 or SHA1 for integrity checks or passwords exposes systems to collision and pre-image attacks.
- **CWE-330: Use of Insufficiently Random Values**: Predicting tokens, session IDs, or password reset parameters is possible when software relies on standard PRNGs instead of CSPRNGs.
- **CWE-295: Improper Certificate Validation**: Bypassing TLS/SSL verification exposes network data to intercepting Man-in-the-Middle (MitM) attacks.

## A03:2021-Injection
An application is vulnerable to injection attacks when user-supplied data is not validated, filtered, or sanitized, and is directly concatenated into dynamic interpreters.
- **CWE-89: SQL Injection**: Arbitrary SQL command execution via string formatting. Parameterized queries must isolate input variables from SQL instruction blocks.
- **CWE-78: OS Command Injection**: Passing raw inputs directly to shells allows system commands execution. Arguments should be passed as structured arrays with disabled shell parsing.
- **CWE-22: Path Traversal**: Unchecked path inputs enable attackers to access files outside the system directory bounds. Normalization and path containment assertions are required.
- **CWE-79: Cross-Site Scripting (XSS)**: Inserting untrusted input payloads directly into browser DOM trees. Escaping or text content node assignments are required.

## A05:2021-Security Misconfiguration
Vulnerabilities include default accounts, open ports, missing headers, or dynamic code execution modules left active.
- **CWE-95: Improper Neutralization of Directives in Dynamically Evaluated Code (Eval)**: Dynamic statement parsing (e.g. `eval` or `exec`) allows attackers to execute arbitrary server-side script structures.

## A07:2021-Identification and Authentication Failures
Authentication issues compromise session management, credentials storage, and multi-factor capabilities.
- **CWE-798: Use of Hard-coded Credentials**: Storing API keys, database credentials, or secret tokens directly in repository source codes. Secrets should reside in environment vaults.
