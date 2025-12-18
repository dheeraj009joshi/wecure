# 🚀 WeCure API - Quick Start Guide

## ⚡ 3-Step Setup (2 minutes)

### 1️⃣ Seed Database
```bash
cd backend
python scripts/seed_dummy_data.py
```

### 2️⃣ Start Server & Get Tokens
```bash
# Terminal 1: Start server
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Get tokens (wait for server to start)
cd backend
python scripts/get_tokens.py
```

### 3️⃣ Import to Postman
1. Import `WeCure_API_Complete.postman_collection.json`
2. Import `WeCure_Local.postman_environment.json`  
3. Select "WeCure Local" environment
4. **Start testing!** ✅

---

## 📋 Test Credentials

| Email | Password | Role |
|-------|----------|------|
| patient1@wecure.com | patient123 | Patient |
| patient2@wecure.com | patient123 | Patient |
| doctor1@wecure.com | doctor123 | Doctor |
| doctor2@wecure.com | doctor123 | Doctor |
| doctor3@wecure.com | doctor123 | Doctor |
| admin@wecure.com | admin123 | Admin |

---

## ✅ What You Get

- **3 Patients** with profiles
- **3 Active Doctors** with availability
- **5 Appointments** (pending, confirmed, completed)
- **2 Reviews** 
- **1 Prescription**
- **All tokens** pre-filled in Postman
- **50+ API endpoints** ready to test

---

## 🎯 Ready to Use!

All endpoints are optimized and ready. Just import the collection and start testing!

For detailed instructions, see `SETUP_INSTRUCTIONS.md`

