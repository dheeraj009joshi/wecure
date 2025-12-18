from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from app.database import Base

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentMethod(str, enum.Enum):
    CARD = "card"
    UPI = "upi"
    NET_BANKING = "net_banking"
    WALLET = "wallet"

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(String, unique=True, nullable=False)
    
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), unique=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    
    # Amount (in paise)
    amount = Column(Integer, nullable=False)
    platform_fee = Column(Integer, nullable=False)
    doctor_payout = Column(Integer, nullable=False)
    
    # Payment Details
    payment_method = Column(Enum(PaymentMethod), nullable=True)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Gateway Integration
    gateway_payment_id = Column(String, nullable=True)
    gateway_order_id = Column(String, nullable=True)
    gateway_signature = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    
    # Relationships
    appointment = relationship("Appointment", back_populates="payment")
