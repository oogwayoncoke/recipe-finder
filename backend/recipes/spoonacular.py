"""
Spoonacular API client.
Two tiers:
  - search_by_name / search_by_ingredients  → basic data only (fast)
  - fetch_recipe_detail                     → full ingredients + instructions
"""
import requests
from django.conf import settings
from .models import Recipe, Instructions, Ingredient, RecipeIngredient, Tag, RecipeTag

BASE_URL = 'https://api.spoonacular.com'


def _key():
    return settings.SPOONACULAR_API_KEY


# ── Persist helpers ───────────────────────────────────────────────────────────

def _persist_basic(data: dict) -> Recipe:
    """Upsert title/image/time/servings/tags only. Fast."""
    recipe, _ = Recipe.objects.update_or_create(
        external_id=data['id'],
        defaults={
            'title':            data.get('title', ''),
            'image_url':        data.get('image', ''),
            'ready_in_minutes': data.get('readyInMinutes'),
            'servings':         data.get('servings'),
        },
    )

    # Tags from diets + cuisines + dishTypes
    tag_names = set()
    for field in ('diets', 'cuisines', 'dishTypes'):
        for name in data.get(field, []):
            tag_names.add(name.lower().strip())

    for name in tag_names:
        tag, _ = Tag.objects.get_or_create(name=name)
        RecipeTag.objects.get_or_create(recipe=recipe, tag=tag)

    return recipe


def _persist_full(recipe: Recipe, data: dict) -> Recipe:
    """
    Upsert ingredients + instructions onto an existing Recipe.
    Called only when user opens a recipe detail.
    """
    # Update time fields from full info (more accurate than search results)
    real_time = data.get('readyInMinutes')
    if real_time and real_time != 45:
        recipe.ready_in_minutes = real_time
        recipe.servings = data.get('servings', recipe.servings)
        recipe.save(update_fields=['ready_in_minutes', 'servings'])

    # Instructions
    analyzed = data.get('analyzedInstructions', [])
    if analyzed:
        steps = analyzed[0].get('steps', [])
        Instructions.objects.filter(recipe=recipe).delete()
        Instructions.objects.bulk_create([
            Instructions(
                recipe=recipe,
                step_num=s['number'],
                description=s.get('step', ''),
            )
            for s in steps
        ])

    # Ingredients
    extended = data.get('extendedIngredients', [])
    if extended:
        RecipeIngredient.objects.filter(recipe=recipe).delete()
        for ing_data in extended:
            ingredient, _ = Ingredient.objects.get_or_create(
                name=ing_data.get('name', '').lower().strip()
            )
            metric = ing_data.get('measures', {}).get('metric', {})
            RecipeIngredient.objects.get_or_create(
                recipe=recipe,
                ingredient=ingredient,
                defaults={
                    'amount': metric.get('amount'),
                    'unit':   metric.get('unitShort', ''),
                },
            )

    return recipe


# ── Public API ────────────────────────────────────────────────────────────────

def search_by_name(query: str, filters: dict = None):
    """Basic search — no nutrition, no ingredients."""
    filters = filters or {}
    params = {
        'apiKey':               _key(),
        'query':                query,
        'number':               filters.get('number', 12),
        'addRecipeInformation': 'true',   # needed for diets/cuisines/dishTypes
    }
    if filters.get('maxTime'):    params['maxReadyTime'] = filters['maxTime']
    if filters.get('diet'):       params['diet']         = ','.join(filters['diet'])
    if filters.get('cuisine'):    params['cuisine']      = ','.join(filters['cuisine'])

    res = requests.get(f'{BASE_URL}/recipes/complexSearch', params=params, timeout=8)
    res.raise_for_status()
    data = res.json()
    results = data.get('results', [])

    if not results:
        return [], 0

    # Bulk fetch accurate readyInMinutes — complexSearch returns 45 as default
    ids = ','.join(str(r['id']) for r in results)
    bulk = requests.get(
        f'{BASE_URL}/recipes/informationBulk',
        params={'apiKey': _key(), 'ids': ids},
        timeout=8,
    )
    bulk.raise_for_status()
    # Merge accurate times into results
    time_map = {item['id']: item.get('readyInMinutes') for item in bulk.json()}
    for item in results:
        if time_map.get(item['id']):
            item['readyInMinutes'] = time_map[item['id']]

    recipes = [_persist_basic(item) for item in results]
    return recipes, data.get('totalResults', 0)


def search_by_ingredients(ingredients: list, filters: dict = None):
    """Ingredient search — fetches basic info in a second bulk call."""
    filters = filters or {}
    params = {
        'apiKey':       _key(),
        'ingredients':  ','.join(ingredients),
        'number':       filters.get('number', 12),
        'ranking':      1,
        'ignorePantry': 'true',
    }

    res = requests.get(f'{BASE_URL}/recipes/findByIngredients', params=params, timeout=8)
    res.raise_for_status()
    items = res.json()
    if not items:
        return [], 0

    # Bulk fetch basic info (diets, cuisines, dishTypes)
    ids = ','.join(str(i['id']) for i in items)
    bulk = requests.get(
        f'{BASE_URL}/recipes/informationBulk',
        params={'apiKey': _key(), 'ids': ids},
        timeout=8,
    )
    bulk.raise_for_status()

    recipes = [_persist_basic(item) for item in bulk.json()]
    return recipes, len(recipes)


def fetch_recipe_detail(external_id: int):
    """
    Fetch full recipe info (ingredients + instructions) for a single recipe.
    Returns the Recipe instance with full data.
    Skips the API call if full data already exists in DB.
    """
    try:
        recipe = Recipe.objects.get(external_id=external_id)
        # If we already have ingredients and instructions, return from DB
        if recipe.recipe_ingredients.exists() and recipe.instructions.exists():
            return recipe
    except Recipe.DoesNotExist:
        recipe = None

    # Hit Spoonacular for full info
    res = requests.get(
        f'{BASE_URL}/recipes/{external_id}/information',
        params={'apiKey': _key(), 'includeNutrition': 'false'},
        timeout=8,
    )
    res.raise_for_status()
    data = res.json()

    if recipe is None:
        recipe = _persist_basic(data)

    _persist_full(recipe, data)
    return recipe