"""Usuario de Rosetta — specs/002-autenticacion-oauth/data-model.md (accounts_user).

Implementa FR-005, FR-006 y FR-008 (ROS-89, ROS-90, ROS-180). La identidad la asegura el
proveedor (Auth0): no hay contraseñas propias (FR-001) y el usuario se reconoce por
auth0_sub, nunca por el correo.
"""

import uuid
from typing import Any

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.db import models
from django.db.models.functions import Lower


class UserManager(BaseUserManager["User"]):
    """Sin create_superuser: no hay consola administrativa en el MVP (DP-024, opción A)."""

    def create_user(self, auth0_sub: str, email: str, full_name: str, **extra: Any) -> "User":
        user = self.model(auth0_sub=auth0_sub, email=email, full_name=full_name, **extra)
        user.set_unusable_password()
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    auth0_sub = models.CharField(max_length=255, unique=True)
    email = models.CharField(max_length=254)
    full_name = models.CharField(max_length=200)
    # Nulo (no cadena vacía) = sin avatar, como fija el diccionario de datos.
    avatar_url = models.CharField(max_length=500, null=True, blank=True)  # noqa: DJ001
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    onboarding_completed_at = models.DateTimeField(null=True, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # La fecha propia es last_login_at (se actualiza como máximo una vez por hora).
    last_login = None  # type: ignore[assignment]

    USERNAME_FIELD = "auth0_sub"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = ["email", "full_name"]

    objects = UserManager()

    class Meta:
        db_table = "accounts_user"
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(Lower("email"), name="accounts_user_email_ci_unique"),
            models.CheckConstraint(
                condition=~models.Q(auth0_sub="") & ~models.Q(email=""),
                name="accounts_user_identity_not_empty",
            ),
        ]

    def __str__(self) -> str:
        return str(self.id)
