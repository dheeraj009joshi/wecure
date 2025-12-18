from sqlalchemy import Column, String, Date, Time, Text, DateTime, ForeignKey, ARRAY, Integer, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from app.database import Base

class AppointmentType(str, enum.Enum):
    VIDEO = "video"
    IN_PERSON = "in_person"

class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_number = Column(String, unique=True, nullable=False)
    
    # Participants
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    
    # Scheduling
    appointment_date = Column(Date, nullable=False, index=True)
    appointment_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, default=30)
    
    # Type & Status
    appointment_type = Column(Enum(AppointmentType), nullable=False)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.PENDING)
    
    # Patient Information
    chief_complaint = Column(Text, nullable=False)
    symptoms = Column(ARRAY(String), nullable=True)
    
    # Vital Signs
    blood_pressure = Column(String, nullable=True)
    heart_rate = Column(String, nullable=True)
    temperature = Column(String, nullable=True)
    weight = Column(String, nullable=True)
    
    # Consultation Notes
    diagnosis = Column(Text, nullable=True)
    consultation_notes = Column(Text, nullable=True)
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(Date, nullable=True)
    
    # Video Call
    video_call_link = Column(String, nullable=True)
    video_call_started_at = Column(DateTime, nullable=True)
    video_call_ended_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    prescription = relationship("Prescription", back_populates="appointment", uselist=False)
    payment = relationship("Payment", back_populates="appointment", uselist=False)
    lab_reports = relationship("LabReport", back_populates="appointment")
