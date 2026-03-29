/**
 * historyTracker
 *
 * Maintains a capped list of recently viewed recipes in localStorage.
 * The chatbot reads this to understand what the user has been looking at.
 *
 * Call trackView(recipe) from RecipeDetailPage or RecipeModal.
 * Call trackFavourite(recipe) when user stars a recipe.
 */

const HISTORY_KEY   = 'dish_history'
const FAVS_KEY      = 'dish_favourites'
const MAX_HISTORY   = 30
const MAX_FAVS      = 100

function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] }
  catch { return [] }
}

function writeJSON(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) }
  catch {}
}

/**
 * Record that the user viewed a recipe.
 * @param {object} recipe  Must have at least { id, title }
 */
export function trackView(recipe) {
  if (!recipe?.title) return
  const history = readJSON(HISTORY_KEY).filter(h => h.id !== recipe.id)
  history.unshift({
    id:      recipe.id ?? recipe.external_id,
    title:   recipe.title,
    cuisine: recipe.cuisine ?? '',
    time:    recipe.readyInMinutes ?? recipe.ready_in_minutes ?? '',
    action:  'viewed',
    ts:      Date.now(),
  })
  writeJSON(HISTORY_KEY, history.slice(0, MAX_HISTORY))
}

/**
 * Record that the user cooked a recipe.
 * @param {object} recipe
 */
export function trackCooked(recipe) {
  if (!recipe?.title) return
  const history = readJSON(HISTORY_KEY)
  const existing = history.find(h => h.id === recipe.id)
  if (existing) { existing.action = 'cooked'; existing.ts = Date.now() }
  else {
    history.unshift({
      id:      recipe.id ?? recipe.external_id,
      title:   recipe.title,
      cuisine: recipe.cuisine ?? '',
      time:    recipe.readyInMinutes ?? recipe.ready_in_minutes ?? '',
      action:  'cooked',
      ts:      Date.now(),
    })
  }
  writeJSON(HISTORY_KEY, history.slice(0, MAX_HISTORY))
}

/**
 * Add or remove a recipe from favourites.
 * @param {object} recipe
 * @param {boolean} isFav  true = add, false = remove
 */
export function setFavourite(recipe, isFav) {
  if (!recipe?.title) return
  let favs = readJSON(FAVS_KEY)
  if (isFav) {
    if (!favs.find(f => f.id === recipe.id)) {
      favs.unshift({
        id:      recipe.id ?? recipe.external_id,
        title:   recipe.title,
        cuisine: recipe.cuisine ?? '',
        ready_in_minutes: recipe.readyInMinutes ?? recipe.ready_in_minutes ?? '',
        ts:      Date.now(),
      })
      favs = favs.slice(0, MAX_FAVS)
    }
  } else {
    favs = favs.filter(f => f.id !== recipe.id)
  }
  writeJSON(FAVS_KEY, favs)
}

/**
 * Check if a recipe is currently favourited.
 * @param {string|number} id
 * @returns {boolean}
 */
export function isFavourite(id) {
  return readJSON(FAVS_KEY).some(f => f.id == id)
}

/**
 * Save the current meal plan snapshot for chatbot context.
 * @param {object} plan  { 'Mon 12': { breakfast: 'X', lunch: 'Y', dinner: 'Z' }, ... }
 */
export function saveMealPlan(plan) {
  writeJSON('dish_meal_plan', plan)
}

/**
 * Save the current grocery list for chatbot context.
 * @param {Array} list  [{ name: string, checked: boolean, category: string }]
 */
export function saveGroceryList(list) {
  writeJSON('dish_grocery_list', list)
}
