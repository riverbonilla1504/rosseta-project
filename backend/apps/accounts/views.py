"""Vistas de accounts (contracts/accounts-api.yaml). ROS-185.

GET /api/me: implementa FR-005, FR-007 y FR-017 a través de la autenticación (la cuenta se
crea o reconoce al validar la credencial) y FR-016 (cada persona solo ve la suya).
POST /api/me/onboarding/complete: implementa FR-017 y FR-021 (ROS-91).
"""

from typing import cast

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import MeSerializer
from .services import complete_onboarding


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(operation_id="getMe", responses=MeSerializer, tags=["cuentas"])
    def get(self, request: Request) -> Response:
        # IsAuthenticated garantiza un User de accounts (Auth0JWTAuthentication).
        return Response(MeSerializer(cast(User, request.user)).data)


class CompleteOnboardingView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="completeOnboarding", request=None, responses=MeSerializer, tags=["cuentas"]
    )
    def post(self, request: Request) -> Response:
        user = complete_onboarding(cast(User, request.user))
        return Response(MeSerializer(user).data)
