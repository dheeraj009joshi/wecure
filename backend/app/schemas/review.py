from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class ReviewBase(BaseModel):
    doctor_id: UUID
    appointment_id: UUID
    rating: int
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    id: UUID
    patient_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
