// Benchmark Testcase: Permissive CORS (JS Safe 5)
const cors = require("cors");
function setupCors(app) {
    // SAFE: White-listed domain headers
    app.use(cors({ origin: "https://secure.example.com" }));
}
