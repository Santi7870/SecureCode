# Benchmark Testcase: Disabled TLS Verification (Python Vuln 3)
import requests
def fetch_data(url):
    # VULNERABLE: Disabled TLS verification
    return requests.get(url, verify=False)
