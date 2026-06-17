from django.db import models

class LogSincronizacao(models.Model):
    CATEGORIAS = [
        # Dimensões
        ('dim_tempo', 'Dimensão: Tempo'),
        ('dim_unidade', 'Dimensão: Unidade'),
        ('dim_paciente', 'Dimensão: Paciente'),
        ('dim_medicamento', 'Dimensão: Medicamento'),
        ('dim_tipo_procedimento', 'Dimensão: Tipo Procedimento'),
        ('dim_equipamento', 'Dimensão: Equipamento'),
        ('dim_protocolo', 'Dimensão: Protocolo'),
        ('dim_medico', 'Dimensão: Médico'),
        ('dim_convenio', 'Dimensão: Convênio'),
        # Fatos
        ('fato_atendimentos', 'Fato: Atendimentos'),
        ('fato_estoque', 'Fato: Estoque'),
        ('fato_erros_medicao', 'Fato: Erros de Medicação'),
        ('fato_procedimentos', 'Fato: Procedimentos'),
        ('fato_infraestrutura', 'Fato: Infraestrutura'),
        ('fato_higienizacao', 'Fato: Higienização'),
        ('fato_desempenho_clinico', 'Fato: Desempenho Clínico'),
        ('fato_escala_medica', 'Fato: Escala Médica'),
        ('fato_financeiro', 'Fato: Financeiro'),
    ]
    
    categoria = models.CharField(max_length=50, choices=CATEGORIAS, unique=True)
    ultima_sincronizacao = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, default='Sucesso')
    registros_processados = models.IntegerField(default=0)

    class Meta:
        verbose_name = "Log de Sincronização"
        verbose_name_plural = "Logs de Sincronização"

    def __str__(self):
        return f"{self.categoria} - {self.ultima_sincronizacao}"
