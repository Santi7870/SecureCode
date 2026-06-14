# Benchmark Testcase: SQL Injection (Python Safe 4)
def get_user(db_conn, username):
    # SAFE: Parameterized database queries
    cursor = db_conn.cursor()
    query = "SELECT * FROM users WHERE username = %s"
    cursor.execute(query, (username,))
    return cursor.fetchall()
