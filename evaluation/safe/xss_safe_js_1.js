// Benchmark Testcase: XSS (JS Safe 1)
function renderGreeting(element, username) {
    // SAFE: textContent locks HTML parsing
    element.textContent = username;
}
