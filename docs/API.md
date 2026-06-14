# Backend API Documentation

This page details the FastAPI REST endpoints exposed by the **SecureCode Reasoning Agent** backend server.

---

## 1. Health Status check
*   **Endpoint**: `GET /health`
*   **Response Model**: `HealthResponse`
*   **Response Schema**:
    ```json
    {
      "status": "healthy",
      "version": "2.0.0",
      "environment": "local",
      "engine_ready": true
    }
    ```

---

## 2. Scan Raw Code
*   **Endpoint**: `POST /api/scan/code`
*   **Request Model**: `CodeScanRequest`
*   **Request Schema**:
    ```json
    {
      "code": "API_KEY = '123456'",
      "filename": "demo.py",
      "language": "python"
    }
    ```
*   **Response Model**: `ScanResponse`
*   **Response Schema**:
    ```json
    {
      "scan_id": "84897f1f-48d6-4444-a0f5-442a98f1f50a",
      "filename": "demo.py",
      "language": "python",
      "created_at": "2026-06-14T07:18:22Z",
      "total_findings": 1,
      "critical_count": 1,
      "high_count": 0,
      "medium_count": 0,
      "low_count": 0,
      "status": "SUCCESS",
      "findings": [
        {
          "id": "SEC-001",
          "title": "Hardcoded Secret",
          "severity": "CRITICAL",
          "evidence": "API_KEY = '123456'",
          "line_number": 1,
          "cwe": "CWE-798",
          "explanation": "...",
          "impact": "...",
          "recommendation": "...",
          "validation_tests": "..."
        }
      ],
      "agent_trace": [
        "[Orchestrator] Starting Scan...",
        "[CodeUnderstandingAgent] Scanned file...",
        "[SecurityRiskAgent] Found SEC-001..."
      ],
      "report_markdown": "# Markdown report content...",
      "report_json": { ... }
    }
    ```

---

## 3. Scan Uploaded File
*   **Endpoint**: `POST /api/scan/file`
*   **Request Payload**: `Multipart/form-data` with key `file` containing source code file
*   **Response Model**: `ScanResponse`

---

## 4. Retrieve Scan History
*   **Endpoint**: `GET /api/scans`
*   **Response Model**: `list[ScanSummary]`
*   **Response Schema**:
    ```json
    [
      {
        "scan_id": "84897f1f-48d6-4444-a0f5-442a98f1f50a",
        "filename": "demo.py",
        "language": "python",
        "created_at": "2026-06-14T07:18:22Z",
        "total_findings": 1,
        "critical_count": 1,
        "high_count": 0,
        "medium_count": 0,
        "low_count": 0,
        "status": "SUCCESS"
      }
    ]
    ```

---

## 5. Retrieve Scan Details
*   **Endpoint**: `GET /api/scans/{scan_id}`
*   **Response Model**: `ScanResponse`

---

## 6. Export Reports
*   **Markdown Report**: `GET /api/reports/{scan_id}/markdown`
    *   *Returns raw PlainText Markdown*
*   **JSON Report**: `GET /api/reports/{scan_id}/json`
    *   *Returns parsed JSON report payload*
