import os
import shutil
import zipfile
import subprocess
import tempfile
from pathlib import Path

class RepositoryService:
    """
    Handles safe ingestion of repositories from ZIP files and GitHub URLs.
    Includes protections for zip bombs, nested archives, executable binaries, and path traversals.
    """
    def __init__(self, temp_base_dir: str = None):
        from backend.core.config import settings
        if not temp_base_dir:
            self.temp_base_dir = settings.TEMP_REPOS_DIR
        else:
            self.temp_base_dir = temp_base_dir
        
        os.makedirs(self.temp_base_dir, exist_ok=True)

    def extract_zip(self, zip_bytes: bytes) -> str:
        """
        Safely extracts a ZIP archive into a temporary folder.
        Applies protections:
        - Max 5000 files
        - Max 200 MB extracted size
        - Reject nested archives (.zip, .tar, .gz, .tgz, .zipx, .7z, .rar)
        - Reject executable binaries (.exe, .dll, .so, .dylib, .bin, .msi, .sys, .elf)
        - Reject Zip Slip path traversal
        """
        import uuid
        dest_dir = os.path.join(self.temp_base_dir, f"zip_scan_{uuid.uuid4().hex}")
        os.makedirs(dest_dir, exist_ok=True)

        temp_zip_path = os.path.join(dest_dir, "upload.zip")
        with open(temp_zip_path, "wb") as f:
            f.write(zip_bytes)

        max_files = 5000
        max_size = 200 * 1024 * 1024  # 200 MB
        
        forbidden_archives = {".zip", ".tar", ".gz", ".tgz", ".zipx", ".7z", ".rar"}
        forbidden_binaries = {".exe", ".dll", ".so", ".dylib", ".bin", ".msi", ".sys", ".elf"}

        total_size = 0
        file_count = 0

        try:
            with zipfile.ZipFile(temp_zip_path, 'r') as ref:
                infolist = ref.infolist()
                
                # Pre-validation of headers
                for info in infolist:
                    if info.is_dir():
                        continue
                    
                    filename_lower = info.filename.lower()
                    _, ext = os.path.splitext(filename_lower)
                    
                    # 1. Prevent Zip Slip / Path Traversal
                    target_path = os.path.abspath(os.path.join(dest_dir, info.filename))
                    if not target_path.startswith(os.path.abspath(dest_dir)):
                        raise ValueError(f"Security Policy violation: Path traversal attempt detected: {info.filename}")

                # Extraction loop with progressive checks
                for info in infolist:
                    if info.is_dir():
                        # Safe folder creation
                        target_dir = os.path.abspath(os.path.join(dest_dir, info.filename))
                        if target_dir.startswith(os.path.abspath(dest_dir)):
                            os.makedirs(target_dir, exist_ok=True)
                        continue

                    filename_lower = info.filename.lower()
                    _, ext = os.path.splitext(filename_lower)

                    # 1. Skip nested archives
                    if ext in forbidden_archives:
                        print(f"Security Policy: Skipping nested archive: {info.filename}")
                        continue
                    
                    # 2. Skip executable binaries
                    if ext in forbidden_binaries:
                        print(f"Security Policy: Skipping executable binary: {info.filename}")
                        continue

                    file_count += 1
                    if file_count > max_files:
                        raise ValueError(f"Security Policy violation: Maximum file count ({max_files}) exceeded.")

                    total_size += info.file_size
                    if total_size > max_size:
                        raise ValueError(f"Security Policy violation: Maximum extracted size ({max_size / (1024*1024)} MB) exceeded.")

                    # Read binary signature validation (Magic Numbers)
                    with ref.open(info) as zf:
                        chunk = zf.read(4)
                        if chunk.startswith(b"MZ") or chunk.startswith(b"\x7fELF") or chunk.startswith(b"\xca\xfe\xba\xbe") or chunk.startswith(b"\xfe\xed\xfa\xce") or chunk.startswith(b"\xcf\xfa\xed\xfe"):
                            print(f"Security Policy: Skipping file with executable binary magic signature: {info.filename}")
                            continue
                    
                    # Safe extraction of individual file
                    ref.extract(info, dest_dir)
            
            # Clean up the zip file itself before returning path
            if os.path.exists(temp_zip_path):
                os.remove(temp_zip_path)
            
            return dest_dir

        except Exception as e:
            # Clean up destination directory on failure
            if os.path.exists(dest_dir):
                shutil.rmtree(dest_dir, ignore_errors=True)
            raise e

    def clone_github_repo(self, git_url: str) -> str:
        """
        Clones a GitHub repository into a temporary folder, checkouts default branch,
        and purges the .git metadata directory.
        """
        import uuid
        dest_dir = os.path.join(self.temp_base_dir, f"git_scan_{uuid.uuid4().hex}")
        os.makedirs(dest_dir, exist_ok=True)

        try:
            # Depth 1 clone with longpaths enabled and a timeout of 90 seconds to prevent hanging
            cmd = ["git", "-c", "core.longpaths=true", "clone", git_url, dest_dir, "--depth", "1", "--quiet"]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=90)
            
            # Remove .git folder to avoid scanning git internals or treating it as live git
            git_folder = os.path.join(dest_dir, ".git")
            if os.path.exists(git_folder):
                shutil.rmtree(git_folder, ignore_errors=True)

            return dest_dir
        except subprocess.TimeoutExpired as e:
            if os.path.exists(dest_dir):
                shutil.rmtree(dest_dir, ignore_errors=True)
            raise ValueError(f"Failed to clone repository: Command timed out after 90 seconds.")
        except subprocess.CalledProcessError as e:
            if os.path.exists(dest_dir):
                shutil.rmtree(dest_dir, ignore_errors=True)
            stderr_msg = e.stderr.strip() if e.stderr else "No error output."
            raise ValueError(f"Failed to clone repository from URL: {git_url}. Git error: {stderr_msg}")
        except Exception as e:
            if os.path.exists(dest_dir):
                shutil.rmtree(dest_dir, ignore_errors=True)
            raise ValueError(f"Failed to clone repository from URL: {git_url}. Details: {str(e)}")

    def cleanup(self, path: str):
        """
        Purges the temporary repository folder.
        """
        if path and os.path.exists(path) and path.startswith(self.temp_base_dir):
            shutil.rmtree(path, ignore_errors=True)
