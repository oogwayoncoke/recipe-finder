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
    """
    GET  /mealplanner/?week=YYYY-MM-DD
    POST /mealplanner/
    """
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
    """
    PUT    /mealplanner/entry/
    DELETE /mealplanner/entry/
    """
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


class GroceryListView(APIView):
    """
    GET /mealplanner/grocery-list/?week=YYYY-MM-DD

    Aggregates every ingredient from every recipe in the week's meal plan.
    If a recipe was added from a search card (no ingredients in DB yet),
    we backfill from Spoonacular before aggregating so the list is always
    complete — even on first use.
    """
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

        # ── Backfill any recipes that are missing ingredients ─────────────────
        # Pull all entries and check which recipes have no ingredient rows yet.
        # For each missing one, call ensure_ingredients() which hits Spoonacular
        # only on a cache miss and persists the result — subsequent calls are free.
        from recipes import spoonacular  # local import avoids circular deps
        from recipes.models import RecipeIngredient

        entries = list(
            plan.entries
            .select_related('recipe')
            .prefetch_related('recipe__recipe_ingredients')
        )

        recipes_needing_ingredients = [
            entry.recipe
            for entry in entries
            if not entry.recipe.recipe_ingredients.exists()
        ]

        for recipe in recipes_needing_ingredients:
            try:
                spoonacular.ensure_ingredients(recipe.external_id)
            except Exception:
                # If Spoonacular is down or quota is hit, skip gracefully.
                # That recipe will just contribute 0 ingredients to the list.
                pass

        # Re-fetch entries with freshly populated ingredients
        entries = (
            plan.entries
            .select_related('recipe')
            .prefetch_related('recipe__recipe_ingredients__ingredient')
        )

        # ── Aggregate ─────────────────────────────────────────────────────────
        from collections import defaultdict

        recipe_titles = {}
        aggregated    = {}

        for entry in entries:
            recipe = entry.recipe
            recipe_titles[recipe.id] = recipe.title

            for ri in recipe.recipe_ingredients.all():
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

        # ── Group by category ─────────────────────────────────────────────────
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