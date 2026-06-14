// Benchmark Testcase: Path Traversal (JS Vuln 1)
const path = require("path");
const fs = require("fs");
function readUserFile(filename) {
    // VULNERABLE: Path concatenation
    const filepath = path.join("/var/www/uploads", filename);
    return fs.readFileSync(filepath, "utf8");
}
