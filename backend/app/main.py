from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .database import engine, Base
from .models import User, ChatHistory, ActivityLog  # noqa – needed for table creation
from .auth import hash_password
from .database import SessionLocal
from .routers import auth, chatbot, admin, logs

load_dotenv()

app = FastAPI(title="EDAC API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chatbot.router)
app.include_router(admin.router)
app.include_router(logs.router)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    _seed_admin()


def _seed_admin():
    db = SessionLocal()
    try:
        from .models import User
        existing = db.query(User).filter(User.email == "admin@edac.com").first()
        if not existing:
            admin_user = User(
                name="Super Admin",
                email="admin@edac.com",
                password=hash_password("Admin@123"),
                role="admin",
            )
            db.add(admin_user)
            db.commit()
            print("Default admin created → admin@edac.com / Admin@123")
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "EDAC API is running", "docs": "/docs"}
