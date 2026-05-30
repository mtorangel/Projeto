from django.db import models

class LogSincronizacao(models.Model):
    CATEGORIAS = [
        ('pacientes', 'Pacientes'),
        ('medicamentos', 'Medicamentos'),
        ('procedimentos', 'Procedimentos'),
        ('hospital', 'Hospital'),
        ('medicos', 'Médicos'),
        ('financeiro', 'Financeiro'),
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
