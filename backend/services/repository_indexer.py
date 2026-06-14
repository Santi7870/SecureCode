import os

class RepositoryIndexer:
    """
    Recursively scans the ingested repository, ignoring build/virtual env directories,
    and returns a manifest with file statistics (path, language, size, lines).
    """
    def __init__(self):
        self.ignore_dirs = {"node_modules", "venv", ".venv", "dist", "build", "coverage", ".git", "__pycache__"}
        self.supported_extensions = {
            ".py": "python",
            ".js": "javascript",
            ".jsx": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript"
        }

    def index_repository(self, repo_path: str) -> dict:
        """
        Recursively scans repo_path and collects metadata of code files.
        Returns:
            {
                "files_list": [{"path": str, "language": str, "size": int, "lines": int}, ...],
                "manifest": {
                    "files": int,
                    "python": int,
                    "javascript": int,
                    "typescript": int
                }
            }
        """
        files_list = []
        manifest = {
            "files": 0,
            "python": 0,
            "javascript": 0,
            "typescript": 0
        }

        for root, dirs, files in os.walk(repo_path):
            # Prune directory search path
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]

            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in self.supported_extensions:
                    language = self.supported_extensions[ext]
                    filepath = os.path.join(root, file)
                    rel_path = os.path.relpath(filepath, repo_path).replace("\\", "/")

                    try:
                        size = os.path.getsize(filepath)
                        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                            lines = len(f.readlines())
                    except Exception:
                        size = 0
                        lines = 0

                    files_list.append({
                        "path": rel_path,
                        "language": language,
                        "size": size,
                        "lines": lines
                    })

                    manifest["files"] += 1
                    manifest[language] += 1

        return {
            "files_list": files_list,
            "manifest": manifest
        }
