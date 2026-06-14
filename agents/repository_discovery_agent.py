import os
import json
from agents.base_agent import BaseAgent

class RepositoryDiscoveryAgent(BaseAgent):
    """
    Analyzes repository composition to build a project profile, discovering
    supported languages, frameworks, infrastructure patterns, and project type.
    """
    def __init__(self):
        super().__init__("RepositoryDiscoveryAgent")

    def profile_repository(self, repo_path: str, indexed_data: dict, total_dependencies: int = 0) -> dict:
        self.log(f"Profiling repository structure under {repo_path}...")
        
        files_list = indexed_data.get("files_list", [])
        manifest = indexed_data.get("manifest", {})
        
        # 1. Discover Languages
        languages = []
        if manifest.get("python", 0) > 0:
            languages.append("Python")
        if manifest.get("typescript", 0) > 0:
            languages.append("TypeScript")
        if manifest.get("javascript", 0) > 0:
            languages.append("JavaScript")
        
        # 2. Discover Frameworks/Tech stack
        frameworks = []
        has_python = "Python" in languages
        has_js_ts = "TypeScript" in languages or "JavaScript" in languages

        # Check configuration files recursively
        package_json_paths = []
        requirements_paths = []
        has_dockerfile = False
        has_terraform = False
        has_github_actions = False

        for root, dirs, files in os.walk(repo_path):
            # Ignore standard ignored folders
            dirs[:] = [d for d in dirs if d not in {".git", "node_modules", "venv", ".venv", "dist", "build"}]
            
            for file in files:
                file_lower = file.lower()
                if file_lower == "package.json":
                    package_json_paths.append(os.path.join(root, file))
                elif file_lower in ["requirements.txt", "poetry.lock", "pipfile"]:
                    requirements_paths.append(os.path.join(root, file))
                elif "dockerfile" in file_lower or file_lower == "docker-compose.yml":
                    has_dockerfile = True
                elif file_lower.endswith(".tf"):
                    has_terraform = True
                
                # Check for GitHub Actions
                rel_dir = os.path.relpath(root, repo_path)
                if ".github/workflows" in rel_dir.replace("\\", "/"):
                    if file_lower.endswith((".yml", ".yaml")):
                        has_github_actions = True

        # Parse package.json for JS frameworks
        for pkg_path in package_json_paths:
            try:
                with open(pkg_path, "r", encoding="utf-8", errors="ignore") as f:
                    data = json.load(f)
                    deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
                    
                    if "react" in deps:
                        frameworks.append("React")
                    if "vue" in deps:
                        frameworks.append("Vue")
                    if "@angular/core" in deps:
                        frameworks.append("Angular")
                    if "express" in deps:
                        frameworks.append("Express")
                    
                    # If it has package.json, it's running Node
                    if "Node" not in frameworks:
                        frameworks.append("Node")
            except Exception:
                pass

        # Parse requirements.txt/pipfile for Python frameworks
        for req_path in requirements_paths:
            try:
                with open(req_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read().lower()
                    if "fastapi" in content:
                        frameworks.append("FastAPI")
                    if "flask" in content:
                        frameworks.append("Flask")
                    if "django" in content:
                        frameworks.append("Django")
            except Exception:
                pass

        # If no explicit config files, search file list paths for imports
        if "React" not in frameworks and any(f["path"].endswith((".jsx", ".tsx")) for f in files_list):
            frameworks.append("React")

        # infrastructure framework additions
        if has_dockerfile:
            frameworks.append("Docker")
        if has_terraform:
            frameworks.append("Terraform")
        if has_github_actions:
            frameworks.append("GitHub Actions")

        # De-duplicate frameworks list
        frameworks = list(set(frameworks))

        # 3. Calculate LOC
        total_loc = sum(f.get("lines", 0) for f in files_list)

        # 4. Classify Project Type
        project_type = "Static Code Script Collection"
        if ("FastAPI" in frameworks or "Flask" in frameworks or "Django" in frameworks or "Express" in frameworks) and ("React" in frameworks or "Vue" in frameworks or "Angular" in frameworks):
            project_type = "Full Stack Web Application"
        elif "React" in frameworks or "Vue" in frameworks or "Angular" in frameworks:
            project_type = "Frontend Application"
        elif "FastAPI" in frameworks or "Flask" in frameworks or "Django" in frameworks or "Express" in frameworks or "Node" in frameworks:
            project_type = "Backend API"
        elif "Terraform" in frameworks:
            project_type = "Infrastructure as Code Repository"
        elif "Docker" in frameworks:
            project_type = "Containerized Service"

        profile = {
            "project_type": project_type,
            "languages": languages,
            "frameworks": frameworks,
            "files": len(files_list),
            "loc": total_loc,
            "dependencies": total_dependencies or 0
        }

        self.log(f"Profile generated: {project_type} | Languages: {languages} | Frameworks: {frameworks} | Files: {len(files_list)} | LOC: {total_loc}")
        return profile
