// Benchmark Testcase: Permissive CORS (JS Vuln 3)
const cors = require("cors");
function setupCors(app) {
    // VULNERABLE: Wildcard headers CORS mapping
    app.use(cors({ origin: "*" }));
}
