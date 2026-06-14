// Benchmark Testcase: XSS (JS Vuln 5)
function renderGreeting(element, username) {
    // VULNERABLE: DOM injection via innerHTML
    element.innerHTML = "<div>" + username + "</div>";
}
