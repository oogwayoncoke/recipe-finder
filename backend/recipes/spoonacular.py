"""
Spoonacular API client.
DB-first: checks local DB before hitting the API.
"""
import requests
from django.conf import settings
from .models import Recipe, Instructions, Ingredient, RecipeIngredient, Tag, RecipeTag

BASE_URL = 'https://api.spoonacular.com'


def _key():
    return settings.SPOONACULAR_API_KEY


# ── DB search helpers ─────────────────────────────────────────────────────────

def _db_search_by_name(query: str, filters: dict, limit: int):
    qs = Recipe.objects.filter(title__icontains=query)
    if filters.get('maxTime'):
        qs = qs.filter(ready_in_minutes__lte=filters['maxTime'])
    for d in filters.get('diet', []):
        qs = qs.filter(recipe_tags__tag__name__icontains=d)
    for c in filters.get('cuisine', []):
        qs = qs.filter(recipe_tags__tag__name__icontains=c)
    recipes = list(qs.distinct()[:limit])
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
    return recipe


# ── Public API ────────────────────────────────────────────────────────────────

def search_by_name(query: str, filters: dict = None):
    filters = filters or {}
    limit   = filters.get('number', 12)

    recipes, total = _db_search_by_name(query, filters, limit)
    if len(recipes) > 0:
        return recipes, total

    # Cache miss — hit Spoonacular
    params = {
        'apiKey':               _key(),
        'query':                query,
        'number':               limit,
        'addRecipeInformation': 'true',
    }
    if filters.get('maxTime'):  params['maxReadyTime'] = filters['maxTime']
    if filters.get('diet'):     params['diet']         = ','.join(filters['diet'])
    if filters.get('cuisine'):  params['cuisine']      = ','.join(filters['cuisine'])

    res = requests.get(f'{BASE_URL}/recipes/complexSearch', params=params, timeout=8)
    res.raise_for_status()
    data    = res.json()
    results = data.get('results', [])
    if not results:
        return [], 0

    ids      = ','.join(str(r['id']) for r in results)
    bulk     = requests.get(f'{BASE_URL}/recipes/informationBulk',
                            params={'apiKey': _key(), 'ids': ids}, timeout=8)
    bulk.raise_for_status()
    time_map = {item['id']: item.get('readyInMinutes') for item in bulk.json()}
    for item in results:
        if time_map.get(item['id']):
            item['readyInMinutes'] = time_map[item['id']]

    recipes = [_persist_basic(item) for item in results]
    return recipes, data.get('totalResults', 0)


def search_by_ingredients(ingredients: list, filters: dict = None):
    filters = filters or {}
    limit   = filters.get('number', 12)

    recipes, total = _db_search_by_ingredients(ingredients, limit)
    if len(recipes) > 0:
        return recipes, total

    # Cache miss — hit Spoonacular
    params = {
        'apiKey':       _key(),
        'ingredients':  ','.join(ingredients),
        'number':       limit,
        'ranking':      1,
        'ignorePantry': 'true',
    }
    res = requests.get(f'{BASE_URL}/recipes/findByIngredients', params=params, timeout=8)
    res.raise_for_status()
    items = res.json()
    if not items:
        return [], 0

    ids  = ','.join(str(i['id']) for i in items)
    bulk = requests.get(f'{BASE_URL}/recipes/informationBulk',
                        params={'apiKey': _key(), 'ids': ids}, timeout=8)
    bulk.raise_for_status()
    recipes = [_persist_basic(item) for item in bulk.json()]
    return recipes, len(recipes)


def fetch_recipe_detail(external_id: int):
    try:
        recipe = Recipe.objects.get(external_id=external_id)
        if recipe.recipe_ingredients.exists() and recipe.instructions.exists():
            return recipe
    except Recipe.DoesNotExist:
        recipe = None

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