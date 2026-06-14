// Benchmark Testcase: Unsafe Eval (JS Safe 4)
function executeScript(script) {
    // SAFE: Standard JSON parsing
    return JSON.parse(script);
}
