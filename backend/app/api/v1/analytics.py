from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.api import deps

router = APIRouter()

@router.get("/doctor/overview")
def get_doctor_analytics(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.DOCTOR:
        return {"error": "Not authorized"}
        
    # Mock data for now, would be real queries
    return {
        "revenue": {"total": 125000, "this_month": 25000},
        "appointments": {"total": 150, "completed": 140},
        "patients": {"total": 85, "new_this_month": 12},
        "rating": 4.8
    }
