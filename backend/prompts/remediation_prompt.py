def get_remediation_prompt(finding: dict, vulnerable_code: str, file_path: str, repository_context: str, retrieved_chunks: list) -> tuple[str, str]:
    """
    Constructs the system and user prompts for the AI Remediation Agent.
    Returns:
        tuple[str, str]: (system_prompt, user_prompt)
    """
    
    # Format grounding references
    owasp_guidance = []
    cwe_references = []
    ms_guidance = []
    other_guidance = []
    
    for c in retrieved_chunks:
        source_lower = c.get("source", "").lower()
        content_block = f"- [{c.get('source')}#{c.get('section')}]: {c.get('content')}"
        if "owasp" in source_lower:
            owasp_guidance.append(content_block)
        elif "cwe" in source_lower:
            cwe_references.append(content_block)
        elif "microsoft" in source_lower or "secure_coding" in source_lower:
            ms_guidance.append(content_block)
        else:
            other_guidance.append(content_block)
            
    owasp_str = "\n".join(owasp_guidance) if owasp_guidance else "No specific OWASP guidance retrieved."
    cwe_str = "\n".join(cwe_references) if cwe_references else "No specific CWE references retrieved."
    ms_str = "\n".join(ms_guidance) if ms_guidance else "No specific Microsoft Secure Coding guidance retrieved."
    other_str = "\n".join(other_guidance) if other_guidance else ""

    system_prompt = (
        "You are an expert Principal AI Security Engineer.\n"
        "Your task is to analyze a detected vulnerability, read its vulnerable code, and generate a precise, "
        "code-aware remediation workspace tailored exactly to the provided source code.\n"
        "You must return a valid JSON object ONLY. No markdown wrapper, no backticks, no other text.\n"
        "The JSON object must match this schema:\n"
        "{\n"
        "  \"explanation\": \"Detailed security explanation of the vulnerability and its potential exploitation path.\",\n"
        "  \"root_cause\": \"Specific line-by-line root cause explaining how the code is vulnerable (mention line numbers if applicable).\",\n"
        "  \"business_impact\": \"Explain the potential business impact, compliance/regulatory violations, and exposure risk.\",\n"
        "  \"confidence_score\": 95,\n"
        "  \"secure_fix\": {\n"
        "    \"option_a\": {\n"
        "      \"title\": \"Option A: Quick Fix\",\n"
        "      \"description\": \"A simple, direct code adjustment to mitigate the immediate risk (e.g. direct validation or library call).\",\n"
        "      \"code\": \"Code snippet replacing the vulnerable code.\"\n"
        "    },\n"
        "    \"option_b\": {\n"
        "      \"title\": \"Option B: Recommended Fix\",\n"
        "      \"description\": \"The recommended standard secure coding pattern (e.g. parameterized query, built-in library sanitization).\",\n"
        "      \"code\": \"Code snippet replacing the vulnerable code.\"\n"
        "    },\n"
        "    \"option_c\": {\n"
        "      \"title\": \"Option C: Enterprise-grade Fix\",\n"
        "      \"description\": \"A robust, defense-in-depth architectural improvement (e.g. repository pattern, full ORM integration, custom validation decorator).\",\n"
        "      \"code\": \"Code snippet showing the structured approach.\"\n"
        "    }\n"
        "  },\n"
        "  \"validation_test\": \"A complete, runnable unit test (pytest/unittest for Python; Jest for Javascript/Typescript) verifying that the vulnerability is removed, the fix works, and original functionality is preserved. Directly reference the fixed function or module.\",\n"
        "  \"implementation_roadmap\": {\n"
        "    \"complexity\": \"Low/Medium/High\",\n"
        "    \"estimated_effort\": \"30 minutes / 2 hours / 1 day\",\n"
        "    \"business_priority\": \"Critical/High/Medium/Low\",\n"
        "    \"steps\": [\n"
        "      \"Step 1: ...\",\n"
        "      \"Step 2: ...\"\n"
        "    ]\n"
        "  }\n"
        "}"
    )

    user_prompt = (
        f"Vulnerability Type: {finding.get('title')}\n"
        f"CWE: {finding.get('cwe')}\n"
        f"Severity: {finding.get('severity')}\n"
        f"File Path: {file_path}\n\n"
        f"--- Vulnerable Code ---\n"
        f"{vulnerable_code}\n\n"
        f"--- Repository Context ---\n"
        f"{repository_context or 'No extra repository context available.'}\n\n"
        f"--- Retrieved OWASP Guidance ---\n"
        f"{owasp_str}\n\n"
        f"--- Retrieved CWE References ---\n"
        f"{cwe_str}\n\n"
        f"--- Retrieved Microsoft Secure Coding Guidance ---\n"
        f"{ms_str}\n"
    )
    
    if other_str:
        user_prompt += f"\n--- Other Grounding Reference Guidance ---\n{other_str}\n"

    user_prompt += (
        "\nProvide the customized remediation JSON payload. "
        "Make sure the secure code fixes directly reference and modify the actual vulnerable code structure. "
        "Do not provide generic templates."
    )

    return system_prompt, user_prompt
