import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from indicadores.models import DimConvenio, FatoFinanceiro, DimTempo, DimUnidade

class Command(BaseCommand):
    help = 'Popula o banco de dados com dados financeiros'

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando o seeding do módulo Financeiro...")

        # 1. Criar Convênios
        conve_data = [
            {"nome": "Bradesco Saúde", "tipo": "Empresarial", "prazo": 30},
            {"nome": "SulAmérica", "tipo": "Premium", "prazo": 45},
            {"nome": "Unimed", "tipo": "Cooperativo", "prazo": 30},
            {"nome": "Amil", "tipo": "Empresarial", "prazo": 60},
            {"nome": "SUS", "tipo": "Público", "prazo": 90},
        ]
        
        convenios = []
        for c in conve_data:
            obj, _ = DimConvenio.objects.get_or_create(
                nome_operadora=c["nome"],
                defaults={"tipo_contrato": c["tipo"], "prazo_contratual_pagamento": c["prazo"]}
            )
            convenios.append(obj)

        tempos = list(DimTempo.objects.all())
        unidades = list(DimUnidade.objects.all())

        # 2. Criar Fato Financeiro (50 transações)
        for _ in range(50):
            t = random.choice(tempos)
            u = random.choice(unidades)
            c = random.choice(convenios)
            
            receita = random.uniform(5000, 50000)
            glosa_ini = receita * random.uniform(0.05, 0.15)
            glosa_rec = glosa_ini * random.uniform(0.3, 0.8)
            custos = receita * random.uniform(0.4, 0.6)
            
            data_prev = t.data_registro + timedelta(days=c.prazo_contratual_pagamento)
            data_real = data_prev + timedelta(days=random.randint(-5, 15))
            
            FatoFinanceiro.objects.create(
                id_tempo=t,
                id_unidade=u,
                id_convenio=c,
                receita_bruta=receita,
                valor_glosa_inicial=glosa_ini,
                valor_glosa_recuperada=glosa_rec,
                custos_operacionais=custos,
                data_pagamento_prevista=data_prev,
                data_pagamento_real=data_real
            )

        self.stdout.write(self.style.SUCCESS('Dados Financeiros populados com sucesso!'))
