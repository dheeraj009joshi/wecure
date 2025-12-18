from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import date, time, datetime
from app.models.appointment import AppointmentType, AppointmentStatus
from app.schemas.doctor import DoctorResponse
from app.schemas.patient import PatientResponse

class AppointmentBase(BaseModel):
    doctor_id: UUID
    appointment_date: date
    appointment_time: time
    appointment_type: AppointmentType
    chief_complaint: str
    symptoms: Optional[List[str]] = []

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    diagnosis: Optional[str] = None
    consultation_notes: Optional[str] = None
    blood_pressure: Optional[str] = None
    heart_rate: Optional[str] = None
    temperature: Optional[str] = None
    weight: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[date] = None

class AppointmentResponse(AppointmentBase):
    id: UUID
    appointment_number: str
    patient_id: UUID
    status: AppointmentStatus
    created_at: datetime
    
    # Optional nested objects for detailed views
    doctor: Optional[DoctorResponse] = None
    patient: Optional[PatientResponse] = None
    
    class Config:
        from_attributes = True
