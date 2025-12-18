from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
import uuid
from app.database import get_db
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewResponse
from pydantic import BaseModel
from app.api import deps

router = APIRouter()

class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None

@router.get("/me", response_model=List[ReviewResponse])
def get_my_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get my reviews (patient) or reviews for my profile (doctor)"""
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        reviews = db.query(Review).filter(
            Review.patient_id == patient.id
        ).order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        reviews = db.query(Review).filter(
            Review.doctor_id == doctor.id
        ).order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return reviews


@router.post("/", response_model=ReviewResponse)
def create_review(
    review_in: ReviewCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new review"""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Only patients can write reviews")
    
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    # Check if review already exists for this appointment
    existing = db.query(Review).filter(
        Review.appointment_id == review_in.appointment_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Review already exists for this appointment")
    
    # Validate rating
    if review_in.rating < 1 or review_in.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    review = Review(
        **review_in.dict(),
        id=uuid.uuid4(),
        patient_id=patient.id
    )
    
    db.add(review)
    
    # Update doctor's average rating
    doctor = db.query(Doctor).filter(Doctor.id == review_in.doctor_id).first()
    if doctor:
        # Recalculate average rating
        avg_rating = db.query(func.avg(Review.rating)).filter(
            Review.doctor_id == doctor.id
        ).scalar() or 0.0
        total_reviews = db.query(func.count(Review.id)).filter(
            Review.doctor_id == doctor.id
        ).scalar() or 0
        
        doctor.average_rating = round(float(avg_rating), 2)
        doctor.total_reviews = total_reviews
    
    db.commit()
    db.refresh(review)
    return review

@router.get("/doctor/{doctor_id}", response_model=List[ReviewResponse])
def read_doctor_reviews(
    doctor_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get reviews for a specific doctor (public endpoint)"""
    reviews = db.query(Review).filter(
        Review.doctor_id == doctor_id
    ).order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    return reviews


@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: UUID,
    review_update: ReviewUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a review (only by the patient who created it)"""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Only patients can update reviews")
    
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review.patient_id != patient.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this review")
    
    update_data = review_update.dict(exclude_unset=True)
    
    # Validate rating if provided
    if "rating" in update_data and (update_data["rating"] < 1 or update_data["rating"] > 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    for field, value in update_data.items():
        setattr(review, field, value)
    
    db.add(review)
    
    # Update doctor's average rating
    doctor = db.query(Doctor).filter(Doctor.id == review.doctor_id).first()
    if doctor:
        avg_rating = db.query(func.avg(Review.rating)).filter(
            Review.doctor_id == doctor.id
        ).scalar() or 0.0
        doctor.average_rating = round(float(avg_rating), 2)
    
    db.commit()
    db.refresh(review)
    return review


@router.delete("/{review_id}")
def delete_review(
    review_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a review (only by the patient who created it)"""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Only patients can delete reviews")
    
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review.patient_id != patient.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")
    
    doctor_id = review.doctor_id
    
    db.delete(review)
    
    # Update doctor's average rating
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if doctor:
        avg_rating = db.query(func.avg(Review.rating)).filter(
            Review.doctor_id == doctor.id
        ).scalar() or 0.0
        total_reviews = db.query(func.count(Review.id)).filter(
            Review.doctor_id == doctor.id
        ).scalar() or 0
        
        doctor.average_rating = round(float(avg_rating), 2)
        doctor.total_reviews = total_reviews
    
    db.commit()
    return {"message": "Review deleted successfully"}
