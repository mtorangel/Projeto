import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from indicadores.models import FatoInfraestrutura, FatoHigienizacao, DimTempo, DimUnidade

class Command(BaseCommand):
    help = 'Popula o banco de dados com dados de infraestrutura e higienização'

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando o seeding do módulo Hospital...")

        tempos = list(DimTempo.objects.all())
        unidades = list(DimUnidade.objects.all())

        if not tempos or not unidades:
            self.stdout.write(self.style.ERROR('Erro: Rode o seed_data primeiro.'))
            return

        # 1. Criar Fato Infraestrutura (Últimos 30 dias)
        for t in tempos:
            for u in unidades:
                FatoInfraestrutura.objects.create(
                    id_unidade=u,
                    id_tempo=t,
                    consumo_agua_m3=random.uniform(50, 150),
                    consumo_energia_kwh=random.uniform(200, 600),
                    total_colaboradores_ativos=random.randint(10, 40),
                    eventos_infeccao=random.choice([0, 0, 0, 0, 1]) # 20% de chance de ter 1 infecção
                )

        # 2. Criar Fato Higienização (30 registros)
        for _ in range(30):
            u = random.choice(unidades)
            t = random.choice(tempos)
            data_saida = datetime.combine(t.data_registro, datetime.min.time()) + timedelta(hours=random.randint(8, 18))
            # Intervalo de substituição entre 30 e 180 minutos
            data_liberacao = data_saida + timedelta(minutes=random.randint(30, 180))
            
            FatoHigienizacao.objects.create(
                id_unidade=u,
                id_tempo=t,
                data_hora_saida_paciente=data_saida,
                data_hora_liberacao_leito=data_liberacao
            )

        self.stdout.write(self.style.SUCCESS('Dados hospitalares (Infra/Higienização) populados com sucesso!'))
