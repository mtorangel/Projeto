import csv
import os
import random
from datetime import datetime, timedelta

# Configurações
BASE_DIR = 'carga_dados'
os.makedirs(BASE_DIR, exist_ok=True)
DELIMITER = ';'

# Período: Julho/2025 a Abril/2026
START_DATE = datetime(2025, 7, 1)
END_DATE = datetime(2026, 4, 30)

def generate_csv(filename, fields, rows):
    path = os.path.join(BASE_DIR, filename)
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fields, delimiter=DELIMITER)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Gerado: {filename} ({len(rows)} linhas)")

# --- DIMENSÕES ---

# 1. DimTempo
tempo_rows = []
curr = START_DATE
while curr <= END_DATE:
    tempo_rows.append({
        'id_tempo': int(curr.strftime('%Y%m%d')),
        'data_registro': curr.strftime('%Y-%m-%d'),
        'mes': curr.month,
        'ano': curr.year
    })
    curr += timedelta(days=1)
generate_csv('01_dim_tempo.csv', ['id_tempo', 'data_registro', 'mes', 'ano'], tempo_rows)

# 2. DimUnidade
unidades = [
    {'id_unidade': 1, 'nome_unidade': 'Hospital Central', 'tipo_leito': 'UTI', 'capacidade_maxima': 50},
    {'id_unidade': 2, 'nome_unidade': 'Hospital Norte', 'tipo_leito': 'Enfermaria', 'capacidade_maxima': 100},
    {'id_unidade': 3, 'nome_unidade': 'PA Sul', 'tipo_leito': 'Emergência', 'capacidade_maxima': 30},
]
generate_csv('02_dim_unidade.csv', ['id_unidade', 'nome_unidade', 'tipo_leito', 'capacidade_maxima'], unidades)

# 3. DimPaciente
pacientes = [{'id_paciente': 1000 + i, 'pontuacao_nps': random.randint(6, 10), 'faixa_etaria': random.choice(['0-18', '19-40', '41-60', '60+'])} for i in range(1, 101)]
generate_csv('03_dim_paciente.csv', ['id_paciente', 'pontuacao_nps', 'faixa_etaria'], pacientes)

# 4. DimMedico
medicos = [
    {'id_medico': 1, 'nome_medico': 'Dr. Silva', 'especialidade': 'Cardiologia', 'crm': '123-SP'},
    {'id_medico': 2, 'nome_medico': 'Dra. Santos', 'especialidade': 'Pediatria', 'crm': '456-RJ'},
    {'id_medico': 3, 'nome_medico': 'Dr. Oliveira', 'especialidade': 'Ortopedia', 'crm': '789-MG'},
]
generate_csv('04_dim_medico.csv', ['id_medico', 'nome_medico', 'especialidade', 'crm'], medicos)

# 5. DimConvenio
convenios = [
    {'id_convenio': 1, 'nome_operadora': 'Saúde Total', 'tipo_contrato': 'Premium', 'prazo_contratual_pagamento': 30},
    {'id_convenio': 2, 'nome_operadora': 'Vida Plena', 'tipo_contrato': 'Básico', 'prazo_contratual_pagamento': 45},
]
generate_csv('05_dim_convenio.csv', ['id_convenio', 'nome_operadora', 'tipo_contrato', 'prazo_contratual_pagamento'], convenios)

# 6. DimMedicamento
medicamentos = [
    {'id_medicamento': 1, 'nome_farmaco': 'Dipirona', 'classe_terapeutica': 'Analgésico', 'custo_unitario': 5.50, 'item_essencial': True},
    {'id_medicamento': 2, 'nome_farmaco': 'Amoxicilina', 'classe_terapeutica': 'Antibiótico', 'custo_unitario': 25.00, 'item_essencial': True},
    {'id_medicamento': 3, 'nome_farmaco': 'Propofol', 'classe_terapeutica': 'Anestésico', 'custo_unitario': 120.0, 'item_essencial': False},
]
generate_csv('06_dim_medicamento.csv', ['id_medicamento', 'nome_farmaco', 'classe_terapeutica', 'custo_unitario', 'item_essencial'], medicamentos)

# 7. DimTipoProcedimento
procedimentos_tipos = [
    {'id_tipo_procedimento': 1, 'nome_procedimento': 'Consulta Emergência', 'especialidade': 'Clínica Geral', 'valor_base': 150.0},
    {'id_tipo_procedimento': 2, 'nome_procedimento': 'Cirurgia Cardíaca', 'especialidade': 'Cardiologia', 'valor_base': 5000.0},
    {'id_tipo_procedimento': 3, 'nome_procedimento': 'Raio-X', 'especialidade': 'Radiologia', 'valor_base': 80.0},
]
generate_csv('07_dim_tipo_procedimento.csv', ['id_tipo_procedimento', 'nome_procedimento', 'especialidade', 'valor_base'], procedimentos_tipos)

# 8. DimEquipamento
equipamentos = [
    {'id_equipamento': 1, 'nome_maquina': 'Monitor Multiparamétrico', 'modelo': 'MX-100', 'ultima_manutencao': '2025-01-10'},
    {'id_equipamento': 2, 'nome_maquina': 'Bomba de Infusão', 'modelo': 'B-500', 'ultima_manutencao': '2025-02-15'},
]
generate_csv('08_dim_equipamento.csv', ['id_equipamento', 'nome_maquina', 'modelo', 'ultima_manutencao'], equipamentos)

# 9. DimProtocolo
protocolos = [
    {'id_protocolo': 1, 'nome_protocolo': 'Protocolo de Sepse', 'area_medica': 'Infectologia'},
    {'id_protocolo': 2, 'nome_protocolo': 'Protocolo de IAM', 'area_medica': 'Cardiologia'},
]
generate_csv('09_dim_protocolo.csv', ['id_protocolo', 'nome_protocolo', 'area_medica'], protocolos)

# --- FATOS ---

# 10. FatoAtendimentos
atendimentos = []
for idx, t in enumerate(tempo_rows[::2]): # Amostragem dia sim, dia não
    atendimentos.append({
        'id_atendimento': 20000 + idx,
        'id_tempo': t['id_tempo'],
        'id_unidade': random.choice(unidades)['id_unidade'],
        'id_paciente': random.choice(pacientes)['id_paciente'],
        'tempo_permanencia_dias': random.randint(1, 10),
        'status_alta': random.choice(['Alta Médica', 'Transferência', 'Óbito']),
        'reinternacao_30d': random.choice([True, False, False, False])
    })
generate_csv('10_fato_atendimentos.csv', ['id_atendimento', 'id_tempo', 'id_unidade', 'id_paciente', 'tempo_permanencia_dias', 'status_alta', 'reinternacao_30d'], atendimentos)

# 11. FatoEstoque
estoque = []
for idx, t in enumerate(tempo_rows[::5]):
    estoque.append({
        'id_movimentacao': 30000 + idx,
        'id_medicamento': random.choice(medicamentos)['id_medicamento'],
        'id_tempo': t['id_tempo'],
        'id_unidade': random.choice(unidades)['id_unidade'],
        'quantidade_saida': random.randint(1, 100),
        'saldo_atual': random.randint(500, 2000)
    })
generate_csv('11_fato_estoque.csv', ['id_movimentacao', 'id_medicamento', 'id_tempo', 'id_unidade', 'quantidade_saida', 'saldo_atual'], estoque)

# 12. FatoErrosMedicao
erros = []
for idx, a in enumerate(atendimentos[::20]): # 5% de chance de erro de medicação nos atendimentos
    erros.append({
        'id_evento': 40000 + idx,
        'id_medicamento': random.choice(medicamentos)['id_medicamento'],
        'id_paciente': a['id_paciente'],
        'id_tempo': a['id_tempo'],
        'tipo_erro': random.choice(['Dose Incorreta', 'Horário Incorreto', 'Medicamento Errado']),
        'severidade': random.choice(['Baixa', 'Média', 'Alta'])
    })
generate_csv('12_fato_erros_medicao.csv', ['id_evento', 'id_medicamento', 'id_paciente', 'id_tempo', 'tipo_erro', 'severidade'], erros)

# 13. FatoProcedimentos
procedimentos = []
for idx, a in enumerate(atendimentos):
    procedimentos.append({
        'id_procedimento_instancia': 50000 + idx,
        'id_tipo_procedimento': random.choice(procedimentos_tipos)['id_tipo_procedimento'],
        'id_unidade': a['id_unidade'],
        'id_tempo': a['id_tempo'],
        'id_equipamento': random.choice(equipamentos)['id_equipamento'],
        'tempo_preparo_minutos': random.randint(10, 30),
        'tempo_execucao_minutos': random.randint(20, 120),
        'tempo_limpeza_minutos': random.randint(15, 45),
        'status_agendamento': 'Realizado'
    })
generate_csv('13_fato_procedimentos.csv', ['id_procedimento_instancia', 'id_tipo_procedimento', 'id_unidade', 'id_tempo', 'id_equipamento', 'tempo_preparo_minutos', 'tempo_execucao_minutos', 'tempo_limpeza_minutos', 'status_agendamento'], procedimentos)

# 14. FatoInfraestrutura
infra = []
for t in tempo_rows[::7]: # Semanalmente
    for u in unidades:
        infra.append({
            'id_registro': 60000 + random.randint(1, 9999),
            'id_unidade': u['id_unidade'],
            'id_tempo': t['id_tempo'],
            'consumo_agua_m3': random.randint(50, 200),
            'consumo_energia_kwh': random.randint(1000, 5000),
            'total_colaboradores_ativos': random.randint(20, 100),
            'eventos_infeccao': random.randint(0, 3)
        })
generate_csv('14_fato_infraestrutura.csv', ['id_registro', 'id_unidade', 'id_tempo', 'consumo_agua_m3', 'consumo_energia_kwh', 'total_colaboradores_ativos', 'eventos_infeccao'], infra)

# 15. FatoHigienizacao
higienizacao = []
for idx, a in enumerate(atendimentos):
    higienizacao.append({
        'id_higienizacao': 70000 + idx,
        'id_unidade': a['id_unidade'],
        'id_tempo': a['id_tempo'],
        'data_hora_saida_paciente': f"{t['data_registro']} 14:00:00",
        'data_hora_liberacao_leito': f"{t['data_registro']} 15:30:00"
    })
generate_csv('15_fato_higienizacao.csv', ['id_higienizacao', 'id_unidade', 'id_tempo', 'data_hora_saida_paciente', 'data_hora_liberacao_leito'], higienizacao)

# 16. FatoDesempenhoClinico
desempenho = []
for idx, a in enumerate(atendimentos):
    desempenho.append({
        'id_registro': 80000 + idx,
        'id_medico': random.randint(1, 3),
        'id_tempo': a['id_tempo'],
        'id_protocolo': random.choice(protocolos)['id_protocolo'],
        'aderente_ao_protocolo': random.choice([True, True, False]),
        'tempo_fechamento_prontuario_min': random.randint(5, 60)
    })
generate_csv('16_fato_desempenho_clinico.csv', ['id_registro', 'id_medico', 'id_tempo', 'id_protocolo', 'aderente_ao_protocolo', 'tempo_fechamento_prontuario_min'], desempenho)

# 17. FatoEscalaMedica
escala = []
for t in tempo_rows[::1]: # Diário
    for m in medicos:
        escala.append({
            'id_escala': 90000 + random.randint(1, 99999),
            'id_medico': m['id_medico'],
            'id_tempo': t['id_tempo'],
            'status_presenca': random.choice(['Presente', 'Presente', 'Falta Justificada']),
            'horas_atraso': random.randint(0, 2)
        })
generate_csv('17_fato_escala_medica.csv', ['id_escala', 'id_medico', 'id_tempo', 'status_presenca', 'horas_atraso'], escala)

# 18. FatoFinanceiro
financeiro = []
for idx, a in enumerate(atendimentos):
    receita = random.randint(500, 10000)
    financeiro.append({
        'id_transacao': 100000 + idx,
        'id_tempo': a['id_tempo'],
        'id_unidade': a['id_unidade'],
        'id_convenio': random.choice(convenios)['id_convenio'],
        'receita_bruta': receita,
        'valor_glosa_inicial': receita * 0.15,
        'valor_glosa_recuperada': receita * 0.05,
        'custos_operacionais': receita * 0.45,
        'data_pagamento_prevista': t['data_registro'],
        'data_pagamento_real': t['data_registro']
    })
generate_csv('18_fato_financeiro.csv', ['id_transacao', 'id_tempo', 'id_unidade', 'id_convenio', 'receita_bruta', 'valor_glosa_inicial', 'valor_glosa_recuperada', 'custos_operacionais', 'data_pagamento_prevista', 'data_pagamento_real'], financeiro)

print("\n--- MEGA ENGINE DE DADOS CONCLUÍDA ---")
print("Todos os 18 arquivos foram gerados na pasta 'carga_dados'.")
print("Siga a ordem numérica para garantir a integridade total!")
