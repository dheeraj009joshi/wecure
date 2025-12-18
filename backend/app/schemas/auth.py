from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole
from app.schemas.user import UserResponse

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    phone: str
    role: UserRole
    # Optional fields for doctor signup
    specialization: str | None = None
    qualification: str | None = None
    registration_number: str | None = None
    experience_years: int | None = None
    available_from: str | None = None
    available_to: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: str
    role: UserRole
