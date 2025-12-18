from fastapi import APIRouter
from app.api.v1 import auth, patients, doctors, appointments, prescriptions, reviews, admin, analytics, availability, utils

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(doctors.router, prefix="/doctors", tags=["doctors"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(prescriptions.router, prefix="/prescriptions", tags=["prescriptions"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(availability.router, prefix="/availability", tags=["availability"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
