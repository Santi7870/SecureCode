// Benchmark Testcase: Unsafe Eval (JS Safe 2)
function executeScript(script) {
    // SAFE: Standard JSON parsing
    return JSON.parse(script);
}
