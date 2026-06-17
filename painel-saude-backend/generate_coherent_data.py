import csv
import os
import random
from datetime import datetime, timedelta

# Configurações de diretório de saída
ROOT_DIR = r"c:\Users\marcotulio\OneDrive\MBACD\Projeto\arquivos_importacao"
DIM_DIR = os.path.join(ROOT_DIR, "01_dimensoes")
FACT_DIR = os.path.join(ROOT_DIR, "02_fatos_por_mes")

os.makedirs(DIM_DIR, exist_ok=True)
os.makedirs(FACT_DIR, exist_ok=True)

DELIMITER = ';'

# Período: Julho/2025 a Abril/2026
START_DATE = datetime(2025, 7, 1)
END_DATE = datetime(2026, 4, 30)

# Gerador auxiliar de CSV
def write_csv(path, fields, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fields, delimiter=DELIMITER)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Gerado: {os.path.basename(path)} - {len(rows)} registros")

# --- GERAR DIMENSÕES ---

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
write_csv(os.path.join(DIM_DIR, 'dim_tempo.csv'), ['id_tempo', 'data_registro', 'mes', 'ano'], tempo_rows)

# 2. DimUnidade
unidades = [
    {'id_unidade': 1, 'nome_unidade': 'Hospital Central - UTI', 'tipo_leito': 'UTI', 'capacidade_maxima': 50},
    {'id_unidade': 2, 'nome_unidade': 'Hospital Central - Pediátrico', 'tipo_leito': 'UTI Pediátrica', 'capacidade_maxima': 20},
    {'id_unidade': 3, 'nome_unidade': 'Hospital Norte - Enfermaria', 'tipo_leito': 'Enfermaria', 'capacidade_maxima': 120},
    {'id_unidade': 4, 'nome_unidade': 'PA Sul - Emergência', 'tipo_leito': 'Observação', 'capacidade_maxima': 40},
    {'id_unidade': 5, 'nome_unidade': 'Ala Leste - Recuperação', 'tipo_leito': 'Recuperação', 'capacidade_maxima': 30},
]
write_csv(os.path.join(DIM_DIR, 'dim_unidade.csv'), ['id_unidade', 'nome_unidade', 'tipo_leito', 'capacidade_maxima'], unidades)

# 3. DimPaciente
# NPS: Detratores (0-6), Passivos (7-8), Promotores (9-10)
random.seed(42)  # Semente fixa para reprodutibilidade
pacientes = []
for i in range(1, 301):
    pacientes.append({
        'id_paciente': 1000 + i,
        'pontuacao_nps': random.choice([9, 10, 10, 8, 7, 9, 10, 5, 6, 9]),
        'faixa_etaria': random.choice(['0-18', '19-40', '41-60', '60+'])
    })
write_csv(os.path.join(DIM_DIR, 'dim_paciente.csv'), ['id_paciente', 'pontuacao_nps', 'faixa_etaria'], pacientes)

# 4. DimMedicamento
medicamentos = [
    {'id_medicamento': 1, 'nome_farmaco': 'Dipirona Sódica 500mg', 'classe_terapeutica': 'Analgésico', 'custo_unitario': 1.50, 'item_essencial': True},
    {'id_medicamento': 2, 'nome_farmaco': 'Amoxicilina + Clavulanato 1g', 'classe_terapeutica': 'Antibiótico', 'custo_unitario': 12.80, 'item_essencial': True},
    {'id_medicamento': 3, 'nome_farmaco': 'Propofol 10mg/mL', 'classe_terapeutica': 'Anestésico', 'custo_unitario': 45.00, 'item_essencial': False},
    {'id_medicamento': 4, 'nome_farmaco': 'Heparina Sódica 5000UI', 'classe_terapeutica': 'Anticoagulante', 'custo_unitario': 18.50, 'item_essencial': True},
    {'id_medicamento': 5, 'nome_farmaco': 'Omeprazol 40mg EV', 'classe_terapeutica': 'Antiácido', 'custo_unitario': 4.20, 'item_essencial': True},
    {'id_medicamento': 6, 'nome_farmaco': 'Morfina 10mg/mL', 'classe_terapeutica': 'Analgésico Opioide', 'custo_unitario': 8.90, 'item_essencial': False},
]
write_csv(os.path.join(DIM_DIR, 'dim_medicamento.csv'), ['id_medicamento', 'nome_farmaco', 'classe_terapeutica', 'custo_unitario', 'item_essencial'], medicamentos)

# 5. DimTipoProcedimento
procedimentos_tipos = [
    {'id_tipo_procedimento': 1, 'nome_procedimento': 'Consulta Médica de Emergência', 'especialidade': 'Clínica Geral', 'valor_base': 180.0},
    {'id_tipo_procedimento': 2, 'nome_procedimento': 'Cirurgia Cardíaca de Revascularização', 'especialidade': 'Cardiologia', 'valor_base': 12500.0},
    {'id_tipo_procedimento': 3, 'nome_procedimento': 'Angioplastia Coronária', 'especialidade': 'Cardiologia', 'valor_base': 6800.0},
    {'id_tipo_procedimento': 4, 'nome_procedimento': 'Raio-X de Tórax (Digital)', 'especialidade': 'Radiologia', 'valor_base': 95.0},
    {'id_tipo_procedimento': 5, 'nome_procedimento': 'Ressonância Magnética de Crânio', 'especialidade': 'Radiologia', 'valor_base': 850.0},
    {'id_tipo_procedimento': 6, 'nome_procedimento': 'Apendicectomia Videolaparoscópica', 'especialidade': 'Cirurgia Geral', 'valor_base': 4200.0},
]
write_csv(os.path.join(DIM_DIR, 'dim_tipo_procedimento.csv'), ['id_tipo_procedimento', 'nome_procedimento', 'especialidade', 'valor_base'], procedimentos_tipos)

# 6. DimEquipamento
equipamentos = [
    {'id_equipamento': 1, 'nome_maquina': 'Monitor de Sinais Vitais Multi', 'modelo': 'Philips Gold', 'ultima_manutencao': '2025-05-12 10:00:00'},
    {'id_equipamento': 2, 'nome_maquina': 'Bomba de Infusão Contínua', 'modelo': 'Braun Space', 'ultima_manutencao': '2025-06-20 09:30:00'},
    {'id_equipamento': 3, 'nome_maquina': 'Aparelho de Ressonância Magnética 3T', 'modelo': 'Siemens Magnetom', 'ultima_manutencao': '2025-04-18 14:00:00'},
    {'id_equipamento': 4, 'nome_maquina': 'Tomógrafo Computadorizado 64 Canais', 'modelo': 'GE Optima', 'ultima_manutencao': '2025-03-25 15:45:00'},
]
write_csv(os.path.join(DIM_DIR, 'dim_equipamento.csv'), ['id_equipamento', 'nome_maquina', 'modelo', 'ultima_manutencao'], equipamentos)

# 7. DimProtocolo
protocolos = [
    {'id_protocolo': 1, 'nome_protocolo': 'Protocolo de Sepse (Diretrizes Clínicas)', 'area_medica': 'Infectologia'},
    {'id_protocolo': 2, 'nome_protocolo': 'Protocolo de IAM (Infarto Agudo do Miocárdio)', 'area_medica': 'Cardiologia'},
    {'id_protocolo': 3, 'nome_protocolo': 'Protocolo de AVC (Acidente Vascular Cerebral)', 'area_medica': 'Neurologia'},
    {'id_protocolo': 4, 'nome_protocolo': 'Protocolo de Prevenção de Quedas', 'area_medica': 'Enfermagem Geral'},
]
write_csv(os.path.join(DIM_DIR, 'dim_protocolo.csv'), ['id_protocolo', 'nome_protocolo', 'area_medica'], protocolos)

# 8. DimMedico
medicos = [
    {'id_medico': 1, 'nome_medico': 'Dr. Marcos Silva', 'especialidade': 'Cardiologia', 'crm': '12345-SP'},
    {'id_medico': 2, 'nome_medico': 'Dra. Ana Santos', 'especialidade': 'Pediatria', 'crm': '45678-RJ'},
    {'id_medico': 3, 'nome_medico': 'Dr. Roberto Oliveira', 'especialidade': 'Ortopedia', 'crm': '78901-MG'},
    {'id_medico': 4, 'nome_medico': 'Dra. Clara Souza', 'especialidade': 'Neurologia', 'crm': '23456-SP'},
    {'id_medico': 5, 'nome_medico': 'Dr. Fernando Lima', 'especialidade': 'Infectologia', 'crm': '34567-RJ'},
]
write_csv(os.path.join(DIM_DIR, 'dim_medico.csv'), ['id_medico', 'nome_medico', 'especialidade', 'crm'], medicos)

# 9. DimConvenio
convenios = [
    {'id_convenio': 1, 'nome_operadora': 'Saúde Total Nacional', 'tipo_contrato': 'Premium', 'prazo_contratual_pagamento': 30},
    {'id_convenio': 2, 'nome_operadora': 'Vida Plena Hospitalar', 'tipo_contrato': 'Básico', 'prazo_contratual_pagamento': 45},
    {'id_convenio': 3, 'nome_operadora': 'SUS - Sistema Único de Saúde', 'tipo_contrato': 'Público', 'prazo_contratual_pagamento': 60},
]
write_csv(os.path.join(DIM_DIR, 'dim_convenio.csv'), ['id_convenio', 'nome_operadora', 'tipo_contrato', 'prazo_contratual_pagamento'], convenios)


# --- GERAR FATOS ---
# Para garantir integridade, primeiro geraremos uma lista estruturada de fatos na memória.
# Depois, agruparemos os registros por ano/mês de competência e gravaremos na pasta correspondente.

atendimentos = []
estoque = []
erros = []
procedimentos = []
infra = []
higienizacao = []
desempenho = []
escala = []
financeiro = []

# Variáveis de controle de coerência
paciente_historico = {}  # id_paciente -> list of (data_registro, data_alta, status_alta)
id_atendimento_counter = 20000
id_movimentacao_counter = 30000
id_evento_counter = 40000
id_procedimento_counter = 50000
id_registro_infra_counter = 60000
id_higienizacao_counter = 70000
id_registro_desempenho_counter = 80000
id_escala_counter = 90000
id_transacao_counter = 100000

# Saldo de estoque inicial por medicamento e unidade
saldos_estoque = {}
for m in medicamentos:
    for u in unidades:
        saldos_estoque[(m['id_medicamento'], u['id_unidade'])] = 1000

# Iterar sobre cada dia
for idx_tempo, t in enumerate(tempo_rows):
    data_atual = datetime.strptime(t['data_registro'], '%Y-%m-%d')
    id_tempo = t['id_tempo']
    
    # 1. ESCALA MEDICA (Diária)
    # Cada médico tem uma escala todo dia
    for med in medicos:
        status = random.choice(['Presente', 'Presente', 'Presente', 'Presente', 'Atraso', 'Falta Justificada'])
        atraso = 0.0
        if status == 'Atraso':
            atraso = round(random.uniform(0.5, 3.5), 1)
        
        escala.append({
            'id_escala': id_escala_counter,
            'id_medico': med['id_medico'],
            'id_tempo': id_tempo,
            'status_presenca': status,
            'horas_atraso': atraso
        })
        id_escala_counter += 1
        
    # 2. INFRAESTRUTURA (Gerado semanalmente, ex: aos domingos)
    if data_atual.weekday() == 6:
        for u in unidades:
            # Consumos médios variando por tamanho/tipo da unidade
            colaboradores = random.randint(20, 60)
            if 'Enfermaria' in u['nome_unidade']:
                colaboradores = random.randint(60, 110)
            
            infra.append({
                'id_registro': id_registro_infra_counter,
                'id_unidade': u['id_unidade'],
                'id_tempo': id_tempo,
                'consumo_agua_m3': random.randint(30, 150),
                'consumo_energia_kwh': random.randint(800, 4000),
                'total_colaboradores_ativos': colaboradores,
                'eventos_infeccao': random.choice([0, 0, 0, 0, 1, 0, 0, 2, 0])
            })
            id_registro_infra_counter += 1

    # 3. ATENDIMENTOS (Vários por dia)
    # Quantidade de atendimentos varia por dia
    num_atendimentos_hoje = random.randint(1, 3)
    for _ in range(num_atendimentos_hoje):
        # Selecionar paciente
        p = random.choice(pacientes)
        id_paciente = p['id_paciente']
        
        # Validar histórico clínico (Se o paciente já morreu, ele não pode ser atendido novamente!)
        paciente_morto = False
        historico_anterior = paciente_historico.get(id_paciente, [])
        for hist in historico_anterior:
            if hist['status_alta'] == 'Óbito':
                paciente_morto = True
                break
        
        if paciente_morto:
            # Ignora e pega outro paciente que esteja vivo
            pacientes_vivos = [pac for pac in pacientes if not any(h['status_alta'] == 'Óbito' for h in paciente_historico.get(pac['id_paciente'], []))]
            if not pacientes_vivos:
                continue
            p = random.choice(pacientes_vivos)
            id_paciente = p['id_paciente']
            historico_anterior = paciente_historico.get(id_paciente, [])
            
        # Determinar reinternação de 30 dias
        reinternado = False
        if historico_anterior:
            # Achar o último atendimento registrado para este paciente
            ultimo_atendimento = historico_anterior[-1]
            diff_dias = (data_atual - ultimo_atendimento['data_registro']).days
            # Se a última alta/atendimento foi há menos de 30 dias, e a última alta NÃO foi óbito
            if diff_dias <= 30:
                reinternado = True
                
        # Detalhes do atendimento
        tempo_permanencia = random.randint(1, 12)
        # Decisão de status_alta coerente
        status_alta = random.choice(['Alta Médica', 'Alta Médica', 'Alta Médica', 'Transferência', 'Óbito'])
        
        atendimentos.append({
            'id_atendimento': id_atendimento_counter,
            'id_tempo': id_tempo,
            'id_unidade': random.choice(unidades)['id_unidade'],
            'id_paciente': id_paciente,
            'tempo_permanencia_dias': tempo_permanencia,
            'status_alta': status_alta,
            'reinternacao_30d': reinternado
        })
        
        # Guardar histórico do paciente
        if id_paciente not in paciente_historico:
            paciente_historico[id_paciente] = []
        paciente_historico[id_paciente].append({
            'data_registro': data_atual,
            'status_alta': status_alta
        })
        
        # 4. HIGIENIZACAO (Associado ao atendimento)
        # O leito é liberado algum tempo após a saída do paciente
        data_saida_paciente = data_atual + timedelta(days=tempo_permanencia)
        hora_saida_paciente = data_saida_paciente.replace(hour=random.randint(8, 18), minute=random.randint(0, 59))
        liberacao_minutos = random.randint(30, 150) # Coerência: leito liberado 30min a 2h30 depois
        hora_liberacao_leito = hora_saida_paciente + timedelta(minutes=liberacao_minutos)
        
        higienizacao.append({
            'id_higienizacao': id_higienizacao_counter,
            'id_unidade': atendimentos[-1]['id_unidade'],
            'id_tempo': id_tempo, # Mantemos o vínculo ao tempo do atendimento
            'data_hora_saida_paciente': hora_saida_paciente.strftime('%Y-%m-%d %H:%M:%S'),
            'data_hora_liberacao_leito': hora_liberacao_leito.strftime('%Y-%m-%d %H:%M:%S')
        })
        id_higienizacao_counter += 1
        
        # 5. DESEMPENHO CLINICO (Aderência a protocolos do médico)
        desempenho.append({
            'id_registro': id_registro_desempenho_counter,
            'id_medico': random.choice(medicos)['id_medico'],
            'id_tempo': id_tempo,
            'id_protocolo': random.choice(protocolos)['id_protocolo'],
            'aderente_ao_protocolo': random.choice([True, True, True, True, False]), # 80% aderência
            'tempo_fechamento_prontuario_min': round(random.uniform(5.0, 90.0), 1)
        })
        id_registro_desempenho_counter += 1
        
        # 6. FINANCEIRO (Faturamento da internação/atendimento)
        conv = random.choice(convenios)
        # Valor base de acordo com a gravidade / dias de permanência
        receita = round(float(conv['id_convenio'] * 350.0) + (tempo_permanencia * random.uniform(800.0, 1800.0)), 2)
        
        # Regras de Glosa
        # Algumas contas são glosadas pelas operadoras
        inicialmente_glosado = 0.0
        recuperado_glosa = 0.0
        if random.random() < 0.15: # 15% de chance de ter glosa
            inicialmente_glosado = round(receita * random.uniform(0.05, 0.25), 2)
            # Desses, recupera uma parte
            recuperado_glosa = round(inicialmente_glosado * random.uniform(0.3, 0.8), 2)
            
        custo_op = round(receita * random.uniform(0.4, 0.6), 2)
        
        # Datas de pagamento
        data_prevista = data_saida_paciente + timedelta(days=conv['prazo_contratual_pagamento'])
        # 90% das vezes paga, algumas vezes atrasa ou paga um pouco antes
        pago = random.random() < 0.95
        data_real_str = ""
        if pago:
            data_real = data_prevista + timedelta(days=random.randint(-3, 15))
            data_real_str = data_real.strftime('%Y-%m-%d')
            
        financeiro.append({
            'id_transacao': id_transacao_counter,
            'id_tempo': id_tempo,
            'id_unidade': atendimentos[-1]['id_unidade'],
            'id_convenio': conv['id_convenio'],
            'receita_bruta': receita,
            'valor_glosa_inicial': inicialmente_glosado,
            'valor_glosa_recuperada': recuperado_glosa,
            'custos_operacionais': custo_op,
            'data_pagamento_prevista': data_prevista.strftime('%Y-%m-%d'),
            'data_pagamento_real': data_real_str
        })
        id_transacao_counter += 1
        
        # 7. ERROS DE MEDICAO (Raridade, apenas 1% de chance)
        if random.random() < 0.02:
            med_erro = random.choice(medicamentos)
            erros.append({
                'id_evento': id_evento_counter,
                'id_medicamento': med_erro['id_medicamento'],
                'id_paciente': id_paciente,
                'id_tempo': id_tempo,
                'tipo_erro': random.choice(['Dose Duplicada', 'Horário Incorreto', 'Omissão de Dose']),
                'severidade': random.choice(['Baixa', 'Média', 'Média', 'Alta'])
            })
            id_evento_counter += 1
            
        # 8. PROCEDIMENTOS (Exames ou Cirurgias agendadas durantes internações)
        # 60% dos atendimentos têm algum procedimento
        if random.random() < 0.6:
            proc_tipo = random.choice(procedimentos_tipos)
            equip = random.choice(equipamentos) if proc_tipo['id_tipo_procedimento'] in [4, 5] else ""
            id_equip = equip['id_equipamento'] if equip else ""
            
            procedimentos.append({
                'id_procedimento_instancia': id_procedimento_counter,
                'id_tipo_procedimento': proc_tipo['id_tipo_procedimento'],
                'id_unidade': atendimentos[-1]['id_unidade'],
                'id_tempo': id_tempo,
                'id_equipamento': id_equip,
                'tempo_preparo_minutos': random.randint(10, 45),
                'tempo_execucao_minutos': random.randint(15, 180),
                'tempo_limpeza_minutos': random.randint(15, 60),
                'status_agendamento': random.choice(['Realizado', 'Realizado', 'Realizado', 'Cancelado'])
            })
            id_procedimento_counter += 1
            
        id_atendimento_counter += 1

    # 9. ESTOQUE (Movimentações diárias de farmácia)
    # Consumo diário de medicamentos
    for m in medicamentos:
        for u in unidades:
            saida = random.randint(2, 25)
            # Retirar estoque
            key = (m['id_medicamento'], u['id_unidade'])
            saldos_estoque[key] = max(0, saldos_estoque[key] - saida)
            
            # Se estoque ficar baixo, simula reabastecimento (compras)
            if saldos_estoque[key] < 100:
                saldos_estoque[key] += 1000 # Entrada de compra
                
            estoque.append({
                'id_movimentacao': id_movimentacao_counter,
                'id_medicamento': m['id_medicamento'],
                'id_tempo': id_tempo,
                'id_unidade': u['id_unidade'],
                'quantidade_saida': saida,
                'saldo_atual': saldos_estoque[key]
            })
            id_movimentacao_counter += 1


# --- AGRUPAR E GRAVAR OS ARQUIVOS FATOS POR COMPETÊNCIA ---

# Dicionário mapeando (ano_mes) -> lista de registros para cada tabela fato
fatos_agrupados = {}

# Lista de todas as fatos
fatos_info = [
    ('fato_atendimentos', atendimentos, ['id_atendimento', 'id_tempo', 'id_unidade', 'id_paciente', 'tempo_permanencia_dias', 'status_alta', 'reinternacao_30d']),
    ('fato_estoque', estoque, ['id_movimentacao', 'id_medicamento', 'id_tempo', 'id_unidade', 'quantidade_saida', 'saldo_atual']),
    ('fato_erros_medicao', erros, ['id_evento', 'id_medicamento', 'id_paciente', 'id_tempo', 'tipo_erro', 'severidade']),
    ('fato_procedimentos', procedimentos, ['id_procedimento_instancia', 'id_tipo_procedimento', 'id_unidade', 'id_tempo', 'id_equipamento', 'tempo_preparo_minutos', 'tempo_execucao_minutos', 'tempo_limpeza_minutos', 'status_agendamento']),
    ('fato_infraestrutura', infra, ['id_registro', 'id_unidade', 'id_tempo', 'consumo_agua_m3', 'consumo_energia_kwh', 'total_colaboradores_ativos', 'eventos_infeccao']),
    ('fato_higienizacao', higienizacao, ['id_higienizacao', 'id_unidade', 'id_tempo', 'data_hora_saida_paciente', 'data_hora_liberacao_leito']),
    ('fato_desempenho_clinico', desempenho, ['id_registro', 'id_medico', 'id_tempo', 'id_protocolo', 'aderente_ao_protocolo', 'tempo_fechamento_prontuario_min']),
    ('fato_escala_medica', escala, ['id_escala', 'id_medico', 'id_tempo', 'status_presenca', 'horas_atraso']),
    ('fato_financeiro', financeiro, ['id_transacao', 'id_tempo', 'id_unidade', 'id_convenio', 'receita_bruta', 'valor_glosa_inicial', 'valor_glosa_recuperada', 'custos_operacionais', 'data_pagamento_prevista', 'data_pagamento_real'])
]

# Inicializar os buffers
competencias = []
curr = START_DATE
while curr <= END_DATE:
    comp_str = curr.strftime('%Y_%m')
    competencias.append(comp_str)
    # Avançar para o próximo mês
    if curr.month == 12:
        curr = datetime(curr.year + 1, 1, 1)
    else:
        curr = datetime(curr.year, curr.month + 1, 1)

# Agrupar registros por ano_mes e salvar
for comp in competencias:
    ano_comp = int(comp.split('_')[0])
    mes_comp = int(comp.split('_')[1])
    
    comp_dir = os.path.join(FACT_DIR, comp)
    os.makedirs(comp_dir, exist_ok=True)
    
    print(f"\nEscrevendo competência: {comp}")
    
    for nome_fato, registros, campos in fatos_info:
        # Filtrar registros que correspondem a essa competência temporal
        # O id_tempo tem o formato YYYYMMDD, logo:
        # YYYYMMDD // 100 == YYYYMM
        target_yyyymm = ano_comp * 100 + mes_comp
        registros_filtrados = [r for r in registros if r['id_tempo'] // 100 == target_yyyymm]
        
        file_path = os.path.join(comp_dir, f"{nome_fato}.csv")
        write_csv(file_path, campos, registros_filtrados)

print("\n--- GERAÇÃO CONCLUÍDA COM SUCESSO ---")
print(f"Arquivos gerados em: {ROOT_DIR}")
