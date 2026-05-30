from django.urls import path
from .views import GenericIntegrationView, StatusIntegracaoView

urlpatterns = [
    path('sync/<str:model_name>/', GenericIntegrationView.as_view(), name='generic_sync'),
    path('status/', StatusIntegracaoView.as_view(), name='status_integracao'),
]
