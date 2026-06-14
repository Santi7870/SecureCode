// Benchmark Testcase: Unsafe Eval (JS Vuln 1)
function executeScript(script) {
    // VULNERABLE: Unsafe eval statement execution
    return eval(script);
}
