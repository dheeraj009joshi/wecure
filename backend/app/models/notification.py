from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum
from app.database import Base

class NotificationType(str, enum.Enum):
    APPOINTMENT_CONFIRMED = "appointment_confirmed"
    APPOINTMENT_REMINDER = "appointment_reminder"
    APPOINTMENT_CANCELLED = "appointment_cancelled"
    PRESCRIPTION_READY = "prescription_ready"
    REVIEW_REQUEST = "review_request"
    PAYMENT_RECEIVED = "payment_received"
    DOCTOR_VERIFIED = "doctor_verified"

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    
    # Link/Action
    action_url = Column(String, nullable=True)
    
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
