# System Architecture - Phase 2 Web Platform

This document describes the design specifications of the Phase 2 full-stack local web platform for the **SecureCode Reasoning Agent** project.

---

## 🏗️ Layered Architecture Diagram

```mermaid
graph TD
    %% Frontend Subsystem
    subgraph Frontend (React + Vite + TS)
        App[App.tsx State Manager]
        UI[UI View Dashboard]
        APIClient[client.ts REST requests]
        styles[styles.css Microsoft Theme]
        
        App --> UI
        UI --> APIClient
    end

    %% Backend Subsystem
    subgraph Backend (FastAPI + SQLite)
        API[main.py API Routes]
        ScanSvc[scan_service.py Scan Service]
        RepSvc[report_service.py Report Service]
        AI[ai_provider.py Service abstraction]
        DB[(SQLite Scan History DB)]
        
        APIClient -->|HTTP / JSON| API
        API --> ScanSvc & RepSvc
        ScanSvc --> DB
        ScanSvc --> AI
    end

    %% Agent Engine Subsystem
    subgraph Multi-Agent Engine
        Orch[AgentOrchestrator]
        Agents[7 Specialized Agents]
        Rules[rules.py Rules Detector]
        FIQ[FoundryIQKnowledgeBase]
        KB_Files[Local Markdown Guidelines]
        
        ScanSvc --> Orch
        Orch --> Agents
        Agents --> Rules
        Agents --> FIQ
        FIQ --> KB_Files
    end
```

---

## 1. Backend Layer (FastAPI)
The backend is structured under the `backend/` directory:
- **Presentation Layer**: Exposes `/health`, `/api/scan/code`, `/api/scan/file`, `/api/scans`, and `/api/reports/{scan_id}/*`.
- **Database Layer**: SQLite managed via SQLAlchemy. Startup events trigger automatic database and table initialization (`Base.metadata.create_all`).
- **Service Layer**: 
  - `ScanService`: Coordinates temporary file generation, triggers the engine's `AgentOrchestrator`, invokes `AIProvider`, parses files, and writes records to database history.
  - `AIProvider`: Abstraction layer resolving optional LLM calls (Azure OpenAI or OpenAI) for text summaries, remediation notes, and quality check verifier critiques. Includes a default local template provider for pure offline operations.

---

## 2. SQLite Database Schema
The scan runs are stored in the `scans` table:
- `scan_id` (String Primary Key)
- `filename` (String)
- `language` (String)
- `created_at` (DateTime)
- `total_findings` (Integer)
- `critical_count` (Integer)
- `high_count` (Integer)
- `medium_count` (Integer)
- `low_count` (Integer)
- `status` (String - SUCCESS/ERROR)
- `report_markdown_path` (String)
- `report_json_path` (String)
- `raw_result_json` (Text - Serialized findings and agent logs)

---

## 3. Frontend Layer (React)
The frontend uses **React, TypeScript, Vite, and simple custom CSS**:
- **State Management**: Root component `App.tsx` handles histories list loading, active scan selection, tabs for pastes vs uploads, active inspector finding, API errors, and backend health status.
- **Agent Pipeline Progress Animation**: The scan button initiates an active loading sequence highlighting the status of individual agents: Code Understanding, Security Risk, Reasoning, Remediation, Validation, Critic Verifier, and Report.
- **Inspecting Details**: Selectable findings table row loads the finding details inspector showing evidence, reasoning explanations, remedies, unit tests, and Foundry IQ grounding data references.
