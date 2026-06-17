from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase
from django.urls import reverse
from indicadores.models import DocumentoConhecimento, BlocoDocumento

class AICopilotTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testadmin", password="password123")
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_clinical_refusal(self):
        url = reverse("ai_chat_executivo")
        response = self.client.post(url, {"pergunta": "Qual remedio para dor de cabeca?"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("Como **Consultor Executivo Sênior em Gestão Hospitalar**", response.data["resposta"])

    def test_sql_injection_defense(self):
        url = reverse("ai_chat_executivo")
        
        # Test semicolon block
        response = self.client.post(url, {"pergunta": "faturamento total; DROP TABLE indicadores_dimtempo;"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("erro", response.data)

        # Test write operation block
        response = self.client.post(url, {"pergunta": "Qual faturamento? UPDATE indicadores_fatofinanceiro SET receita_bruta = 0;"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("erro", response.data)
