from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = "apps.accounts"
    label = "accounts"
    verbose_name = "Cuentas"

    def ready(self) -> None:
        from . import schema  # noqa: F401  registra la extensión de drf-spectacular
