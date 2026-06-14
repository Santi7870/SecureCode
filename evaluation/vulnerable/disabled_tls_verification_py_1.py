# Benchmark Testcase: Disabled TLS Verification (Python Vuln 1)
import requests
def fetch_data(url):
    # VULNERABLE: Disabled TLS verification
    return requests.get(url, verify=False)
