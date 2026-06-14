// Benchmark Testcase: Command Injection (JS Vuln 2)
const { exec } = require("child_process");
function pingHost(ip) {
    // VULNERABLE: Command execution shell shell=true
    exec("ping -c 1 " + ip);
}
