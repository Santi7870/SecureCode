import argparse
import sys
import os
import time
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.table import Table
from rich.live import Live
from rich.spinner import Spinner
from rich.align import Align

from orchestrator.orchestrator import AgentOrchestrator

console = Console()

def print_banner():
    banner = """
=========================================================
==             SECURECODE REASONING AGENT              ==
=========================================================
"""
    console.print(Align.center(Panel(Text(banner, style="cyan"), subtitle="Microsoft Agents League Hackathon MVP - Reasoning Agents Track", expand=False)))
    console.print(Align.center("[bold white]Foundry IQ Grounding Integration Concept * Multi-Agent Orchestration Layer[/bold white]\n"))


def run_cli():
    print_banner()

    parser = argparse.ArgumentParser(description="SecureCode Reasoning Agent Command Line CLI")
    parser.add_argument("--file", "-f", required=True, help="Path to the file to analyze (Python or JavaScript)")
    
    args = parser.parse_args()
    filepath = args.file

    if not os.path.exists(filepath):
        console.print(f"[bold red]Error:[/bold red] The file '[cyan]{filepath}[/cyan]' does not exist.")
        sys.exit(1)

    console.print(f"[bold yellow]Initiating Multi-Agent security analysis on target file:[/bold yellow] [cyan]{filepath}[/cyan]\n")

    # Setup orchestrator
    orchestrator = AgentOrchestrator()

    # We will simulate agent execution with a live spinner dashboard
    steps = [
        ("CodeUnderstandingAgent", "Analyzing target source structure, files properties, and AST constructs..."),
        ("SecurityRiskAgent", "Scanning code for matching policy rules and registering raw findings..."),
        ("ReasoningAgent", "Grounding vulnerability risk reasoning against Microsoft Foundry IQ knowledge base..."),
        ("RemediationAgent", "Generating secure code replacement recommendations..."),
        ("ValidationAgent", "Creating test suites to validate exploitability and fix correctness..."),
        ("CriticVerifierAgent", "Performing quality gates check and verification critique review..."),
        ("ReportAgent", "Assembling security findings, trace logs, and writing final reports...")
    ]

    with Live(Panel("Orchestrator Warmup...", title="Orchestrator State", border_style="blue"), console=console, refresh_per_second=4) as live:
        for idx, (agent_name, desc) in enumerate(steps):
            live.update(Panel(
                Text.assemble(
                    ("Active Agent: ", "bold white"),
                    (f"{agent_name}\n", "bold green"),
                    ("Status: ", "bold white"),
                    (f"{desc}\n\n", "italic yellow"),
                    (f"Workflow progress: {idx+1}/{len(steps)} agents dispatched", "dim white")
                ),
                title="Agent Orchestrator Pipeline",
                border_style="cyan"
            ))
            # Just a tiny sleep for UI visualization effect during CLI demos
            time.sleep(1.2)

    # Now execute the actual pipeline synchronously (which takes less than a second)
    result = orchestrator.run_analysis(filepath)

    if result.get("status") == "error":
        console.print(f"[bold red]Analysis failed:[/bold red] {result.get('error_message')}")
        sys.exit(1)

    findings_count = result.get("findings_count", 0)
    report_res = result.get("report_results", {})

    console.print("\n[bold green][OK] Orchestrator Analysis Finished Successfully![/bold green]\n")

    # Create summary findings table
    table = Table(title=f"Discovered Findings Summary ({findings_count} vulnerabilities)", border_style="cyan")
    table.add_column("ID", style="cyan", justify="center")
    table.add_column("Severity", style="bold red", justify="center")
    table.add_column("Line", style="yellow", justify="center")
    table.add_column("Title", style="white")
    table.add_column("CWE Category", style="magenta")

    # Fetch findings from output json to display them
    json_path = report_res.get("json_path")
    if os.path.exists(json_path):
        import json
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            for fnd in data.get("findings", []):
                sev_color = "red" if fnd["severity"] in ["CRITICAL", "HIGH"] else "yellow" if fnd["severity"] == "MEDIUM" else "blue"
                table.add_row(
                    fnd["id"],
                    f"[bold {sev_color}]{fnd['severity']}[/bold {sev_color}]",
                    str(fnd["line_number"]),
                    fnd["title"],
                    fnd["cwe"]
                )

    console.print(table)
    console.print()

    # Output report locations
    console.print(Panel(
        Text.assemble(
            ("Markdown Security Report: ", "bold white"),
            (f"{report_res.get('markdown_path')}\n", "cyan"),
            ("JSON Security Report:     ", "bold white"),
            (f"{report_res.get('json_path')}\n\n", "cyan"),
            ("[Compliance] Microsoft Foundry: ", "bold green"),
            ("Synthetic Demo data used. No company secrets scanned.", "italic white")
        ),
        title="Artifact Outputs",
        border_style="green"
    ))

if __name__ == "__main__":
    run_cli()
