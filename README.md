<div align="center">

# di*sh*

### Find what to cook, tonight.

A full-stack recipe finder with personalised diet filtering, ingredient-based search, and a clean dark/light interface.

[![Django](https://img.shields.io/badge/Django-5.2-092E20?style=flat&logo=django)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql)](https://postgresql.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat&logo=vite)](https://vitejs.dev)

</div>

---

## Overview

**dish** is a recipe discovery app that personalises results to how you eat. Search by dish name or available ingredients, filter by diet, cuisine, and time — with a DB-first caching layer that keeps the app fast and API-quota-friendly.

The backend is built as a **decoupled REST API** — a single Django server serves the React web client. It consumes JWT auth and identical endpoints, and stays in sync automatically as the API evolves.

Guest browsing is supported with no account required. Sign up to unlock favourites, history, and a saved diet profile.

---

## Screenshots

| Get Started | Discover | Recipe Detail |
|---|---|---|
| Dark split-panel onboarding with "Cook with intention." | Sidebar filters + recipe grid | Bottom sheet modal with ingredients & steps |

---

## Tech Stack

### Architecture

```
┌─────────────────────────────────────────┐
│           Django REST API               │
│     JWT Auth · PostgreSQL · DRF         │
└──────────────┬──────────────────────────┘
               │  JSON over HTTP
       ┌───────┴────────┐
       │                │
┌──────▼──────┐
│  React Web  │
│  (Vite 6)   │
└─────────────┘
```

A single Django server powers the web client. All business logic, auth, and data live in the API — the client has no server-side code. Adding another client (CLI, desktop, mobile, etc.) requires zero backend changes.

### Backend
| Layer | Technology |
|---|---|
| Framework | Django 5.2 + Django REST Framework |
| Auth | simplejwt + django-allauth (Google OAuth) |
| Database | PostgreSQL |
| Recipe API | Spoonacular (migrating to Edamam) |
| Caching | DB-first — API only called on cache miss |
| Parallelism | `ThreadPoolExecutor` for concurrent API calls |

### Web Client (React)
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 6 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Routing | React Router v6 |
| HTTP | `fetch` with `AbortController` + debounce |
| State | React context (`AuthContext`, `ThemeContext`) |
| Font | Inter |

---

## Features

- **Guest browsing** — explore recipes with no account
- **Onboarding flow** — diet & allergy setup before first use
- **Search by name** — debounced as-you-type with 500ms delay
- **Search by ingredients** — drop what's in your fridge
- **Filter-only browse** — diet, cuisine, and time filters fire automatically
- **DB-first caching** — zero API calls on cache hits, parallel fetches on misses
- **Google OAuth** — one-click sign in via redirect flow
- **Password reset** — email link flow via Django's token generator
- **Dark / light theme** — persisted to `localStorage`, toggle in navbar
- **Mobile bottom sheet** — recipe modal slides up from bottom on mobile, centered on desktop
- **Optimistic UI** — previous results stay visible while new ones load

---

## Project Structure

```
dish/
├── backend/              # Shared Django REST API
│   ├── core/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── authentication/
│   │   ├── models.py          # Custom User, Diet, Allergy, UserProfile
│   │   ├── serializers/
│   │   ├── views/
│   │   │   ├── creat_user.py  # Register, confirm email, JWT login
│   │   │   ├── google.py      # Google OAuth token exchange
│   │   │   └── password_reset.py
│   │   └── urls.py
│   └── recipes/
│       ├── models.py          # Recipe, Ingredient, Nutrition, History, Favorites
│       ├── spoonacular.py     # DB-first API client with parallel fetches
│       ├── views.py           # Search, browse, detail — all public
│       └── management/commands/seed_recipes.py
│
└── frontend/             # React web client (Vite)
    └── src/
        ├── App.jsx
        ├── index.css              # CSS tokens (dark + light)
        ├── context/
        │   ├── AuthContext.jsx
        │   └── ThemeContext.jsx
        ├── pages/
        │   ├── GetStartedPage.jsx
        │   ├── DietSetupPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DiscoverPage.jsx
        │   ├── GoogleCallbackPage.jsx
        │   └── ResetPasswordPage.jsx
        └── components/
            ├── auth/          # AuthForm, ProtectedRoute, VerifyEmail
            ├── layout/        # Navbar, Sidebar
            ├── recipe/        # RecipeCard, RecipeGrid
            └── search/        # SearchPanel
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 14+

### Backend Setup

```bash
# Clone and enter project
git clone https://github.com/oogwayoncoke/recipe-finder.git
cd recipe-finder/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

# Run migrations
python manage.py migrate

# Seed the database with starter recipes
python manage.py seed_recipes

# Start the server
python manage.py runserver
```

### Frontend Setup

```bash
cd recipe-finder/frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add VITE_API_URL and VITE_GOOGLE_CLIENT_ID

# Start dev server
npm run dev
```

---

## Environment Variables

### Backend `.env`

```env
# Database
DB=your_db_name
USER=your_db_user
PASSWORD=your_db_password
HOST=localhost
PORT=5432

# APIs
SPOONACULAR_API_KEY=your_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# App
FRONTEND_URL=http://localhost:5173
DEFAULT_FROM_EMAIL=noreply@dish.app
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## API Reference

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/authentication/register/` | Create account | Public |
| `POST` | `/api/authentication/login/` | Get JWT tokens | Public |
| `POST` | `/api/authentication/token/refresh/` | Refresh access token | Public |
| `POST` | `/api/authentication/confirm-email/<key>/` | Verify email | Public |
| `POST` | `/api/authentication/google/` | Google OAuth exchange | Public |
| `POST` | `/api/authentication/password-reset/` | Request reset link | Public |
| `POST` | `/api/authentication/password-reset/confirm/` | Set new password | Public |

### Recipes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/recipes/` | Latest DB recipes | Public |
| `POST` | `/api/recipes/search/` | Search by name, ingredients, or filters | Public |
| `GET` | `/api/recipes/<external_id>/` | Recipe detail with ingredients & steps | Public |

#### Search Request Body

```json
{
  "query": "chicken shawarma",
  "filters": {
    "number": 12,
    "maxTime": 30,
    "diet": ["vegan"],
    "cuisine": ["middle eastern"]
  }
}
```

Filter-only browse (no query):
```json
{
  "filters": { "diet": ["halal"], "cuisine": ["mediterranean"] }
}
```

Ingredient search:
```json
{
  "ingredients": ["chicken", "lemon", "garlic"],
  "filters": { "number": 6 }
}
```

---

## User Flow

```
/ ──→ /get-started
         │
         ├── "Get started →" ──→ /register ──→ /diet-setup ──→ /discover
         │
         └── "Skip for now" ──→ /discover  (guest, no account needed)
```

Returning users go directly to `/login` → `/discover`.

---

## Design System

| Token | Dark | Light |
|---|---|---|
| `--bg` | `#0a0a09` | `#f5f4f0` |
| `--bg-card` | `#121210` | `#ffffff` |
| `--bg-hover` | `#1a1a17` | `#f0ede6` |
| `--border` | `#252522` | `#e0ddd6` |
| `--text` | `#e8e6e0` | `#1a1a18` |
| `--text-muted` | `#a8a6a0` | `#4a4a46` |
| `--text-dim` | `#6b6b67` | `#8a8a86` |
| `--accent` | `#d4a843` | `#b8892e` |
| `--error` | `#c0574a` | `#b04030` |

Font: **Inter** — 400/500 weights throughout.

---

## Pending Features

- [ ] Migrate from Spoonacular → Edamam (Recipe Search + Nutrition APIs)
- [ ] Nutrition display in recipe detail
- [ ] Favourites — save and view saved recipes
- [ ] Profile page — edit diet preferences, avatar
- [ ] Meal planner — weekly plan builder
- [ ] Grocery list — generated from planned meals
- [ ] Wire diet setup preferences to backend profile

---

## Development Notes

### Decoupled Architecture

The Django backend exposes a pure JSON REST API with no knowledge of any frontend. The web client authenticates using the same JWT flow — `POST /api/authentication/login/` returns `{ access, refresh }` and the client attaches `Authorization: Bearer <token>` to subsequent requests.

This means:
- A bug fix or feature on the backend is immediately available to the client
- A third client (CLI, desktop, mobile) can be added with zero API changes
- The backend can be deployed independently and versioned separately

**DB-first caching** — `spoonacular.py` checks the local DB before every API call. On a cache hit the response is ~50ms. On a miss, `complexSearch` and `informationBulk` fire in parallel via `ThreadPoolExecutor`. After enough real searches, cache misses become rare.

**Guest mode** — `/recipes/` endpoints use `permission_classes = [AllowAny]` and `authentication_classes = []`. The empty auth classes list bypasses JWT validation entirely — `AllowAny` alone isn't enough because the JWT middleware rejects missing tokens before permissions are checked.

**Onboarding** — stored in `localStorage` under `dish_onboarded`. Values: `'started'`, `'skipped'`, `'done'`. First-time users are routed through get-started → register → diet-setup. The key is checked in `ProtectedRoute` and set at each onboarding step.

---

## License

MIT