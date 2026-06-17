from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DimTempoViewSet, DimUnidadeViewSet, 
    DimPacienteViewSet, FatoAtendimentosViewSet,
    DimMedicamentoViewSet, FatoEstoqueViewSet, FatoErrosMedicaoViewSet,
    DimTipoProcedimentoViewSet, DimEquipamentoViewSet, FatoProcedimentosViewSet,
    FatoInfraestruturaViewSet, FatoHigienizacaoViewSet,
    DimMedicoViewSet, DimProtocoloViewSet, FatoDesempenhoClinicoViewSet, FatoEscalaMedicaViewSet,
    DimConvenioViewSet, FatoFinanceiroViewSet, AuditoriaFaturamentoView, RegulacaoFilaView,
    MatrizRiscoView, ExplicarIndicadorView, DatabaseStatsView, SeedDataView,
    ChatExecutivoView, UploadDocumentoView, HistoricoResumosView
)

router = DefaultRouter()
router.register(r'tempo', DimTempoViewSet)
router.register(r'unidades', DimUnidadeViewSet)
router.register(r'pacientes', DimPacienteViewSet)
router.register(r'atendimentos', FatoAtendimentosViewSet)
router.register(r'medicamentos', DimMedicamentoViewSet)
router.register(r'estoque', FatoEstoqueViewSet)
router.register(r'erros-medicao', FatoErrosMedicaoViewSet)
router.register(r'tipos-procedimento', DimTipoProcedimentoViewSet)
router.register(r'equipamentos', DimEquipamentoViewSet)
router.register(r'procedimentos', FatoProcedimentosViewSet)
router.register(r'infraestrutura', FatoInfraestruturaViewSet)
router.register(r'higienizacao', FatoHigienizacaoViewSet)
router.register(r'medicos', DimMedicoViewSet)
router.register(r'protocolos', DimProtocoloViewSet)
router.register(r'desempenho-clinico', FatoDesempenhoClinicoViewSet)
router.register(r'escala-medica', FatoEscalaMedicaViewSet)
router.register(r'convenios', DimConvenioViewSet)
router.register(r'financeiro', FatoFinanceiroViewSet)

urlpatterns = [
    path('financeiro/auditoria/', AuditoriaFaturamentoView.as_view(), name='auditoria_financeira'),
    path('procedimentos/regulacao/', RegulacaoFilaView.as_view(), name='regulacao_fila'),
    path('desempenho-clinico/matriz-risco/', MatrizRiscoView.as_view(), name='matriz_risco'),
    path('ai/explicar-indicador/', ExplicarIndicadorView.as_view(), name='ai_explicar_indicador'),
    path('ai/chat-executivo/', ChatExecutivoView.as_view(), name='ai_chat_executivo'),
    path('ai/upload-documento/', UploadDocumentoView.as_view(), name='ai_upload_documento'),
    path('ai/historico-resumos/', HistoricoResumosView.as_view(), name='ai_historico_resumos'),
    path('admin/database-stats/', DatabaseStatsView.as_view(), name='database_stats'),
    path('admin/seed-data/', SeedDataView.as_view(), name='seed_data'),
    path('', include(router.urls)),
]
