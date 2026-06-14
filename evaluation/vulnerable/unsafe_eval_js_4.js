// Benchmark Testcase: Unsafe Eval (JS Vuln 4)
function executeScript(script) {
    // VULNERABLE: Unsafe eval statement execution
    return eval(script);
}
