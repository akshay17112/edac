from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import ActivityLog
from ..schemas import LogOut
from ..dependencies import require_admin

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("/", response_model=dict)
def get_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    action: Optional[str] = None,
    user_email: Optional[str] = None,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(ActivityLog)

    if action:
        query = query.filter(ActivityLog.action == action)
    if user_email:
        query = query.filter(ActivityLog.user_email.ilike(f"%{user_email}%"))

    total = query.count()
    logs = (
        query.order_by(ActivityLog.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "logs": [LogOut.model_validate(l) for l in logs],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }
