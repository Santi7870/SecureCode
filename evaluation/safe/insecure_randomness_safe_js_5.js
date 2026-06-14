// Benchmark Testcase: Insecure Randomness (JS Safe 5)
const crypto = require("crypto");
function generateSessionToken() {
    // SAFE: Cryptographically secure random bytes
    return crypto.randomBytes(32).toString("hex");
}
