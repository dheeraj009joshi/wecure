"""
Slot Management Utility
Converts time ranges to 30-minute slots and manages slot status
"""
from typing import List, Dict, Optional
from datetime import datetime, date, time, timedelta
from uuid import UUID


class SlotStatus:
    """Slot status constants"""
    AVAILABLE = "available"
    BOOKED = "booked"
    PAST = "past"
    BLOCKED = "blocked"


def time_to_minutes(time_str: str) -> int:
    """Convert time string (HH:MM) to minutes since midnight"""
    parts = time_str.split(":")
    return int(parts[0]) * 60 + int(parts[1])


def minutes_to_time(minutes: int) -> str:
    """Convert minutes since midnight to time string (HH:MM)"""
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours:02d}:{mins:02d}"


def generate_slots_from_ranges(time_ranges: List[Dict[str, str]], slot_duration: int = 30) -> List[Dict]:
    """
    Convert time ranges to 30-minute slots
    
    Args:
        time_ranges: List of dicts with 'start_time' and 'end_time' (e.g., [{"start_time": "09:00", "end_time": "13:00"}])
        slot_duration: Duration of each slot in minutes (default: 30)
    
    Returns:
        List of slot dicts with start_time, end_time, and initial status
    """
    slots = []
    
    for range_item in time_ranges:
        start_time = range_item["start_time"]
        end_time = range_item["end_time"]
        
        start_minutes = time_to_minutes(start_time)
        end_minutes = time_to_minutes(end_time)
        
        # Generate slots in 30-minute increments
        current_minutes = start_minutes
        while current_minutes + slot_duration <= end_minutes:
            slot_start = minutes_to_time(current_minutes)
            slot_end = minutes_to_time(current_minutes + slot_duration)
            
            slots.append({
                "start_time": slot_start,
                "end_time": slot_end,
                "status": SlotStatus.AVAILABLE,
                "appointment_id": None
            })
            
            current_minutes += slot_duration
    
    return slots


def merge_slots_with_existing(
    new_slots: List[Dict],
    existing_slots: List[Dict],
    booked_slots_map: Dict[str, UUID] = None
) -> List[Dict]:
    """
    Merge new slots with existing slots, preserving booked status
    
    Args:
        new_slots: Newly generated slots
        existing_slots: Existing slots from database
        booked_slots_map: Dict mapping "start_time" -> appointment_id for booked slots
    
    Returns:
        Merged list of slots
    """
    if booked_slots_map is None:
        booked_slots_map = {}
    
    # Create a map of existing slots by start_time
    existing_map = {slot["start_time"]: slot for slot in existing_slots}
    
    # Create a map of new slots by start_time
    new_map = {slot["start_time"]: slot for slot in new_slots}
    
    # Merge: new slots override existing, but preserve booked status
    merged = []
    all_start_times = set(list(existing_map.keys()) + list(new_map.keys()))
    
    for start_time in sorted(all_start_times):
        if start_time in new_map:
            # New slot takes priority
            slot = new_map[start_time].copy()
            # But preserve booking if it exists
            if start_time in booked_slots_map:
                slot["status"] = SlotStatus.BOOKED
                slot["appointment_id"] = str(booked_slots_map[start_time])
            elif start_time in existing_map and existing_map[start_time]["status"] == SlotStatus.BOOKED:
                slot["status"] = SlotStatus.BOOKED
                slot["appointment_id"] = existing_map[start_time].get("appointment_id")
            merged.append(slot)
        elif start_time in existing_map:
            # Keep existing slot if not in new ranges
            merged.append(existing_map[start_time])
    
    return merged


def update_slot_statuses(
    slots: List[Dict],
    day_of_week: str,
    appointments: List[Dict] = None,
    reference_date: Optional[date] = None,
    specific_date: Optional[date] = None
) -> List[Dict]:
    """
    Update slot statuses based on appointments and current date/time
    
    Args:
        slots: List of slot dicts
        day_of_week: Day of week (e.g., "monday")
        appointments: List of appointment dicts with appointment_date, appointment_time, status, id
        reference_date: Reference date for checking past slots (default: today)
        specific_date: If provided, use this exact date instead of calculating from weekday
    
    Returns:
        Updated slots with correct statuses
    """
    if reference_date is None:
        reference_date = date.today()
    
    if appointments is None:
        appointments = []
    
    # Day mapping
    day_map = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6
    }
    target_weekday = day_map.get(day_of_week.lower(), 0)
    
    # If specific_date is provided (e.g., when booking for a specific date), use it directly
    # Otherwise, calculate the next occurrence of the target weekday
    if specific_date is not None:
        target_date = specific_date
    else:
        # Use reference_date as the base date for comparison
        today = reference_date
        today_weekday = today.weekday()  # 0=Monday, 6=Sunday
        
        # If reference_date matches the target weekday, use it directly
        # Otherwise, calculate the next occurrence of the target weekday from reference_date
        if today_weekday == target_weekday:
            target_date = today
        else:
            # Calculate days until target day (next occurrence from reference_date)
            days_until = (target_weekday - today_weekday) % 7
            if days_until == 0:
                target_date = today
            else:
                target_date = today + timedelta(days=days_until)
    
    # Create a map of booked slots for this specific day: "HH:MM" -> appointment_id
    booked_map = {}
    for apt in appointments:
        if apt.get("status") in ["pending", "confirmed"]:
            apt_date = apt.get("appointment_date")
            if isinstance(apt_date, date):
                apt_date_obj = apt_date
            elif isinstance(apt_date, str):
                apt_date_obj = datetime.strptime(apt_date, "%Y-%m-%d").date()
            else:
                continue
            
            # If specific_date is provided, only include appointments on that exact date
            # Otherwise, include appointments on the target weekday
            if specific_date is not None:
                # Only appointments on the exact target date
                if apt_date_obj == target_date:
                    apt_time = apt["appointment_time"]
                    if isinstance(apt_time, time):
                        time_str = apt_time.strftime("%H:%M")
                    elif isinstance(apt_time, str):
                        time_str = apt_time
                    else:
                        continue
                    booked_map[time_str] = apt["id"]
            else:
                # Check if appointment is on the target day (or same weekday in future)
                apt_weekday = apt_date_obj.weekday()
                if apt_weekday == target_weekday:
                    # Same weekday - check if it's the same week or future
                    if apt_date_obj >= target_date:
                        apt_time = apt["appointment_time"]
                        if isinstance(apt_time, time):
                            time_str = apt_time.strftime("%H:%M")
                        elif isinstance(apt_time, str):
                            time_str = apt_time
                        else:
                            continue
                        booked_map[time_str] = apt["id"]
    
    # Update slot statuses with proper date+time checking
    updated_slots = []
    now = datetime.now()
    current_datetime = now
    current_date = now.date()
    current_time_str = now.strftime("%H:%M")
    current_time_minutes = time_to_minutes(current_time_str)
    
    # When specific_date is provided (booking for a specific date), use it as target_date
    if specific_date is not None:
        # CRITICAL: Use the exact appointment date - don't calculate anything
        target_date = specific_date
        print(f"[Slot Manager] ===== BOOKING MODE =====")
        print(f"[Slot Manager] specific_date provided: {specific_date}")
    else:
        # Calculate target_date from weekday (for weekly view)
        target_date = reference_date
        today_weekday = reference_date.weekday()
        if today_weekday != target_weekday:
            days_until = (target_weekday - today_weekday) % 7
            if days_until > 0:
                target_date = reference_date + timedelta(days=days_until)
        print(f"[Slot Manager] ===== WEEKLY VIEW MODE =====")
    
    # CRITICAL: Determine date relationship - compare dates only
    # Make sure we're comparing date objects
    if not isinstance(target_date, date):
        raise ValueError(f"target_date must be a date object, got {type(target_date)}")
    if not isinstance(current_date, date):
        raise ValueError(f"current_date must be a date object, got {type(current_date)}")
    
    is_past_date = (target_date < current_date)
    is_today = (target_date == current_date)
    is_future_date = (target_date > current_date)
    
    # Verify the comparison
    direct_compare = target_date > current_date
    print(f"[Slot Manager] ===== DATE COMPARISON =====")
    print(f"[Slot Manager] target_date: {target_date} (type: {type(target_date).__name__})")
    print(f"[Slot Manager] current_date: {current_date} (type: {type(current_date).__name__})")
    print(f"[Slot Manager] Direct comparison: target_date > current_date = {direct_compare}")
    print(f"[Slot Manager] is_past_date: {is_past_date}")
    print(f"[Slot Manager] is_today: {is_today}")
    print(f"[Slot Manager] is_future_date: {is_future_date}")
    print(f"[Slot Manager] Current time: {current_time_str}")
    print(f"[Slot Manager] Total slots: {len(slots)}, Booked slots: {len(booked_map)}")
    
    if specific_date is not None:
        if is_future_date:
            print(f"[Slot Manager] ✓✓✓ FUTURE DATE - All slots will be AVAILABLE (NO time check) ✓✓✓")
        elif is_today:
            print(f"[Slot Manager] ✓ TODAY - Will check time for each slot")
        else:
            print(f"[Slot Manager] ✗✗✗ ERROR: PAST DATE detected for {specific_date}! ✗✗✗")
            print(f"[Slot Manager] This should not happen if you selected a future date!")
    
    # Process each slot
    for slot in slots:
        slot_copy = slot.copy()
        start_time_str = slot["start_time"]
        start_time_minutes = time_to_minutes(start_time_str)
        
        # Check if booked first
        if start_time_str in booked_map:
            slot_copy["status"] = SlotStatus.BOOKED
            slot_copy["appointment_id"] = str(booked_map[start_time_str])
        else:
            # Determine slot status based on DATE + TIME
            # CRITICAL: Check FUTURE first - if future, ALL slots available (NO time check)
            if is_future_date:
                # FUTURE DATE: All slots are available (NO time check whatsoever)
                # This is the key: for future dates, we don't care about current time
                slot_copy["status"] = SlotStatus.AVAILABLE
                slot_copy["appointment_id"] = None
            elif is_today:
                # TODAY: Check if time has passed (slot_time < current_time)
                if start_time_minutes < current_time_minutes:
                    slot_copy["status"] = SlotStatus.PAST
                    slot_copy["appointment_id"] = None
                else:
                    slot_copy["status"] = SlotStatus.AVAILABLE
                    slot_copy["appointment_id"] = None
            elif is_past_date:
                # PAST DATE: All slots are past
                slot_copy["status"] = SlotStatus.PAST
                slot_copy["appointment_id"] = None
            else:
                # Fallback: mark as available (should never happen)
                print(f"[Slot Manager] WARNING: Unexpected date state for slot {start_time_str}")
                slot_copy["status"] = SlotStatus.AVAILABLE
                slot_copy["appointment_id"] = None
        
        updated_slots.append(slot_copy)
    
    # Final counts and verification
    available_count = sum(1 for s in updated_slots if s.get("status") == SlotStatus.AVAILABLE)
    booked_count = sum(1 for s in updated_slots if s.get("status") == SlotStatus.BOOKED)
    past_count = sum(1 for s in updated_slots if s.get("status") == SlotStatus.PAST)
    
    print(f"[Slot Manager] ===== FINAL RESULTS =====")
    print(f"[Slot Manager] Available: {available_count}")
    print(f"[Slot Manager] Booked: {booked_count}")
    print(f"[Slot Manager] Past: {past_count}")
    print(f"[Slot Manager] Total: {len(updated_slots)}")
    
    if specific_date is not None and is_future_date:
        expected_available = len(updated_slots) - booked_count
        if available_count == expected_available:
            print(f"[Slot Manager] ✓✓✓ SUCCESS: All {expected_available} non-booked slots are AVAILABLE ✓✓✓")
        else:
            print(f"[Slot Manager] ⚠️  WARNING: Expected {expected_available} available, got {available_count}")
    
    return updated_slots


def add_individual_slot(
    existing_slots: List[Dict],
    start_time: str,
    end_time: str,
    slot_duration: int = 30
) -> List[Dict]:
    """
    Add individual slot(s) to existing slots
    
    Args:
        existing_slots: Existing slots
        start_time: Start time (HH:MM)
        end_time: End time (HH:MM)
        slot_duration: Duration in minutes
    
    Returns:
        Updated slots list
    """
    new_slots = generate_slots_from_ranges([{"start_time": start_time, "end_time": end_time}], slot_duration)
    
    # Merge with existing, avoiding duplicates
    existing_start_times = {slot["start_time"] for slot in existing_slots}
    for new_slot in new_slots:
        if new_slot["start_time"] not in existing_start_times:
            existing_slots.append(new_slot)
    
    # Sort by start_time
    existing_slots.sort(key=lambda x: time_to_minutes(x["start_time"]))
    return existing_slots


def remove_individual_slot(
    existing_slots: List[Dict],
    start_time: str
) -> List[Dict]:
    """
    Remove individual slot from existing slots
    
    Args:
        existing_slots: Existing slots
        start_time: Start time of slot to remove (HH:MM)
    
    Returns:
        Updated slots list
    """
    # Don't remove if booked
    for slot in existing_slots:
        if slot["start_time"] == start_time:
            if slot.get("status") == SlotStatus.BOOKED:
                raise ValueError(f"Cannot remove booked slot at {start_time}")
    
    return [slot for slot in existing_slots if slot["start_time"] != start_time]

