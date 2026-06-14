# Benchmark Testcase: SQL Injection (Python Vuln 5)
def get_user(db_conn, username):
    # VULNERABLE: Direct SQL string interpolation
    cursor = db_conn.cursor()
    query = f"SELECT * FROM users WHERE username = '{username}'"
    cursor.execute(query)
    return cursor.fetchall()
