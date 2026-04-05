from django.conf import settings
from django.db import models


DAYS = [
    ('monday',    'Monday'),
    ('tuesday',   'Tuesday'),
    ('wednesday', 'Wednesday'),
    ('thursday',  'Thursday'),
    ('friday',    'Friday'),
    ('saturday',  'Saturday'),
    ('sunday',    'Sunday'),
]

MEAL_SLOTS = [
    ('breakfast', 'Breakfast'),
    ('lunch',     'Lunch'),
    ('dinner',    'Dinner'),
    ('snack',     'Snack'),
]


class MealPlan(models.Model):
    """
    One week-long plan per user.
    week_start is always a Monday (enforced in the serializer).
    """
    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meal_plans',
        to_field='UUID',
    )
    week_start = models.DateField()          # always Monday
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'meal_plan'
        unique_together = ('user', 'week_start')
        ordering        = ['-week_start']

    def __str__(self):
        return f"{self.user} — week of {self.week_start}"


class MealPlanEntry(models.Model):
    """
    A single recipe slot inside a MealPlan.
    e.g. Monday breakfast = Avocado Toast
    """
    plan      = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name='entries')
    recipe    = models.ForeignKey('recipes.Recipe', on_delete=models.CASCADE)
    day       = models.CharField(max_length=10, choices=DAYS)
    meal_slot = models.CharField(max_length=10, choices=MEAL_SLOTS, default='dinner')

    class Meta:
        db_table        = 'meal_plan_entry'
        unique_together = ('plan', 'day', 'meal_slot')
        ordering        = ['day', 'meal_slot']

    def __str__(self):
        return f"{self.plan} | {self.day} {self.meal_slot} — {self.recipe}"
