// Benchmark Testcase: XSS (JS Safe 3)
function renderGreeting(element, username) {
    // SAFE: textContent locks HTML parsing
    element.textContent = username;
}
