from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DimTempoViewSet, DimUnidadeViewSet, 
    DimPacienteViewSet, FatoAtendimentosViewSet,
    DimMedicamentoViewSet, FatoEstoqueViewSet, FatoErrosMedicaoViewSet,
    DimTipoProcedimentoViewSet, DimEquipamentoViewSet, FatoProcedimentosViewSet,
    FatoInfraestruturaViewSet, FatoHigienizacaoViewSet,
    DimMedicoViewSet, DimProtocoloViewSet, FatoDesempenhoClinicoViewSet, FatoEscalaMedicaViewSet,
    DimConvenioViewSet, FatoFinanceiroViewSet
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
    path('', include(router.urls)),
]
