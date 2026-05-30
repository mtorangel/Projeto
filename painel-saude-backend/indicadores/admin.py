from django.contrib import admin
from .models import (
    DimTempo, DimUnidade, DimPaciente, FatoAtendimentos,
    DimMedicamento, FatoEstoque, FatoErrosMedicao,
    DimTipoProcedimento, DimEquipamento, FatoProcedimentos,
    FatoInfraestrutura, FatoHigienizacao,
    DimMedico, DimProtocolo, FatoDesempenhoClinico, FatoEscalaMedica,
    DimConvenio, FatoFinanceiro
)

@admin.register(DimTempo)
class DimTempoAdmin(admin.ModelAdmin):
    list_display = ('id_tempo', 'data_registro', 'mes', 'ano')
    list_filter = ('ano', 'mes')

@admin.register(DimUnidade)
class DimUnidadeAdmin(admin.ModelAdmin):
    list_display = ('id_unidade', 'nome_unidade', 'tipo_leito', 'capacidade_maxima')
    search_fields = ('nome_unidade', 'tipo_leito')

@admin.register(DimPaciente)
class DimPacienteAdmin(admin.ModelAdmin):
    list_display = ('id_paciente', 'pontuacao_nps', 'faixa_etaria')
    list_filter = ('faixa_etaria',)

@admin.register(FatoAtendimentos)
class FatoAtendimentosAdmin(admin.ModelAdmin):
    list_display = ('id_atendimento', 'id_tempo', 'id_unidade', 'id_paciente', 'tempo_permanencia_dias', 'status_alta', 'reinternacao_30d')
    list_filter = ('status_alta', 'reinternacao_30d')

@admin.register(DimMedicamento)
class DimMedicamentoAdmin(admin.ModelAdmin):
    list_display = ('id_medicamento', 'nome_farmaco', 'classe_terapeutica', 'custo_unitario', 'item_essencial')
    list_filter = ('classe_terapeutica', 'item_essencial')
    search_fields = ('nome_farmaco',)

@admin.register(FatoEstoque)
class FatoEstoqueAdmin(admin.ModelAdmin):
    list_display = ('id_movimentacao', 'id_medicamento', 'id_tempo', 'id_unidade', 'quantidade_saida', 'saldo_atual')
    list_filter = ('id_unidade', 'id_medicamento')

@admin.register(FatoErrosMedicao)
class FatoErrosMedicaoAdmin(admin.ModelAdmin):
    list_display = ('id_evento', 'id_medicamento', 'id_paciente', 'tipo_erro', 'severidade')
    list_filter = ('severidade', 'tipo_erro')

@admin.register(DimTipoProcedimento)
class DimTipoProcedimentoAdmin(admin.ModelAdmin):
    list_display = ('id_tipo_procedimento', 'nome_procedimento', 'especialidade', 'valor_base')
    search_fields = ('nome_procedimento',)

@admin.register(DimEquipamento)
class DimEquipamentoAdmin(admin.ModelAdmin):
    list_display = ('id_equipamento', 'nome_maquina', 'modelo', 'ultima_manutencao')
    search_fields = ('nome_maquina',)

@admin.register(FatoProcedimentos)
class FatoProcedimentosAdmin(admin.ModelAdmin):
    list_display = ('id_procedimento_instancia', 'id_tipo_procedimento', 'id_unidade', 'status_agendamento')
    list_filter = ('status_agendamento', 'id_unidade')

@admin.register(FatoInfraestrutura)
class FatoInfraestruturaAdmin(admin.ModelAdmin):
    list_display = ('id_registro', 'id_unidade', 'id_tempo', 'eventos_infeccao')
    list_filter = ('id_unidade',)

@admin.register(FatoHigienizacao)
class FatoHigienizacaoAdmin(admin.ModelAdmin):
    list_display = ('id_higienizacao', 'id_unidade', 'data_hora_saida_paciente', 'data_hora_liberacao_leito')
    list_filter = ('id_unidade',)

@admin.register(DimMedico)
class DimMedicoAdmin(admin.ModelAdmin):
    list_display = ('id_medico', 'nome_medico', 'especialidade', 'crm')
    search_fields = ('nome_medico', 'especialidade', 'crm')

@admin.register(DimProtocolo)
class DimProtocoloAdmin(admin.ModelAdmin):
    list_display = ('id_protocolo', 'nome_protocolo', 'area_medica')
    search_fields = ('nome_protocolo',)

@admin.register(FatoDesempenhoClinico)
class FatoDesempenhoClinicoAdmin(admin.ModelAdmin):
    list_display = ('id_registro', 'id_medico', 'aderente_ao_protocolo', 'tempo_fechamento_prontuario_min')
    list_filter = ('aderente_ao_protocolo', 'id_medico__especialidade')

@admin.register(FatoEscalaMedica)
class FatoEscalaMedicaAdmin(admin.ModelAdmin):
    list_display = ('id_escala', 'id_medico', 'status_presenca', 'horas_atraso')
    list_filter = ('status_presenca',)

@admin.register(DimConvenio)
class DimConvenioAdmin(admin.ModelAdmin):
    list_display = ('id_convenio', 'nome_operadora', 'tipo_contrato', 'prazo_contratual_pagamento')
    search_fields = ('nome_operadora',)

@admin.register(FatoFinanceiro)
class FatoFinanceiroAdmin(admin.ModelAdmin):
    list_display = ('id_transacao', 'id_convenio', 'receita_bruta', 'custos_operacionais', 'data_pagamento_real')
    list_filter = ('id_convenio', 'id_unidade')
