import os
import re
import json
from agents.base_agent import BaseAgent

class DependencyIntelligenceAgent(BaseAgent):
    """
    Analyzes project dependencies from package.json, requirements.txt, poetry.lock, pipfile,
    Dockerfiles, and Terraform configs.
    Categorizes dependencies into Runtime, Development, and Infrastructure dependencies.
    """
    def __init__(self):
        super().__init__("DependencyIntelligenceAgent")

    def analyze_dependencies(self, repo_path: str) -> dict:
        self.log(f"Analyzing project dependencies in {repo_path}...")
        
        runtime_deps = set()
        dev_deps = set()
        infra_deps = set()

        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in {".git", "node_modules", "venv", ".venv", "dist", "build"}]
            
            for file in files:
                file_lower = file.lower()
                filepath = os.path.join(root, file)

                # 1. Node.js dependencies
                if file_lower == "package.json":
                    try:
                        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                            data = json.load(f)
                            
                            # Runtime deps
                            for dep in data.get("dependencies", {}).keys():
                                runtime_deps.add(f"npm:{dep}")
                                
                            # Dev deps
                            for dep in data.get("devDependencies", {}).keys():
                                dev_deps.add(f"npm:{dep}")
                    except Exception:
                        pass

                # 2. Python requirements.txt dependencies
                elif file_lower == "requirements.txt":
                    try:
                        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                            for line in f:
                                line = line.strip()
                                if not line or line.startswith("#") or line.startswith("-r"):
                                    continue
                                # Extract dependency name before operators
                                dep_name = re.split(r'[=<>~!]', line)[0].strip()
                                if dep_name:
                                    runtime_deps.add(f"pip:{dep_name}")
                    except Exception:
                        pass

                # 3. Python poetry.lock dependencies
                elif file_lower == "poetry.lock":
                    try:
                        # Scan package names in lockfile
                        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()
                            # Find [[package]] lines
                            packages = re.findall(r'name\s*=\s*"(.*?)"', content)
                            for pkg in packages:
                                # We can categorize poetry dependencies in lockfile as runtime
                                runtime_deps.add(f"poetry:{pkg}")
                    except Exception:
                        pass

                # 4. Python pipfile
                elif file_lower == "pipfile":
                    try:
                        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()
                            # Basic extraction of packages and dev-packages
                            packages_sect = re.search(r'\[packages\](.*?)(\[|$)', content, re.DOTALL)
                            if packages_sect:
                                for line in packages_sect.group(1).splitlines():
                                    if "=" in line:
                                        dep = line.split("=")[0].strip().strip('"\'')
                                        runtime_deps.add(f"pipfile:{dep}")
                                        
                            dev_packages_sect = re.search(r'\[dev-packages\](.*?)(\[|$)', content, re.DOTALL)
                            if dev_packages_sect:
                                for line in dev_packages_sect.group(1).splitlines():
                                    if "=" in line:
                                        dep = line.split("=")[0].strip().strip('"\'')
                                        dev_deps.add(f"pipfile:{dep}")
                    except Exception:
                        pass

                # 5. Infrastructure dependencies (Docker & Terraform)
                elif "dockerfile" in file_lower or file_lower == "docker-compose.yml":
                    try:
                        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                            for line in f:
                                line = line.strip()
                                # E.g., FROM python:3.9-slim
                                if line.upper().startswith("FROM "):
                                    img = line.split()[1]
                                    infra_deps.add(f"docker:{img}")
                                # E.g., image: postgres:15
                                elif line.startswith("image:"):
                                    img = line.split(":", 1)[1].strip()
                                    infra_deps.add(f"docker-compose:{img}")
                    except Exception:
                        pass
                
                elif file_lower.endswith(".tf"):
                    try:
                        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()
                            # E.g., provider "aws"
                            providers = re.findall(r'provider\s+"(.*?)"', content)
                            for provider in providers:
                                infra_deps.add(f"terraform-provider:{provider}")
                            # E.g., module "vpc"
                            modules = re.findall(r'module\s+"(.*?)"', content)
                            for mod in modules:
                                infra_deps.add(f"terraform-module:{mod}")
                    except Exception:
                        pass

        total_runtime = len(runtime_deps)
        total_dev = len(dev_deps)
        total_infra = len(infra_deps)
        total_dependencies = total_runtime + total_dev + total_infra

        # Complexity classification
        if total_dependencies < 30:
            complexity = "Low"
        elif total_dependencies < 100:
            complexity = "Medium"
        else:
            complexity = "High"

        summary = {
            "total_dependencies": total_dependencies,
            "runtime_dependencies": total_runtime,
            "development_dependencies": total_dev,
            "infrastructure_dependencies": total_infra,
            "dependency_complexity": complexity
        }

        self.log(f"Dependency analysis complete. Total: {total_dependencies} (Runtime: {total_runtime}, Dev: {total_dev}, Infra: {total_infra}) | Complexity: {complexity}")
        return summary
