from pydantic import BaseModel, Field, validator, model_validator
from typing import Optional, List, Union
from uuid import UUID
from datetime import date, datetime
from app.models.doctor import DoctorStatus

class DoctorBase(BaseModel):
    full_name: str
    phone: str
    registration_number: str
    qualification: str
    specialties: List[str]
    experience_years: int
    bio: Optional[str] = None
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    video_consultation_fee: Optional[int] = 1500
    in_person_consultation_fee: Optional[int] = 2000

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    registration_number: Optional[str] = None
    qualification: Optional[str] = None
    specialties: Optional[List[str]] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    education: Optional[str] = None
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    video_consultation_fee: Optional[int] = None
    in_person_consultation_fee: Optional[int] = None

class DoctorResponse(DoctorBase):
    id: UUID
    user_id: UUID
    avatar_url: Optional[str] = None
    status: DoctorStatus
    average_rating: Optional[float] = 0.0
    total_reviews: Optional[int] = 0
    created_at: Optional[datetime] = None
    
    @validator('average_rating', pre=True)
    def validate_average_rating(cls, v):
        return v if v is not None else 0.0
    
    @validator('total_reviews', pre=True)
    def validate_total_reviews(cls, v):
        return v if v is not None else 0
    
    class Config:
        from_attributes = True
        populate_by_name = True
