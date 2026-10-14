"""Fábricas de accounts con datos sintéticos (RNF-38): dominio example.test, nunca datos reales."""

import factory


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "accounts.User"

    auth0_sub = factory.Sequence(lambda n: f"google-oauth2|{100000 + n}")
    email = factory.Sequence(lambda n: f"persona{n}@example.test")
    full_name = factory.Sequence(lambda n: f"Persona {n}")
    avatar_url = None

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        return model_class.objects.create_user(*args, **kwargs)
