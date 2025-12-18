from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import UUID
import uuid
from app.database import get_db
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.prescription import Prescription
from app.models.appointment import Appointment
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[PrescriptionResponse])
def list_prescriptions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    appointment_id: Optional[UUID] = None,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """List prescriptions with pagination"""
    query = db.query(Prescription)
    
    # Role-based filtering
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        query = query.filter(Prescription.patient_id == patient.id)
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        query = query.filter(Prescription.doctor_id == doctor.id)
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if appointment_id:
        query = query.filter(Prescription.appointment_id == appointment_id)
    
    prescriptions = query.order_by(
        Prescription.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return prescriptions


@router.get("/me", response_model=List[PrescriptionResponse])
def get_my_prescriptions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get my prescriptions (patient or doctor)"""
    query = db.query(Prescription)
    
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        query = query.filter(Prescription.patient_id == patient.id)
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        query = query.filter(Prescription.doctor_id == doctor.id)
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    prescriptions = query.order_by(
        Prescription.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return prescriptions


@router.post("/", response_model=PrescriptionResponse)
def create_prescription(
    prescription_in: PrescriptionCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new prescription"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can create prescriptions")
    
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    # Verify appointment exists and belongs to this doctor
    appointment = db.query(Appointment).filter(Appointment.id == prescription_in.appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment.doctor_id != doctor.id:
        raise HTTPException(status_code=403, detail="Appointment does not belong to this doctor")
    
    # Check if prescription already exists for this appointment
    existing = db.query(Prescription).filter(
        Prescription.appointment_id == prescription_in.appointment_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Prescription already exists for this appointment")
    
    # Generate prescription number
    count = db.query(Prescription).count()
    rx_number = f"RX-{str(count + 1).zfill(6)}"
    
    prescription = Prescription(
        **prescription_in.dict(),
        id=uuid.uuid4(),
        prescription_number=rx_number,
        doctor_id=doctor.id,
        patient_id=appointment.patient_id
    )
    
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return prescription

@router.get("/{prescription_id}", response_model=PrescriptionResponse)
def read_prescription(
    prescription_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get prescription by ID with permission check"""
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    # Permission check
    if current_user.role == UserRole.ADMIN:
        return prescription
    
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient and prescription.patient_id == patient.id:
            return prescription
    
    if current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor and prescription.doctor_id == doctor.id:
            return prescription
    
    raise HTTPException(status_code=403, detail="Not authorized to view this prescription")
