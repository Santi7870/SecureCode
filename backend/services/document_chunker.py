import os
import re

class DocumentChunker:
    """
    Splits markdown documents into structured chunks of 800-1200 characters,
    preserving markdown headings (sections), CWE/OWASP references, and source metadata.
    """
    def __init__(self, min_size: int = 800, max_size: int = 1200):
        self.min_size = min_size
        self.max_size = max_size

    def chunk_file(self, filepath: str) -> list[dict]:
        if not os.path.exists(filepath):
            return []

        filename = os.path.basename(filepath)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        chunks = []
        # Split document by headers (e.g., ## or ###, or #)
        # We capture the header lines and everything up to the next header
        lines = content.split("\n")
        current_section = "General"
        current_paragraphs = []
        current_len = 0

        for line in lines:
            # Detect header
            header_match = re.match(r"^#{1,4}\s+(.*)$", line)
            if header_match:
                # If we have accumulated text, yield it as chunks before changing section
                if current_paragraphs:
                    chunks.extend(self._build_chunks(current_paragraphs, filename, current_section))
                    current_paragraphs = []
                    current_len = 0
                current_section = header_match.group(1).strip()
            else:
                # Add line to current paragraph accumulator
                if line.strip():
                    current_paragraphs.append(line)
                    current_len += len(line) + 1
                elif current_paragraphs and current_paragraphs[-1] != "":
                    # Represent double newlines (paragraphs)
                    current_paragraphs.append("")
                    current_len += 1

        # Yield any remaining text
        if current_paragraphs:
            chunks.extend(self._build_chunks(current_paragraphs, filename, current_section))

        return chunks

    def _build_chunks(self, paragraphs: list[str], source: str, section: str) -> list[dict]:
        chunks = []
        current_chunk_text = []
        current_len = 0

        for para in paragraphs:
            if para == "":
                # Re-add double newlines between paragraphs
                if current_chunk_text and current_chunk_text[-1] != "\n":
                    current_chunk_text.append("\n")
                continue

            para_len = len(para)
            # Check if adding this paragraph exceeds max_size
            if current_len + para_len > self.max_size and current_len >= self.min_size:
                # Yield current chunk
                content_str = " ".join(current_chunk_text).strip().replace(" \n ", "\n\n")
                chunks.append({
                    "content": content_str,
                    "source": source,
                    "section": section
                })
                current_chunk_text = []
                current_len = 0

            current_chunk_text.append(para)
            current_len += para_len + 1

        if current_chunk_text:
            content_str = " ".join(current_chunk_text).strip().replace(" \n ", "\n\n")
            # Only add if it has non-whitespace characters
            if content_str:
                chunks.append({
                    "content": content_str,
                    "source": source,
                    "section": section
                })

        return chunks
