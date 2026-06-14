import logging
import sys

class SafeFormatter(logging.Formatter):
    """
    Custom logging formatter that handles missing record attributes (like request_id)
    gracefully to prevent KeyError exceptions in format strings.
    """
    def format(self, record):
        if not hasattr(record, "request_id"):
            record.request_id = "SYSTEM"
        return super().format(record)

def setup_logging():
    """
    Configures structured logging for production-ready backend debugging.
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    formatter = SafeFormatter(
        "%(asctime)s [%(levelname)s] %(name)s (Request-ID: %(request_id)s) - %(message)s"
    )
    handler.setFormatter(formatter)

    # Clear existing handlers to prevent duplicates
    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)

    root_logger.addHandler(handler)

class RequestIdFilter(logging.Filter):
    """
    Injects request_id context variable into log records if present.
    """
    def __init__(self, request_id: str = "SYSTEM"):
        super().__init__()
        self.request_id = request_id

    def filter(self, record):
        record.request_id = getattr(record, "request_id", self.request_id)
        return True

