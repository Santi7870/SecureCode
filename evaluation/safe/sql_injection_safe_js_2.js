// Benchmark Testcase: SQL Injection (JS Safe 2)
function getUser(db, username) {
    // SAFE: Prepared statement placeholders
    const query = "SELECT * FROM users WHERE username = ?";
    return db.query(query, [username]);
}
