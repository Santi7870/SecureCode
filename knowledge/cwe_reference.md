# CWE Reference Grounding Guidelines

This document details Common Weakness Enumeration (CWE) patterns tracked by the Azure AI Foundry Grounding Layer.

## CWE-798: Use of Hard-coded Credentials
- **Description**: Storing sensitive authentication credentials (passwords, tokens, keys) in the source code.
- **Risk**: Hardcoded keys are easily extracted via reverse engineering, repository exposure, or access logs.
- **Remediation**: Use environment configurations or secure cloud secret vaults (e.g. Azure Key Vault).

## CWE-89: Improper Neutralization of Special Elements used in an SQL Command (SQL Injection)
- **Description**: Concatenating dynamic query strings with user-supplied arguments directly into SQL executors.
- **Risk**: Attackers can modify SQL commands, allowing unauthorized access, reading, or dropping database tables.
- **Remediation**: Use parameterized statements or query placeholders.

## CWE-95: Improper Neutralization of Directives in Dynamically Evaluated Code (Eval)
- **Description**: Passing unvalidated variables to dynamic code execution blocks (e.g. `eval()`, `exec()`).
- **Risk**: Execution of arbitrary system command strings, leading to complete machine takeover.
- **Remediation**: Use safe parsers (like JSON decoding) or dictionary maps.

## CWE-328: Use of Weak Hash
- **Description**: Relying on deprecated cryptographic algorithms like MD5 or SHA1.
- **Risk**: Vulnerable to collision attacks and quick pre-image decoding, rendering checksums and passwords useless.
- **Remediation**: Upgrade hashing algorithms to SHA-256 or bcrypt.

## CWE-330: Use of Insufficiently Random Values
- **Description**: Using simple pseudorandom number generators (PRNG) for cryptographic tokens.
- **Risk**: Predictable random outputs allow session hijacking or token forgery.
- **Remediation**: Use cryptographically secure pseudo-random generators (CSPRNG) like `secrets` in Python.

## CWE-295: Improper Certificate Validation
- **Description**: Disabling TLS/SSL verification parameters in network protocols.
- **Risk**: Man-in-the-Middle (MitM) attackers can intercept, modify, or inject malicious payloads into communication channels.
- **Remediation**: Ensure certificate verification parameters (`verify=True`) are active.

## CWE-942: Permissive CORS Configuration
- **Description**: Setting resource headers (`Access-Control-Allow-Origin`) to wildcards (`*`) when processing credentialed requests.
- **Risk**: External cross-origin domains can read sensitive internal application records from user browsers.
- **Remediation**: Restrict CORS headers to authorized domain lists.

## CWE-78: Improper Neutralization of OS Command Structure (OS Command Injection)
- **Description**: Injecting command arguments directly into shell-invoking statements (e.g., `shell=True`).
- **Risk**: Unauthorized execution of shell scripts on the host platform.
- **Remediation**: Pass arguments as static arrays and disable shell execution.

## CWE-22: Improper Limitation of a Pathname to a Restricted Directory (Path Traversal)
- **Description**: Constructing path coordinates by merging inputs directly without checking boundary containment.
- **Risk**: Accessing or writing files outside target folders, revealing system credentials.
- **Remediation**: Use path normalization utilities and confirm paths begin with the base directory route.

## CWE-79: Improper Neutralization of Input During Web Page Generation (Cross-Site Scripting)
- **Description**: Rendering user-controlled inputs inside web pages without sanitization or escaping.
- **Risk**: Injection of malicious JavaScript into target browsers, causing session hijacking.
- **Remediation**: Use text node payload updates (`textContent`) instead of parsing raw HTML strings.
