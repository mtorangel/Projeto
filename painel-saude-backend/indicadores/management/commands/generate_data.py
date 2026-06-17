"""
generate_data.py — Gerador de dados de teste para o BI Hospitalar.

Uso:
    python manage.py generate_data --records=500 --mode=db --clear
    python manage.py generate_data --records=200 --mode=csv --csv-dir=./output/
    python manage.py generate_data --records=300 --mode=both --csv-dir=./output/
    python manage.py generate_data --records=100 --mode=db --dims-only
    python manage.py generate_data --records=100 --mode=db --facts-only

Ordem de geração respeita integridade referencial:
  Dimensões primeiro (sem FKs) → Fatos depois (com FKs)
"""

import os
import csv
import random
import string
from datetime import datetime, timedelta, date
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction


# ── Dados mestres realistas para o estado de MT ────────────────────────
NOMES_UNIDADES = [
    ("UTI Adulto",              "Crítico",     20),
    ("UTI Pediátrica",          "Crítico",     10),
    ("Pronto Socorro",          "Emergência",  50),
    ("Ala de Internação A",     "Enfermaria", 100),
    ("Ala de Internação B",     "Enfermaria",  80),
    ("Centro Cirúrgico",        "Cirurgia",    10),
    ("Maternidade",             "Obstétrico",  40),
    ("Hospital Regional Sorriso","Enfermaria",  60),
    ("MT-Hemocentro",           "Especializado",30),
    ("CEOPE-MT",                "Especializado",25),
    ("PA Sul",                  "Emergência",  35),
    ("Hospital Norte",          "Enfermaria",  70),
    ("Bloco Cirúrgico",         "Cirurgia",    15),
]

NOMES_MEDICOS = [
    "Ana Lima","Carlos Silva","Beatriz Santos","Diego Costa",
    "Elena Rocha","Fernando Melo","Gabriela Nunes","Henrique Pinto",
    "Isabela Freitas","João Moraes","Karina Dias","Leonardo Faria",
    "Mariana Teixeira","Nelson Borges","Olivia Monteiro","Paulo Ribeiro",
    "Quésia Alves","Rafael Cunha","Sabrina Mendes","Thiago Barbosa",
    "Ursula Castro","Victor Lopes","Wendy Gomes","Xavier Souza",
    "Yasmin Ferreira","Zé Augusto","Amanda Ramos","Bruno Cardoso",
    "Cecília Braga","Danilo Vasconcelos",
]

ESPECIALIDADES = [
    "Clínica Geral","Cardiologia","Ortopedia","Neurologia","Pediatria",
    "Ginecologia","Oncologia","Infectologia","Anestesiologia","Urgência",
]

FARMACOS = [
    ("Dipirona Sódica 500mg",      "Analgésico",      1.20,  True),
    ("Amoxicilina 500mg",          "Antibiótico",     0.85,  True),
    ("Metformina 850mg",           "Antidiabético",   0.45,  True),
    ("Losartana 50mg",             "Anti-hipertensivo",0.30, True),
    ("Insulina NPH 100UI/mL",      "Antidiabético",  38.00,  True),
    ("Omeprazol 20mg",             "Inibidor de bomba",0.90, True),
    ("Sinvastatina 20mg",          "Hipolipemiante",  0.55,  True),
    ("Captopril 25mg",             "Anti-hipertensivo",0.25, True),
    ("Azitromicina 500mg",         "Antibiótico",     2.80,  True),
    ("Cefazolina 1g",              "Antibiótico IV", 12.50,  True),
    ("Vancomicina 500mg",          "Antibiótico IV", 45.00,  False),
    ("Morfina 10mg/mL",            "Opioide",        18.00,  False),
    ("Midazolam 5mg/mL",           "Benzodiazepínico",22.00, False),
    ("Heparina 5000UI/mL",         "Anticoagulante", 15.00,  True),
    ("Propofol 10mg/mL 20mL",      "Anestésico",     35.00,  False),
    ("Ondansetrona 8mg",           "Antiemético",     3.50,  True),
    ("Dexametasona 4mg/mL",        "Corticosteroide",  4.00, True),
    ("Atropina 0,5mg/mL",          "Anticolinérgico",  2.20, True),
    ("Adrenalina 1mg/mL",          "Vasoativo",        8.50, True),
    ("Noradrenalina 2mg/mL",       "Vasoativo",       12.00, True),
    ("Clopidogrel 75mg",           "Antiplaquetário",  0.90, True),
    ("Ácido Fólico 5mg",           "Vitamina",         0.15, True),
    ("Sulfato Ferroso 40mg",       "Antianêmico",      0.20, True),
    ("Paracetamol 500mg",          "Analgésico",       0.30, True),
    ("Ibuprofeno 600mg",           "Anti-inflamatório",0.45, True),
    ("Prednisona 20mg",            "Corticosteroide",  0.60, True),
    ("Lorazepam 2mg",              "Benzodiazepínico",  4.00, False),
    ("Tramadol 50mg",              "Opioide",           2.50, True),
    ("Furosemida 40mg",            "Diurético",         0.35, True),
    ("Espironolactona 25mg",       "Diurético",         0.50, True),
    ("Eritropoetina 4000UI",       "Hematopoético",   95.00,  False),
    ("Albumina 20% 50mL",          "Expansor plasmático",180.00, False),
    ("Imipeném 500mg",             "Antibiótico IV",  65.00,  False),
    ("Meropeném 1g",               "Antibiótico IV",  80.00,  False),
    ("Fenitoína 100mg",            "Anticonvulsivante", 1.80, True),
    ("Carbamazepina 200mg",        "Anticonvulsivante", 0.75, True),
    ("Haloperidol 5mg",            "Antipsicótico",     1.50, True),
    ("Quetiapina 25mg",            "Antipsicótico",     3.20, False),
    ("Varfarina 5mg",              "Anticoagulante",    0.40, True),
    ("Enoxaparina 40mg",           "Anticoagulante",   22.00, True),
]

PROCEDIMENTOS = [
    ("Apendicectomia",             "Cirurgia Geral",     2500.00),
    ("Colecistectomia Laparoscópica","Cirurgia Geral",   3200.00),
    ("Hernioplastia Inguinal",     "Cirurgia Geral",     1800.00),
    ("Cesariana",                  "Obstetrícia",        2800.00),
    ("Artroscopia de Joelho",      "Ortopedia",          4500.00),
    ("Artroplastia de Quadril",    "Ortopedia",          9800.00),
    ("Cateterismo Cardíaco",       "Cardiologia",        5500.00),
    ("Angioplastia Coronária",     "Cardiologia",       12000.00),
    ("Tomografia Computadorizada", "Diagnóstico",         650.00),
    ("Ressonância Magnética",      "Diagnóstico",        1200.00),
    ("Endoscopia Digestiva",       "Gastroenterologia",   800.00),
    ("Colonoscopia",               "Gastroenterologia",   950.00),
    ("Hemodiálise",                "Nefrologia",          450.00),
    ("Quimioterapia Ambulatorial", "Oncologia",          1800.00),
    ("Radioterapia Sessão",        "Oncologia",           620.00),
    ("Cirurgia de Catarata",       "Oftalmologia",       2200.00),
    ("Septoplastia",               "Otorrinolaringologia",1600.00),
    ("Parto Normal",               "Obstetrícia",        1500.00),
    ("Curetagem Uterina",          "Ginecologia",        1200.00),
    ("Laparoscopia Diagnóstica",   "Cirurgia Geral",     2100.00),
    ("Broncoscopia",               "Pneumologia",        1100.00),
    ("Ecocardiograma",             "Cardiologia",         480.00),
    ("Eletroencefalograma",        "Neurologia",          350.00),
    ("Biópsia de Próstata",        "Urologia",           1400.00),
    ("Litotripsia Renal",          "Urologia",           3500.00),
]

EQUIPAMENTOS = [
    ("Tomógrafo Siemens SOMATOM",  "SOMATOM Go.All"),
    ("Ressonância Philips Ingenia", "Ingenia 1.5T"),
    ("Ventilador Draeger Evita",    "Evita Infinity V500"),
    ("Monitor Multiparamétrico",    "Mindray BeneView T5"),
    ("Desfibrilador Zoll",          "Zoll R Series"),
    ("Bomba de Infusão",            "BD Alaris 8015"),
    ("Bisturi Elétrico",            "Valleylab Force FX"),
    ("Laparoscópio Olympus",        "Olympus EVIS X1"),
    ("Endoscópio Fujinon",          "Fujinon 7000"),
    ("Ultrassom GE Voluson",        "Voluson E10"),
    ("Mesa Cirúrgica Trumpf",       "Trumpf TruSystem 7500"),
    ("Autoclave Stermax",           "Stermax 75 Litros"),
    ("Foco Cirúrgico Barraquef",    "Barraquef LED L7000"),
    ("Hemodialisador Fresenius",    "Fresenius 5008"),
    ("Incubadora Fanem",            "Fanem Compact Plus"),
]

PROTOCOLOS = [
    ("Sepse Bundle 1h",                "Emergência"),
    ("Tromboprofilaxia Cirúrgica",     "Cirurgia"),
    ("Protocolo de AVC Isquêmico",    "Neurologia"),
    ("Manejo de IAM com CSST",        "Cardiologia"),
    ("Insulinoterapia Intensiva",      "Endocrinologia"),
    ("Profilaxia de IACS",            "CCIH"),
    ("Higiene das Mãos - OMS",        "CCIH"),
    ("Protocolo de Higiene Oral UTI", "UTI"),
    ("Prevenção de Lesão por Pressão","Enfermagem"),
    ("Protocolo de Dor Pós-Op",       "Cirurgia"),
    ("Controle Glicêmico Intensivo",  "Endocrinologia"),
    ("Bundle de Cateter Venoso",      "UTI"),
    ("Profilaxia TACO",               "Hemoterapia"),
    ("Protocolo de Sedação e Analgesia","UTI"),
    ("Time-Out Cirúrgico",             "Cirurgia"),
    ("Protocolo de Antibióticos",      "Infectologia"),
    ("Prevenção de Queda",             "Enfermagem"),
    ("Protocolo de Ressuscitação",     "Emergência"),
    ("Checklist de Alta Segura",       "Geral"),
    ("Protocolo de Transfusão",        "Hemoterapia"),
]

CONVENIOS = [
    ("SUS",                    "Público",    30),
    ("Unimed MT",              "Cooperativa",15),
    ("Bradesco Saúde",         "Privado",    20),
    ("SulAmérica",             "Privado",    20),
    ("Porto Seguro Saúde",     "Privado",    25),
    ("Hapvida",                "Privado",    18),
    ("NotreDame Intermédica",  "Privado",    20),
    ("Particular",             "Particular", 0),
]

FAIXAS_ETARIAS = ["0-18", "19-40", "41-60", "61-80", "80+"]
STATUS_ALTA = [
    ("Alta Médica",    0.70),
    ("Transferência",  0.10),
    ("Óbito",          0.05),
    ("Evasão",         0.05),
    ("A/O",            0.10),
]
STATUS_PRESENCA = [
    ("Presente", 0.82),
    ("Falta",    0.10),
    ("Atraso",   0.08),
]
STATUS_AGENDAMENTO = [
    ("Realizado", 0.78),
    ("Cancelado", 0.12),
    ("Agendado",  0.10),
]
TIPOS_ERRO = ["Dose incorreta","Medicamento errado","Via incorreta","Horário incorreto","Paciente errado"]
SEVERIDADES = [("Leve",0.55),("Moderada",0.35),("Grave",0.10)]


def weighted_choice(options):
    """Escolha ponderada a partir de lista de (valor, peso)."""
    values, weights = zip(*options)
    return random.choices(values, weights=weights, k=1)[0]


def random_date_range(start_date: date, end_date: date) -> date:
    delta = (end_date - start_date).days
    return start_date + timedelta(days=random.randint(0, max(delta, 0)))


class Command(BaseCommand):
    help = "Gera dados de teste realistas para todas as 18 tabelas do BI Hospitalar."

    def add_arguments(self, parser):
        parser.add_argument(
            "--records", type=int, default=100,
            help="Número de registros base por tabela fato (padrão: 100, máx: 50000)"
        )
        parser.add_argument(
            "--mode", type=str, default="db", choices=["db", "csv", "both"],
            help="Destino dos dados: 'db' (banco), 'csv' (arquivo), 'both' (ambos)"
        )
        parser.add_argument(
            "--csv-dir", type=str, default="./output/seed_data/",
            help="Diretório de saída para os CSVs (padrão: ./output/seed_data/)"
        )
        parser.add_argument(
            "--clear", action="store_true", default=False,
            help="Limpa as tabelas antes de gerar (CUIDADO: destrói dados existentes)"
        )
        parser.add_argument(
            "--dims-only", action="store_true", default=False,
            help="Gera apenas as tabelas de dimensão"
        )
        parser.add_argument(
            "--facts-only", action="store_true", default=False,
            help="Gera apenas as tabelas de fato (requer dimensões existentes no banco)"
        )

    def handle(self, *args, **options):
        from indicadores.models import (
            DimTempo, DimUnidade, DimPaciente, DimMedicamento,
            DimTipoProcedimento, DimEquipamento, DimMedico, DimProtocolo, DimConvenio,
            FatoAtendimentos, FatoEstoque, FatoErrosMedicao, FatoProcedimentos,
            FatoInfraestrutura, FatoHigienizacao, FatoDesempenhoClinico,
            FatoEscalaMedica, FatoFinanceiro
        )

        n = min(max(options["records"], 1), 50000)
        mode = options["mode"]
        csv_dir = options["csv_dir"]
        clear = options["clear"]
        dims_only = options["dims_only"]
        facts_only = options["facts_only"]

        self.stdout.write(self.style.HTTP_INFO(
            f"\n[ Gerador de Dados BI Hospitalar ]\n"
            f"   Registros por fato: {n:,}\n"
            f"   Modo: {mode.upper()}\n"
            f"   Limpar antes: {'Sim ⚠️' if clear else 'Não'}\n"
        ))

        # Configurar saída CSV
        csv_writers = {}
        csv_files = {}
        if mode in ("csv", "both"):
            os.makedirs(csv_dir, exist_ok=True)
            self.stdout.write(f"   CSV dir: {os.path.abspath(csv_dir)}\n")

        def get_csv_writer(name, fieldnames):
            if mode not in ("csv", "both"):
                return None
            fpath = os.path.join(csv_dir, f"{name}.csv")
            f = open(fpath, "w", newline="", encoding="utf-8")
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            csv_files[name] = f
            csv_writers[name] = writer
            return writer

        def close_csv_files():
            for f in csv_files.values():
                f.close()

        try:
            with transaction.atomic():
                # ── CLEAR ─────────────────────────────────────────────
                if clear:
                    self.stdout.write(self.style.WARNING("ATENCAO: Limpando tabelas..."))
                    FatoFinanceiro.objects.all().delete()
                    FatoEscalaMedica.objects.all().delete()
                    FatoDesempenhoClinico.objects.all().delete()
                    FatoHigienizacao.objects.all().delete()
                    FatoInfraestrutura.objects.all().delete()
                    FatoProcedimentos.objects.all().delete()
                    FatoErrosMedicao.objects.all().delete()
                    FatoEstoque.objects.all().delete()
                    FatoAtendimentos.objects.all().delete()
                    if not facts_only:
                        DimConvenio.objects.all().delete()
                        DimProtocolo.objects.all().delete()
                        DimMedico.objects.all().delete()
                        DimEquipamento.objects.all().delete()
                        DimTipoProcedimento.objects.all().delete()
                        DimMedicamento.objects.all().delete()
                        DimPaciente.objects.all().delete()
                        DimUnidade.objects.all().delete()
                        DimTempo.objects.all().delete()
                    self.stdout.write("   Tabelas limpas.\n")

                today = date.today()
                start_date = today - timedelta(days=365)

                # ══════════════════════════════════════════
                #  DIMENSÕES
                # ══════════════════════════════════════════
                if not facts_only:
                    # ── DimTempo ──────────────────────────
                    self.stdout.write("[Tempo] Gerando DimTempo (365 dias)...")
                    dim_tempo_list = []
                    tempos_db = []
                    tempo_csv = get_csv_writer("DimTempo", ["id_tempo","data_registro","mes","ano"])
                    pk_tempo = 1
                    for i in range(365):
                        d = start_date + timedelta(days=i)
                        row = {"id_tempo": pk_tempo, "data_registro": str(d), "mes": d.month, "ano": d.year}
                        dim_tempo_list.append(row)
                        if tempo_csv:
                            tempo_csv.writerow(row)
                        pk_tempo += 1
                    if mode in ("db", "both"):
                        objs = [DimTempo(data_registro=r["data_registro"], mes=r["mes"], ano=r["ano"])
                                for r in dim_tempo_list]
                        DimTempo.objects.bulk_create(objs, ignore_conflicts=True)
                    tempos_db = list(DimTempo.objects.all())
                    self.stdout.write(self.style.SUCCESS(f"   OK {len(tempos_db)} registros"))

                    # ── DimUnidade ────────────────────────
                    self.stdout.write("[Unidade] Gerando DimUnidade...")
                    unidade_csv = get_csv_writer("DimUnidade", ["id_unidade","nome_unidade","tipo_leito","capacidade_maxima"])
                    pk_u = 1
                    for nome, tipo, cap in NOMES_UNIDADES:
                        if not DimUnidade.objects.filter(nome_unidade=nome).exists():
                            row = {"id_unidade": pk_u, "nome_unidade": nome, "tipo_leito": tipo, "capacidade_maxima": cap}
                            if unidade_csv:
                                unidade_csv.writerow(row)
                            if mode in ("db", "both"):
                                DimUnidade.objects.create(nome_unidade=nome, tipo_leito=tipo, capacidade_maxima=cap)
                        pk_u += 1
                    unidades_db = list(DimUnidade.objects.all())
                    self.stdout.write(self.style.SUCCESS(f"   OK {len(unidades_db)} registros"))

                    # ── DimPaciente ───────────────────────
                    self.stdout.write(f"[Paciente] Gerando DimPaciente ({n})...")
                    paciente_csv = get_csv_writer("DimPaciente", ["id_paciente","pontuacao_nps","faixa_etaria"])
                    pk_p = 1
                    pac_objs = []
                    for _ in range(n):
                        nps = random.randint(0, 10)
                        faixa = random.choice(FAIXAS_ETARIAS)
                        if paciente_csv:
                            paciente_csv.writerow({"id_paciente": pk_p, "pontuacao_nps": nps, "faixa_etaria": faixa})
                        pac_objs.append(DimPaciente(pontuacao_nps=nps, faixa_etaria=faixa))
                        pk_p += 1
                    if mode in ("db", "both"):
                        DimPaciente.objects.bulk_create(pac_objs)
                    pacientes_db = list(DimPaciente.objects.all())
                    self.stdout.write(self.style.SUCCESS(f"   OK {len(pacientes_db)} registros"))

                    # ── DimMedicamento ────────────────────
                    self.stdout.write("[Med] Gerando DimMedicamento...")
                    med_csv = get_csv_writer("DimMedicamento", ["id_medicamento","nome_farmaco","classe_terapeutica","custo_unitario","item_essencial"])
                    pk_m = 1
                    for nome, classe, custo, essencial in FARMACOS:
                        if not DimMedicamento.objects.filter(nome_farmaco=nome).exists():
                            row = {"id_medicamento": pk_m, "nome_farmaco": nome,
                                   "classe_terapeutica": classe, "custo_unitario": custo, "item_essencial": essencial}
                            if med_csv:
                                med_csv.writerow(row)
                            if mode in ("db", "both"):
                                DimMedicamento.objects.create(
                                    nome_farmaco=nome, classe_terapeutica=classe,
                                    custo_unitario=Decimal(str(custo)), item_essencial=essencial)
                        pk_m += 1
                    meds_db = list(DimMedicamento.objects.all())
                    self.stdout.write(self.style.SUCCESS(f"   OK {len(meds_db)} registros"))

                    # ── DimTipoProcedimento ───────────────
                    self.stdout.write("[Proc] Gerando DimTipoProcedimento...")
                    proc_csv = get_csv_writer("DimTipoProcedimento", ["id_tipo_procedimento","nome_procedimento","especialidade","valor_base"])
                    pk_tp = 1
                    for nome, espec, valor in PROCEDIMENTOS:
                        if not DimTipoProcedimento.objects.filter(nome_procedimento=nome).exists():
                            row = {"id_tipo_procedimento": pk_tp, "nome_procedimento": nome,
                                   "especialidade": espec, "valor_base": valor}
                            if proc_csv:
                                proc_csv.writerow(row)
                            if mode in ("db", "both"):
                                DimTipoProcedimento.objects.create(
                                    nome_procedimento=nome, especialidade=espec,
                                    valor_base=Decimal(str(valor)))
                        pk_tp += 1
                    tipos_proc_db = list(DimTipoProcedimento.objects.all())
                    self.stdout.write(self.style.SUCCESS(f"   OK {len(tipos_proc_db)} registros"))

                    # ── DimEquipamento ────────────────────
                    self.stdout.write("[Equip] Gerando DimEquipamento...")
                    equip_csv = get_csv_writer("DimEquipamento", ["id_equipamento","nome_maquina","modelo","ultima_manutencao"])
                    pk_e = 1
                    for nome, modelo in EQUIPAMENTOS:
                        if not DimEquipamento.objects.filter(nome_maquina=nome).exists():
                            manutencao = datetime.now() - timedelta(days=random.randint(30, 365))
                            row = {"id_equipamento": pk_e, "nome_maquina": nome, "modelo": modelo,
                                   "ultima_manutencao": manutencao.isoformat()}
                            if equip_csv:
                                equip_csv.writerow(row)
                            if mode in ("db", "both"):
                                DimEquipamento.objects.create(
                                    nome_maquina=nome, modelo=modelo, ultima_manutencao=manutencao)
                        pk_e += 1
                    equips_db = list(DimEquipamento.objects.all())
                    self.stdout.write(self.style.SUCCESS(f"   OK {len(equips_db)} registros"))

                    # ── DimMedico ─────────────────────────
                    self.stdout.write("[Medico] Gerando DimMedico...")
                    medico_csv = get_csv_writer("DimMedico", ["id_medico","nome_medico","especialidade","crm"])
                    crm_set = set(DimMedico.objects.values_list("crm", flat=True))
                    pk_md = DimMedico.objects.count() + 1
                    med_objs = []
                    for i, nome in enumerate(NOMES_MEDICOS):
                        espec = ESPECIALIDADES[i % len(ESPECIALIDADES)]
                        # Gera CRM único: MT + 6 dígitos
                        crm = f"MT{str(pk_md + i).zfill(6)}"
                        while crm in crm_set:
                            pk_md += 1
                            crm = f"MT{str(pk_md + i).zfill(6)}"
                        crm_set.add(crm)
                        row = {"id_medico": pk_md + i, "nome_medico": nome, "especialidade": espec, "crm": crm}
                        if medico_csv:
                            medico_csv.writerow(row)
                        med_objs.append(DimMedico(nome_medico=nome, especialidade=espec, crm=crm))
                    if mode in ("db", "both"):
                        DimMedico.objects.bulk_create(med_objs, ignore_conflicts=True)
                    medicos_db = list(DimMedico.objects.all())
                    self.stdout.write(self.style.SUCCESS(f"   OK {len(medicos_db)} registros"))

                    # ── DimProtocolo ──────────────────────
                    self.stdout.write("[Proto] Gerando DimProtocolo...")
                    proto_csv = get_csv_writer("DimProtocolo", ["id_protocolo","nome_protocolo","area_medica"])
                    pk_pr = 1
                    for nome, area in PROTOCOLOS:
                        if not DimProtocolo.objects.filter(nome_protocolo=nome).exists():
                            row = {"id_protocolo": pk_pr, "nome_protocolo": nome, "area_medica": area}
                            if proto_csv:
                                proto_csv.writerow(row)
                            if mode in ("db", "both"):
                                DimProtocolo.objects.create(nome_protocolo=nome, area_medica=area)
                        pk_pr += 1
                    protocolos_db = list(DimProtocolo.objects.all())
                    self.stdout.write(self.style.SUCCESS(f"   OK {len(protocolos_db)} registros"))

                    # ── DimConvenio ───────────────────────
                    self.stdout.write("[Conv] Gerando DimConvenio...")
                    conv_csv = get_csv_writer("DimConvenio", ["id_convenio","nome_operadora","tipo_contrato","prazo_contratual_pagamento"])
                    pk_cv = 1
                    for nome, tipo, prazo in CONVENIOS:
                        if not DimConvenio.objects.filter(nome_operadora=nome).exists():
                            row = {"id_convenio": pk_cv, "nome_operadora": nome,
                                   "tipo_contrato": tipo, "prazo_contratual_pagamento": prazo}
                            if conv_csv:
                                conv_csv.writerow(row)
                            if mode in ("db", "both"):
                                DimConvenio.objects.create(nome_operadora=nome, tipo_contrato=tipo,
                                                           prazo_contratual_pagamento=prazo)
                        pk_cv += 1
                    convenios_db = list(DimConvenio.objects.all())
                    self.stdout.write(self.style.SUCCESS(f"   OK {len(convenios_db)} registros"))

                else:
                    # facts_only: load existing dims
                    self.stdout.write(self.style.WARNING("INFO: Modo facts-only: carregando dimensões existentes..."))
                    from indicadores.models import (
                        DimTempo, DimUnidade, DimPaciente, DimMedicamento,
                        DimTipoProcedimento, DimEquipamento, DimMedico, DimProtocolo, DimConvenio
                    )
                    tempos_db = list(DimTempo.objects.all())
                    unidades_db = list(DimUnidade.objects.all())
                    pacientes_db = list(DimPaciente.objects.all())
                    meds_db = list(DimMedicamento.objects.all())
                    tipos_proc_db = list(DimTipoProcedimento.objects.all())
                    equips_db = list(DimEquipamento.objects.all())
                    medicos_db = list(DimMedico.objects.all())
                    protocolos_db = list(DimProtocolo.objects.all())
                    convenios_db = list(DimConvenio.objects.all())
                    if not tempos_db or not unidades_db or not pacientes_db:
                        self.stderr.write(self.style.ERROR(
                            "ERRO: Erro: Dimensões vazias. Execute sem --facts-only primeiro."))
                        return

                # Calcular pesos realistas para as datas (distribuição por dia da semana e outliers)
                tempos_weights = []
                if tempos_db:
                    temp_rand = random.Random(42)  # semente fixa para consistência
                    # Define 5 dias do ano como outliers (picos de atendimento)
                    outlier_indices = set(temp_rand.sample(range(len(tempos_db)), k=min(len(tempos_db), 5)))
                    for idx, t in enumerate(tempos_db):
                        d_val = t.data_registro
                        if isinstance(d_val, str):
                            try:
                                dt = datetime.strptime(d_val, "%Y-%m-%d").date()
                            except ValueError:
                                dt = today
                        elif isinstance(d_val, date):
                            dt = d_val
                        else:
                            dt = today
                        
                        weekday = dt.weekday()  # 0: Segunda, 6: Domingo
                        
                        # Peso base: Segunda a Sexta = 1.0, Sábado = 0.4, Domingo = 0.2
                        if weekday < 5:
                            w = 1.0
                        elif weekday == 5:
                            w = 0.4
                        else:
                            w = 0.2
                        
                        # Flutuação diária (+/- 15%)
                        w *= temp_rand.uniform(0.85, 1.15)
                        
                        # Outliers (pico de 3.0x a 5.0x o peso normal)
                        if idx in outlier_indices:
                            w *= temp_rand.uniform(3.0, 5.0)
                        
                        tempos_weights.append(w)

                # ══════════════════════════════════════════
                #  FATOS
                # ══════════════════════════════════════════
                if dims_only:
                    self.stdout.write(self.style.WARNING("\nINFO: Modo dims-only: fatos não gerados."))
                else:
                    self.stdout.write(self.style.HTTP_INFO("\n[ Gerando tabelas fato... ]..."))

                    # ── FatoAtendimentos ──────────────────
                    self.stdout.write(f"[Atend] FatoAtendimentos ({n})...")
                    at_csv = get_csv_writer("FatoAtendimentos",
                        ["id_atendimento","id_tempo_id","id_unidade_id","id_paciente_id",
                         "tempo_permanencia_dias","status_alta","reinternacao_30d"])
                    at_objs = []
                    sampled_tempos_at = random.choices(tempos_db, weights=tempos_weights, k=n)
                    for i in range(n):
                        row = {
                            "id_atendimento": i + 1,
                            "id_tempo_id": sampled_tempos_at[i].id_tempo,
                            "id_unidade_id": random.choice(unidades_db).id_unidade,
                            "id_paciente_id": random.choice(pacientes_db).id_paciente,
                            "tempo_permanencia_dias": random.randint(1, 20),
                            "status_alta": weighted_choice(STATUS_ALTA),
                            "reinternacao_30d": random.random() < 0.12,
                        }
                        if at_csv:
                            at_csv.writerow(row)
                        if mode in ("db", "both"):
                            at_objs.append(FatoAtendimentos(
                                id_tempo_id=row["id_tempo_id"],
                                id_unidade_id=row["id_unidade_id"],
                                id_paciente_id=row["id_paciente_id"],
                                tempo_permanencia_dias=row["tempo_permanencia_dias"],
                                status_alta=row["status_alta"],
                                reinternacao_30d=row["reinternacao_30d"],
                            ))
                    if mode in ("db", "both"):
                        FatoAtendimentos.objects.bulk_create(at_objs)
                    self.stdout.write(self.style.SUCCESS(f"   OK {n} registros"))

                    # ── FatoEstoque ───────────────────────
                    self.stdout.write(f"[Estoque] FatoEstoque ({n})...")
                    est_csv = get_csv_writer("FatoEstoque",
                        ["id_movimentacao","id_medicamento_id","id_tempo_id","id_unidade_id","quantidade_saida","saldo_atual"])
                    est_objs = []
                    sampled_tempos_est = random.choices(tempos_db, weights=tempos_weights, k=n)
                    for i in range(n):
                        med = random.choice(meds_db)
                        saida = round(random.uniform(1, 200), 2)
                        saldo = round(random.uniform(50, 5000), 2)
                        row = {"id_movimentacao": i+1, "id_medicamento_id": med.id_medicamento,
                               "id_tempo_id": sampled_tempos_est[i].id_tempo,
                               "id_unidade_id": random.choice(unidades_db).id_unidade,
                               "quantidade_saida": saida, "saldo_atual": saldo}
                        if est_csv:
                            est_csv.writerow(row)
                        if mode in ("db", "both"):
                            est_objs.append(FatoEstoque(
                                id_medicamento_id=med.id_medicamento,
                                id_tempo_id=row["id_tempo_id"],
                                id_unidade_id=row["id_unidade_id"],
                                quantidade_saida=saida, saldo_atual=saldo))
                    if mode in ("db", "both"):
                        FatoEstoque.objects.bulk_create(est_objs)
                    self.stdout.write(self.style.SUCCESS(f"   OK {n} registros"))

                    # ── FatoErrosMedicao ─────────── (≈20% de n)
                    n_erros = max(1, n // 5)
                    self.stdout.write(f"[Erros] FatoErrosMedicao ({n_erros})...")
                    err_csv = get_csv_writer("FatoErrosMedicao",
                        ["id_evento","id_medicamento_id","id_paciente_id","id_tempo_id","tipo_erro","severidade"])
                    err_objs = []
                    sampled_tempos_err = random.choices(tempos_db, weights=tempos_weights, k=n_erros)
                    for i in range(n_erros):
                        row = {"id_evento": i+1,
                               "id_medicamento_id": random.choice(meds_db).id_medicamento,
                               "id_paciente_id": random.choice(pacientes_db).id_paciente,
                               "id_tempo_id": sampled_tempos_err[i].id_tempo,
                               "tipo_erro": random.choice(TIPOS_ERRO),
                               "severidade": weighted_choice(SEVERIDADES)}
                        if err_csv:
                            err_csv.writerow(row)
                        if mode in ("db", "both"):
                            err_objs.append(FatoErrosMedicao(
                                id_medicamento_id=row["id_medicamento_id"],
                                id_paciente_id=row["id_paciente_id"],
                                id_tempo_id=row["id_tempo_id"],
                                tipo_erro=row["tipo_erro"],
                                severidade=row["severidade"]))
                    if mode in ("db", "both"):
                        FatoErrosMedicao.objects.bulk_create(err_objs)
                    self.stdout.write(self.style.SUCCESS(f"   OK {n_erros} registros"))

                    # ── FatoProcedimentos ─────────────────
                    self.stdout.write(f"[Proc] FatoProcedimentos ({n})...")
                    fp_csv = get_csv_writer("FatoProcedimentos",
                        ["id_procedimento_instancia","id_tipo_procedimento_id","id_unidade_id",
                         "id_tempo_id","id_equipamento_id","tempo_preparo_minutos",
                         "tempo_execucao_minutos","tempo_limpeza_minutos","status_agendamento"])
                    fp_objs = []
                    sampled_tempos_proc = random.choices(tempos_db, weights=tempos_weights, k=n)
                    for i in range(n):
                        equip = random.choice(equips_db) if equips_db and random.random() > 0.1 else None
                        row = {"id_procedimento_instancia": i+1,
                               "id_tipo_procedimento_id": random.choice(tipos_proc_db).id_tipo_procedimento,
                               "id_unidade_id": random.choice(unidades_db).id_unidade,
                               "id_tempo_id": sampled_tempos_proc[i].id_tempo,
                               "id_equipamento_id": equip.id_equipamento if equip else "",
                               "tempo_preparo_minutos": round(random.uniform(10, 60), 1),
                               "tempo_execucao_minutos": round(random.uniform(30, 300), 1),
                               "tempo_limpeza_minutos": round(random.uniform(5, 30), 1),
                               "status_agendamento": weighted_choice(STATUS_AGENDAMENTO)}
                        if fp_csv:
                            fp_csv.writerow(row)
                        if mode in ("db", "both"):
                            fp_objs.append(FatoProcedimentos(
                                id_tipo_procedimento_id=row["id_tipo_procedimento_id"],
                                id_unidade_id=row["id_unidade_id"],
                                id_tempo_id=row["id_tempo_id"],
                                id_equipamento_id=equip.id_equipamento if equip else None,
                                tempo_preparo_minutos=row["tempo_preparo_minutos"],
                                tempo_execucao_minutos=row["tempo_execucao_minutos"],
                                tempo_limpeza_minutos=row["tempo_limpeza_minutos"],
                                status_agendamento=row["status_agendamento"]))
                    if mode in ("db", "both"):
                        FatoProcedimentos.objects.bulk_create(fp_objs)
                    self.stdout.write(self.style.SUCCESS(f"   OK {n} registros"))

                    # ── FatoInfraestrutura ────────────────
                    self.stdout.write(f"[Infra] FatoInfraestrutura ({n})...")
                    inf_csv = get_csv_writer("FatoInfraestrutura",
                        ["id_registro","id_unidade_id","id_tempo_id","consumo_agua_m3",
                         "consumo_energia_kwh","total_colaboradores_ativos","eventos_infeccao"])
                    inf_objs = []
                    sampled_tempos_inf = random.choices(tempos_db, weights=tempos_weights, k=n)
                    for i in range(n):
                        unidade = random.choice(unidades_db)
                        row = {"id_registro": i+1,
                               "id_unidade_id": unidade.id_unidade,
                               "id_tempo_id": sampled_tempos_inf[i].id_tempo,
                               "consumo_agua_m3": round(random.uniform(50, 500), 2),
                               "consumo_energia_kwh": round(random.uniform(500, 5000), 2),
                               "total_colaboradores_ativos": random.randint(5, unidade.capacidade_maxima),
                               "eventos_infeccao": random.randint(0, 5)}
                        if inf_csv:
                            inf_csv.writerow(row)
                        if mode in ("db", "both"):
                            inf_objs.append(FatoInfraestrutura(
                                id_unidade_id=row["id_unidade_id"],
                                id_tempo_id=row["id_tempo_id"],
                                consumo_agua_m3=row["consumo_agua_m3"],
                                consumo_energia_kwh=row["consumo_energia_kwh"],
                                total_colaboradores_ativos=row["total_colaboradores_ativos"],
                                eventos_infeccao=row["eventos_infeccao"]))
                    if mode in ("db", "both"):
                        FatoInfraestrutura.objects.bulk_create(inf_objs)
                    self.stdout.write(self.style.SUCCESS(f"   OK {n} registros"))

                    # ── FatoHigienizacao ──────────────────
                    self.stdout.write(f"[Higien] FatoHigienizacao ({n})...")
                    hig_csv = get_csv_writer("FatoHigienizacao",
                        ["id_higienizacao","id_unidade_id","id_tempo_id",
                         "data_hora_saida_paciente","data_hora_liberacao_leito"])
                    hig_objs = []
                    sampled_tempos_hig = random.choices(tempos_db, weights=tempos_weights, k=n)
                    for i in range(n):
                        tempo_obj = sampled_tempos_hig[i]
                        data_base = tempo_obj.data_registro
                        from django.utils import timezone as tz
                        if hasattr(data_base, 'strftime'):
                            naive_saida = datetime.combine(data_base, datetime.min.time()) + timedelta(hours=random.randint(6, 18))
                        else:
                            naive_saida = datetime.now() - timedelta(days=random.randint(1, 365), hours=random.randint(0, 23))
                        naive_lib = naive_saida + timedelta(minutes=random.randint(20, 180))
                        hora_saida = tz.make_aware(naive_saida, tz.get_current_timezone())
                        hora_lib = tz.make_aware(naive_lib, tz.get_current_timezone())
                        row = {"id_higienizacao": i+1,
                               "id_unidade_id": random.choice(unidades_db).id_unidade,
                               "id_tempo_id": tempo_obj.id_tempo,
                               "data_hora_saida_paciente": hora_saida.isoformat(),
                               "data_hora_liberacao_leito": hora_lib.isoformat()}
                        if hig_csv:
                            hig_csv.writerow(row)
                        if mode in ("db", "both"):
                            hig_objs.append(FatoHigienizacao(
                                id_unidade_id=row["id_unidade_id"],
                                id_tempo_id=row["id_tempo_id"],
                                data_hora_saida_paciente=hora_saida,
                                data_hora_liberacao_leito=hora_lib))
                    if mode in ("db", "both"):
                        FatoHigienizacao.objects.bulk_create(hig_objs)
                    self.stdout.write(self.style.SUCCESS(f"   OK {n} registros"))

                    # ── FatoDesempenhoClinico ─────────────
                    self.stdout.write(f"[Desempenho] FatoDesempenhoClinico ({n})...")
                    dc_csv = get_csv_writer("FatoDesempenhoClinico",
                        ["id_registro","id_medico_id","id_tempo_id","id_protocolo_id",
                         "aderente_ao_protocolo","tempo_fechamento_prontuario_min"])
                    dc_objs = []
                    sampled_tempos_des = random.choices(tempos_db, weights=tempos_weights, k=n)
                    for i in range(n):
                        row = {"id_registro": i+1,
                               "id_medico_id": random.choice(medicos_db).id_medico,
                               "id_tempo_id": sampled_tempos_des[i].id_tempo,
                               "id_protocolo_id": random.choice(protocolos_db).id_protocolo,
                               "aderente_ao_protocolo": random.random() < 0.78,
                               "tempo_fechamento_prontuario_min": round(random.uniform(5, 120), 1)}
                        if dc_csv:
                            dc_csv.writerow(row)
                        if mode in ("db", "both"):
                            dc_objs.append(FatoDesempenhoClinico(
                                id_medico_id=row["id_medico_id"],
                                id_tempo_id=row["id_tempo_id"],
                                id_protocolo_id=row["id_protocolo_id"],
                                aderente_ao_protocolo=row["aderente_ao_protocolo"],
                                tempo_fechamento_prontuario_min=row["tempo_fechamento_prontuario_min"]))
                    if mode in ("db", "both"):
                        FatoDesempenhoClinico.objects.bulk_create(dc_objs)
                    self.stdout.write(self.style.SUCCESS(f"   OK {n} registros"))

                    # ── FatoEscalaMedica ──────────────────
                    self.stdout.write(f"[Escala] FatoEscalaMedica ({n})...")
                    esc_csv = get_csv_writer("FatoEscalaMedica",
                        ["id_escala","id_medico_id","id_tempo_id","status_presenca","horas_atraso"])
                    esc_objs = []
                    sampled_tempos_esc = random.choices(tempos_db, weights=tempos_weights, k=n)
                    for i in range(n):
                        status = weighted_choice(STATUS_PRESENCA)
                        horas_atraso = round(random.uniform(0.5, 4.0), 1) if status == "Atraso" else 0.0
                        row = {"id_escala": i+1,
                               "id_medico_id": random.choice(medicos_db).id_medico,
                               "id_tempo_id": sampled_tempos_esc[i].id_tempo,
                               "status_presenca": status,
                               "horas_atraso": horas_atraso}
                        if esc_csv:
                            esc_csv.writerow(row)
                        if mode in ("db", "both"):
                            esc_objs.append(FatoEscalaMedica(
                                id_medico_id=row["id_medico_id"],
                                id_tempo_id=row["id_tempo_id"],
                                status_presenca=status,
                                horas_atraso=horas_atraso))
                    if mode in ("db", "both"):
                        FatoEscalaMedica.objects.bulk_create(esc_objs)
                    self.stdout.write(self.style.SUCCESS(f"   OK {n} registros"))

                    # ── FatoFinanceiro ────────────────────
                    self.stdout.write(f"[Financeiro] FatoFinanceiro ({n})...")
                    fin_csv = get_csv_writer("FatoFinanceiro",
                        ["id_transacao","id_tempo_id","id_unidade_id","id_convenio_id",
                         "receita_bruta","valor_glosa_inicial","valor_glosa_recuperada",
                         "custos_operacionais","data_pagamento_prevista","data_pagamento_real"])
                    fin_objs = []
                    sampled_tempos_fin = random.choices(tempos_db, weights=tempos_weights, k=n)
                    for i in range(n):
                        tempo_obj = sampled_tempos_fin[i]
                        convenio = random.choice(convenios_db)
                        receita = round(random.uniform(500, 15000), 2)
                        glosa_ini = round(receita * random.uniform(0.02, 0.15), 2)
                        glosa_rec = round(glosa_ini * random.uniform(0.3, 0.9), 2)
                        custos = round(receita * random.uniform(0.55, 0.80), 2)
                        data_registro = tempo_obj.data_registro
                        if hasattr(data_registro, '__str__'):
                            from datetime import date as date_type
                            if isinstance(data_registro, date_type):
                                data_prev = data_registro + timedelta(days=convenio.prazo_contratual_pagamento)
                                pago = random.random() < 0.75
                                data_real = data_prev + timedelta(days=random.randint(-5, 15)) if pago else None
                            else:
                                data_prev = today + timedelta(days=convenio.prazo_contratual_pagamento)
                                data_real = None
                        else:
                            data_prev = today + timedelta(days=convenio.prazo_contratual_pagamento)
                            data_real = None

                        row = {"id_transacao": i+1,
                               "id_tempo_id": tempo_obj.id_tempo,
                               "id_unidade_id": random.choice(unidades_db).id_unidade,
                               "id_convenio_id": convenio.id_convenio,
                               "receita_bruta": receita,
                               "valor_glosa_inicial": glosa_ini,
                               "valor_glosa_recuperada": glosa_rec,
                               "custos_operacionais": custos,
                               "data_pagamento_prevista": str(data_prev),
                               "data_pagamento_real": str(data_real) if data_real else ""}
                        if fin_csv:
                            fin_csv.writerow(row)
                        if mode in ("db", "both"):
                            fin_objs.append(FatoFinanceiro(
                                id_tempo_id=tempo_obj.id_tempo,
                                id_unidade_id=row["id_unidade_id"],
                                id_convenio_id=convenio.id_convenio,
                                receita_bruta=receita,
                                valor_glosa_inicial=glosa_ini,
                                valor_glosa_recuperada=glosa_rec,
                                custos_operacionais=custos,
                                data_pagamento_prevista=data_prev,
                                data_pagamento_real=data_real))
                    if mode in ("db", "both"):
                        FatoFinanceiro.objects.bulk_create(fin_objs)
                    self.stdout.write(self.style.SUCCESS(f"   OK {n} registros"))

        finally:
            close_csv_files()

        # ── Sumário Final ──────────────────────────────
        self.stdout.write(self.style.SUCCESS(
            f"\n{'─'*50}\n"
            f"OK Geração concluída!\n"
            f"   Modo: {mode.upper()}\n"
            f"   Registros base por fato: {n:,}\n"
        ))
        if mode in ("csv", "both"):
            abs_dir = os.path.abspath(csv_dir)
            csvs = [f for f in os.listdir(abs_dir) if f.endswith(".csv")] if os.path.exists(abs_dir) else []
            self.stdout.write(f"   CSVs gerados em: {abs_dir}\n")
            for c in csvs:
                self.stdout.write(f"     {c}\n")
        self.stdout.write(f"{'─'*50}\n")
