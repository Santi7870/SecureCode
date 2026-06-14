// Benchmark Testcase: Command Injection (JS Safe 4)
const { execFile } = require("child_process");
function pingHost(ip) {
    // SAFE: Executable files with array parameters
    execFile("ping", ["-c", "1", ip]);
}
