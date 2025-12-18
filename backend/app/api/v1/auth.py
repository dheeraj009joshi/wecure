from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.schemas.auth import UserLogin, UserSignup, Token
from app.core.security import verify_password, get_password_hash, create_access_token
from app.config import settings
from app.api import deps
from app.models.availability import DoctorAvailability, DayOfWeek

router = APIRouter()

@router.post("/signup", response_model=Token)
def signup(user_in: UserSignup, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        user = db.query(User).filter(User.email == user_in.email).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="The user with this email already exists in the system",
            )
        
        # Create User
        user = User(
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            role=user_in.role,
            is_active=True,
            is_verified=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create Role specific profile
        if user_in.role == UserRole.PATIENT:
            patient = Patient(
                user_id=user.id,
                full_name=user_in.full_name,
                phone=user_in.phone
            )
            db.add(patient)
        elif user_in.role == UserRole.DOCTOR:
            # Check if registration number already exists (if provided)
            registration_number = user_in.registration_number or ("TEMP-" + str(user.id)[:8])
            if user_in.registration_number:
                existing_doctor = db.query(Doctor).filter(Doctor.registration_number == user_in.registration_number).first()
                if existing_doctor:
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Registration number '{user_in.registration_number}' is already registered. Please use a different registration number or contact support if this is your number."
                    )
            
            # Ensure specialties is a list and not empty
            specialties_list = []
            if user_in.specialization:
                # Handle comma-separated specializations
                specialties_list = [s.strip() for s in user_in.specialization.split(',') if s.strip()]
            
            # If still empty, use a default
            if not specialties_list:
                specialties_list = ["General Medicine"]
            
            doctor = Doctor(
                user_id=user.id,
                full_name=user_in.full_name,
                phone=user_in.phone,
                registration_number=registration_number,
                qualification=user_in.qualification or "MBBS",
                specialties=specialties_list,
                experience_years=user_in.experience_years or 0
            )
            db.add(doctor)
            
            # Create default availability if provided
            if user_in.available_from and user_in.available_to:
                from app.utils.slot_manager import generate_slots_from_ranges
                weekdays = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY]
                # Generate 30-minute slots from the time range
                time_ranges = [{"start_time": user_in.available_from, "end_time": user_in.available_to}]
                slots = generate_slots_from_ranges(time_ranges)
                for day in weekdays:
                    availability = DoctorAvailability(
                        doctor_id=doctor.id,
                        day_of_week=day,
                        is_available=True,
                        slots=slots
                    )
                    db.add(availability)
        
        db.commit()
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Rollback on any other error
        db.rollback()
        import traceback
        error_detail = str(e)
        traceback.print_exc()
        
        # Check for unique constraint violations
        if "unique constraint" in error_detail.lower() or "duplicate key" in error_detail.lower():
            if "registration_number" in error_detail.lower():
                raise HTTPException(
                    status_code=400,
                    detail="This registration number is already registered. Please use a different registration number or contact support if this is your number."
                )
            elif "email" in error_detail.lower() or "users_email_key" in error_detail.lower():
                raise HTTPException(
                    status_code=400,
                    detail="An account with this email already exists. Please use a different email or try logging in."
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail="A record with this information already exists. Please check your details and try again."
                )
        
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during signup: {error_detail}"
        )

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=Token)
def read_users_me(current_user: User = Depends(deps.get_current_active_user)):
    # Just return a new token for the current user to refresh session
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(current_user.id), "role": current_user.role}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": current_user
    }
