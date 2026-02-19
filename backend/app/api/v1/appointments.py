from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime
import uuid
from app.database import get_db
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[AppointmentResponse])
def list_appointments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[AppointmentStatus] = None,
    appointment_date: Optional[date] = None,
    doctor_id: Optional[UUID] = None,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """List appointments with filters and pagination"""
    query = db.query(Appointment).options(
        joinedload(Appointment.doctor),
        joinedload(Appointment.patient)
    )
    
    # Role-based filtering
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        query = query.filter(Appointment.patient_id == patient.id)
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        query = query.filter(Appointment.doctor_id == doctor.id)
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Apply filters
    if status:
        query = query.filter(Appointment.status == status)
    if appointment_date:
        query = query.filter(Appointment.appointment_date == appointment_date)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    
    # Order by date and time
    appointments = query.order_by(
        Appointment.appointment_date.desc(),
        Appointment.appointment_time.desc()
    ).offset(skip).limit(limit).all()
    
    return appointments


@router.post("/", response_model=AppointmentResponse)
def create_appointment(
    appointment_in: AppointmentCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new appointment"""
    # Check role - UserRole is a string enum, compare using enum directly
    if current_user.role != UserRole.PATIENT:
        role_str = str(current_user.role.value) if hasattr(current_user.role, 'value') else str(current_user.role)
        raise HTTPException(
            status_code=403, 
            detail=f"Only patients can create appointments. Current role: {role_str}"
        )
    
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == appointment_in.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Check for duplicate appointment - doctor already booked
    existing_doctor = db.query(Appointment).filter(
        and_(
            Appointment.doctor_id == appointment_in.doctor_id,
            Appointment.appointment_date == appointment_in.appointment_date,
            Appointment.appointment_time == appointment_in.appointment_time,
            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
        )
    ).first()
    
    if existing_doctor:
        raise HTTPException(status_code=400, detail="This time slot is already booked. Please select another time.")
    
    # Check for duplicate appointment - patient already has appointment at this time
    existing_patient = db.query(Appointment).filter(
        and_(
            Appointment.patient_id == patient.id,
            Appointment.appointment_date == appointment_in.appointment_date,
            Appointment.appointment_time == appointment_in.appointment_time,
            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
        )
    ).first()
    
    if existing_patient:
        raise HTTPException(status_code=400, detail="You already have an appointment at this time. Please select another time slot.")
    
    # Verify doctor availability for this date and time
    day_of_week_name = appointment_in.appointment_date.strftime("%A").lower()
    from app.models.availability import DayOfWeek
    day_map = {
        "monday": DayOfWeek.MONDAY,
        "tuesday": DayOfWeek.TUESDAY,
        "wednesday": DayOfWeek.WEDNESDAY,
        "thursday": DayOfWeek.THURSDAY,
        "friday": DayOfWeek.FRIDAY,
        "saturday": DayOfWeek.SATURDAY,
        "sunday": DayOfWeek.SUNDAY
    }
    
    day_of_week = day_map.get(day_of_week_name)
    if day_of_week:
        from app.models.availability import DoctorAvailability
        availability = db.query(DoctorAvailability).filter(
            DoctorAvailability.doctor_id == appointment_in.doctor_id,
            DoctorAvailability.day_of_week == day_of_week,
            DoctorAvailability.is_available == True
        ).first()
        
        if availability and availability.slots:
            # Check if the requested time slot exists in doctor's availability
            requested_time = appointment_in.appointment_time.strftime("%H:%M") if hasattr(appointment_in.appointment_time, 'strftime') else str(appointment_in.appointment_time)[:5]
            slot_exists = any(
                slot.get("start_time") == requested_time and slot.get("status") != "booked"
                for slot in availability.slots
            )
            
            if not slot_exists:
                raise HTTPException(status_code=400, detail="Doctor is not available at this time. Please select an available time slot.")
    
    # Generate Appointment Number
    count = db.query(Appointment).count()
    apt_number = f"APT-{str(count + 1).zfill(6)}"
    
    appointment = Appointment(
        **appointment_in.dict(),
        id=uuid.uuid4(),
        appointment_number=apt_number,
        patient_id=patient.id,
        status=AppointmentStatus.PENDING
    )
    
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def read_appointment(
    appointment_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get appointment by ID with permission check"""
    appointment = db.query(Appointment).options(
        joinedload(Appointment.doctor),
        joinedload(Appointment.patient)
    ).filter(Appointment.id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Permission check
    if current_user.role == UserRole.ADMIN:
        return appointment
    
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient and appointment.patient_id == patient.id:
            return appointment
    
    if current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor and appointment.doctor_id == doctor.id:
            return appointment
    
    raise HTTPException(status_code=403, detail="Not authorized to view this appointment")

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: UUID,
    appointment_in: AppointmentUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update appointment (doctor can update diagnosis/notes, patient can cancel)"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Permission check
    if current_user.role == UserRole.ADMIN:
        pass  # Admin can update anything
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or appointment.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or appointment.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        # Patients can only cancel
        if appointment_in.status not in [AppointmentStatus.CANCELLED, None]:
            raise HTTPException(status_code=403, detail="Patients can only cancel appointments")
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = appointment_in.dict(exclude_unset=True)
    
    # Handle status changes
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == AppointmentStatus.CANCELLED:
            appointment.cancelled_at = datetime.utcnow()
        elif new_status == AppointmentStatus.COMPLETED:
            appointment.completed_at = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(appointment, field, value)
    
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


class CancelRequest(BaseModel):
    cancellation_reason: Optional[str] = None

@router.post("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: UUID,
    cancel_request: CancelRequest = CancelRequest(),
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel an appointment"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Cannot cancel completed or already cancelled appointment")
    
    # Permission check
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or appointment.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or appointment.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancelled_at = datetime.utcnow()
    if cancel_request.cancellation_reason:
        appointment.cancellation_reason = cancel_request.cancellation_reason
    
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment
