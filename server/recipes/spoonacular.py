"""
Spoonacular API client.
DB-first + parallel API calls via ThreadPoolExecutor.
Nutrition is fetched from Spoonacular directly (includeNutrition=true)
and persisted to the Nutrition table alongside ingredients and instructions.
"""
import requests
from concurrent.futures import ThreadPoolExecutor
from django.conf import settings
from .models import Recipe, Instructions, Ingredient, RecipeIngredient, Tag, RecipeTag, Nutrition

BASE_URL = 'https://api.spoonacular.com'


def _key():
    return settings.SPOONACULAR_API_KEY


# ── DB search helpers ─────────────────────────────────────────────────────────

def _db_search_by_name(query: str, filters: dict, limit: int):
    qs = Recipe.objects.filter(title__icontains=query)

    has_filters = (
        filters.get('maxTime') or
        filters.get('diet') or
        filters.get('cuisine')
    )

    if filters.get('maxTime'):
        qs = qs.filter(ready_in_minutes__lte=filters['maxTime'])
    for d in filters.get('diet', []):
        qs = qs.filter(recipe_tags__tag__name__icontains=d)
    for c in filters.get('cuisine', []):
        qs = qs.filter(recipe_tags__tag__name__icontains=c)

    recipes = list(qs.distinct()[:limit])

    if has_filters and not recipes:
        return [], 0

    return recipes, len(recipes)


def _db_search_by_ingredients(ingredients: list, limit: int):
    qs = Recipe.objects.all()
    for ing in ingredients:
        qs = qs.filter(recipe_ingredients__ingredient__name__icontains=ing)
    recipes = list(qs.distinct()[:limit])
    return recipes, len(recipes)


# ── Persist helpers ───────────────────────────────────────────────────────────

def _persist_basic(data: dict) -> Recipe:
    recipe, _ = Recipe.objects.update_or_create(
        external_id=data['id'],
        defaults={
            'title':            data.get('title', ''),
            'image_url':        data.get('image', ''),
            'ready_in_minutes': data.get('readyInMinutes'),
            'servings':         data.get('servings'),
        },
    )
    tag_names = set()
    for field in ('diets', 'cuisines', 'dishTypes'):
        for name in data.get(field, []):
            tag_names.add(name.lower().strip())
    for name in tag_names:
        tag, _ = Tag.objects.get_or_create(name=name)
        RecipeTag.objects.get_or_create(recipe=recipe, tag=tag)
    return recipe


def _persist_nutrition(recipe: Recipe, data: dict) -> None:
    """
    Extract macro nutrients from a Spoonacular response that was fetched
    with includeNutrition=true and write them to the Nutrition table.
    """
    nutrition_block = data.get('nutrition', {})
    nutrients_list  = nutrition_block.get('nutrients', [])

    if not nutrients_list:
        return

    # Build a quick lookup by nutrient name
    nutrients = {n['name']: n['amount'] for n in nutrients_list}

    calories = nutrients.get('Calories')
    protein  = nutrients.get('Protein')
    carbs    = nutrients.get('Carbohydrates')
    fat      = nutrients.get('Fat')

    # Only persist if we got at least calories
    if calories is None:
        return

    Nutrition.objects.update_or_create(
        recipe=recipe,
        defaults={
            'calories': round(calories, 1),
            'protein':  round(protein, 1)  if protein  is not None else None,
            'carbs':    round(carbs, 1)    if carbs    is not None else None,
            'fat':      round(fat, 1)      if fat      is not None else None,
        },
    )


def _persist_full(recipe: Recipe, data: dict) -> Recipe:
    real_time = data.get('readyInMinutes')
    if real_time and real_time != 45:
        recipe.ready_in_minutes = real_time
        recipe.servings = data.get('servings', recipe.servings)
        recipe.save(update_fields=['ready_in_minutes', 'servings'])

    analyzed = data.get('analyzedInstructions', [])
    if analyzed:
        steps = analyzed[0].get('steps', [])
        Instructions.objects.filter(recipe=recipe).delete()
        Instructions.objects.bulk_create([
            Instructions(recipe=recipe, step_num=s['number'], description=s.get('step', ''))
            for s in steps
        ])

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
                defaults={'amount': metric.get('amount'), 'unit': metric.get('unitShort', '')},
            )

    # Persist nutrition if it came back in this response
    _persist_nutrition(recipe, data)

    return recipe


# ── Parallel fetch helpers ────────────────────────────────────────────────────

def _fetch_complex_search(params: dict) -> dict:
    res = requests.get(f'{BASE_URL}/recipes/complexSearch', params=params, timeout=8)
    res.raise_for_status()
    return res.json()


def _fetch_information_bulk(ids: str) -> list:
    res = requests.get(
        f'{BASE_URL}/recipes/informationBulk',
        params={'apiKey': _key(), 'ids': ids},
        timeout=8,
    )
    res.raise_for_status()
    return res.json()


def _fetch_find_by_ingredients(params: dict) -> list:
    res = requests.get(f'{BASE_URL}/recipes/findByIngredients', params=params, timeout=8)
    res.raise_for_status()
    return res.json()


# ── Public API ────────────────────────────────────────────────────────────────

def search_by_name(query: str, filters: dict = None):
    filters = filters or {}
    limit   = filters.get('number', 12)

    recipes, total = _db_search_by_name(query, filters, limit)
    if len(recipes) > 0:
        return recipes, total

    params = {
        'apiKey':               _key(),
        'query':                query,
        'number':               limit,
        'addRecipeInformation': 'true',
    }
    if filters.get('maxTime'):  params['maxReadyTime'] = filters['maxTime']
    if filters.get('diet'):     params['diet']         = ','.join(filters['diet'])
    if filters.get('cuisine'):  params['cuisine']      = ','.join(filters['cuisine'])

    search_data = _fetch_complex_search(params)
    results     = search_data.get('results', [])
    if not results:
        return [], 0

    ids = ','.join(str(r['id']) for r in results)

    with ThreadPoolExecutor(max_workers=2) as ex:
        bulk_future    = ex.submit(_fetch_information_bulk, ids)
        persist_future = ex.submit(lambda: [_persist_basic(item) for item in results])

        bulk_data = bulk_future.result()
        recipes   = persist_future.result()

    time_map = {item['id']: item.get('readyInMinutes') for item in bulk_data}
    for recipe in recipes:
        accurate_time = time_map.get(recipe.external_id)
        if accurate_time and accurate_time != 45:
            recipe.ready_in_minutes = accurate_time
            recipe.save(update_fields=['ready_in_minutes'])

    return recipes, search_data.get('totalResults', 0)


def search_by_ingredients(ingredients: list, filters: dict = None):
    filters = filters or {}
    limit   = filters.get('number', 12)

    recipes, total = _db_search_by_ingredients(ingredients, limit)
    if len(recipes) > 0:
        return recipes, total

    ing_params = {
        'apiKey':       _key(),
        'ingredients':  ','.join(ingredients),
        'number':       limit,
        'ranking':      1,
        'ignorePantry': 'true',
    }

    items = _fetch_find_by_ingredients(ing_params)
    if not items:
        return [], 0

    ids = ','.join(str(i['id']) for i in items)
    bulk_data = _fetch_information_bulk(ids)
    recipes   = [_persist_basic(item) for item in bulk_data]
    return recipes, len(recipes)


def fetch_recipe_detail(external_id: int):
    """
    Fetch full recipe detail from Spoonacular with nutrition included.
    Results are cached in the DB — subsequent calls for the same recipe
    are served from the DB without hitting the API.
    """
    try:
        recipe = Recipe.objects.get(external_id=external_id)
        has_ingredients  = recipe.recipe_ingredients.exists()
        has_instructions = recipe.instructions.exists()
        has_nutrition    = Nutrition.objects.filter(
            recipe=recipe, calories__isnull=False
        ).exists()

        # Fully cached — return immediately
        if has_ingredients and has_instructions and has_nutrition:
            return recipe

        # Partially cached — still need to hit API to get what's missing
        # (fall through to API call below)
    except Recipe.DoesNotExist:
        recipe = None

    res = requests.get(
        f'{BASE_URL}/recipes/{external_id}/information',
        params={'apiKey': _key(), 'includeNutrition': 'true'},
        timeout=8,
    )
    res.raise_for_status()
    data = res.json()

    if recipe is None:
        recipe = _persist_basic(data)
    _persist_full(recipe, data)

    return recipe


def browse(filters: dict = None):
    """Filter-only browse — no query, no external API call."""
    filters = filters or {}
    limit   = filters.get('number', 12)

    qs = Recipe.objects.all()

    if filters.get('maxTime'):
        qs = qs.filter(ready_in_minutes__lte=filters['maxTime'])
    for d in filters.get('diet', []):
        qs = qs.filter(recipe_tags__tag__name__icontains=d)
    for c in filters.get('cuisine', []):
        qs = qs.filter(recipe_tags__tag__name__icontains=c)

    total   = qs.distinct().count()
    recipes = list(qs.distinct().order_by('-id')[:limit])
    return recipes, total


def ensure_ingredients(external_id: int) -> Recipe:
    """
    Guarantees a recipe has ingredients persisted in the DB.
    Used by the grocery list to backfill recipes added from search cards.
    """
    try:
        recipe = Recipe.objects.get(external_id=external_id)
        if recipe.recipe_ingredients.exists():
            return recipe
    except Recipe.DoesNotExist:
        recipe = None

    res = requests.get(
        f'{BASE_URL}/recipes/{external_id}/information',
        params={'apiKey': _key(), 'includeNutrition': 'true'},
        timeout=8,
    )
    res.raise_for_status()
    data = res.json()

    if recipe is None:
        recipe = _persist_basic(data)
    _persist_full(recipe, data)
    return recipe