import streamlit as st
import os
import json
from orchestrator.orchestrator import AgentOrchestrator

# Configure beautiful page layouts
st.set_page_config(
    page_title="SecureCode Reasoning Agent - Microsoft Agents League",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom css styling for premium look
st.markdown("""
    <style>
    .main-title {
        font-size: 2.8rem;
        font-weight: 800;
        color: #0078D4; /* Microsoft Blue */
        margin-bottom: 0.1rem;
    }
    .subtitle {
        font-size: 1.2rem;
        font-weight: 400;
        color: #555555;
        margin-bottom: 2rem;
    }
    .metric-box {
        background-color: #F3F2F1;
        padding: 1.2rem;
        border-radius: 8px;
        text-align: center;
        border: 1px solid #E1DFDD;
    }
    .metric-value {
        font-size: 2rem;
        font-weight: 700;
        color: #0078D4;
    }
    .metric-label {
        font-size: 0.9rem;
        font-weight: 500;
        color: #323130;
    }
    .badge-critical {
        background-color: #A80000;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
    }
    .badge-high {
        background-color: #D83B01;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
    }
    .badge-medium {
        background-color: #C86D00;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
    }
    .badge-low {
        background-color: #107C41;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
    }
    </style>
""", unsafe_allow_html=True)

# App Sidebar
st.sidebar.image("https://img.icons8.com/color/120/microsoft.png", width=60)
st.sidebar.title("SecureCode Reasoning")
st.sidebar.caption("Track: Reasoning Agents")
st.sidebar.markdown("---")

# File Selection
st.sidebar.subheader("Select Sample Code File")
sample_options = {
    "vulnerable_python.py": "samples/vulnerable_python.py",
    "vulnerable_javascript.js": "samples/vulnerable_javascript.js",
    "safe_python.py": "samples/safe_python.py"
}
selected_sample = st.sidebar.selectbox("Choose a sample code template:", list(sample_options.keys()))
selected_path = sample_options[selected_sample]

# Custom paste code options
custom_code_check = st.sidebar.checkbox("Analyze Custom Code Input Instead")
st.sidebar.markdown("---")
st.sidebar.markdown(
    "**Microsoft Foundry Alignment**\n"
    "- 🛡️ Local Grounding via Foundry IQ\n"
    "- 🤖 7 specialized coordinate agents\n"
    "- 📊 Verification Quality Gates"
)

# Header
st.markdown('<div class="main-title">🛡️ SecureCode Reasoning Agent</div>', unsafe_allow_html=True)
st.markdown('<div class="subtitle">Microsoft Agents League Hackathon MVP - Multi-Agent source code risk analysis & explanation</div>', unsafe_allow_html=True)

# Load selected code
if custom_code_check:
    language_opt = st.selectbox("Select Language", ["python", "javascript"])
    code_to_analyze = st.text_area("Paste Code to Analyze", value="# Insert code here...", height=250)
    # Write custom paste to a temporary analysis file
    target_filepath = "samples/custom_temp_code.py" if language_opt == "python" else "samples/custom_temp_code.js"
    os.makedirs("samples", exist_ok=True)
    with open(target_filepath, "w", encoding="utf-8") as f:
        f.write(code_to_analyze)
else:
    target_filepath = selected_path
    if os.path.exists(target_filepath):
        with open(target_filepath, "r", encoding="utf-8") as f:
            code_to_analyze = f.read()
    else:
        code_to_analyze = "# Error: Selected sample path not found."

# Tabs
tab1, tab2, tab3 = st.tabs(["💻 Target Code & Analysis", "📊 Findings & Agent Reasoning", "📚 Foundry IQ Knowledge Base"])

with tab1:
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("Source Code Viewer")
        file_ext = "python" if target_filepath.endswith(".py") else "javascript"
        st.code(code_to_analyze, language=file_ext, line_numbers=True)
        
        # Analyze button
        run_btn = st.button("🚀 Trigger Multi-Agent Pipeline", use_container_width=True)
        
    with col2:
        st.subheader("Agent Execution Monitor")
        if run_btn:
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            # Instantiating orchestrator
            # Let's perform step updates in Streamlit UI
            steps = [
                ("CodeUnderstandingAgent", "Resolving code file format and structure metadata..."),
                ("SecurityRiskAgent", "Scanning rules and registering code vulnerabilities..."),
                ("ReasoningAgent", "Grounding risks in Microsoft Foundry IQ guidelines..."),
                ("RemediationAgent", "Generating secure code replacement recommendations..."),
                ("ValidationAgent", "Creating test suites to validate vulnerabilities & fixes..."),
                ("CriticVerifierAgent", "Running security checks and critique quality review..."),
                ("ReportAgent", "Assembling reports and writing MD & JSON outputs...")
            ]
            
            for idx, (agent, desc) in enumerate(steps):
                status_text.info(f"**🤖 {agent}**: {desc}")
                progress_bar.progress((idx + 1) / len(steps))
                # Wait briefly to show agent transitions
                import time
                time.sleep(0.5)
                
            orchestrator = AgentOrchestrator()
            result = orchestrator.run_analysis(target_filepath)
            
            if result.get("status") == "success":
                status_text.success("🎉 Multi-Agent Analysis pipeline executed successfully!")
                st.session_state["report_res"] = result.get("report_results")
                st.session_state["findings_count"] = result.get("findings_count", 0)
                st.session_state["analyzed_file"] = target_filepath
                
                # Load trace log
                trace_logs = orchestrator.trace_logs
                with st.expander("🔍 View Detailed Multi-Agent Orchestration Log", expanded=True):
                    st.code("\n".join(trace_logs), language="text")
            else:
                status_text.error(f"❌ Pipeline failed: {result.get('error_message')}")
        else:
            st.info("Click the 'Trigger Multi-Agent Pipeline' button to analyze the code.")

with tab2:
    if "report_res" in st.session_state:
        report_res = st.session_state["report_res"]
        json_path = report_res.get("json_path")
        
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                report_data = json.load(f)
                
            findings = report_data.get("findings", [])
            
            # Dashboard counts
            c_col1, c_col2, c_col3, c_col4, c_col5 = st.columns(5)
            
            critical_count = sum(1 for f in findings if f["severity"].upper() == "CRITICAL")
            high_count = sum(1 for f in findings if f["severity"].upper() == "HIGH")
            medium_count = sum(1 for f in findings if f["severity"].upper() == "MEDIUM")
            low_count = sum(1 for f in findings if f["severity"].upper() == "LOW")
            
            with c_col1:
                st.markdown(f'<div class="metric-box"><div class="metric-value">{len(findings)}</div><div class="metric-label">Total Findings</div></div>', unsafe_allow_html=True)
            with c_col2:
                st.markdown(f'<div class="metric-box"><div class="metric-value" style="color: #A80000;">{critical_count}</div><div class="metric-label">Critical Risks</div></div>', unsafe_allow_html=True)
            with c_col3:
                st.markdown(f'<div class="metric-box"><div class="metric-value" style="color: #D83B01;">{high_count}</div><div class="metric-label">High Risks</div></div>', unsafe_allow_html=True)
            with c_col4:
                st.markdown(f'<div class="metric-box"><div class="metric-value" style="color: #C86D00;">{medium_count}</div><div class="metric-label">Medium Risks</div></div>', unsafe_allow_html=True)
            with c_col5:
                st.markdown(f'<div class="metric-box"><div class="metric-value" style="color: #107C41;">{low_count}</div><div class="metric-label">Low Risks</div></div>', unsafe_allow_html=True)
                
            st.markdown("---")
            
            if findings:
                st.subheader("Discovered Vulnerabilities & Reasoning Traces")
                
                for f in findings:
                    severity = f["severity"].upper()
                    badge_style = "badge-critical" if severity == "CRITICAL" else "badge-high" if severity == "HIGH" else "badge-medium" if severity == "MEDIUM" else "badge-low"
                    
                    header_label = f"[{f['id']}] {f['title']} (Line {f['line_number']})"
                    
                    with st.expander(header_label, expanded=True):
                        st.markdown(f"**Severity:** <span class='{badge_style}'>{severity}</span> &nbsp;&nbsp; | &nbsp;&nbsp; **CWE:** `{f['cwe']}` &nbsp;&nbsp; | &nbsp;&nbsp; **Confidence:** `{f['confidence']}`", unsafe_allow_html=True)
                        st.write("")
                        st.write(f"**Description:** {f['explanation']}")
                        st.write(f"**Security Impact:** {f['impact']}")
                        st.markdown(f"**Observed Code Line:** `{f['evidence']}`")
                        
                        r_col1, r_col2 = st.columns(2)
                        
                        with r_col1:
                            st.markdown("#### 🤖 Grounded Reasoning (ReasoningAgent)")
                            reasoning = f.get("reasoning", {})
                            st.markdown(f"- **Violated Principle:** {reasoning.get('security_principle_violated')}")
                            st.markdown(f"- **Severity Justification:** {reasoning.get('severity_justification')}")
                            st.markdown(f"- **Remediation Strategy:** {reasoning.get('fix_strategy')}")
                            
                            st.markdown("#### 🔍 Quality Verification Critique (CriticVerifierAgent)")
                            critique = f.get("critic_review", {})
                            st.markdown(f"- **Status:** `{critique.get('status')}`")
                            st.markdown(f"- *{critique.get('critique')}*")
                            
                        with r_col2:
                            st.markdown("#### 💡 Remediation Recommendations (RemediationAgent)")
                            st.code(f.get("recommendation"), language="python" if file_ext == "python" else "javascript")
                            
                            st.markdown("#### 🧪 Automated Unit Test Suite (ValidationAgent)")
                            st.code(f.get("validation_tests"), language="python" if file_ext == "python" else "javascript")
            else:
                st.success("No vulnerabilities detected. Source code is secure against defined risk rules.")
                
            # Download buttons
            st.markdown("---")
            md_path = report_res.get("markdown_path")
            if os.path.exists(md_path):
                with open(md_path, "r", encoding="utf-8") as f:
                    md_data = f.read()
                st.download_button(
                    label="📥 Download Markdown Report",
                    data=md_data,
                    file_name="security_report.md",
                    mime="text/markdown",
                    use_container_width=True
                )
    else:
        st.info("Trigger analysis from the first tab to view findings.")

with tab3:
    st.subheader("Microsoft Foundry IQ Mock Grounding Guidelines")
    st.write("These files ground our multi-agent reasoning, representing secure guidelines retrieved from local knowledge repositories:")
    
    k_col1, k_col2, k_col3 = st.columns(3)
    
    with k_col1:
        st.markdown("### 📜 Secure Coding Guidelines")
        guidelines_path = "knowledge/secure_coding_guidelines.md"
        if os.path.exists(guidelines_path):
            with open(guidelines_path, "r", encoding="utf-8") as f:
                st.markdown(f.read())
                
    with k_col2:
        st.markdown("### 🏷️ OWASP Top 10 Reference Mapping")
        owasp_path = "knowledge/owasp_reference.md"
        if os.path.exists(owasp_path):
            with open(owasp_path, "r", encoding="utf-8") as f:
                st.markdown(f.read())
                
    with k_col3:
        st.markdown("### 🧪 Security Validation Standards")
        validation_path = "knowledge/validation_guidelines.md"
        if os.path.exists(validation_path):
            with open(validation_path, "r", encoding="utf-8") as f:
                st.markdown(f.read())
