// Benchmark Testcase: Disabled TLS Verification (JS Safe 5)
const axios = require("axios");
function fetchData(url) {
    // SAFE: Default TLS validation enabled
    return axios.get(url);
}
