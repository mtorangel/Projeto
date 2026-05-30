from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authentication import TokenAuthentication
from django.utils import timezone
from .models import LogSincronizacao
from indicadores import models as m

class GenericIntegrationView(APIView):
    """
    Endpoint universal para integração de qualquer tabela do sistema.
    Suporta Dimensões e Fatos com lógica de Upsert.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, model_name):
        # Suporte a CSV ou JSON
        if 'text/csv' in request.content_type:
            import csv
            import io
            try:
                decoded_file = request.body.decode('utf-8')
                io_string = io.StringIO(decoded_file)
                reader = csv.DictReader(io_string, delimiter=';')
                dados = [row for row in reader]
            except Exception as e:
                return Response({"erro": f"Falha ao processar CSV: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            dados = request.data

        if not isinstance(dados, list): dados = [dados]
        
        # Mapeamento dinâmico de modelos
        model_map = {
            # Dimensões
            'dim_tempo': m.DimTempo,
            'dim_unidade': m.DimUnidade,
            'dim_paciente': m.DimPaciente,
            'dim_medicamento': m.DimMedicamento,
            'dim_tipo_procedimento': m.DimTipoProcedimento,
            'dim_equipamento': m.DimEquipamento,
            'dim_protocolo': m.DimProtocolo,
            'dim_medico': m.DimMedico,
            'dim_convenio': m.DimConvenio,
            # Fatos
            'fato_atendimentos': m.FatoAtendimentos,
            'fato_estoque': m.FatoEstoque,
            'fato_erros_medicao': m.FatoErrosMedicao,
            'fato_procedimentos': m.FatoProcedimentos,
            'fato_infraestrutura': m.FatoInfraestrutura,
            'fato_higienizacao': m.FatoHigienizacao,
            'fato_desempenho_clinico': m.FatoDesempenhoClinico,
            'fato_escala_medica': m.FatoEscalaMedica,
            'fato_financeiro': m.FatoFinanceiro,
        }

        if model_name not in model_map:
            return Response({"erro": "Tabela não encontrada."}, status=status.HTTP_404_NOT_FOUND)

        model = model_map[model_name]
        processados = 0
        
        try:
            for item in dados:
                # Extrair a PK (geralmente id_...)
                pk_field = [f.name for f in model._meta.fields if f.primary_key][0]
                pk_value = item.get(pk_field)
                
                # Tratar campos de Foreing Key (Placeholder Logic)
                clean_data = {}
                valid_fields = [f.name for f in model._meta.fields]
                
                for key, value in item.items():
                    if key not in valid_fields:
                        continue # Ignora colunas que não existem no banco
                    
                    field = model._meta.get_field(key)
                    if field.is_relation and value:
                        related_model = field.related_model
                        # Tentar buscar a FK, se não existir, cria placeholder dinâmico
                        rel_pk_field = [f.name for f in related_model._meta.fields if f.primary_key][0]
                        
                        # Gerar defaults inteligentes baseados nos campos reais do modelo
                        model_fields = [f.name for f in related_model._meta.get_fields()]
                        field_map = {
                            'nome_unidade': 'Unidade Automática',
                            'nome_farmaco': 'Medicamento Automático',
                            'nome_medico': 'Médico Automático',
                            'nome_procedimento': 'Procedimento Automático',
                            'nome_protocolo': 'Protocolo Automático',
                            'nome_operadora': 'Convênio Automático',
                            'nome_maquina': 'Equipamento Automático',
                            'faixa_etaria': 'Não Informada',
                            'tipo_leito': 'Não Informado',
                            'tipo_contrato': 'Padrão',
                            'especialidade': 'Geral',
                            'crm': f'NI-{value}',
                            'prazo_contratual_pagamento': 30,
                            'data_registro': timezone.now().date(),
                            'mes': timezone.now().month,
                            'ano': timezone.now().year,
                            'capacidade_maxima': 0,
                            'pontuacao_nps': 0,
                            'custo_unitario': 0.0,
                            'valor_base': 0.0,
                        }
                        
                        defaults = {k: v for k, v in field_map.items() if k in model_fields}
                        
                        # Fallback para campos numéricos obrigatórios não mapeados
                        for f in related_model._meta.fields:
                            if f.name in model_fields and f.name not in defaults and not f.null and f.name != rel_pk_field:
                                if isinstance(f, (m.models.IntegerField, m.models.FloatField, m.models.DecimalField)):
                                    defaults[f.name] = 0
                                elif isinstance(f, m.models.CharField):
                                    defaults[f.name] = "NI"
                        
                        related_obj, _ = related_model.objects.get_or_create(
                            **{rel_pk_field: value},
                            defaults=defaults
                        )
                        clean_data[key] = related_obj
                    else:
                        clean_data[key] = value

                # Upsert Real
                model.objects.update_or_create(**{pk_field: pk_value}, defaults=clean_data)
                processados += 1

            # Log do Monitor
            LogSincronizacao.objects.update_or_create(
                categoria=model_name,
                defaults={'ultima_sincronizacao': timezone.now(), 'status': 'Sucesso', 'registros_processados': processados}
            )

            return Response({
                "mensagem": "Sincronização concluída",
                "registros_processados": processados
            }, status=status.HTTP_200_OK)

        except Exception as e:
            LogSincronizacao.objects.update_or_create(categoria=model_name, defaults={'status': 'Erro', 'ultima_sincronizacao': timezone.now()})
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StatusIntegracaoView(APIView):
    def get(self, request):
        logs = LogSincronizacao.objects.all().values()
        return Response(list(logs))
