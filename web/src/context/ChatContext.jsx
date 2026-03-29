/**
 * useChatContext
 *
 * Collects ALL available app state and formats it for the chatbot API.
 * Reads from: AuthContext, localStorage (prefs, history, plan), current URL.
 */

import { useContext, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

const PAGE_LABELS = {
  '/discover':     'Discover / Browse recipes',
  '/meal-planner': 'Meal Planner (weekly view)',
  '/grocery-list': 'Grocery List',
  '/saved':        'Saved Recipes',
  '/profile':      'Profile / Preferences',
  '/login':        'Login page',
  '/register':     'Register page',
  '/diet-setup':   'Diet Setup (onboarding)',
}

export function useChatContext() {
  const { user } = useAuth()
  const location = useLocation()

  const buildContext = useCallback((currentRecipe = null) => {
    // ── Current page ───────────────────────────────────────────────────────────
    const path = location.pathname
    let current_page = PAGE_LABELS[path] || path

    // Handle recipe detail pages like /recipes/12345
    if (path.startsWith('/recipes/')) {
      current_page = 'Recipe Detail page'
    }

    // ── Diet preferences (from localStorage, set during onboarding) ────────────
    let preferences = { diets: [], allergies: [], cuisines: [] }
    try {
      const raw = localStorage.getItem('dish_diet_prefs')
      if (raw) {
        const parsed = JSON.parse(raw)
        preferences = {
          diets:     parsed.diets     || [],
          allergies: parsed.allergies || [],
          cuisines:  parsed.cuisines  || [],
        }
      }
    } catch {}

    // ── Favourites (from localStorage cache) ───────────────────────────────────
    let favourites = []
    try {
      const raw = localStorage.getItem('dish_favourites')
      if (raw) favourites = JSON.parse(raw)
    } catch {}

    // ── History (from localStorage) ────────────────────────────────────────────
    let history = []
    try {
      const raw = localStorage.getItem('dish_history')
      if (raw) history = JSON.parse(raw)
    } catch {}

    // ── Meal plan (from localStorage) ─────────────────────────────────────────
    let meal_plan = {}
    try {
      const raw = localStorage.getItem('dish_meal_plan')
      if (raw) meal_plan = JSON.parse(raw)
    } catch {}

    // ── Grocery list (from localStorage) ──────────────────────────────────────
    let grocery_list = []
    try {
      const raw = localStorage.getItem('dish_grocery_list')
      if (raw) grocery_list = JSON.parse(raw)
    } catch {}

    return {
      current_page,
      current_recipe:  currentRecipe || null,
      preferences,
      favourites,
      history,
      meal_plan,
      grocery_list,
    }
  }, [location.pathname])

  return { buildContext, user }
}
