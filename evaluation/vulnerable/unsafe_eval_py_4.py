# Benchmark Testcase: Unsafe Eval (Python Vuln 4)
def calculate_expression(expression):
    # VULNERABLE: Execution of untrusted inputs
    return eval(expression)
