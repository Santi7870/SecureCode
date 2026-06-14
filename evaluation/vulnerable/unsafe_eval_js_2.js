// Benchmark Testcase: Unsafe Eval (JS Vuln 2)
function executeScript(script) {
    // VULNERABLE: Unsafe eval statement execution
    return eval(script);
}
