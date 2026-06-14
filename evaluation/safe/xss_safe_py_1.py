# Benchmark Testcase: XSS (Python Safe 1)
import html
def render_greeting(username):
    # SAFE: HTML escaping user payloads
    escaped_user = html.escape(username)
    return f"<div><h1>Welcome {escaped_user}!</h1></div>"
