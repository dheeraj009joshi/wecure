from sqlalchemy import Column, Integer, Text, Boolean, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), unique=True)
    
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    
    # Moderation
    is_flagged = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True)
    flagged_reason = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    doctor = relationship("Doctor", back_populates="reviews")
    patient = relationship("Patient", back_populates="reviews")
