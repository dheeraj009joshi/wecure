from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models.user import User, UserRole
from app.models.doctor import Doctor, DoctorStatus
from app.models.patient import Patient
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.doctor import DoctorResponse, DoctorUpdate
from app.schemas.patient import PatientResponse, PatientUpdate
from app.schemas.appointment import AppointmentResponse
from app.api import deps

router = APIRouter()

def check_admin(current_user: User = Depends(deps.get_current_active_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@router.get("/dashboard")
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin)
):
    total_patients = db.query(Patient).count()
    total_doctors = db.query(Doctor).count()
    total_appointments = db.query(Appointment).count()
    pending_doctors = db.query(Doctor).filter(Doctor.status == DoctorStatus.PENDING).count()
    
    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_appointments": total_appointments,
        "pending_doctors": pending_doctors
    }

@router.get("/doctors/pending", response_model=List[DoctorResponse])
def get_pending_doctors(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin)
):
    doctors = db.query(Doctor).filter(Doctor.status == DoctorStatus.PENDING).all()
    # Ensure None values are handled properly before returning
    result = []
    for doctor in doctors:
        # Set defaults if None
        if doctor.average_rating is None:
            doctor.average_rating = 0.0
        if doctor.total_reviews is None:
            doctor.total_reviews = 0
        result.append(doctor)
    return result

@router.get("/patients", response_model=List[PatientResponse])
def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin)
):
    """List all patients with pagination"""
    query = db.query(Patient)
    
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            func.lower(Patient.full_name).like(search_term)
        )
    
    patients = query.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()
    return patients

@router.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient_by_id(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin)
):
    """Get patient details by ID (admin only)"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/patients/{patient_id}/appointments", response_model=List[AppointmentResponse])
def get_patient_appointments(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin)
):
    """Get all appointments for a specific patient (admin only)"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    appointments = db.query(Appointment).options(
        joinedload(Appointment.doctor),
        joinedload(Appointment.patient)
    ).filter(Appointment.patient_id == patient_id).order_by(
        Appointment.appointment_date.desc(),
        Appointment.appointment_time.desc()
    ).all()
    
    return appointments


@router.get("/doctors", response_model=List[DoctorResponse])
def list_doctors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[DoctorStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin)
):
    """List all doctors with filters"""
    query = db.query(Doctor)
    
    if status:
        query = query.filter(Doctor.status == status)
    
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            func.lower(Doctor.full_name).like(search_term)
        )
    
    doctors = query.order_by(Doctor.created_at.desc()).offset(skip).limit(limit).all()
    # Ensure None values are handled properly before returning
    for doctor in doctors:
        # Set defaults if None
        if doctor.average_rating is None:
            doctor.average_rating = 0.0
        if doctor.total_reviews is None:
            doctor.total_reviews = 0
    return doctors

# IMPORTANT: More specific routes must come BEFORE less specific routes
# This route MUST be defined before /appointments to ensure proper matching
@router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
def get_appointment_by_id(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin)
):
    """Get appointment details by ID (admin only)"""
    appointment = db.query(Appointment).options(
        joinedload(Appointment.doctor),
        joinedload(Appointment.patient)
    ).filter(Appointment.id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return appointment

@router.get("/appointments", response_model=List[AppointmentResponse])
def list_all_appointments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[AppointmentStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin)
):
    """List all appointments"""
    query = db.query(Appointment).options(
        joinedload(Appointment.doctor),
        joinedload(Appointment.patient)
    )
    
    if status:
        query = query.filter(Appointment.status == status)
    
    appointments = query.order_by(
        Appointment.appointment_date.desc(),
        Appointment.appointment_time.desc()
    ).offset(skip).limit(limit).all()
    
    return appointments


@router.put("/patients/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: UUID,
    patient_update: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin)
):
    """Update patient profile (admin only)"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/doctors/{doctor_id}", response_model=DoctorResponse)
def get_doctor_by_id(
    doctor_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin)
):
    """Get doctor details by ID (admin only)"""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Ensure None values are handled properly
    if doctor.average_rating is None:
        doctor.average_rating = 0.0
    if doctor.total_reviews is None:
        doctor.total_reviews = 0
    
    return doctor

@router.put("/doctors/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: UUID,
    doctor_update: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin)
):
    """Update doctor profile (admin only)"""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    update_data = doctor_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(doctor, field, value)
    
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.put("/doctors/{doctor_id}/verify")
def verify_doctor(
    doctor_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin)
):
    """Verify and activate a doctor"""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    doctor.status = DoctorStatus.ACTIVE
    db.commit()
    return {"message": "Doctor verified successfully"}


@router.put("/doctors/{doctor_id}/suspend")
def suspend_doctor(
    doctor_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin)
):
    """Suspend a doctor"""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    doctor.status = DoctorStatus.SUSPENDED
    db.commit()
    return {"message": "Doctor suspended successfully"}
