# Benchmark Testcase: Disabled TLS Verification (Python Safe 2)
import requests
def fetch_data(url):
    # SAFE: Verifying TLS certificates
    return requests.get(url, verify=True)
