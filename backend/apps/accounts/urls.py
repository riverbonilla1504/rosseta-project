from django.urls import path

from .views import CompleteOnboardingView, MeView

urlpatterns = [
    path("me", MeView.as_view(), name="me"),
    path("me/onboarding/complete", CompleteOnboardingView.as_view(), name="me-onboarding-complete"),
]
