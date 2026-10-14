"""Servicios de accounts (regla B1 de docs/03-arquitectura/03-backend.md).

Implementa FR-004 (ROS-93), FR-005 y FR-017 (ROS-90, ROS-91), FR-006, FR-007, FR-008,
FR-009 y FR-010 (ROS-90), FR-011 (ROS-89) y los eventos de seguridad de FR-033 (ROS-93),
según specs/002-autenticacion-oauth/research.md R-03 y data-model.md.
"""

import logging
from datetime import timedelta
from typing import Any, NoReturn

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from .exceptions import AccountDisabled, AccountExistsOtherProvider, EmailMissing, EmailNotVerified
from .models import User

CLAIMS_NS = "https://rosetta/"
NAME_MAX_LENGTH = 200
AVATAR_MAX_LENGTH = 500
LAST_LOGIN_RESOLUTION = timedelta(hours=1)

security_log = logging.getLogger("rosetta.security")


def log_security_event(
    event: str, reason: str, user_id: Any = None, path: str | None = None
) -> None:
    """Evento de seguridad con campos cerrados y sin datos personales (FR-033)."""
    security_log.warning(
        "security_event",
        extra={
            "event": event,
            "reason": reason,
            "user_id": str(user_id) if user_id else None,
            "path": path,
        },
    )


def _clean_name(value: Any) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    return value.strip()[:NAME_MAX_LENGTH]


def _clean_avatar(value: Any) -> str | None:
    """Un avatar fuera de rango no rechaza el acceso: se guarda como nulo (research R-03)."""
    if not isinstance(value, str) or len(value) > AVATAR_MAX_LENGTH:
        return None
    if not value.startswith(("https://", "http://")):
        return None
    return value


def _reject(exc: Exception, reason: str, path: str | None, user_id: Any = None) -> NoReturn:
    log_security_event("access_denied", reason, user_id=user_id, path=path)
    raise exc


def get_or_create_from_claims(claims: dict[str, Any], path: str | None = None) -> User:
    """Devuelve el usuario local de la credencial, creándolo en el primer acceso.

    Orden de comprobaciones: correo verificado (FR-004) → reconocer por auth0_sub (FR-006)
    → desactivada (FR-011) o actualizar (FR-007, FR-010); si no existe: correo presente,
    correo libre (FR-009), nombre presente (DP-023, falla cerrado) y alta (FR-005, FR-017).
    """
    if claims.get(f"{CLAIMS_NS}email_verified") is not True:
        _reject(EmailNotVerified(), "email_not_verified", path)

    sub = claims["sub"]
    email = claims.get(f"{CLAIMS_NS}email")
    name = _clean_name(claims.get(f"{CLAIMS_NS}name"))
    avatar = _clean_avatar(claims.get(f"{CLAIMS_NS}picture"))

    try:
        user = User.objects.get(auth0_sub=sub)
    except User.DoesNotExist:
        user = _create(sub, email, name, avatar, path)
    else:
        if not user.is_active:
            _reject(AccountDisabled(), "account_disabled", path, user_id=user.id)
        _update(user, email, name, avatar, path)
    return user


def _create(sub: str, email: Any, name: str | None, avatar: str | None, path: str | None) -> User:
    if not isinstance(email, str) or not email.strip():
        _reject(EmailMissing(), "email_missing", path)
    if User.objects.filter(email__iexact=email).exclude(auth0_sub=sub).exists():
        _reject(AccountExistsOtherProvider(), "account_exists_other_provider", path)
    if name is None:
        # DP-023 sigue abierta: sin nombre no se crea la cuenta (comportamiento mínimo y
        # seguro, no una decisión; T037 lo sustituye cuando se decida).
        _reject(PermissionDenied(), "name_missing", path)

    try:
        with transaction.atomic():
            return User.objects.create_user(
                auth0_sub=sub,
                email=email,
                full_name=name,
                avatar_url=avatar,
                last_login_at=timezone.now(),
            )
    except IntegrityError:
        # Acceso simultáneo de la misma identidad: la otra petición ya creó la fila (FR-005).
        return User.objects.get(auth0_sub=sub)


def _update(user: User, email: Any, name: str | None, avatar: str | None, path: str | None) -> None:
    changed: list[str] = []
    if name is not None and name != user.full_name:
        user.full_name = name
        changed.append("full_name")
    if avatar != user.avatar_url:
        user.avatar_url = avatar
        changed.append("avatar_url")
    if isinstance(email, str) and email and email != user.email:
        if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            # FR-010: se deja entrar y se conserva el correo anterior.
            log_security_event("email_conflict", "email_taken", user_id=user.id, path=path)
        else:
            user.email = email
            changed.append("email")
    now = timezone.now()
    if user.last_login_at is None or now - user.last_login_at >= LAST_LOGIN_RESOLUTION:
        user.last_login_at = now
        changed.append("last_login_at")
    if changed:
        user.save(update_fields=[*changed, "updated_at"])


def complete_onboarding(user: User) -> User:
    """Marca el onboarding como completado una sola vez (FR-017, FR-021; ROS-91).

    Idempotente: solo escribe la fecha si es nula. No comprueba que exista un proyecto para no
    hacer depender accounts de projects (research R-09); la interfaz lo llama tras crearlo.
    """
    if user.onboarding_completed_at is None:
        user.onboarding_completed_at = timezone.now()
        user.save(update_fields=["onboarding_completed_at", "updated_at"])
    return user
