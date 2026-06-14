// SecureCode Reasoning Agent Mock Vulnerable File (JavaScript)
// Synthetically generated for demo and verification purposes.

const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

const app = express();

// 1. Hardcoded Secret (CWE-798)
const db_password = "superSecureHackathonDatabasePassword2026!";

// 2. Overly Permissive CORS (CWE-942)
app.use(cors({ origin: "*" }));

app.get('/search', (req, res) => {
    const userId = req.query.id;
    // 3. SQL Injection (CWE-89)
    const sqlQuery = "SELECT * FROM users WHERE id = " + userId;
    db.query(sqlQuery, (err, result) => {
        res.send(result);
    });
});

app.post('/calculate', (req, res) => {
    const code = req.body.code;
    // 4. Unsafe eval/exec usage (CWE-95)
    const result = eval(code);
    res.send({ result });
});

app.get('/download', (req, res) => {
    const file = req.query.file;
    // 5. Path traversal patterns (CWE-22)
    fs.readFile("/var/www/uploads/" + file, 'utf8', (err, data) => {
        res.send(data);
    });
});

function checkUserToken(token) {
    // 6. Weak hashing algorithm (CWE-328)
    const hash = crypto.createHash('md5').update(token).digest('hex');
    return hash;
}

function renderContent(element, userText) {
    // 7. XSS-like unsafe HTML insertion (CWE-79)
    element.innerHTML = "<div>" + userText + "</div>";
}

function fetchConfig() {
    // 8. Disabled TLS verification (CWE-295)
    const agent = new https.Agent({
        rejectUnauthorized: false
    });
    https.get("https://internal.service/config", { agent }, (res) => {
        // process config
    });
}
