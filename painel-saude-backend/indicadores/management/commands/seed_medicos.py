import random
from django.core.management.base import BaseCommand
from indicadores.models import DimMedico, DimProtocolo, FatoDesempenhoClinico, FatoEscalaMedica, DimTempo

class Command(BaseCommand):
    help = 'Popula o banco de dados com médicos, protocolos e desempenho'

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando o seeding do módulo Médicos...")

        # 1. Criar Médicos
        specs = ["Cardiologia", "Ortopedia", "Pediatria", "Neurologia", "Clínica Geral"]
        medicos = []
        for i in range(10):
            spec = random.choice(specs)
            med, _ = DimMedico.objects.get_or_create(
                crm=f"CRM-{i}{random.randint(100,999)}",
                defaults={"nome_medico": f"Dr(a). Medico {i}", "especialidade": spec}
            )
            medicos.append(med)

        # 2. Criar Protocolos
        prot_data = [
            {"nome": "Protocolo de SEPSE", "area": "Emergência"},
            {"nome": "Protocolo de AVC", "area": "Neurologia"},
            {"nome": "Protocolo de Dor Torácica", "area": "Cardiologia"},
            {"nome": "Protocolo de Trauma", "area": "Ortopedia"},
        ]
        protocolos = []
        for p in prot_data:
            obj, _ = DimProtocolo.objects.get_or_create(
                nome_protocolo=p["nome"],
                defaults={"area_medica": p["area"]}
            )
            protocolos.append(obj)

        tempos = list(DimTempo.objects.all())

        # 3. Criar Fato Desempenho (10 registros por especialidade)
        for med in medicos:
            for _ in range(10):
                FatoDesempenhoClinico.objects.create(
                    id_medico=med,
                    id_tempo=random.choice(tempos),
                    id_protocolo=random.choice(protocolos),
                    aderente_ao_protocolo=random.choice([True, True, True, False]), # 75% adesão
                    tempo_fechamento_prontuario_min=random.uniform(20, 300)
                )

        # 4. Criar Escala Médica (30 registros)
        status_opcoes = ["Presente", "Presente", "Presente", "Presente", "Falta", "Atraso"]
        for _ in range(30):
            FatoEscalaMedica.objects.create(
                id_medico=random.choice(medicos),
                id_tempo=random.choice(tempos),
                status_presenca=random.choice(status_opcoes),
                horas_atraso=random.uniform(0, 4) if "Atraso" else 0
            )

        self.stdout.write(self.style.SUCCESS('Dados Médicos populados com sucesso!'))
