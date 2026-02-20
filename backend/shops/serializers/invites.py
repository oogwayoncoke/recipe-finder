from rest_framework import serializers
from ..models.auth import ActionToken

    
    

    
class ActionTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionToken
        # We don't include 'id' or 'is_used' in inputs; they are auto-generated
        fields = ['id','phone_number', 'token_type', 'related_ticket', 'metadata', 'expires_at']
        read_only_fields = ['id', 'expires_at']
        extra_kwargs = {
            'expires_at': {'required': False},
            'related_ticket': {'required': False},
        }

    def validate_phone_number(self, value):
        # Basic validation: strip spaces and ensure it's a decent length
        # You can add more complex regex here later
        cleaned = value.replace(" ", "")
        if len(cleaned) < 10:
            raise serializers.ValidationError("Phone number is too short.")
        return cleaned