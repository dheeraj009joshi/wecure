# WeCure API Setup Scripts

## Quick Start

### 1. Seed Dummy Data

Run the seeding script to populate your database with test data:

```bash
cd backend
python scripts/seed_dummy_data.py
```

This will create:
- 3 Patients
- 3 Doctors (all active)
- 5 Appointments (various statuses)
- 2 Reviews
- 1 Prescription
- Availability slots for all doctors

### 2. Get Authentication Tokens

After seeding, run the token generator to get tokens for Postman:

```bash
# Make sure your FastAPI server is running first!
python scripts/get_tokens.py
```

This will:
- Login all test users
- Get their authentication tokens
- Update the Postman environment file automatically

### 3. Import Postman Collection

1. Open Postman
2. Import `WeCure_API_Complete.postman_collection.json`
3. Import `WeCure_Local.postman_environment.json`
4. Select "WeCure Local" environment
5. Start testing! 🚀

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Patient 1 | patient1@wecure.com | patient123 |
| Patient 2 | patient2@wecure.com | patient123 |
| Doctor 1 | doctor1@wecure.com | doctor123 |
| Doctor 2 | doctor2@wecure.com | doctor123 |
| Doctor 3 | doctor3@wecure.com | doctor123 |
| Admin | admin@wecure.com | admin123 |

## Test Data Overview

### Patients
- **John Doe** (patient1@wecure.com) - Male, 35 years old
- **Jane Smith** (patient2@wecure.com) - Female, 28 years old
- **Bob Johnson** (patient3@wecure.com) - Male, 42 years old

### Doctors
- **Dr. Sarah Williams** (doctor1@wecure.com) - Cardiology, 10 years exp
- **Dr. Michael Brown** (doctor2@wecure.com) - Dermatology, 8 years exp
- **Dr. Emily Davis** (doctor3@wecure.com) - Pediatrics, 12 years exp

All doctors have:
- Active status
- Availability: Monday-Friday, 9 AM - 5 PM (30-min slots)
- Average rating: 4.5
- Consultation fees set

### Appointments
- 2 Confirmed appointments (upcoming)
- 2 Pending appointments
- 1 Completed appointment (past)

### Reviews
- 2 reviews for completed appointments
- Ratings: 5 and 4 stars

### Prescriptions
- 1 prescription for a completed appointment
- Contains 2 medications

## Manual Token Setup (Alternative)

If the token generator doesn't work, you can manually get tokens:

1. Use the "Login" endpoints in Postman for each user
2. Copy the `access_token` from the response
3. Update the environment variables manually:
   - `patient_token` / `patient1_token`
   - `doctor_token` / `doctor1_token`
   - `admin_token`

## Troubleshooting

### Server not running
```bash
cd backend
source venv/bin/activate  # or activate your virtual environment
uvicorn app.main:app --reload --port 8000
```

### Database connection issues
Make sure your database is running and `DATABASE_URL` in `.env` is correct.

### Token expired
Tokens expire after 30 minutes. Just run `get_tokens.py` again to get fresh tokens.

### No data after seeding
Check the database connection and make sure migrations are applied:
```bash
cd backend
alembic upgrade head
```

## Notes

- All tokens are automatically saved to the Postman environment
- Test IDs (doctor_id, patient_id, etc.) are also automatically extracted
- The collection is ready to use immediately after running these scripts

