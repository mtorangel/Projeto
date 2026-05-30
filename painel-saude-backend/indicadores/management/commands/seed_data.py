import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from indicadores.models import DimTempo, DimUnidade, DimPaciente, FatoAtendimentos

class Command(BaseCommand):
    help = 'Popula o banco de dados com dados iniciais para teste'

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando o seeding de dados...")

        # 1. Limpar dados existentes (Opcional, mas bom para testes)
        FatoAtendimentos.objects.all().delete()
        DimTempo.objects.all().delete()
        DimUnidade.objects.all().delete()
        DimPaciente.objects.all().delete()

        # 2. Criar Dimensões Unidade
        unidades_data = [
            {"nome": "UTI Geral", "tipo": "Crítico", "cap": 20},
            {"nome": "Pronto Socorro", "tipo": "Emergência", "cap": 50},
            {"nome": "Ala de Internação A", "tipo": "Enfermaria", "cap": 100},
            {"nome": "Ala de Internação B", "tipo": "Enfermaria", "cap": 80},
            {"nome": "Centro Cirúrgico", "tipo": "Cirurgia", "cap": 10},
        ]
        unidades = []
        for u in unidades_data:
            unidades.append(DimUnidade.objects.create(
                nome_unidade=u["nome"],
                tipo_leito=u["tipo"],
                capacidade_maxima=u["cap"]
            ))

        # 3. Criar Dimensões Paciente
        faixas = ["0-18", "19-40", "41-60", "60+"]
        pacientes = []
        for _ in range(50):
            pacientes.append(DimPaciente.objects.create(
                pontuacao_nps=random.randint(0, 10),
                faixa_etaria=random.choice(faixas)
            ))

        # 4. Criar Dimensões Tempo (Últimos 30 dias)
        tempos = []
        base_date = datetime.now().date()
        for i in range(31):
            data = base_date - timedelta(days=i)
            tempos.append(DimTempo.objects.create(
                data_registro=data,
                mes=data.month,
                ano=data.year
            ))

        # 5. Criar Fato Atendimentos
        status_opcoes = ["Alta Médica", "Transferência", "Óbito", "Evasão"]
        for _ in range(100):
            FatoAtendimentos.objects.create(
                id_tempo=random.choice(tempos),
                id_unidade=random.choice(unidades),
                id_paciente=random.choice(pacientes),
                tempo_permanencia_dias=random.randint(1, 15),
                status_alta=random.choice(status_opcoes),
                reinternacao_30d=random.choice([True, False, False, False]) # 25% de chance
            )

        self.stdout.write(self.style.SUCCESS('Dados de exemplo criados com sucesso!'))
