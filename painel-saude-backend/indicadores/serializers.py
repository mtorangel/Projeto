from rest_framework import serializers
from .models import (
    DimTempo, DimUnidade, DimPaciente, FatoAtendimentos,
    DimMedicamento, FatoEstoque, FatoErrosMedicao,
    DimTipoProcedimento, DimEquipamento, FatoProcedimentos,
    FatoInfraestrutura, FatoHigienizacao,
    DimMedico, DimProtocolo, FatoDesempenhoClinico, FatoEscalaMedica,
    DimConvenio, FatoFinanceiro
)

class DimTempoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DimTempo
        fields = '__all__'

class DimUnidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DimUnidade
        fields = '__all__'

class DimPacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DimPaciente
        fields = '__all__'

class FatoAtendimentosSerializer(serializers.ModelSerializer):
    class Meta:
        model = FatoAtendimentos
        fields = '__all__'

class DimMedicamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DimMedicamento
        fields = '__all__'

class FatoEstoqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = FatoEstoque
        fields = '__all__'

class FatoErrosMedicaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FatoErrosMedicao
        fields = '__all__'

class DimTipoProcedimentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DimTipoProcedimento
        fields = '__all__'

class DimEquipamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DimEquipamento
        fields = '__all__'

class FatoProcedimentosSerializer(serializers.ModelSerializer):
    class Meta:
        model = FatoProcedimentos
        fields = '__all__'

class FatoInfraestruturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FatoInfraestrutura
        fields = '__all__'

class FatoHigienizacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FatoHigienizacao
        fields = '__all__'

class DimMedicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DimMedico
        fields = '__all__'

class DimProtocoloSerializer(serializers.ModelSerializer):
    class Meta:
        model = DimProtocolo
        fields = '__all__'

class FatoDesempenhoClinicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FatoDesempenhoClinico
        fields = '__all__'

class FatoEscalaMedicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FatoEscalaMedica
        fields = '__all__'

class DimConvenioSerializer(serializers.ModelSerializer):
    class Meta:
        model = DimConvenio
        fields = '__all__'

class FatoFinanceiroSerializer(serializers.ModelSerializer):
    class Meta:
        model = FatoFinanceiro
        fields = '__all__'
