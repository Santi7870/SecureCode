// Benchmark Testcase: Weak Hashing (JS Vuln 2)
const crypto = require("crypto");
function hashPassword(password) {
    // VULNERABLE: Weak MD5 digest
    return crypto.createHash("md5").update(password).digest("hex");
}
