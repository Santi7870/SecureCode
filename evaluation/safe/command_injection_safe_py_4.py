# Benchmark Testcase: Command Injection (Python Safe 4)
import subprocess
def ping_host(ip_address):
    # SAFE: Parameter array execution without shell context
    subprocess.run(["ping", "-c", "1", ip_address], shell=False)
