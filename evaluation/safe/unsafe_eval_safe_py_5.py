# Benchmark Testcase: Unsafe Eval (Python Safe 5)
import json
def parse_expression(expression_str):
    # SAFE: Secure JSON parsing instead of raw execution
    return json.loads(expression_str)
