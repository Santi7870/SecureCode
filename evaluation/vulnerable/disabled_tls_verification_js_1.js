// Benchmark Testcase: Disabled TLS Verification (JS Vuln 1)
const axios = require("axios");
const https = require("https");
function fetchData(url) {
    // VULNERABLE: Disabling SSL certificate validation
    const agent = new https.Agent({ rejectUnauthorized: false });
    return axios.get(url, { httpsAgent: agent });
}
