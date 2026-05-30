from django.db import models

class DimTempo(models.Model):
    id_tempo = models.AutoField(primary_key=True)
    data_registro = models.DateField()
    mes = models.IntegerField()
    ano = models.IntegerField()

    class Meta:
        verbose_name = "Dimensão Tempo"
        verbose_name_plural = "Dimensões Tempo"

    def __str__(self):
        return f"{self.data_registro} ({self.id_tempo})"

class DimUnidade(models.Model):
    id_unidade = models.AutoField(primary_key=True)
    nome_unidade = models.CharField(max_length=255)
    tipo_leito = models.CharField(max_length=100)
    capacidade_maxima = models.IntegerField()

    class Meta:
        verbose_name = "Dimensão Unidade"
        verbose_name_plural = "Dimensões Unidade"

    def __str__(self):
        return self.nome_unidade

class DimPaciente(models.Model):
    id_paciente = models.AutoField(primary_key=True)
    pontuacao_nps = models.IntegerField()
    faixa_etaria = models.CharField(max_length=50)

    class Meta:
        verbose_name = "Dimensão Paciente"
        verbose_name_plural = "Dimensões Paciente"

    def __str__(self):
        return f"Paciente {self.id_paciente}"

class FatoAtendimentos(models.Model):
    id_atendimento = models.AutoField(primary_key=True)
    id_tempo = models.ForeignKey(DimTempo, on_delete=models.CASCADE)
    id_unidade = models.ForeignKey(DimUnidade, on_delete=models.CASCADE)
    id_paciente = models.ForeignKey(DimPaciente, on_delete=models.CASCADE)
    tempo_permanencia_dias = models.IntegerField()
    status_alta = models.CharField(max_length=100)
    reinternacao_30d = models.BooleanField()

    class Meta:
        verbose_name = "Fato Atendimento"
        verbose_name_plural = "Fato Atendimentos"

    def __str__(self):
        return f"Atendimento {self.id_atendimento}"

class DimMedicamento(models.Model):
    id_medicamento = models.AutoField(primary_key=True)
    nome_farmaco = models.CharField(max_length=255)
    classe_terapeutica = models.CharField(max_length=100)
    custo_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    item_essencial = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Dimensão Medicamento"
        verbose_name_plural = "Dimensões Medicamento"

    def __str__(self):
        return self.nome_farmaco

class FatoEstoque(models.Model):
    id_movimentacao = models.AutoField(primary_key=True)
    id_medicamento = models.ForeignKey(DimMedicamento, on_delete=models.CASCADE)
    id_tempo = models.ForeignKey(DimTempo, on_delete=models.CASCADE)
    id_unidade = models.ForeignKey(DimUnidade, on_delete=models.CASCADE)
    quantidade_saida = models.FloatField()
    saldo_atual = models.FloatField()

    class Meta:
        verbose_name = "Fato Estoque"
        verbose_name_plural = "Fato Estoque"

    def __str__(self):
        return f"Mov {self.id_movimentacao} - {self.id_medicamento.nome_farmaco}"

class FatoErrosMedicao(models.Model):
    id_evento = models.AutoField(primary_key=True)
    id_medicamento = models.ForeignKey(DimMedicamento, on_delete=models.CASCADE)
    id_paciente = models.ForeignKey(DimPaciente, on_delete=models.CASCADE)
    id_tempo = models.ForeignKey(DimTempo, on_delete=models.CASCADE)
    tipo_erro = models.CharField(max_length=100)
    severidade = models.CharField(max_length=50)

    class Meta:
        verbose_name = "Fato Erro Medicação"
        verbose_name_plural = "Fato Erros Medicação"

    def __str__(self):
        return f"Erro {self.id_evento} - {self.id_medicamento.nome_farmaco}"

class DimTipoProcedimento(models.Model):
    id_tipo_procedimento = models.AutoField(primary_key=True)
    nome_procedimento = models.CharField(max_length=255)
    especialidade = models.CharField(max_length=100)
    valor_base = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = "Dimensão Tipo Procedimento"
        verbose_name_plural = "Dimensões Tipo Procedimento"

    def __str__(self):
        return self.nome_procedimento

class DimEquipamento(models.Model):
    id_equipamento = models.AutoField(primary_key=True)
    nome_maquina = models.CharField(max_length=255)
    modelo = models.CharField(max_length=100)
    ultima_manutencao = models.DateTimeField()

    class Meta:
        verbose_name = "Dimensão Equipamento"
        verbose_name_plural = "Dimensões Equipamento"

    def __str__(self):
        return f"{self.nome_maquina} ({self.modelo})"

class FatoProcedimentos(models.Model):
    id_procedimento_instancia = models.AutoField(primary_key=True)
    id_tipo_procedimento = models.ForeignKey(DimTipoProcedimento, on_delete=models.CASCADE)
    id_unidade = models.ForeignKey(DimUnidade, on_delete=models.CASCADE)
    id_tempo = models.ForeignKey(DimTempo, on_delete=models.CASCADE)
    id_equipamento = models.ForeignKey(DimEquipamento, on_delete=models.SET_NULL, null=True, blank=True)
    tempo_preparo_minutos = models.FloatField()
    tempo_execucao_minutos = models.FloatField()
    tempo_limpeza_minutos = models.FloatField()
    status_agendamento = models.CharField(max_length=50) # Realizado, Cancelado, Agendado

    class Meta:
        verbose_name = "Fato Procedimento"
        verbose_name_plural = "Fato Procedimentos"

    def __str__(self):
        return f"Proc {self.id_procedimento_instancia} - {self.id_tipo_procedimento.nome_procedimento}"

class FatoInfraestrutura(models.Model):
    id_registro = models.AutoField(primary_key=True)
    id_unidade = models.ForeignKey(DimUnidade, on_delete=models.CASCADE)
    id_tempo = models.ForeignKey(DimTempo, on_delete=models.CASCADE)
    consumo_agua_m3 = models.FloatField()
    consumo_energia_kwh = models.FloatField()
    total_colaboradores_ativos = models.IntegerField()
    eventos_infeccao = models.IntegerField()

    class Meta:
        verbose_name = "Fato Infraestrutura"
        verbose_name_plural = "Fato Infraestrutura"

    def __str__(self):
        return f"Infra {self.id_registro} - {self.id_unidade.nome_unidade}"

class FatoHigienizacao(models.Model):
    id_higienizacao = models.AutoField(primary_key=True)
    id_unidade = models.ForeignKey(DimUnidade, on_delete=models.CASCADE)
    id_tempo = models.ForeignKey(DimTempo, on_delete=models.CASCADE)
    data_hora_saida_paciente = models.DateTimeField()
    data_hora_liberacao_leito = models.DateTimeField()

    class Meta:
        verbose_name = "Fato Higienização"
        verbose_name_plural = "Fato Higienização"

    def __str__(self):
        return f"Higienização {self.id_higienizacao} - {self.id_unidade.nome_unidade}"

class DimMedico(models.Model):
    id_medico = models.AutoField(primary_key=True)
    nome_medico = models.CharField(max_length=255)
    especialidade = models.CharField(max_length=100)
    crm = models.CharField(max_length=20, unique=True)

    class Meta:
        verbose_name = "Dimensão Médico"
        verbose_name_plural = "Dimensões Médico"

    def __str__(self):
        return f"{self.nome_medico} ({self.especialidade})"

class DimProtocolo(models.Model):
    id_protocolo = models.AutoField(primary_key=True)
    nome_protocolo = models.CharField(max_length=255)
    area_medica = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Dimensão Protocolo"
        verbose_name_plural = "Dimensões Protocolo"

    def __str__(self):
        return self.nome_protocolo

class FatoDesempenhoClinico(models.Model):
    id_registro = models.AutoField(primary_key=True)
    id_medico = models.ForeignKey(DimMedico, on_delete=models.CASCADE)
    id_tempo = models.ForeignKey(DimTempo, on_delete=models.CASCADE)
    id_protocolo = models.ForeignKey(DimProtocolo, on_delete=models.CASCADE)
    aderente_ao_protocolo = models.BooleanField(default=True)
    tempo_fechamento_prontuario_min = models.FloatField()

    class Meta:
        verbose_name = "Fato Desempenho Clínico"
        verbose_name_plural = "Fato Desempenho Clínico"

    def __str__(self):
        return f"Desempenho {self.id_registro} - {self.id_medico.nome_medico}"

class FatoEscalaMedica(models.Model):
    id_escala = models.AutoField(primary_key=True)
    id_medico = models.ForeignKey(DimMedico, on_delete=models.CASCADE)
    id_tempo = models.ForeignKey(DimTempo, on_delete=models.CASCADE)
    status_presenca = models.CharField(max_length=50) # Presente, Falta, Atraso
    horas_atraso = models.FloatField(default=0)

    class Meta:
        verbose_name = "Fato Escala Médica"
        verbose_name_plural = "Fato Escalas Médicas"

    def __str__(self):
        return f"Escala {self.id_escala} - {self.id_medico.nome_medico}"

class DimConvenio(models.Model):
    id_convenio = models.AutoField(primary_key=True)
    nome_operadora = models.CharField(max_length=255)
    tipo_contrato = models.CharField(max_length=100)
    prazo_contratual_pagamento = models.IntegerField() # em dias

    class Meta:
        verbose_name = "Dimensão Convênio"
        verbose_name_plural = "Dimensões Convênio"

    def __str__(self):
        return self.nome_operadora

class FatoFinanceiro(models.Model):
    id_transacao = models.AutoField(primary_key=True)
    id_tempo = models.ForeignKey(DimTempo, on_delete=models.CASCADE)
    id_unidade = models.ForeignKey(DimUnidade, on_delete=models.CASCADE)
    id_convenio = models.ForeignKey(DimConvenio, on_delete=models.CASCADE)
    receita_bruta = models.FloatField()
    valor_glosa_inicial = models.FloatField()
    valor_glosa_recuperada = models.FloatField()
    custos_operacionais = models.FloatField()
    data_pagamento_prevista = models.DateField()
    data_pagamento_real = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Fato Financeiro"
        verbose_name_plural = "Fato Financeiro"

    def __str__(self):
        return f"Transação {self.id_transacao} - {self.id_convenio.nome_operadora}"
