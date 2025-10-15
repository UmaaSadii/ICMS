from rest_framework import serializers
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'confirm_password',
            'role', 'name', 'first_name', 'last_name'
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")

        # Check if username already exists
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "A user with this username already exists."})

        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')

        # combine first_name + last_name → name
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        full_name = f"{first_name} {last_name}".strip()

        user = User(
            username=validated_data['username'],
            email=validated_data.get('email'),
            role=validated_data.get('role'),
            name=full_name or validated_data.get('name', ''),
            first_name=first_name,
            last_name=last_name,
        )
        user.set_password(validated_data['password'])
        user.save()
        return user