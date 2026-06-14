// Benchmark Testcase: XSS (JS Safe 5)
function renderGreeting(element, username) {
    // SAFE: textContent locks HTML parsing
    element.textContent = username;
}
