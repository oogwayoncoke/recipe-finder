import datetime
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from recipes.models import Recipe
from .models import MealPlan, MealPlanEntry
from .serializers import MealPlanSerializer, MealPlanEntryWriteSerializer


def _monday(date):
    """Return the Monday of the week containing `date`."""
    return date - datetime.timedelta(days=date.weekday())


def _get_or_create_plan(user, week_start):
    monday = _monday(week_start)
    plan, _ = MealPlan.objects.get_or_create(user=user, week_start=monday)
    return plan


class MealPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        week_param = request.query_params.get('week')
        try:
            date = datetime.date.fromisoformat(week_param) if week_param else datetime.date.today()
        except ValueError:
            return Response({'error': 'Invalid date. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        monday = _monday(date)
        plan   = MealPlan.objects.filter(user=request.user, week_start=monday).first()

        if not plan:
            return Response({'id': None, 'week_start': str(monday), 'entries': []})

        return Response(MealPlanSerializer(plan).data)

    def post(self, request):
        week_param = request.data.get('week_start')
        try:
            date = datetime.date.fromisoformat(week_param) if week_param else datetime.date.today()
        except (ValueError, TypeError):
            return Response({'error': 'Invalid date. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        plan = _get_or_create_plan(request.user, date)
        return Response(MealPlanSerializer(plan).data, status=status.HTTP_201_CREATED)


class MealPlanEntryView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = MealPlanEntryWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        recipe = get_object_or_404(Recipe, external_id=d['recipe_external_id'])

        week_param = request.data.get('week_start')
        try:
            date = datetime.date.fromisoformat(week_param) if week_param else datetime.date.today()
        except (ValueError, TypeError):
            return Response({'error': 'Invalid week_start.'}, status=status.HTTP_400_BAD_REQUEST)

        plan = _get_or_create_plan(request.user, date)

        entry, _ = MealPlanEntry.objects.update_or_create(
            plan      = plan,
            day       = d['day'],
            meal_slot = d['meal_slot'],
            defaults  = {'recipe': recipe},
        )

        return Response(MealPlanSerializer(plan).data, status=status.HTTP_200_OK)

    def delete(self, request):
        week_param = request.data.get('week_start')
        day        = request.data.get('day')
        meal_slot  = request.data.get('meal_slot')

        try:
            date = datetime.date.fromisoformat(week_param) if week_param else datetime.date.today()
        except (ValueError, TypeError):
            return Response({'error': 'Invalid week_start.'}, status=status.HTTP_400_BAD_REQUEST)

        monday = _monday(date)
        plan   = MealPlan.objects.filter(user=request.user, week_start=monday).first()
        if not plan:
            return Response({'error': 'No plan for this week.'}, status=status.HTTP_404_NOT_FOUND)

        deleted, _ = MealPlanEntry.objects.filter(
            plan=plan, day=day, meal_slot=meal_slot
        ).delete()

        if not deleted:
            return Response({'error': 'Entry not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(MealPlanSerializer(plan).data, status=status.HTTP_200_OK)


# ── Ingredient categories ─────────────────────────────────────────────────────
CATEGORY_RULES = [
    (['chicken','beef','lamb','pork','turkey','bacon','sausage','steak',
      'salmon','tuna','shrimp','prawn','fish','cod','tilapia','anchovy',
      'egg','tofu','tempeh'], 'Proteins'),
    (['milk','cream','butter','cheese','yogurt','mozzarella','parmesan',
      'cheddar','feta','ricotta','ghee','kefir'], 'Dairy'),
    (['onion','garlic','tomato','pepper','carrot','celery','spinach',
      'lettuce','cucumber','zucchini','broccoli','cauliflower','mushroom',
      'potato','sweet potato','leek','cabbage','kale','arugula','avocado',
      'corn','peas','bean','lentil','chickpea','eggplant','asparagus',
      'artichoke','beet','radish','turnip','fennel','shallot','scallion',
      'chive','parsley','cilantro','basil','mint','thyme','rosemary',
      'oregano','dill','sage','tarragon'], 'Produce — Vegetables'),
    (['apple','banana','lemon','lime','orange','grape','berry','strawberry',
      'blueberry','raspberry','mango','pineapple','peach','pear','plum',
      'cherry','melon','watermelon','kiwi','fig','date','apricot',
      'pomegranate','coconut'], 'Produce — Fruits'),
    (['flour','bread','rice','pasta','noodle','oat','quinoa','barley',
      'couscous','bulgur','tortilla','pita','cracker','breadcrumb',
      'cornstarch','semolina','polenta'], 'Grains & Bread'),
    (['oil','vinegar','sauce','ketchup','mustard','mayonnaise','soy sauce',
      'tahini','hummus','pesto','salsa','worcestershire','hot sauce',
      'oyster sauce','fish sauce','hoisin','miso','sriracha'], 'Oils, Sauces & Condiments'),
    (['salt','pepper','cumin','paprika','turmeric','cinnamon','coriander',
      'cardamom','clove','nutmeg','ginger','chili','cayenne','curry',
      'sumac','za\'atar','allspice','anise','bay leaf','saffron',
      'vanilla','seasoning','spice','powder','flake'], 'Spices & Seasonings'),
    (['almond','walnut','cashew','pecan','pistachio','peanut','hazelnut',
      'sesame','sunflower seed','pumpkin seed','chia','flaxseed',
      'raisin','dried','pine nut'], 'Nuts, Seeds & Dried Goods'),
    (['canned','can of','tin','broth','stock','tomato paste','coconut milk',
      'evaporated','condensed'], 'Canned & Packaged'),
    (['sugar','honey','maple','syrup','molasses','agave','stevia',
      'baking powder','baking soda','yeast','cocoa','chocolate',
      'confectioner'], 'Sweeteners & Baking'),
]

UNIT_NORMALISE = {
    'tablespoon': 'tbsp', 'tablespoons': 'tbsp', 'tbsps': 'tbsp',
    'teaspoon':   'tsp',  'teaspoons':   'tsp',  'tsps':  'tsp',
    'ounce': 'oz', 'ounces': 'oz',
    'pound': 'lb', 'pounds': 'lb',
    'gram':  'g',  'grams':  'g',
    'kilogram': 'kg', 'kilograms': 'kg',
    'milliliter': 'ml', 'milliliters': 'ml', 'millilitre': 'ml',
    'liter': 'l', 'liters': 'l', 'litre': 'l',
    'cup': 'cup', 'cups': 'cup',
    'piece': 'pc', 'pieces': 'pc', 'slice': 'slice', 'slices': 'slice',
    'clove': 'clove', 'cloves': 'clove',
    'bunch': 'bunch', 'bunches': 'bunch',
    'pinch': 'pinch', 'pinches': 'pinch',
    'handful': 'handful',
}

def _categorise(name: str) -> str:
    lower = name.lower()
    for keywords, category in CATEGORY_RULES:
        if any(kw in lower for kw in keywords):
            return category
    return 'Other'

def _normalise_unit(unit: str) -> str:
    return UNIT_NORMALISE.get(unit.lower().strip(), unit.strip())


def _ensure_ingredients(recipe: Recipe) -> None:
    """
    If the recipe has no ingredients cached in the DB, fetch full detail
    from Spoonacular and persist it now so the grocery list can use them.
    This is the same logic as RecipeDetailView but called inline.
    """
    if recipe.recipe_ingredients.exists():
        return  # already populated — nothing to do

    try:
        from recipes import spoonacular
        spoonacular.fetch_recipe_detail(recipe.external_id)
    except Exception:
        # Spoonacular is unavailable or the recipe ID is invalid.
        # We swallow the error and the recipe will simply contribute
        # zero ingredients to the grocery list rather than crashing.
        pass


class GroceryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        week_param = request.query_params.get('week')
        try:
            date = datetime.date.fromisoformat(week_param) if week_param else datetime.date.today()
        except ValueError:
            return Response({'error': 'Invalid date. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        monday = _monday(date)
        plan   = MealPlan.objects.filter(user=request.user, week_start=monday).first()

        if not plan:
            return Response({
                'week_start':   str(monday),
                'recipe_count': 0,
                'categories':   [],
            })

        from collections import defaultdict
        from recipes.models import RecipeIngredient

        # ── Step 1: get all recipes in this plan ──────────────────────────────
        entries = list(plan.entries.select_related('recipe').all())
        recipes = [entry.recipe for entry in entries]

        print(f"[GroceryList] Found {len(recipes)} recipes in plan")

        # ── Step 2: for each recipe, check ingredients directly in DB ─────────
        # Do NOT use prefetch here — we need a live count, not a cached one
        for recipe in recipes:
            count = RecipeIngredient.objects.filter(recipe=recipe).count()
            print(f"[GroceryList] Recipe '{recipe.title}' (ext_id={recipe.external_id}) has {count} ingredients in DB")

            if count == 0:
                print(f"[GroceryList] Fetching from Spoonacular for '{recipe.title}'...")
                try:
                    from recipes import spoonacular
                    spoonacular.fetch_recipe_detail(recipe.external_id)
                    new_count = RecipeIngredient.objects.filter(recipe=recipe).count()
                    print(f"[GroceryList] After fetch: {new_count} ingredients saved")
                except Exception as e:
                    print(f"[GroceryList] Spoonacular fetch failed for {recipe.external_id}: {e}")

        # ── Step 3: now load all ingredients fresh from DB ────────────────────
        recipe_titles = {}
        aggregated    = {}

        for recipe in recipes:
            recipe_titles[recipe.id] = recipe.title
            ingredients = RecipeIngredient.objects.filter(recipe=recipe).select_related('ingredient')

            for ri in ingredients:
                ing_name  = ri.ingredient.name.strip()
                norm_unit = _normalise_unit(ri.unit or '')
                key       = (ing_name.lower(), norm_unit)

                if key not in aggregated:
                    aggregated[key] = {
                        'name':    ing_name,
                        'amount':  0.0,
                        'unit':    norm_unit,
                        'recipes': set(),
                    }

                if ri.amount:
                    aggregated[key]['amount'] += ri.amount
                aggregated[key]['recipes'].add(recipe.title)

        print(f"[GroceryList] Total unique ingredients aggregated: {len(aggregated)}")

        # ── Step 4: group by category ─────────────────────────────────────────
        category_map = defaultdict(list)
        for item in aggregated.values():
            cat = _categorise(item['name'])
            category_map[cat].append({
                'name':    item['name'],
                'amount':  round(item['amount'], 2) if item['amount'] else None,
                'unit':    item['unit'],
                'recipes': sorted(item['recipes']),
            })

        for cat in category_map:
            category_map[cat].sort(key=lambda x: x['name'].lower())

        known_order = [cat for _, cat in CATEGORY_RULES]
        categories  = []
        for cat_name in known_order:
            if cat_name in category_map:
                categories.append({'name': cat_name, 'items': category_map[cat_name]})
        if 'Other' in category_map:
            categories.append({'name': 'Other', 'items': category_map['Other']})

        return Response({
            'week_start':   str(monday),
            'recipe_count': len(set(recipe_titles.values())),
            'categories':   categories,
        })