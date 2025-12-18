# WeCure API - Complete Setup Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Seed Dummy Data
```bash
cd backend
python scripts/seed_dummy_data.py
```

### Step 2: Get Tokens (Server must be running!)
```bash
# In a separate terminal, start the server:
cd backend
uvicorn app.main:app --reload --port 8000

# Then in another terminal:
python scripts/get_tokens.py
```

### Step 3: Import to Postman
1. Import `WeCure_API_Complete.postman_collection.json`
2. Import `WeCure_Local.postman_environment.json`
3. Select "WeCure Local" environment
4. **You're ready to test!** 🎉

## 📋 Test Credentials

All users have been created with these credentials:

| User | Email | Password | Role |
|------|-------|----------|------|
| Patient 1 | patient1@wecure.com | patient123 | Patient |
| Patient 2 | patient2@wecure.com | patient123 | Patient |
| Doctor 1 | doctor1@wecure.com | doctor123 | Doctor |
| Doctor 2 | doctor2@wecure.com | doctor123 | Doctor |
| Doctor 3 | doctor3@wecure.com | doctor123 | Doctor |
| Admin | admin@wecure.com | admin123 | Admin |

## 📊 What's Included

### Dummy Data Created:
- ✅ 3 Patients with complete profiles
- ✅ 3 Active Doctors with specialties
- ✅ 5 Appointments (various statuses)
- ✅ Doctor availability (Mon-Fri, 9 AM - 5 PM)
- ✅ 2 Reviews
- ✅ 1 Prescription

### Postman Collection Includes:
- ✅ All API endpoints (50+ requests)
- ✅ Organized by category
- ✅ Auto-save tokens on login
- ✅ Pre-configured environment variables
- ✅ Query parameters with descriptions
- ✅ Example request bodies

## 🎯 Ready-to-Use Endpoints

### Health Check
- `GET /health` - Verify server is running

### Authentication
- `POST /api/v1/auth/signup` - Sign up new users
- `POST /api/v1/auth/login` - Login (auto-saves token)
- `GET /api/v1/auth/me` - Get current user

### Patients
- `GET /api/v1/patients/me` - Get my profile
- `PUT /api/v1/patients/me` - Update my profile
- `GET /api/v1/patients/me/appointments` - My appointments

### Doctors
- `GET /api/v1/doctors` - List doctors (with search/filters)
- `GET /api/v1/doctors/me` - Get my profile
- `PUT /api/v1/doctors/me` - Update my profile
- `GET /api/v1/doctors/me/appointments` - My appointments

### Availability (Slot System)
- `GET /api/v1/availability` - Get all availability with slot status
- `POST /api/v1/availability/set` - Set availability (time ranges)
- `POST /api/v1/availability/{day}/add-slot` - Add individual slot
- `POST /api/v1/availability/{day}/remove-slot` - Remove slot

### Appointments
- `GET /api/v1/appointments` - List with filters
- `POST /api/v1/appointments` - Create appointment
- `GET /api/v1/appointments/{id}` - Get appointment
- `PUT /api/v1/appointments/{id}` - Update appointment
- `POST /api/v1/appointments/{id}/cancel` - Cancel appointment

### Prescriptions
- `GET /api/v1/prescriptions` - List prescriptions
- `GET /api/v1/prescriptions/me` - My prescriptions
- `POST /api/v1/prescriptions` - Create prescription
- `GET /api/v1/prescriptions/{id}` - Get prescription

### Reviews
- `GET /api/v1/reviews/me` - My reviews
- `POST /api/v1/reviews` - Create review
- `GET /api/v1/reviews/doctor/{id}` - Doctor reviews
- `PUT /api/v1/reviews/{id}` - Update review
- `DELETE /api/v1/reviews/{id}` - Delete review

### Admin
- `GET /api/v1/admin/dashboard` - Dashboard stats
- `GET /api/v1/admin/patients` - List all patients
- `GET /api/v1/admin/doctors` - List all doctors
- `GET /api/v1/admin/appointments` - List all appointments
- `PUT /api/v1/admin/doctors/{id}/verify` - Verify doctor
- `PUT /api/v1/admin/doctors/{id}/suspend` - Suspend doctor

## 🔧 Environment Variables

The Postman environment includes:
- `base_url` - http://localhost:8000
- `api_prefix` - /api/v1
- `patient_token` - Auto-filled after login
- `doctor_token` - Auto-filled after login
- `admin_token` - Auto-filled after login
- `test_doctor_id` - Auto-extracted
- `test_patient_id` - Auto-extracted
- `test_appointment_id` - Auto-extracted after creating appointment

## 💡 Tips

1. **Auto Token Saving**: Login requests automatically save tokens to environment
2. **ID Extraction**: Some requests auto-extract IDs (doctor_id, appointment_id, etc.)
3. **Filters**: Use query parameters to filter lists (status, date, search, etc.)
4. **Pagination**: All list endpoints support `skip` and `limit` parameters

## 🐛 Troubleshooting

### Tokens not saving?
- Make sure you've imported the environment file
- Check that "WeCure Local" is selected
- Run the login requests manually and copy tokens

### Server not responding?
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Database errors?
```bash
cd backend
alembic upgrade head  # Run migrations
python scripts/seed_dummy_data.py  # Re-seed data
```

### Need fresh tokens?
Just run `python scripts/get_tokens.py` again!

## 📝 Next Steps

1. ✅ Seed the database
2. ✅ Get tokens
3. ✅ Import Postman collection
4. 🎯 Start testing endpoints!

All endpoints are optimized for 1-2 second response times with proper pagination and filtering.

