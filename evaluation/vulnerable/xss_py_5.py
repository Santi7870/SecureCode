# Benchmark Testcase: XSS (Python Vuln 5)
def render_greeting(username):
    # VULNERABLE: Direct string interpolation into raw HTML
    return f"<div><h1>Welcome {username}!</h1></div>"
