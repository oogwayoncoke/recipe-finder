"""
Backfill nutrition for all recipes in the DB that are missing macro data.
Fetches from Spoonacular with includeNutrition=true.

Usage:
    python manage.py backfill_nutrition
    python manage.py backfill_nutrition --limit 50
"""

import time
from django.core.management.base import BaseCommand
from recipes.models import Recipe, Nutrition
from recipes.spoonacular import fetch_recipe_detail


class Command(BaseCommand):
    help = "Backfill Spoonacular nutrition for all recipes missing macro data"

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=None,
                            help='Max recipes to process (default: all)')
        parser.add_argument('--delay', type=float, default=0.5,
                            help='Seconds between API calls (default: 0.5)')

    def handle(self, *args, **options):
        limit = options['limit']
        delay = options['delay']

        missing = (
            Recipe.objects
            .exclude(nutrition__calories__isnull=False)
            .order_by('id')
        )
        if limit:
            missing = missing[:limit]

        total = missing.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS("All recipes already have nutrition."))
            return

        self.stdout.write(f"Backfilling nutrition for {total} recipes...\n")

        success = 0
        failed  = 0

        for i, recipe in enumerate(missing, start=1):
            self.stdout.write(
                f"[{i}/{total}] {recipe.title[:60]} ... ", ending=""
            )
            try:
                fetch_recipe_detail(recipe.external_id)
                n = Nutrition.objects.filter(
                    recipe=recipe, calories__isnull=False
                ).first()
                if n:
                    self.stdout.write(self.style.SUCCESS(f"{n.calories} kcal"))
                    success += 1
                else:
                    self.stdout.write(self.style.WARNING("no nutrition in response"))
                    failed += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(str(e)))
                failed += 1

            if i < total:
                time.sleep(delay)

        self.stdout.write(
            f"\nDone. {success} populated, {failed} skipped out of {total}."
        )