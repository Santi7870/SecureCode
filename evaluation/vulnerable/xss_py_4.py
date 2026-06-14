# Benchmark Testcase: XSS (Python Vuln 4)
def render_greeting(username):
    # VULNERABLE: Direct string interpolation into raw HTML
    return f"<div><h1>Welcome {username}!</h1></div>"
