from sqlalchemy import Column, Boolean, DateTime, ForeignKey, JSON, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from app.database import Base

class DayOfWeek(str, enum.Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"

class DoctorAvailability(Base):
    __tablename__ = "doctor_availability"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    
    day_of_week = Column(Enum(DayOfWeek), nullable=False)
    is_available = Column(Boolean, default=True)
    
    # Time Slots
    slots = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    doctor = relationship("Doctor", back_populates="availability")
    
    __table_args__ = (UniqueConstraint('doctor_id', 'day_of_week', name='_doctor_day_uc'),)
