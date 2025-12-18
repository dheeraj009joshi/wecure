from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.doctor import Doctor
from app.api import deps
import uuid

router = APIRouter()

@router.post("/fix-doctor-profile")
def fix_doctor_profile(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create doctor profile for current user if missing"""
    
    # Check if doctor profile exists
    existing_doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if existing_doctor:
        return {"message": "Doctor profile already exists", "doctor_id": str(existing_doctor.id)}
    
    # Create doctor profile
    doctor = Doctor(
        id=uuid.uuid4(),
        user_id=current_user.id,
        full_name="Dr. " + current_user.email.split('@')[0],
        phone="0000000000",
        registration_number=f"TEMP-{str(current_user.id)[:8]}",
        qualification="MBBS",
        specialties=["General Medicine"],
        experience_years=5,
        video_consultation_fee=500,
        in_person_consultation_fee=800
    )
    
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    
    return {
        "message": "Doctor profile created successfully",
        "doctor_id": str(doctor.id),
        "full_name": doctor.full_name
    }
