"""
Seed dummy data for WeCure API
Run this script to populate the database with test data
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.doctor import Doctor, DoctorStatus
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.availability import DoctorAvailability, DayOfWeek
from app.models.review import Review
from app.models.prescription import Prescription
from app.core.security import get_password_hash
from app.utils.slot_manager import generate_slots_from_ranges
from datetime import date, time, datetime, timedelta
import uuid

def create_dummy_users(db: Session):
    """Create dummy users"""
    users_data = [
        # Patients
        {
            "email": "patient1@wecure.com",
            "password": "patient123",
            "role": UserRole.PATIENT,
            "full_name": "John Doe",
            "phone": "+1234567890"
        },
        {
            "email": "patient2@wecure.com",
            "password": "patient123",
            "role": UserRole.PATIENT,
            "full_name": "Jane Smith",
            "phone": "+1234567891"
        },
        {
            "email": "patient3@wecure.com",
            "password": "patient123",
            "role": UserRole.PATIENT,
            "full_name": "Bob Johnson",
            "phone": "+1234567892"
        },
        # Doctors
        {
            "email": "doctor1@wecure.com",
            "password": "doctor123",
            "role": UserRole.DOCTOR,
            "full_name": "Dr. Sarah Williams",
            "phone": "+1234567800",
            "specialty": "Cardiology",
            "experience": 10
        },
        {
            "email": "doctor2@wecure.com",
            "password": "doctor123",
            "role": UserRole.DOCTOR,
            "full_name": "Dr. Michael Brown",
            "phone": "+1234567801",
            "specialty": "Dermatology",
            "experience": 8
        },
        {
            "email": "doctor3@wecure.com",
            "password": "doctor123",
            "role": UserRole.DOCTOR,
            "full_name": "Dr. Emily Davis",
            "phone": "+1234567802",
            "specialty": "Pediatrics",
            "experience": 12
        },
        # Admin
        {
            "email": "admin@wecure.com",
            "password": "admin123",
            "role": UserRole.ADMIN,
            "full_name": "Admin User",
            "phone": "+1234567000"
        }
    ]
    
    created_users = {}
    
    for user_data in users_data:
        # Check if user exists
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            print(f"User {user_data['email']} already exists, using existing...")
            # Get existing profile
            if user_data["role"] == UserRole.PATIENT:
                patient = db.query(Patient).filter(Patient.user_id == existing.id).first()
                if patient:
                    created_users[user_data["email"]] = {"user": existing, "patient": patient}
                else:
                    created_users[user_data["email"]] = {"user": existing}
            elif user_data["role"] == UserRole.DOCTOR:
                doctor = db.query(Doctor).filter(Doctor.user_id == existing.id).first()
                if doctor:
                    created_users[user_data["email"]] = {"user": existing, "doctor": doctor}
                else:
                    created_users[user_data["email"]] = {"user": existing}
            else:
                created_users[user_data["email"]] = {"user": existing}
            continue
        
        # Create user
        user = User(
            email=user_data["email"],
            hashed_password=get_password_hash(user_data["password"]),
            role=user_data["role"],
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.flush()
        
        # Create role-specific profile
        if user_data["role"] == UserRole.PATIENT:
            patient = Patient(
                user_id=user.id,
                full_name=user_data["full_name"],
                phone=user_data["phone"],
                date_of_birth=date(1990, 1, 1),
                gender="Male" if "John" in user_data["full_name"] or "Bob" in user_data["full_name"] else "Female",
                blood_group="O+",
                city="New York",
                state="NY"
            )
            db.add(patient)
            created_users[user_data["email"]] = {"user": user, "patient": patient}
        
        elif user_data["role"] == UserRole.DOCTOR:
            doctor = Doctor(
                user_id=user.id,
                full_name=user_data["full_name"],
                phone=user_data["phone"],
                registration_number=f"REG-{str(user.id)[:8].upper()}",
                qualification="MD",
                specialties=[user_data["specialty"]],
                experience_years=user_data["experience"],
                bio=f"Experienced {user_data['specialty']} specialist with {user_data['experience']} years of practice.",
                clinic_name="WeCure Medical Center",
                clinic_address="123 Medical Street",
                city="New York",
                state="NY",
                pincode="10001",
                video_consultation_fee=1500,
                in_person_consultation_fee=2000,
                status=DoctorStatus.ACTIVE,
                average_rating=4.5,
                total_reviews=10
            )
            db.add(doctor)
            db.flush()
            
            # Create availability for weekdays
            weekdays = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, 
                       DayOfWeek.THURSDAY, DayOfWeek.FRIDAY]
            time_ranges = [{"start_time": "09:00", "end_time": "17:00"}]
            slots = generate_slots_from_ranges(time_ranges)
            
            for day in weekdays:
                availability = DoctorAvailability(
                    doctor_id=doctor.id,
                    day_of_week=day,
                    is_available=True,
                    slots=slots
                )
                db.add(availability)
            
            created_users[user_data["email"]] = {"user": user, "doctor": doctor}
        
        else:  # Admin
            created_users[user_data["email"]] = {"user": user}
    
    db.commit()
    print("✓ Users created successfully")
    return created_users


def create_dummy_appointments(db: Session, users_data: dict):
    """Create dummy appointments"""
    # Query directly by email (more reliable)
    patient1 = db.query(Patient).join(User).filter(User.email == "patient1@wecure.com").first()
    patient2 = db.query(Patient).join(User).filter(User.email == "patient2@wecure.com").first()
    doctor1 = db.query(Doctor).join(User).filter(User.email == "doctor1@wecure.com").first()
    doctor2 = db.query(Doctor).join(User).filter(User.email == "doctor2@wecure.com").first()
    doctor3 = db.query(Doctor).join(User).filter(User.email == "doctor3@wecure.com").first()
    
    if not all([patient1, patient2, doctor1, doctor2, doctor3]):
        missing = []
        if not patient1: missing.append("patient1")
        if not patient2: missing.append("patient2")
        if not doctor1: missing.append("doctor1")
        if not doctor2: missing.append("doctor2")
        if not doctor3: missing.append("doctor3")
        print(f"⚠️  Warning: Missing profiles: {', '.join(missing)}")
        return []
    
    appointments_data = [
        {
            "patient": patient1,
            "doctor": doctor1,
            "date": date.today() + timedelta(days=1),
            "time": time(10, 0),
            "type": AppointmentType.VIDEO,
            "status": AppointmentStatus.CONFIRMED,
            "complaint": "Chest pain and shortness of breath"
        },
        {
            "patient": patient2,
            "doctor": doctor1,
            "date": date.today() + timedelta(days=2),
            "time": time(14, 0),
            "type": AppointmentType.IN_PERSON,
            "status": AppointmentStatus.PENDING,
            "complaint": "Regular checkup"
        },
        {
            "patient": patient1,
            "doctor": doctor2,
            "date": date.today() + timedelta(days=3),
            "time": time(11, 0),
            "type": AppointmentType.VIDEO,
            "status": AppointmentStatus.PENDING,
            "complaint": "Skin rash"
        },
        {
            "patient": patient2,
            "doctor": doctor3,
            "date": date.today() - timedelta(days=5),
            "time": time(15, 0),
            "type": AppointmentType.VIDEO,
            "status": AppointmentStatus.COMPLETED,
            "complaint": "Child vaccination"
        },
        {
            "patient": patient1,
            "doctor": doctor1,
            "date": date.today() - timedelta(days=2),
            "time": time(10, 0),
            "type": AppointmentType.IN_PERSON,
            "status": AppointmentStatus.COMPLETED,
            "complaint": "Heart checkup"
        }
    ]
    
    created_appointments = []
    for i, apt_data in enumerate(appointments_data, 1):
        appointment = Appointment(
            id=uuid.uuid4(),
            appointment_number=f"APT-{str(i).zfill(6)}",
            patient_id=apt_data["patient"].id,
            doctor_id=apt_data["doctor"].id,
            appointment_date=apt_data["date"],
            appointment_time=apt_data["time"],
            appointment_type=apt_data["type"],
            status=apt_data["status"],
            chief_complaint=apt_data["complaint"],
            duration_minutes=30
        )
        
        if apt_data["status"] == AppointmentStatus.COMPLETED:
            appointment.completed_at = datetime.utcnow() - timedelta(hours=2)
            appointment.diagnosis = "Normal condition"
            appointment.consultation_notes = "Patient is doing well"
        
        db.add(appointment)
        created_appointments.append(appointment)
    
    db.commit()
    print("✓ Appointments created successfully")
    return created_appointments


def create_dummy_reviews(db: Session, users_data: dict):
    """Create dummy reviews"""
    # Query directly by email (more reliable)
    patient1 = db.query(Patient).join(User).filter(User.email == "patient1@wecure.com").first()
    doctor1 = db.query(Doctor).join(User).filter(User.email == "doctor1@wecure.com").first()
    doctor2 = db.query(Doctor).join(User).filter(User.email == "doctor2@wecure.com").first()
    
    if not all([patient1, doctor1, doctor2]):
        print("⚠️  Warning: Missing profiles for reviews, skipping...")
        return
    
    # Get completed appointments
    completed_apts = db.query(Appointment).filter(
        Appointment.status == AppointmentStatus.COMPLETED
    ).limit(2).all()
    
    reviews_data = [
        {
            "patient": patient1,
            "doctor": doctor1,
            "appointment": completed_apts[0] if len(completed_apts) > 0 else None,
            "rating": 5,
            "comment": "Excellent doctor! Very professional and caring."
        },
        {
            "patient": patient1,
            "doctor": doctor2,
            "appointment": completed_apts[1] if len(completed_apts) > 1 else None,
            "rating": 4,
            "comment": "Good consultation, helpful advice."
        }
    ]
    
    for review_data in reviews_data:
        if not review_data["appointment"]:
            continue
        
        review = Review(
            id=uuid.uuid4(),
            patient_id=review_data["patient"].id,
            doctor_id=review_data["doctor"].id,
            appointment_id=review_data["appointment"].id,
            rating=review_data["rating"],
            comment=review_data["comment"]
        )
        db.add(review)
    
    db.commit()
    print("✓ Reviews created successfully")


def create_dummy_prescriptions(db: Session):
    """Create dummy prescriptions"""
    # Get a completed appointment
    completed_apt = db.query(Appointment).filter(
        Appointment.status == AppointmentStatus.COMPLETED
    ).first()
    
    if not completed_apt:
        print("No completed appointments found, skipping prescriptions...")
        return
    
    prescription = Prescription(
        id=uuid.uuid4(),
        prescription_number="RX-000001",
        doctor_id=completed_apt.doctor_id,
        patient_id=completed_apt.patient_id,
        appointment_id=completed_apt.id,
        medicines=[
            {
                "name": "Paracetamol",
                "dosage": "500mg",
                "frequency": "2 times a day",
                "duration": "5 days"
            },
            {
                "name": "Vitamin D",
                "dosage": "1000 IU",
                "frequency": "Once daily",
                "duration": "30 days"
            }
        ],
        instructions="Take after meals. Drink plenty of water."
    )
    
    db.add(prescription)
    db.commit()
    print("✓ Prescriptions created successfully")


def main():
    """Main seeding function"""
    print("🌱 Starting database seeding...")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        # Create users
        users_data = create_dummy_users(db)
        
        # Create appointments
        appointments = create_dummy_appointments(db, users_data)
        
        # Create reviews
        create_dummy_reviews(db, users_data)
        
        # Create prescriptions
        create_dummy_prescriptions(db)
        
        print("=" * 50)
        print("✅ Database seeding completed successfully!")
        print("\n📋 Test Credentials:")
        print("-" * 50)
        print("Patient 1: patient1@wecure.com / patient123")
        print("Patient 2: patient2@wecure.com / patient123")
        print("Doctor 1:  doctor1@wecure.com  / doctor123")
        print("Doctor 2:  doctor2@wecure.com  / doctor123")
        print("Doctor 3:  doctor3@wecure.com  / doctor123")
        print("Admin:     admin@wecure.com    / admin123")
        print("\n💡 Use these credentials to login and get tokens for Postman")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()

