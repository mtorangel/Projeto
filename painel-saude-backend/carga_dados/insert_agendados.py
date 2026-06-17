import os
import sys
import django
import random

# Add backend to sys.path
backend_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from indicadores.models import FatoProcedimentos, DimUnidade, DimTempo, DimTipoProcedimento, DimEquipamento

print("Checking for existing 'Agendado' procedures...")
existing_agendados = FatoProcedimentos.objects.filter(status_agendamento='Agendado').count()
print(f"Current count of 'Agendado': {existing_agendados}")

# We only run if there are no existing agendados
if existing_agendados > 0:
    print("Already populated. Skipping insertion.")
else:
    unidades = list(DimUnidade.objects.exclude(id_unidade=100)) # exclude automatic unit
    tempos = list(DimTempo.objects.order_by('-data_registro')[:30]) # get latest 30 days
    tipos = list(DimTipoProcedimento.objects.all())
    equipamentos = list(DimEquipamento.objects.all())

    count = 0
    # Insert 30 simulated pending procedures
    random.seed(99) # Fixed seed for consistency
    for i in range(35):
        u = random.choice(unidades)
        t = random.choice(tempos)
        tp = random.choice(tipos)
        eq = random.choice(equipamentos) if random.random() < 0.7 else None
        
        FatoProcedimentos.objects.create(
            id_tipo_procedimento=tp,
            id_unidade=u,
            id_tempo=t,
            id_equipamento=eq,
            tempo_preparo_minutos=random.randint(10, 40),
            tempo_execucao_minutos=random.randint(20, 120),
            tempo_limpeza_minutos=random.randint(10, 30),
            status_agendamento='Agendado'
        )
        count += 1

    print(f"Successfully inserted {count} procedures with status 'Agendado'!")
