import random
from django.core.management.base import BaseCommand
from indicadores.models import DimMedicamento, FatoEstoque, FatoErrosMedicao, DimTempo, DimUnidade, DimPaciente

class Command(BaseCommand):
    help = 'Popula o banco de dados com medicamentos e movimentações de estoque'

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando o seeding de medicamentos...")

        # 1. Criar Dimensões Medicamento
        meds_data = [
            {"nome": "Dipirona 500mg/ml", "classe": "Analgésico", "custo": 1.50, "essencial": True},
            {"nome": "Insulina NPH 100UI", "classe": "Hormônio", "custo": 45.00, "essencial": True},
            {"nome": "Omeprazol 40mg EV", "classe": "Protetor Gástrico", "custo": 12.80, "essencial": True},
            {"nome": "Amoxicilina + Clavulanato 1g", "classe": "Antibiótico", "custo": 35.50, "essencial": True},
            {"nome": "Adrenalina 1mg/ml", "classe": "Emergência", "custo": 8.20, "essencial": True},
        ]
        
        medicamentos = []
        for m in meds_data:
            med, created = DimMedicamento.objects.get_or_create(
                nome_farmaco=m["nome"],
                defaults={
                    "classe_terapeutica": m["classe"],
                    "custo_unitario": m["custo"],
                    "item_essencial": m["essencial"]
                }
            )
            medicamentos.append(med)

        # Buscar dados auxiliares existentes
        tempos = list(DimTempo.objects.all())
        unidades = list(DimUnidade.objects.all())
        pacientes = list(DimPaciente.objects.all())

        if not tempos or not unidades:
            self.stdout.write(self.style.ERROR('Erro: Você precisa rodar o seed_data primeiro para ter tempos e unidades.'))
            return

        # 2. Criar Fato Estoque (10 movimentações)
        for _ in range(10):
            FatoEstoque.objects.create(
                id_medicamento=random.choice(medicamentos),
                id_tempo=random.choice(tempos),
                id_unidade=random.choice(unidades),
                quantidade_saida=random.uniform(1, 50),
                saldo_atual=random.uniform(100, 1000)
            )

        # 3. Criar Fato Erros de Medicação (5 eventos)
        erros_opcoes = ["Dosagem incorreta", "Paciente incorreto", "Horário incorreto", "Via de administração"]
        severidades = ["Baixa", "Moderada", "Alta"]
        
        for _ in range(5):
            FatoErrosMedicao.objects.create(
                id_medicamento=random.choice(medicamentos),
                id_paciente=random.choice(pacientes),
                id_tempo=random.choice(tempos),
                tipo_erro=random.choice(erros_opcoes),
                severidade=random.choice(severidades)
            )

        self.stdout.write(self.style.SUCCESS('Medicamentos e estoque populados com sucesso!'))
