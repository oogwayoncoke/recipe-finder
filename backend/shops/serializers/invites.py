from rest_framework import serializers
from ..models.auth import ActionToken

    
    

    
class ActionTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionToken
        fields = ['id', 'role', 'token_type']

    def validate_phone_number(self, value):
        cleaned = value.replace(" ", "")
        if len(cleaned) < 10:
            raise serializers.ValidationError("Phone number is too short.")
        return cleaned