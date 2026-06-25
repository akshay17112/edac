from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, ChatHistory, ActivityLog
from ..schemas import UserOut, UserUpdateRequest, AdminStats
from ..auth import hash_password
from ..dependencies import require_admin, log_activity

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=List[UserOut])
def list_users(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # don't let admin accidentally remove their own admin role
    if user_id == current_user.id and payload.role and payload.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot remove your own admin role")

    if payload.name is not None:
        user.name = payload.name
    if payload.email is not None:
        taken = db.query(User).filter(User.email == payload.email, User.id != user_id).first()
        if taken:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = payload.email
    if payload.role is not None:
        if payload.role not in ("user", "admin"):
            raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
        user.role = payload.role
    if payload.is_active is not None:
        if user_id == current_user.id and not payload.is_active:
            raise HTTPException(status_code=400, detail="You cannot disable your own account")
        user.is_active = payload.is_active

    db.commit()
    db.refresh(user)

    log_activity(db, current_user, "ADMIN_USER_UPDATED", request, f"target_id={user_id}")
    return user


@router.patch("/users/{user_id}/toggle", response_model=UserOut)
def toggle_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot disable your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)

    action = "ADMIN_USER_ENABLED" if user.is_active else "ADMIN_USER_DISABLED"
    log_activity(db, current_user, action, request, f"target_id={user_id}")
    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    log_activity(db, current_user, "ADMIN_USER_DELETED", request, f"deleted_email={user.email}")
    return {"message": "User deleted successfully"}


@router.get("/stats", response_model=AdminStats)
def get_stats(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_chats = db.query(ChatHistory).count()
    total_logs = db.query(ActivityLog).count()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_chats": total_chats,
        "total_logs": total_logs,
    }
