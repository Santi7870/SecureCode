// Benchmark Testcase: Unsafe Eval (JS Safe 1)
function executeScript(script) {
    // SAFE: Standard JSON parsing
    return JSON.parse(script);
}
