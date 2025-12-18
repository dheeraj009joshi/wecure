from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

class Medicine(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str

class PrescriptionBase(BaseModel):
    appointment_id: UUID
    medicines: List[Medicine]
    instructions: Optional[str] = None

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionResponse(PrescriptionBase):
    id: UUID
    prescription_number: str
    doctor_id: UUID
    patient_id: UUID
    pdf_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
