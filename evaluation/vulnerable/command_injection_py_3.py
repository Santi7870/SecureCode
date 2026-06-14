# Benchmark Testcase: Command Injection (Python Vuln 3)
import os
def ping_host(ip_address):
    # VULNERABLE: OS command execution via string concat
    os.system("ping -c 1 " + ip_address)
