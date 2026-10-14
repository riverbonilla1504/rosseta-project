"""Serializador de la cuenta actual (contracts/accounts-api.yaml, esquema Me)."""

from rest_framework import serializers

from .models import User


class MeSerializer(serializers.ModelSerializer[User]):
    onboarding_completed = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "avatar_url", "onboarding_completed"]
        read_only_fields = fields

    def get_onboarding_completed(self, user: User) -> bool:
        return user.onboarding_completed_at is not None
