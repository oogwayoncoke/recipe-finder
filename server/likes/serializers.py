from rest_framework import serializers
from .models import Favorite


class FavoriteToggleSerializer(serializers.ModelSerializer):
    """
    Lightweight response for POST (save) — just confirms the action
    and returns the object_id so the frontend can flip the heart icon.
    """
    class Meta:
        model        = Favorite
        fields       = ['id', 'object_id', 'saved_at']
        read_only_fields = fields


class FavoriteListSerializer(serializers.ModelSerializer):
    """
    Used by FavoriteListView — embeds the serialized target object
    so the Favorites page gets everything it needs in one request.

    `item` is injected by the view after serializing the content_object
    with its own app's serializer (e.g. RecipeBasicSerializer).
    """
    item = serializers.SerializerMethodField()

    class Meta:
        model  = Favorite
        fields = ['id', 'object_id', 'saved_at', 'item']

    def get_item(self, obj):
        # The view injects a `serializer_map` into context:
        # { ContentType.pk: SerializerClass }
        serializer_map = self.context.get('serializer_map', {})
        serializer_cls = serializer_map.get(obj.content_type_id)
        if serializer_cls and obj.content_object:
            return serializer_cls(obj.content_object, context=self.context).data
        return None
