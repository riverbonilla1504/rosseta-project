"""Vistas de accounts (contracts/accounts-api.yaml). ROS-185.

GET /api/me: implementa FR-005, FR-007 y FR-017 a través de la autenticación (la cuenta se
crea o reconoce al validar la credencial) y FR-016 (cada persona solo ve la suya).
"""

from typing import cast

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import MeSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(operation_id="getMe", responses=MeSerializer, tags=["cuentas"])
    def get(self, request: Request) -> Response:
        # IsAuthenticated garantiza un User de accounts (Auth0JWTAuthentication).
        return Response(MeSerializer(cast(User, request.user)).data)
