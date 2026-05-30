import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from indicadores.models import DimTipoProcedimento, DimEquipamento, FatoProcedimentos, DimTempo, DimUnidade

class Command(BaseCommand):
    help = 'Popula o banco de dados com procedimentos e equipamentos'

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando o seeding de procedimentos...")

        # 1. Criar Dimensões Tipo Procedimento
        tipos_data = [
            {"nome": "Tomografia Computadorizada", "esp": "Radiologia", "valor": 450.00},
            {"nome": "Ressonância Magnética", "esp": "Radiologia", "valor": 800.00},
            {"nome": "Apendicectomia", "esp": "Cirurgia Geral", "valor": 2500.00},
            {"nome": "Colecistectomia", "esp": "Cirurgia Geral", "valor": 3200.00},
            {"nome": "Angioplastia", "esp": "Cardiologia", "valor": 5000.00},
        ]
        
        tipos = []
        for t in tipos_data:
            obj, _ = DimTipoProcedimento.objects.get_or_create(
                nome_procedimento=t["nome"],
                defaults={"especialidade": t["esp"], "valor_base": t["valor"]}
            )
            tipos.append(obj)

        # 2. Criar Dimensões Equipamento
        equips_data = [
            {"nome": "CT-Scan Siemens", "modelo": "Somatom Go"},
            {"nome": "MRI Philips", "modelo": "Ingenia 1.5T"},
            {"nome": "Arco Cirúrgico GE", "modelo": "OEC Elite"},
            {"nome": "Torre de Laparoscopia", "modelo": "Stryker 1688"},
        ]
        
        equipamentos = []
        for e in equips_data:
            obj, _ = DimEquipamento.objects.get_or_create(
                nome_maquina=e["nome"],
                defaults={"modelo": e["modelo"], "ultima_manutencao": datetime.now()}
            )
            equipamentos.append(obj)

        # Buscar dados auxiliares
        tempos = list(DimTempo.objects.all())
        unidades = list(DimUnidade.objects.all())

        # 3. Criar Fato Procedimentos (20 registros)
        status_opcoes = ["Realizado", "Realizado", "Realizado", "Cancelado"]
        
        for _ in range(20):
            FatoProcedimentos.objects.create(
                id_tipo_procedimento=random.choice(tipos),
                id_unidade=random.choice(unidades),
                id_tempo=random.choice(tempos),
                id_equipamento=random.choice(equipamentos),
                tempo_preparo_minutos=random.uniform(15, 45),
                tempo_execucao_minutos=random.uniform(30, 120),
                tempo_limpeza_minutos=random.uniform(10, 30),
                status_agendamento=random.choice(status_opcoes)
            )

        self.stdout.write(self.style.SUCCESS('Procedimentos e equipamentos populados com sucesso!'))
