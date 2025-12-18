from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime
from app.database import get_db
from app.models.user import User
from app.models.doctor import Doctor, DoctorStatus
from app.models.availability import DoctorAvailability, DayOfWeek
from app.models.appointment import Appointment, AppointmentStatus
from app.api import deps
from pydantic import BaseModel
from app.utils.slot_manager import (
    generate_slots_from_ranges,
    merge_slots_with_existing,
    update_slot_statuses,
    add_individual_slot,
    remove_individual_slot,
    SlotStatus
)

router = APIRouter()

# Input schemas
class TimeRange(BaseModel):
    """Time range input (e.g., 9 AM to 1 PM)"""
    start_time: str  # Format: "HH:MM" (e.g., "09:00")
    end_time: str    # Format: "HH:MM" (e.g., "13:00")

class AvailabilitySetRequest(BaseModel):
    """Set availability using time ranges - will be converted to 30-min slots"""
    day_of_week: DayOfWeek
    is_available: bool = True
    time_ranges: List[TimeRange]  # e.g., [{"start_time": "09:00", "end_time": "13:00"}, {"start_time": "15:00", "end_time": "21:00"}]

class SlotAddRequest(BaseModel):
    """Add individual slot(s)"""
    start_time: str  # Format: "HH:MM"
    end_time: str    # Format: "HH:MM"

class SlotRemoveRequest(BaseModel):
    """Remove individual slot"""
    start_time: str  # Format: "HH:MM"

# Response schemas
class SlotDetail(BaseModel):
    """Detailed slot information"""
    start_time: str
    end_time: str
    status: str  # "available", "booked", "past", "blocked"
    appointment_id: Optional[str] = None

class AvailabilityResponse(BaseModel):
    id: str
    doctor_id: str
    day_of_week: DayOfWeek
    is_available: bool
    slots: List[SlotDetail]
    
    class Config:
        from_attributes = True

@router.get("/doctor/{doctor_id}", response_model=List[SlotDetail])
def get_doctor_availability_for_date(
    doctor_id: UUID,
    appointment_date: date = Query(..., description="Appointment date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    """
    Public endpoint to get available time slots for a doctor on a specific date
    Used by patients for booking appointments
    
    Example: GET /api/v1/availability/doctor/{doctor_id}?appointment_date=2025-12-08
    """
    # Verify date is a date object
    if not isinstance(appointment_date, date):
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    today = date.today()
    is_future = appointment_date > today
    is_today = appointment_date == today
    is_past = appointment_date < today
    
    print(f"\n{'='*70}")
    print(f"[Availability API] ===== REQUEST RECEIVED =====")
    print(f"{'='*70}")
    print(f"[Availability API] doctor_id: {doctor_id}")
    print(f"[Availability API] appointment_date: {appointment_date} (type: {type(appointment_date).__name__})")
    print(f"[Availability API] today: {today} (type: {type(today).__name__})")
    print(f"[Availability API] Date comparison:")
    print(f"  appointment_date > today: {is_future}")
    print(f"  appointment_date == today: {is_today}")
    print(f"  appointment_date < today: {is_past}")
    if is_future:
        print(f"[Availability API] ✓✓✓ FUTURE DATE - All slots should be AVAILABLE ✓✓✓")
    elif is_today:
        print(f"[Availability API] ✓ TODAY - Will check time for each slot")
    else:
        print(f"[Availability API] ✗ PAST DATE - All slots will be PAST")
    print(f"{'='*70}\n")
    
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    if doctor.status != DoctorStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Doctor is not available for appointments")
    
    # Get day of week from date
    day_of_week_name = appointment_date.strftime("%A").lower()
    day_map = {
        "monday": DayOfWeek.MONDAY,
        "tuesday": DayOfWeek.TUESDAY,
        "wednesday": DayOfWeek.WEDNESDAY,
        "thursday": DayOfWeek.THURSDAY,
        "friday": DayOfWeek.FRIDAY,
        "saturday": DayOfWeek.SATURDAY,
        "sunday": DayOfWeek.SUNDAY
    }
    
    day_of_week = day_map.get(day_of_week_name)
    if not day_of_week:
        return []
    
    # Get availability for this day
    availability = db.query(DoctorAvailability).filter(
        DoctorAvailability.doctor_id == doctor.id,
        DoctorAvailability.day_of_week == day_of_week,
        DoctorAvailability.is_available == True
    ).first()
    
    if not availability or not availability.slots:
        return []
    
    # Get all appointments for this doctor on this date
    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.appointment_date == appointment_date,
        Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
    ).all()
    
    # Create booked slots map
    booked_slots_map = {}
    for apt in appointments:
        if apt.appointment_time:
            time_str = apt.appointment_time.strftime("%H:%M")
            booked_slots_map[time_str] = str(apt.id)
    
    # Update slot statuses with proper date+time checking
    # For future dates: all slots available
    # For today: check if time has passed
    # For past dates: all slots are past
    updated_slots = update_slot_statuses(
        slots=availability.slots,
        day_of_week=day_of_week.value,
        appointments=[{
            "id": str(apt.id),
            "appointment_date": apt.appointment_date,
            "appointment_time": apt.appointment_time,
            "status": apt.status.value
        } for apt in appointments],
        reference_date=date.today(),
        specific_date=appointment_date  # Use appointment date for proper checking
    )
    
    # Filter: Return only available slots (exclude booked and past)
    print(f"[Availability API] ===== FILTERING SLOTS =====")
    print(f"[Availability API] Total slots from update_slot_statuses: {len(updated_slots)}")
    
    # Debug: Show status breakdown
    status_breakdown = {}
    for slot in updated_slots:
        status = slot.get("status", "unknown")
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
    
    print(f"[Availability API] Status breakdown:")
    for status, count in status_breakdown.items():
        print(f"  - {status}: {count}")
    
    available_slots = []
    excluded_count = 0
    for slot in updated_slots:
        slot_status = slot.get("status", "unknown")
        # Use SlotStatus constants for comparison
        if slot_status == SlotStatus.AVAILABLE:
            available_slots.append(SlotDetail(
                start_time=slot["start_time"],
                end_time=slot["end_time"],
                status=slot["status"],
                appointment_id=slot.get("appointment_id")
            ))
        else:
            excluded_count += 1
            # Debug: Log why slot was excluded (first 10 only)
            if excluded_count <= 10:
                print(f"[Availability API] Excluded slot {slot['start_time']}: status='{slot_status}'")
    
    print(f"[Availability API] ===== FINAL RESULT =====")
    print(f"[Availability API] Returning {len(available_slots)} available slots for {appointment_date}")
    if is_future:
        expected = len(updated_slots) - status_breakdown.get("booked", 0)
        if len(available_slots) == expected:
            print(f"[Availability API] ✓✓✓ SUCCESS: All {expected} non-booked slots are available ✓✓✓")
        else:
            print(f"[Availability API] ⚠️  WARNING: Expected {expected} available, got {len(available_slots)}")
    print(f"{'='*70}\n")
    
    return available_slots

@router.get("", response_model=List[AvailabilityResponse])
def get_availability(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db),
    reference_date: Optional[date] = None
):
    """
    Get doctor's weekly availability with detailed slot status
    
    Each slot shows:
    - available: Slot is available for booking
    - booked: Slot has an active appointment
    - past: Slot time has passed
    - blocked: Slot is manually blocked
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    # Get all availability records
    availability_records = db.query(DoctorAvailability).filter(
        DoctorAvailability.doctor_id == doctor.id
    ).all()
    
    # Get all appointments for this doctor to check booked slots
    all_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
    ).all()
    
    # Convert appointments to dict format for slot manager
    all_appointments_data = []
    for apt in all_appointments:
        all_appointments_data.append({
            "id": str(apt.id),
            "appointment_date": apt.appointment_date,
            "appointment_time": apt.appointment_time,
            "status": apt.status.value
        })
    
    # Process each availability record
    result = []
    for avail in availability_records:
        # Filter appointments for this specific day of week
        day_appointments = []
        day_map = {
            "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
            "friday": 4, "saturday": 5, "sunday": 6
        }
        target_weekday = day_map.get(avail.day_of_week.value.lower(), 0)
        
        for apt in all_appointments_data:
            apt_date = apt["appointment_date"]
            if isinstance(apt_date, date):
                apt_date_obj = apt_date
            elif isinstance(apt_date, str):
                apt_date_obj = datetime.strptime(apt_date, "%Y-%m-%d").date()
            else:
                continue
            
            if apt_date_obj.weekday() == target_weekday:
                day_appointments.append(apt)
        
        # Update slot statuses based on appointments and current date
        updated_slots = update_slot_statuses(
            slots=avail.slots or [],
            day_of_week=avail.day_of_week.value,
            appointments=day_appointments,
            reference_date=reference_date
        )
        
        # Convert to response format
        slot_details = [
            SlotDetail(
                start_time=slot["start_time"],
                end_time=slot["end_time"],
                status=slot["status"],
                appointment_id=slot.get("appointment_id")
            )
            for slot in updated_slots
        ]
        
        result.append(AvailabilityResponse(
            id=str(avail.id),
            doctor_id=str(avail.doctor_id),
            day_of_week=avail.day_of_week,
            is_available=avail.is_available,
            slots=slot_details
        ))
    
    return result

@router.post("/set", response_model=AvailabilityResponse)
def set_availability(
    availability_in: AvailabilitySetRequest,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Set availability for a day using time ranges
    
    Example:
    {
        "day_of_week": "monday",
        "is_available": true,
        "time_ranges": [
            {"start_time": "09:00", "end_time": "13:00"},
            {"start_time": "15:00", "end_time": "21:00"}
        ]
    }
    
    This will automatically create 30-minute slots:
    - 09:00-09:30, 09:30-10:00, ..., 12:30-13:00
    - 15:00-15:30, 15:30-16:00, ..., 20:30-21:00
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    # Convert time ranges to 30-minute slots
    time_ranges_dict = [{"start_time": tr.start_time, "end_time": tr.end_time} for tr in availability_in.time_ranges]
    new_slots = generate_slots_from_ranges(time_ranges_dict)
    
    # Check if availability exists for this day
    existing = db.query(DoctorAvailability).filter(
        DoctorAvailability.doctor_id == doctor.id,
        DoctorAvailability.day_of_week == availability_in.day_of_week
    ).first()
    
    # Get existing appointments to preserve booked slots
    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
    ).all()
    
    booked_slots_map = {}
    for apt in appointments:
        if apt.appointment_time:
            time_str = apt.appointment_time.strftime("%H:%M")
            booked_slots_map[time_str] = apt.id
    
    # Merge new slots with existing, preserving booked status
    if existing and existing.slots:
        merged_slots = merge_slots_with_existing(
            new_slots=new_slots,
            existing_slots=existing.slots,
            booked_slots_map=booked_slots_map
        )
    else:
        # Mark booked slots in new slots
        for slot in new_slots:
            if slot["start_time"] in booked_slots_map:
                slot["status"] = "booked"
                slot["appointment_id"] = str(booked_slots_map[slot["start_time"]])
        merged_slots = new_slots
    
    if existing:
        # Update existing
        existing.is_available = availability_in.is_available
        existing.slots = merged_slots
        db.commit()
        db.refresh(existing)
        
        # Return with updated statuses
        updated_slots = update_slot_statuses(
            slots=existing.slots,
            day_of_week=existing.day_of_week.value
        )
        slot_details = [
            SlotDetail(
                start_time=slot["start_time"],
                end_time=slot["end_time"],
                status=slot["status"],
                appointment_id=slot.get("appointment_id")
            )
            for slot in updated_slots
        ]
        
        return AvailabilityResponse(
            id=str(existing.id),
            doctor_id=str(existing.doctor_id),
            day_of_week=existing.day_of_week,
            is_available=existing.is_available,
            slots=slot_details
        )
    else:
        # Create new
        new_availability = DoctorAvailability(
            doctor_id=doctor.id,
            day_of_week=availability_in.day_of_week,
            is_available=availability_in.is_available,
            slots=merged_slots
        )
        db.add(new_availability)
        db.commit()
        db.refresh(new_availability)
        
        # Return with updated statuses
        updated_slots = update_slot_statuses(
            slots=new_availability.slots,
            day_of_week=new_availability.day_of_week.value
        )
        slot_details = [
            SlotDetail(
                start_time=slot["start_time"],
                end_time=slot["end_time"],
                status=slot["status"],
                appointment_id=slot.get("appointment_id")
            )
            for slot in updated_slots
        ]
        
        return AvailabilityResponse(
            id=str(new_availability.id),
            doctor_id=str(new_availability.doctor_id),
            day_of_week=new_availability.day_of_week,
            is_available=new_availability.is_available,
            slots=slot_details
        )

@router.post("/{day_of_week}/add-slot", response_model=AvailabilityResponse)
def add_slot(
    day_of_week: DayOfWeek,
    slot_request: SlotAddRequest,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Add individual slot(s) to a specific day
    
    Example: Add slot from 10:00 to 11:00 (creates 10:00-10:30 and 10:30-11:00)
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    availability = db.query(DoctorAvailability).filter(
        DoctorAvailability.doctor_id == doctor.id,
        DoctorAvailability.day_of_week == day_of_week
    ).first()
    
    if not availability:
        raise HTTPException(status_code=404, detail="Availability not found for this day")
    
    # Add slot(s)
    updated_slots = add_individual_slot(
        existing_slots=availability.slots or [],
        start_time=slot_request.start_time,
        end_time=slot_request.end_time
    )
    
    availability.slots = updated_slots
    db.commit()
    db.refresh(availability)
    
    # Return with updated statuses
    updated_slots_with_status = update_slot_statuses(
        slots=availability.slots,
        day_of_week=availability.day_of_week.value
    )
    slot_details = [
        SlotDetail(
            start_time=slot["start_time"],
            end_time=slot["end_time"],
            status=slot["status"],
            appointment_id=slot.get("appointment_id")
        )
        for slot in updated_slots_with_status
    ]
    
    return AvailabilityResponse(
        id=str(availability.id),
        doctor_id=str(availability.doctor_id),
        day_of_week=availability.day_of_week,
        is_available=availability.is_available,
        slots=slot_details
    )


@router.post("/{day_of_week}/remove-slot", response_model=AvailabilityResponse)
def remove_slot(
    day_of_week: DayOfWeek,
    slot_request: SlotRemoveRequest,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Remove individual slot from a specific day
    
    Note: Cannot remove booked slots
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    availability = db.query(DoctorAvailability).filter(
        DoctorAvailability.doctor_id == doctor.id,
        DoctorAvailability.day_of_week == day_of_week
    ).first()
    
    if not availability:
        raise HTTPException(status_code=404, detail="Availability not found for this day")
    
    try:
        # Remove slot
        updated_slots = remove_individual_slot(
            existing_slots=availability.slots or [],
            start_time=slot_request.start_time
        )
        
        availability.slots = updated_slots
        db.commit()
        db.refresh(availability)
        
        # Return with updated statuses
        updated_slots_with_status = update_slot_statuses(
            slots=availability.slots,
            day_of_week=availability.day_of_week.value
        )
        slot_details = [
            SlotDetail(
                start_time=slot["start_time"],
                end_time=slot["end_time"],
                status=slot["status"],
                appointment_id=slot.get("appointment_id")
            )
            for slot in updated_slots_with_status
        ]
        
        return AvailabilityResponse(
            id=str(availability.id),
            doctor_id=str(availability.doctor_id),
            day_of_week=availability.day_of_week,
            is_available=availability.is_available,
            slots=slot_details
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{day_of_week}")
def delete_availability(
    day_of_week: DayOfWeek,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete availability for a specific day"""
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    availability = db.query(DoctorAvailability).filter(
        DoctorAvailability.doctor_id == doctor.id,
        DoctorAvailability.day_of_week == day_of_week
    ).first()
    
    if not availability:
        raise HTTPException(status_code=404, detail="Availability not found")
    
    # Check if any slots are booked
    booked_slots = [slot for slot in (availability.slots or []) if slot.get("status") == SlotStatus.BOOKED]
    if booked_slots:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete availability with {len(booked_slots)} booked slot(s). Cancel appointments first."
        )
    
    db.delete(availability)
    db.commit()
    return {"message": "Availability deleted"}
