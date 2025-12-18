from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base

class Prescription(Base):
    __tablename__ = "prescriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prescription_number = Column(String, unique=True, nullable=False)
    
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), unique=True)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    
    # Prescription Details
    medicines = Column(JSON, nullable=False)
    instructions = Column(Text, nullable=True)
    
    # Generated PDF
    pdf_url = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    appointment = relationship("Appointment", back_populates="prescription")
    doctor = relationship("Doctor", back_populates="prescriptions")
