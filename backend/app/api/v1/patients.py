from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.schemas.patient import PatientUpdate, PatientResponse
from app.schemas.appointment import AppointmentResponse
from app.api import deps

router = APIRouter()

@router.get("/me", response_model=PatientResponse)
def read_patient_me(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient

@router.put("/me", response_model=PatientResponse)
def update_patient_me(
    patient_in: PatientUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
        
    update_data = patient_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
        
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@router.get("/me/appointments", response_model=List[AppointmentResponse])
def read_my_appointments(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all appointments for the current patient with doctor and patient relationships.

    NOTE:
    - If the user does not yet have an associated Patient profile, we return an empty list
      instead of raising a 404. This prevents the frontend from spamming errors while still
      behaving gracefully for new accounts.
    """
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        # Gracefully handle missing patient profile for logged-in users
        return []
        
    appointments = db.query(Appointment).options(
        joinedload(Appointment.doctor),
        joinedload(Appointment.patient)
    ).filter(
        Appointment.patient_id == patient.id
    ).order_by(
        Appointment.appointment_date.desc(),
        Appointment.appointment_time.desc()
    ).all()
    
    return appointments
