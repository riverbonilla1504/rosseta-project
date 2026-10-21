"""Rechazos de acceso de accounts con código propio (contracts/auth-flow.md §5, 05-api §4).

Los códigos account_disabled, email_missing y email_not_verified son PROVISIONALES hasta
DP-025. El manejador de errores respeta error_code en lugar del mapeo por estado HTTP.
"""

from rest_framework import exceptions

from . import messages


class AccountDisabled(exceptions.APIException):
    status_code = 403
    error_code = "account_disabled"  # PROVISIONAL (DP-025)
    default_detail = messages.ACCOUNT_DISABLED


class AccountExistsOtherProvider(exceptions.APIException):
    status_code = 403
    error_code = "account_exists_other_provider"
    default_detail = messages.ACCOUNT_EXISTS_OTHER_PROVIDER


class EmailMissing(exceptions.APIException):
    status_code = 403
    error_code = "email_missing"  # PROVISIONAL (DP-025)
    default_detail = messages.EMAIL_MISSING


class EmailNotVerified(exceptions.APIException):
    status_code = 403
    error_code = "email_not_verified"  # PROVISIONAL (DP-025)
    default_detail = messages.EMAIL_NOT_VERIFIED
