from sqlalchemy.orm import Session
from backend.db.models import Scan

def create_scan(db: Session, scan: Scan) -> Scan:
    """
    Persists a new scan record.
    """
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan

def get_scan(db: Session, scan_id: str) -> Scan | None:
    """
    Retrieves a single scan by ID.
    """
    return db.query(Scan).filter(Scan.scan_id == scan_id).first()

def get_recent_scans(db: Session, limit: int = 20) -> list[Scan]:
    """
    Retrieves recent scans ordered by creation date descending.
    """
    return db.query(Scan).order_by(Scan.created_at.desc()).limit(limit).all()
