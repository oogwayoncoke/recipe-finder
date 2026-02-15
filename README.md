Repair Shop Management SaaS
A full-stack job management system built with Django, React, and PostgreSQL. This application is designed to streamline repair shop workflows, from job intake to completion.

🛠 Tech Stack
Backend: Django, Django Rest Framework (DRF)

Frontend: React (Vite), Tailwind CSS

Database: PostgreSQL

Authentication: JWT (JSON Web Tokens)

🚀 Getting Started
1. Prerequisites
Python 3.x

Node.js & npm

PostgreSQL installed and running

2. Backend Setup (Django)
Bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
Create a .env file in the backend/ folder.

Add your DB_NAME, DB_USER, and DB_PASSWORD.

Run migrations:

Bash
python manage.py migrate
python manage.py runserver
3. Frontend Setup (React)
Bash
cd frontend
npm install
Create a .env file in the frontend/ folder.

Add VITE_API_URL=http://127.0.0.1:8000.

Start the development server:

Bash
npm run dev
📁 Project Structure
/backend: Django project handling the API and database logic.

/frontend: React application for the user interface.

.gitignore: Configured to keep secrets and dependencies out of version control.

📝 Roadmap
[ ] User authentication & Repair Shop profiles

[ ] Job ticket creation and tracking

[ ] Customer notification system

[ ] Subscription-based SaaS billing
