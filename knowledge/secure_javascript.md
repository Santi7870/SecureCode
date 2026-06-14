# Secure Coding Standards for JavaScript and Node.js

This document presents JavaScript coding standards to mitigate client and server-side vulnerabilities.

## JS Secret Key Management (CWE-798)
Access credentials through the environment configurations:
```javascript
// Secure: Load credential parameters from process context
const apiKey = process.env.API_KEY;
```

## JS Database Sanitization (CWE-89)
Implement parameterized placeholders when requesting database resources:
```javascript
// Secure: Execute DB calls using placeholders to separate sql instruction
db.query('SELECT * FROM users WHERE username = ?', [usernameVal]);
```

## JS Safe Parsing (CWE-95)
Avoid passing dynamic arguments to `eval()` or `Function()`. Safely parse JSON strings:
```javascript
// Secure: Decode data schemas using built-in JSON methods
const data = JSON.parse(payloadStr);
```

## JS Cryptographic Randomness (CWE-330)
Standard `Math.random()` outputs are predictable. Use the `crypto` package for generating session IDs:
```javascript
const crypto = require('crypto');
// Secure: Generate token strings with high security entropy
const token = crypto.randomBytes(32).toString('hex');
```

## JS OS Command Execution (CWE-78)
Avoid generic execution interfaces like `child_process.exec()`. Use `execFile` or parameterized arguments:
```javascript
const { execFile } = require('child_process');
// Secure: Invoke program commands using argument lists without shell wrappers
execFile('tar', ['-xzf', filename], (err, stdout, stderr) => { ... });
```

## JS Safe DOM Rendering (CWE-79)
Prevent cross-site scripting by using text node element mapping instead of parsing inputs inside raw HTML interpreters:
```javascript
// Secure: Assign text strings using secure text content bindings
element.textContent = userControlledInput;
```

## JS CORS Header Policies (CWE-942)
Avoid setting credentialed cross-origin origin tags to generic wildcards (`*`). Limit authorization to specified host lists:
```javascript
const cors = require('cors');
// Secure: Limit access controls to verified origin endpoints
app.use(cors({ origin: 'https://trusted-portal.microsoft.com' }));
```

## JS Secure TLS Verification (CWE-295)
Ensure TLS verification remains active on Node.js clients:
```javascript
const https = require('https');
// Secure: Enforce TLS certificate chain validation checks
const agent = new https.Agent({ rejectUnauthorized: true });
```

## JS Cryptographic Hash Selection (CWE-328)
Upgrade legacy hashing functions:
```javascript
const crypto = require('crypto');
// Secure: Hash string content using SHA-256 standard
const hash = crypto.createHash('sha256').update(data).digest('hex');
```
