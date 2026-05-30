import requests
import json
import random

# CONFIGURAÇÕES
# IMPORTANTE: Substitua pelo seu Token gerado no passo anterior
TOKEN = "618a1ecc975393339a8f8c1a35c779cc142e7654" 
URL = "http://127.0.0.1:8000/api/integracoes/sync/atendimentos/"

def simular_envio():
    print("🚀 Iniciando simulação de sincronização...")
    
    # Gerando 5 atendimentos fictícios para o Upsert
    # Nota: id_tempo, id_unidade e id_paciente devem existir no banco (IDs 1-5 geralmente existem após o seed)
    dados = []
    for i in range(5):
        dados.append({
            "id_atendimento": random.randint(1000, 9999), # Simula um ID novo ou existente
            "id_tempo": random.randint(1, 10),
            "id_unidade": random.randint(1, 3),
            "id_paciente": random.randint(1, 10),
            "tempo_permanencia_dias": random.randint(1, 15),
            "status_alta": random.choice(["Alta Médica", "Transferência"]),
            "reinternacao_30d": random.choice([True, False])
        })

    headers = {
        "Authorization": f"Token {TOKEN}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(URL, headers=headers, data=json.dumps(dados))
        if response.status_code == 200:
            print(f"✅ Sucesso! Resposta do Servidor: {response.json()['mensagem']}")
        else:
            print(f"❌ Erro {response.status_code}: {response.text}")
    except Exception as e:
        print(f"💥 Erro na conexão: {e}")

if __name__ == "__main__":
    simular_envio()
