// Benchmark Testcase: Insecure Randomness (JS Vuln 1)
function generateSessionToken() {
    // VULNERABLE: Math.random is not secure for credentials
    return Math.random().toString(36).substring(2);
}
