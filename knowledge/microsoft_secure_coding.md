# Microsoft Secure Coding Directives

This document details Microsoft-grade enterprise secure coding standards and threat mitigation models.

## Security Posture Management & Zero-Trust
Adhere to the Zero-Trust Architecture (ZTA) principle: **Never Trust, Always Verify**.
- **Explicit Secrets Isolation**: Secrets, credentials, and cryptographic certificates must never reside inside source repositories. All cloud resources must access storage keys using Managed Identities or secure configurations retrieved from Azure Key Vault.
- **Least Privilege Access**: Configure network resources, API endpoints, and cloud connectors to request the minimum permissions required. Restrict Cross-Origin Resource Sharing (CORS) strictly to explicit whitelists.

## Input Sanitization & Threat Modeling
- **Structured Argument Boundaries**: Isolate user inputs from application processing interpreters. This applies to database queries (enforce parameterized SQL), dynamic evaluations (ban `eval`/`exec`), and OS command processes (ban shell execution).
- **Path Verification**: Standardize path manipulations using path canonicalization APIs to confirm files remain within application-authorized directories.

## Cryptographic Standards
Microsoft-approved cryptographic standards require deprecating broken algorithms and ensuring TLS certificate integrity:
- **Encryption Strength**: MD5, SHA-1, and standard RC4/DES algorithms are obsolete. Use SHA-256 or SHA-512 for checksums, and bcrypt or Argon2id for password hashing.
- **Transport Security**: TLS 1.2 or TLS 1.3 must be enforced. Bypassing TLS/SSL verification parameters is strictly prohibited.
- **Entropy & Tokens**: Rely exclusively on cryptographically strong random generation libraries (CSPRNG) for session tokens and unique identifier keys.
