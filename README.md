# EDAC - Full Stack Assignment

A full-stack web application built with **FastAPI**, **PostgreSQL**, and **React.js**.

## Features

- User registration & login with JWT authentication
- Role-based access control (User & Admin)
- AI-powered chatbot (accessible after login)
- Admin panel — view, edit, enable/disable, delete users
- Activity logging — every action is tracked

## Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Backend  | Python, FastAPI          |
| Database | PostgreSQL, SQLAlchemy   |
| Frontend | React.js, React Router   |
| Auth     | JWT, bcrypt              |
| AI       | Groq API (Llama 3)       |

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL

### 1. Database Setup

```bash
sudo -u postgres psql -c "CREATE DATABASE edac_db;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@/edac_db?host=/var/run/postgresql
JWT_SECRET=your_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
GROQ_API_KEY=your_groq_api_key_here
```

> Get a free Groq API key at [console.groq.com](https://console.groq.com)

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

App runs at: `http://localhost:3000`

## Default Admin Account

| Field    | Value           |
|----------|-----------------|
| Email    | admin@edac.com  |
| Password | Admin@123       |
