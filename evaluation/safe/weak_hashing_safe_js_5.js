// Benchmark Testcase: Weak Hashing (JS Safe 5)
const crypto = require("crypto");
function hashPassword(password) {
    // SAFE: Strong SHA256 digest
    return crypto.createHash("sha256").update(password).digest("hex");
}
