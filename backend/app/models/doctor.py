from sqlalchemy import Column, String, Date, Text, DateTime, ForeignKey, ARRAY, Integer, Float, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from app.database import Base

class DoctorStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    ACTIVE = "active"
    SUSPENDED = "suspended"

class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    
    # Personal Information
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    
    # Professional Information
    registration_number = Column(String, unique=True, nullable=False)
    qualification = Column(String, nullable=False)
    specialties = Column(ARRAY(String), nullable=False)
    experience_years = Column(Integer, nullable=False)
    
    # Profile
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    education = Column(Text, nullable=True)
    awards = Column(Text, nullable=True)
    
    # Practice Details
    clinic_name = Column(String, nullable=True)
    clinic_address = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    
    # Consultation Fees (in INR)
    video_consultation_fee = Column(Integer, default=1500)
    in_person_consultation_fee = Column(Integer, default=2000)
    
    # Documents
    certificate_url = Column(String, nullable=True)
    id_proof_url = Column(String, nullable=True)
    
    # Status & Ratings
    status = Column(Enum(DoctorStatus), default=DoctorStatus.PENDING)
    average_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    total_patients = Column(Integer, default=0)
    total_consultations = Column(Integer, default=0)
    
    # Bank Details
    bank_account_number = Column(String, nullable=True)
    bank_ifsc_code = Column(String, nullable=True)
    bank_account_holder = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor")
    availability = relationship("DoctorAvailability", back_populates="doctor")
    reviews = relationship("Review", back_populates="doctor")
    prescriptions = relationship("Prescription", back_populates="doctor")
