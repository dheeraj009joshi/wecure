# Doctor Availability Slot System

## Overview

The availability system now uses a **30-minute slot-based approach** with detailed status tracking. Doctors provide time ranges (e.g., "9 AM to 1 PM, then 3 PM to 9 PM"), and the system automatically converts them into 30-minute slots with status tracking.

## Features

### 1. **Time Range Input**
Doctors can set availability using simple time ranges:
- Single range: `09:00` to `21:00` (9 AM to 9 PM)
- Multiple ranges: `09:00-13:00` and `15:00-21:00` (9 AM-1 PM, then 3 PM-9 PM)

### 2. **Automatic Slot Generation**
Time ranges are automatically converted to 30-minute slots:
- `09:00-13:00` → `09:00-09:30`, `09:30-10:00`, `10:00-10:30`, ..., `12:30-13:00`

### 3. **Slot Status Tracking**
Each slot has a status:
- **`available`**: Slot is available for booking
- **`booked`**: Slot has an active appointment (pending/confirmed)
- **`past`**: Slot time has already passed
- **`blocked`**: Slot is manually blocked (future feature)

### 4. **Individual Slot Management**
- Add individual slots to any day
- Remove individual slots (cannot remove booked slots)

## API Endpoints

### 1. Get Availability
```
GET /api/v1/availability
```
Returns all days with detailed slot information including status.

**Response Example:**
```json
[
  {
    "id": "uuid",
    "doctor_id": "uuid",
    "day_of_week": "monday",
    "is_available": true,
    "slots": [
      {
        "start_time": "09:00",
        "end_time": "09:30",
        "status": "available",
        "appointment_id": null
      },
      {
        "start_time": "09:30",
        "end_time": "10:00",
        "status": "booked",
        "appointment_id": "appointment-uuid"
      },
      {
        "start_time": "10:00",
        "end_time": "10:30",
        "status": "past",
        "appointment_id": null
      }
    ]
  }
]
```

### 2. Set Availability (Time Ranges)
```
POST /api/v1/availability/set
```

**Request Body:**
```json
{
  "day_of_week": "monday",
  "is_available": true,
  "time_ranges": [
    {
      "start_time": "09:00",
      "end_time": "13:00"
    },
    {
      "start_time": "15:00",
      "end_time": "21:00"
    }
  ]
}
```

This will:
- Convert time ranges to 30-minute slots
- Merge with existing slots (preserving booked slots)
- Update slot statuses based on appointments and current date/time

### 3. Add Individual Slot
```
POST /api/v1/availability/{day_of_week}/add-slot
```

**Request Body:**
```json
{
  "start_time": "10:00",
  "end_time": "11:00"
}
```

Creates slots: `10:00-10:30` and `10:30-11:00`

### 4. Remove Individual Slot
```
POST /api/v1/availability/{day_of_week}/remove-slot
```

**Request Body:**
```json
{
  "start_time": "10:00"
}
```

**Note:** Cannot remove booked slots. Returns error if slot is booked.

### 5. Delete Availability for a Day
```
DELETE /api/v1/availability/{day_of_week}
```

**Note:** Cannot delete if any slots are booked. Must cancel appointments first.

## Slot Status Logic

### Status Determination

1. **Booked**: 
   - Slot has an appointment with status `pending` or `confirmed`
   - Matches appointment time and day of week

2. **Past**:
   - Slot date is before today, OR
   - Slot date is today but time has passed

3. **Available**:
   - Slot is in the future and not booked

4. **Blocked**:
   - Reserved for future manual blocking feature

## Database Structure

The `doctor_availability` table stores slots in a JSON column:

```json
[
  {
    "start_time": "09:00",
    "end_time": "09:30",
    "status": "available",
    "appointment_id": null
  },
  {
    "start_time": "09:30",
    "end_time": "10:00",
    "status": "booked",
    "appointment_id": "uuid-of-appointment"
  }
]
```

## Usage Examples

### Example 1: Set Monday Availability (9 AM - 5 PM)
```bash
POST /api/v1/availability/set
{
  "day_of_week": "monday",
  "is_available": true,
  "time_ranges": [
    {"start_time": "09:00", "end_time": "17:00"}
  ]
}
```

Result: Creates slots `09:00-09:30`, `09:30-10:00`, ..., `16:30-17:00`

### Example 2: Set Tuesday with Break (9 AM - 1 PM, 3 PM - 7 PM)
```bash
POST /api/v1/availability/set
{
  "day_of_week": "tuesday",
  "is_available": true,
  "time_ranges": [
    {"start_time": "09:00", "end_time": "13:00"},
    {"start_time": "15:00", "end_time": "19:00"}
  ]
}
```

### Example 3: Add Extra Slot on Wednesday
```bash
POST /api/v1/availability/wednesday/add-slot
{
  "start_time": "18:00",
  "end_time": "19:00"
}
```

### Example 4: Remove Slot (if not booked)
```bash
POST /api/v1/availability/wednesday/remove-slot
{
  "start_time": "18:00"
}
```

## Integration with Appointments

When an appointment is created:
- The corresponding slot is automatically marked as `booked`
- The `appointment_id` is stored in the slot

When an appointment is cancelled:
- The slot status changes back to `available`
- The `appointment_id` is removed

## Notes

- All times are in 24-hour format (HH:MM)
- Slots are always 30 minutes
- Booked slots cannot be removed or modified
- Past slots are automatically marked but remain in the database
- The system automatically calculates which day of the week a slot belongs to based on the current date

