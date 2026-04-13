<div align="center">

# di*sh*

### Find what to cook, tonight.

A full-stack recipe finder with personalised diet filtering, ingredient-based search, an AI cooking assistant, and a weekly meal planner.

[![Django](https://img.shields.io/badge/Django-5.2-092E20?style=flat&logo=django)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql)](https://postgresql.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite)](https://vitejs.dev)

</div>

---

## Overview

**dish** is a recipe discovery app that personalises results to how you eat. Search by dish name or available ingredients, filter by diet, cuisine, and time — with a DB-first caching layer that keeps the app fast and API-quota-friendly.

The backend is a **decoupled REST API** — a single Django server serves the React web client. It consumes JWT auth and identical endpoints, and stays in sync automatically as the API evolves.

Guest browsing is supported with no account required. Sign up to unlock favourites, history, a weekly meal planner, grocery-list generation, and an AI cooking assistant.

> **No `/api/` prefix.** All endpoints mount directly: `/authentication/`, `/recipes/`, `/likes/`, `/profiles/`, `/chatbot/`, `/mealplanner/`. There is no `/api/` wrapper.

---



## Tech Stack

### Architecture

```
┌─────────────────────────────────────────┐
│           Django REST API               │
│   JWT Auth · PostgreSQL · DRF 3.16      │
└──────────────┬──────────────────────────┘
               │  JSON over HTTP
       ┌───────┴
       │                
┌──────▼──────┐
│  React Web  │
│  (Vite 8)   │
└─────────────┘
```

A single Django server powers the web client. All business logic, auth, and data live in the API — the client has no server-side code. Adding another client (CLI, desktop, mobile, etc.) requires zero backend changes.

### Backend

| Layer | Technology |
|---|---|
| Framework | Django 5.2 + Django REST Framework 3.16 |
| Auth | simplejwt 5.4 + django-allauth 65.4 (Google OAuth) |
| Database | PostgreSQL 16 |
| Recipe API | Spoonacular (`complexSearch` + `informationBulk`) |
| AI chatbot | Anthropic Claude `claude-sonnet-4-20250514` |
| Caching | DB-first — API called only on cache miss |
| Parallelism | `ThreadPoolExecutor` for concurrent Spoonacular calls |
| Image uploads | Pillow 11.2 — avatars stored in `server/media/avatars/` |

### Web Client (`web/`)

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Routing | React Router v7 |
| HTTP | Axios 1.14 (`api.js`) with JWT interceptors + raw `fetch` in some pages |
| State | React Context (`AuthContext`, `ThemeContext`, `ToastContext`, `ChatContext`) |
| Font | Inter (Google Fonts) |

---

## Features

- **Guest browsing** — explore recipes with no account
- **Onboarding flow** — diet & allergy setup before first use
- **Search by name** — debounced as-you-type with 500 ms delay
- **Search by ingredients** — drop what's in your fridge
- **Filter-only browse** — diet, cuisine, and time filters fire automatically
- **DB-first caching** — zero API calls on cache hits, parallel fetches on misses
- **Nutrition display** — calorie hero + protein/carb/fat bars on recipe cards and detail modal
- **Hover prefetch** — recipe detail loads in the background on card hover
- **Google OAuth** — one-click sign-in via redirect flow
- **Password reset** — email link flow via Django's token generator
- **Favourites / Likes** — heart icon on cards, dedicated Likes page
- **Meal planner** — weekly table, slot-based recipe assignment
- **Grocery list** — auto-generated from meal plan, grouped by category, checkable
- **AI cooking assistant** — context-aware chatbot with access to diet prefs, history, meal plan, and open recipe
- **Dark / light theme** — persisted to `localStorage`, toggled by `.light` class on `<html>`
- **Mobile bottom sheet** — recipe modal slides up from bottom on mobile, centred on desktop

---

## Project Structure

```
dish/
├── server/                    # Django REST API
│   ├── manage.py
│   ├── requirements.txt
│   ├── core/
│   │   ├── settings.py        # DB, CORS, JWT, API keys, email config
│   │   └── urls.py            # Master router — no /api/ prefix
│   ├── authentication/
│   │   ├── models.py          # User (UUID PK), Diet, Allergy, UserDiet, UserAllergy, UserProfile
│   │   ├── adapter.py         # Overrides allauth email URL → React frontend
│   │   ├── serializers/
│   │   │   └── generics.py    # UserSerializer, MyTokenObtainPairSerializer
│   │   └── views/
│   │       ├── create_user.py # Register, confirm email, JWT login
│   │       ├── google.py      # Google OAuth token exchange
│   │       └── password_reset.py
│   ├── recipes/
│   │   ├── models.py          # Recipe, Nutrition, Instructions, Ingredient, RecipeIngredient, Tag, RecipeTag
│   │   ├── spoonacular.py     # DB-first API client with parallel fetches
│   │   ├── serializers.py     # RecipeBasicSerializer, RecipeSerializer, NutritionSerializer
│   │   ├── views.py           # RecipeListView, RecipeSearchView, RecipeDetailView (all public)
│   │   └── management/commands/backfill_nutrition.py
│   ├── likes/
│   │   ├── models.py          # UserFavourite — direct FK to recipes.Recipe
│   │   └── views.py           # FavouriteToggleView, FavouriteListView, FavouriteStatusView
│   ├── profiles/
│   │   ├── serializers.py     # ProfileSerializer (read), ProfileUpdateSerializer (write)
│   │   └── views.py           # ProfileView, AvatarView, DietListView, AllergyListView
│   ├── chatbot/
│   │   └── views.py           # build_system_prompt() + chat() — Claude API
│   └── meal_planner/
│       ├── models.py          # MealPlan (user+week_start), MealPlanEntry (plan+recipe+day+slot)
│       └── views.py           # MealPlanView, MealPlanEntryView, GroceryListView
│
└── web/                       # React web client (Vite 8)
    └── src/
        ├── App.jsx            # BrowserRouter, all routes, ChatbotWrapper
        ├── api.js             # Axios instance — baseURL :8000, JWT interceptors
        ├── constants.js       # ACCESS_TOKEN, REFRESH_TOKEN key names
        ├── index.css          # Design tokens (dark + light), Tailwind import, Inter font
        ├── context/
        │   ├── AuthContext.jsx   # user, login, register, logout, loginWithTokens, loading
        │   ├── ThemeContext.jsx  # dark/light toggle — .light class on <html>
        │   ├── ToastContext.jsx  # showToast(message, type) — auto-dismiss
        │   └── ChatContext.jsx   # buildContext(currentRecipe) for chatbot payload
        ├── pages/
        │   ├── GetStartedPage.jsx
        │   ├── DietSetupPage.jsx
        │   ├── DiscoverPage.jsx   # Main page — search, sidebar, grid, modal, favourites
        │   ├── LikesPage.jsx
        │   ├── MealPlannerPage.jsx
        │   ├── GroceryListPage.jsx
        │   ├── ProfilePage.jsx
        │   ├── LoginPage.jsx / RegisterPage.jsx
        │   ├── GoogleCallbackPage.jsx
        │   └── ResetPasswordPage.jsx
        ├── components/
        │   ├── auth/          # AuthForm, ProtectedRoute, VerifyEmail
        │   ├── layout/        # Navbar, Sidebar
        │   ├── recipe/        # RecipeCard, RecipeGrid, NutritionPanel
        │   ├── search/        # SearchPanel
        │   └── chat/          # DishChatbot (FAB + panel + inline markdown renderer)
        └── utils/
            └── historyTracker.js  # trackView(), trackCooked(), setFavourite() → localStorage
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 14+

### Backend Setup

```bash
git clone https://github.com/oogwayoncoke/recipe-finder.git
cd recipe-finder/server

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

# Start the server
python manage.py runserver     # → http://localhost:8000
```

### Frontend Setup

```bash
cd recipe-finder/web

npm install

# Configure environment
cp .env.example .env
# Add VITE_API_URL and VITE_GOOGLE_CLIENT_ID

npm run dev                    # → http://localhost:5173
```

---

## Environment Variables

### `server/.env`

```env
# Database
DB=your_db_name
USER=your_db_user
PASSWORD=your_db_password
HOST=localhost
PORT=5432

# APIs
SPOONACULAR_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# App
FRONTEND_URL=http://localhost:5173
DEFAULT_FROM_EMAIL=noreply@dish.app
```

> `SECRET_KEY` is hardcoded in `settings.py` — acceptable for development. Replace with an env var before any production deployment.
> Email backend prints to the terminal in development (`console.EmailBackend`). Swap to SMTP before deploying.

### `web/.env`

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## API Reference

Base URL: `http://localhost:8000` — **no `/api/` prefix**.

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/authentication/register/` | Create account | Public |
| `POST` | `/authentication/login/` | Get JWT tokens | Public |
| `POST` | `/authentication/token/refresh/` | Refresh access token | Public |
| `POST` | `/authentication/verify-email/` | Confirm email, returns JWT pair | Public |
| `POST` | `/authentication/google/` | Exchange Google token for dish JWT | Public |
| `POST` | `/authentication/password-reset/` | Request reset link | Public |
| `POST` | `/authentication/password-reset/confirm/` | Set new password | Public |

### Recipes (all public, guest-accessible)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/recipes/?limit=12` | Latest cached recipes |
| `POST` | `/recipes/search/` | Search by name, ingredients, or filters |
| `GET` | `/recipes/<external_id>/` | Full recipe with ingredients, steps & nutrition |

#### Search Request Body

```json
// By name
{ "query": "chicken shawarma", "filters": { "number": 12, "maxTime": 30, "diet": ["halal"] } }

// By ingredients
{ "ingredients": ["chicken", "lemon", "garlic"], "filters": { "number": 6 } }

// Filter-only browse (no query)
{ "filters": { "cuisine": ["mediterranean"] } }
```

### Likes / Favourites (auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/likes/` | List all saved recipes |
| `POST` | `/likes/recipes/<external_id>/` | Save a recipe |
| `DELETE` | `/likes/recipes/<external_id>/` | Unsave a recipe |
| `GET` | `/likes/recipes/<external_id>/status/` | Check if a recipe is saved |

### Profiles

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/profiles/me/` | Full profile with diets & allergies | Required |
| `PATCH` | `/profiles/me/` | Update bio, username, diets, allergies | Required |
| `POST` | `/profiles/me/avatar/` | Upload avatar (multipart) | Required |
| `DELETE` | `/profiles/me/avatar/` | Remove avatar | Required |
| `GET` | `/profiles/diets/` | All diet options | Public |
| `GET` | `/profiles/allergies/` | All allergy options | Public |

> `PATCH /profiles/me/` is **replace-all** for diets and allergies — send the complete desired list each time, not a delta.

### Meal Planner (auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/mealplanner/?week=YYYY-MM-DD` | Fetch plan for a week |
| `POST` | `/mealplanner/` | Create / retrieve plan for a week |
| `PUT` | `/mealplanner/entry/` | Assign a recipe to a day + meal slot |
| `DELETE` | `/mealplanner/entry/` | Remove a recipe from a slot |
| `GET` | `/mealplanner/grocery-list/?week=YYYY-MM-DD` | Aggregated ingredient list |

### Chatbot

| Field | Value |
|-------|-------|
| Endpoint | `POST /chatbot/chat/` |
| Auth | Optional Bearer — guest-accessible, richer context if logged in |
| Model | `claude-sonnet-4-20250514`, `max_tokens: 2048` |

```json
// Request body
{
  "message": "What should I cook tonight?",
  "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }],
  "context": {
    "current_page": "Discover / Browse recipes",
    "current_recipe": {},
    "preferences": { "diets": ["halal"], "allergies": ["dairy"], "cuisines": [] },
    "favourites": [],
    "history": [],
    "meal_plan": {},
    "grocery_list": []
  }
}
```

---

## User Flow

```
/ → /get-started
       │
       ├── "Get started →"  → /register → email sent
       │                                → /verify-email/:key → auto-login → /diet-setup → /discover
       │
       └── "Skip for now"  → /discover  (guest, no account needed)
```

Returning users go directly to `/login` → `/discover`.

---

## Key Architectural Decisions

### DB-first caching

`spoonacular.py` checks PostgreSQL before every API call. On a cache hit the response is ~50 ms and costs zero quota. On a miss, `complexSearch` and `informationBulk` fire in parallel via `ThreadPoolExecutor`. After enough real searches, cache misses become rare — the Spoonacular 150 call/day free tier becomes sufficient.

### Guest mode requires `authentication_classes = []`

`AllowAny` permission alone is not enough. Django REST Framework's JWT middleware rejects missing tokens **before** the permission check runs. Setting `authentication_classes = []` bypasses JWT validation entirely for recipe endpoints. `AllowAny` alone would still cause 401s for unauthenticated guests.

### No `/api/` prefix

Endpoints are mounted directly at the root: `/authentication/`, `/recipes/`, etc. Both `api.js` (Axios) and raw `fetch` calls in the frontend use `http://127.0.0.1:8000` as the base URL. The older README badge incorrectly showed `/api/...` paths.

### Favourites use a direct ForeignKey

`UserFavourite` points directly to `recipes.Recipe` via a `ForeignKey`, not through Django's `ContentType` / `GenericForeignKey` framework. The app only ever favourites recipes, so the generic approach added complexity with no benefit. `unique_together` prevents duplicate rows.

### JWT decoded client-side

`AuthContext` decodes the JWT payload with `atob(token.split('.')[1])` on mount to restore the user session. No `/me/` API call needed on page load. The payload contains `user_id`, `username`, and `email`.

### Browsing history is localStorage-only

The `UserHistory` / `History` DB model was removed in migration `0002`. Recipe viewing history is written exclusively to `localStorage` via `historyTracker.js` and sent to the chatbot via `ChatContext.buildContext()`. There is no server-side history persistence.

### Diet / allergy prefs live in junction tables

`UserProfile` holds only `avatar`, `bio`, and `updated_at`. Dietary data lives in `UserDiet` (FK → `Diet`) and `UserAllergy` (FK → `Allergy`) junction tables — not as M2M fields on `UserProfile`. Any code that calls `profile.diets` or `profile.allergies` will fail.

---

## Design System

All colour tokens live in `web/src/index.css` as CSS custom properties. Theme switching adds/removes the `.light` class on `<html>` — no JS theme library needed.

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

## Known Quirks

| Issue | Detail |
|---|---|
| No `/api/` prefix | All routes mount at root. The old README showed `/api/...` — that was wrong. |
| `create_user.py` filename | The file is `server/authentication/views/create_user.py`. Do not rename — other imports depend on this name. |
| Axios vs raw `fetch` | `api.js` uses Axios with silent JWT refresh. `SearchPanel`, `DishChatbot`, and `DiscoverPage` use raw `fetch()` — those paths do not auto-refresh expired tokens. |
| `VITE_API_URL` inconsistency | `api.js` hardcodes `baseURL` to `http://127.0.0.1:8000` but the 401-refresh call uses `import.meta.env.VITE_API_URL`. Keep both in sync. |
| Diet/allergy junction tables | `UserProfile` has no `diets` or `allergies` M2M fields. Use `UserDiet.objects.filter(user=user)` and `UserAllergy.objects.filter(user=user)` instead. |
| No `UserHistory` model | The `History` / `UserHistory` DB model was deleted in migration `0002`. History is `localStorage`-only. |
| `PATCH /profiles/me/` is replace-all | Sending `diets` replaces all existing rows — not a merge. Send the complete desired list every time. |
| Spoonacular `ready_in_minutes` | Spoonacular often returns `45` for missing times. The codebase treats `45` as a sentinel and skips updating the DB with it. |
| UUID primary key | Must be set on `User` before the first migration. Cannot be changed after. |
| Grocery list backfill | `GroceryListView` calls `spoonacular.ensure_ingredients()` for any meal-plan recipe with no ingredient rows. This may trigger live Spoonacular API calls at grocery-list load time. |

---

## Pending Features

- [ ] Production deployment config (`SECRET_KEY` env var, SMTP email, `ALLOWED_HOSTS`, `DEBUG=False`)

---

## License

MIT
