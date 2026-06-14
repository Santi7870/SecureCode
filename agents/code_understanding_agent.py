import os
from agents.base_agent import BaseAgent

class CodeUnderstandingAgent(BaseAgent):
    """
    Analyzes Python and JavaScript source code structure, lines,
    functions, and syntax markers, creating a code representation payload.
    """
    def __init__(self):
        super().__init__("CodeUnderstandingAgent")

    def analyze(self, filepath: str) -> dict:
        self.log(f"Reading target file structure: {filepath}")
        if not os.path.exists(filepath):
            self.log(f"Error: Target file not found at {filepath}")
            raise FileNotFoundError(f"File not found: {filepath}")

        filename = os.path.basename(filepath)
        _, ext = os.path.splitext(filepath)
        
        language = "unknown"
        if ext == ".py":
            language = "python"
        elif ext == ".js":
            language = "javascript"

        with open(filepath, "r", encoding="utf-8") as f:
            code_content = f.read()

        lines = code_content.splitlines()
        loc = len(lines)
        
        # Simple structural info: finding function declarations
        functions = []
        for line in lines:
            if language == "python":
                match = re_match_py_def(line)
                if match:
                    functions.append(match)
            elif language == "javascript":
                match = re_match_js_function(line)
                if match:
                    functions.append(match)

        self.log(f"Identified language: {language.upper()} | Lines of code: {loc}")
        self.log(f"Extracted {len(functions)} structure entities: {', '.join(functions) if functions else 'None'}")

        return {
            "filepath": filepath,
            "filename": filename,
            "language": language,
            "loc": loc,
            "functions": functions,
            "content": code_content
        }

def re_match_py_def(line: str) -> str:
    import re
    m = re.search(r'^\s*def\s+(\w+)\(', line)
    return m.group(1) if m else None

def re_match_js_function(line: str) -> str:
    import re
    # matches: function name() or const name = () =>
    m1 = re.search(r'function\s+(\w+)\(', line)
    if m1:
        return m1.group(1)
    m2 = re.search(r'(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=]+)\s*=>', line)
    return m2.group(1) if m2 else None
