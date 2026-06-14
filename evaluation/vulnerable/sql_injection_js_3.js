// Benchmark Testcase: SQL Injection (JS Vuln 3)
function getUser(db, username) {
    // VULNERABLE: Raw SQL interpolation
    const query = `SELECT * FROM users WHERE username = '${username}'`;
    return db.query(query);
}
