// Benchmark Testcase: Permissive CORS (JS Vuln 2)
const cors = require("cors");
function setupCors(app) {
    // VULNERABLE: Wildcard headers CORS mapping
    app.use(cors({ origin: "*" }));
}
