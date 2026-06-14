# 3-Minute Hackathon Demo Script

This document details the step-by-step presentation script for demoing the **SecureCode Reasoning Agent** system during a 3-minute presentation.

---

## ⏱️ Timeline Breakdown

### Minute 0:00 - 0:30: Problem & Architecture Hook
- **Presenter Action**: Open the React Web Dashboard in the web browser at `http://localhost:5173`. Show the clean UI.
- **Speech**: 
  > "Hello judges! Standard code scanners output generic warning text that leaves developers researching fixes. Today, we present the **SecureCode Reasoning Agent**, a multi-agent system that analyzes code, reasons about risks, recommends fixes, compiles validation tests, and outputs compliance reports. It uses a **Foundry IQ-inspired local grounding layer with planned Microsoft Foundry integration** to query standards locally, keeping proprietary code secure."

### Minute 0:30 - 1:30: Pasting Code & Agent Execution
- **Presenter Action**: Click the **Python Vuln** quick template button. The text area is immediately populated with vulnerable Python code. Click the **Run Multi-Agent Scan** button.
- **Visuals**: Show the live agent status updates on screen:
  1. *CodeUnderstandingAgent* parses files...
  2. *SecurityRiskAgent* scans policies...
  3. *ReasoningAgent* queries local grounding...
  4. *RemediationAgent* compiles remedies...
  5. *ValidationAgent* writes unit tests...
  6. *CriticVerifierAgent* performs quality verification check...
  7. *ReportAgent* builds files...
- **Speech**: 
  > "We'll paste a template containing a hardcoded API key, MD5 password hashing, and a SQL injection risk. As we click scan, notice our agent pipeline running. The Code Understanding and Security Risk agents locate flaws, the Reasoning Agent grounds these in our local secure coding standards, the Remediation Agent generates safe code, and the CriticVerifier verifies the results before report output."

### Minute 1:30 - 2:30: Inspecting Findings & Traces
- **Presenter Action**: Click on finding `SEC-001` or `SEC-002` in the findings table. Show the detail inspector on the right.
- **Visuals**: Review the details:
  - **Observed Code Evidence**
  - **Violated Principle** and **Severity Justification**
  - **Remediation Recommendation** (highlighting the secure code replacement)
  - **Automated Unit Test Suite** (pytest unit test case)
  - **Microsoft Foundry Grounding references** (`secure_coding_guidelines.md`)
  - **Verifier Status**: APPROVED
- **Speech**: 
  > "Let's inspect the SQL injection finding. On the right, we have a complete overview: why the severity was assigned, the security principle violated, a clean secure code block replacement, and a ready-to-run unit test case. Below, the CriticVerifier agent has approved the remedy, and we can download the full security report as Markdown or JSON."

### Minute 2:30 - 3:00: Data Safety & Recap
- **Presenter Action**: Point out the **Scan History** sidebar showing persistent history and the **Architecture** panel on the dashboard.
- **Speech**: 
  > "All data remains local. This aligns with Microsoft Foundry privacy principles for data safety. The persistent SQLite database logs our scan history, allowing us to review previous audits instantly. With local, secure, multi-agent code analysis, SecureCode Reasoning Agent ensures your code remains secure without leaking intellectual property. Thank you!"
