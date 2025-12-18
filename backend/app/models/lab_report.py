from sqlalchemy import Column, String, Date, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base

class LabReport(Base):
    __tablename__ = "lab_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_number = Column(String, unique=True, nullable=False)
    
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    
    test_name = Column(String, nullable=False)
    test_date = Column(Date, nullable=False)
    result = Column(Text, nullable=True)
    status = Column(String, default="Normal")
    
    # File Upload
    report_url = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    appointment = relationship("Appointment", back_populates="lab_reports")
