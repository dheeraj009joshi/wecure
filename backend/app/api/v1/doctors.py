from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.doctor import Doctor, DoctorStatus
from app.models.appointment import Appointment
from app.schemas.doctor import DoctorUpdate, DoctorResponse
from app.schemas.appointment import AppointmentResponse
from app.api import deps

router = APIRouter()

@router.get("/me/appointments", response_model=List[AppointmentResponse])
def get_my_appointments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get doctor's appointments with pagination"""
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    query = db.query(Appointment).filter(Appointment.doctor_id == doctor.id)
    
    if status:
        try:
            status_enum = AppointmentStatus[status.upper()]
            query = query.filter(Appointment.status == status_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid status")
    
    appointments = query.order_by(
        Appointment.appointment_date.desc(),
        Appointment.appointment_time.desc()
    ).offset(skip).limit(limit).all()
    
    return appointments

@router.get("/me", response_model=DoctorResponse)
def read_doctor_me(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return doctor

@router.put("/me", response_model=DoctorResponse)
def update_doctor_me(
    doctor_in: DoctorUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
        
    update_data = doctor_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(doctor, field, value)
        
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor

@router.get("/", response_model=List[DoctorResponse])
def read_doctors(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    specialty: Optional[str] = None,
    city: Optional[str] = None,
    min_rating: Optional[float] = Query(None, ge=0.0, le=5.0),
    min_experience: Optional[int] = Query(None, ge=0),
    db: Session = Depends(get_db)
):
    """List doctors with search and filters (public endpoint)"""
    query = db.query(Doctor).filter(Doctor.status == DoctorStatus.ACTIVE)
    
    # Search by name
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(Doctor.full_name).like(search_term),
                func.lower(Doctor.clinic_name).like(search_term)
            )
        )
    
    # Filter by specialty
    if specialty:
        query = query.filter(Doctor.specialties.contains([specialty]))
    
    # Filter by city
    if city:
        query = query.filter(func.lower(Doctor.city) == city.lower())
    
    # Filter by minimum rating
    if min_rating is not None:
        query = query.filter(Doctor.average_rating >= min_rating)
    
    # Filter by minimum experience
    if min_experience is not None:
        query = query.filter(Doctor.experience_years >= min_experience)
    
    # Order by rating and experience
    doctors = query.order_by(
        Doctor.average_rating.desc(),
        Doctor.experience_years.desc()
    ).offset(skip).limit(limit).all()
    
    return doctors

@router.get("/{doctor_id}", response_model=DoctorResponse)
def read_doctor(
    doctor_id: UUID,
    db: Session = Depends(get_db)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor
