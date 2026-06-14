# Contributing Guidelines

We welcome contributions to the **SecureCode Reasoning Agent**!

## Development Guidelines

1.  **Preserve Core Engines**: Do not break the rule-based detection layers (`detectors/rules.py`) or the base agents.
2.  **No Credentials/Secrets**: Never commit passwords, API keys, or Azure connection configurations to this repository. All credentials must be dynamically resolved via environment variables.
3.  **Local Isolation**: Ensure the application remains 100% functional in local template mode without requiring external paid LLM APIs.
4.  **Unit Tests**: Run `pytest tests/` before making pull requests.
5.  **Clean Code**: Maintain clean, layered presentation, orchestration, and service folders.
