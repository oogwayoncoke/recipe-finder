from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class Favorite(models.Model):
    """
    Generic favorites model — works with ANY model in the project.

    Uses Django's ContentType framework so the same table can store:
      - a favorited Recipe
      - a favorited MealPlan  (future feature)
      - anything else

    Usage from any other app:
        from favorites.models import Favorite
        Favorite.objects.create(user=request.user, content_object=recipe_instance)
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites',
        to_field='UUID',
    )

    # --- Generic FK (points to any model) ------------------------------------
    content_type   = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id      = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    # -------------------------------------------------------------------------

    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'favorites'
        ordering        = ['-saved_at']
        # One row per (user, target object) — no duplicate hearts
        unique_together = ('user', 'content_type', 'object_id')
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f"{self.user} ♥ {self.content_object}"
