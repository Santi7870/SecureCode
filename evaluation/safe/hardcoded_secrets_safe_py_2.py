# Benchmark Testcase: Hardcoded Secrets (Python Safe 2)
import os
# SAFE: Loading secrets from configuration context
CLIENT_API_KEY = os.environ.get("SLACK_API_KEY")
