from rest_framework import viewsets, response, permissions
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.authentication import TokenAuthentication
from django.db.models import Avg, Count, Q, Sum, F, ExpressionWrapper, fields
from django.db import connection
from django.utils import timezone
import os
import sys
import subprocess
import requests
import urllib3.util.connection as urllib3_cn
urllib3_cn.HAS_IPV6 = False
import unicodedata
import re
from .models import (
    DimTempo, DimUnidade, DimPaciente, FatoAtendimentos,
    DimMedicamento, FatoEstoque, FatoErrosMedicao,
    DimTipoProcedimento, DimEquipamento, FatoProcedimentos,
    FatoInfraestrutura, FatoHigienizacao,
    DimMedico, DimProtocolo, FatoDesempenhoClinico, FatoEscalaMedica,
    DimConvenio, FatoFinanceiro
)
from .serializers import (
    DimTempoSerializer, DimUnidadeSerializer, 
    DimPacienteSerializer, FatoAtendimentosSerializer,
    DimMedicamentoSerializer, FatoEstoqueSerializer, FatoErrosMedicaoSerializer,
    DimTipoProcedimentoSerializer, DimEquipamentoSerializer, FatoProcedimentosSerializer,
    FatoInfraestruturaSerializer, FatoHigienizacaoSerializer,
    DimMedicoSerializer, DimProtocoloSerializer, FatoDesempenhoClinicoSerializer, FatoEscalaMedicaSerializer,
    DimConvenioSerializer, FatoFinanceiroSerializer
)

def apply_filters(queryset, request):
    """Auxiliar para aplicar filtros de Ano, Mês, Unidade e Convênio."""
    ano = request.query_params.get('ano')
    mes = request.query_params.get('mes')
    unidade = request.query_params.get('unidade')
    convenio = request.query_params.get('convenio')

    # Filtros de Tempo (comum a todos os Fatos)
    if ano: queryset = queryset.filter(id_tempo__ano=ano)
    if mes: queryset = queryset.filter(id_tempo__mes=mes)
    
    # Filtro de Unidade (se o modelo tiver o campo)
    fields = [f.name for f in queryset.model._meta.fields]
    if unidade and 'id_unidade' in fields:
        queryset = queryset.filter(id_unidade=unidade)
    
    # Filtro de Convênio (se o modelo tiver o campo)
    if convenio and 'id_convenio' in fields:
        queryset = queryset.filter(id_convenio=convenio)
        
    return queryset

class DimTempoViewSet(viewsets.ModelViewSet):
    queryset = DimTempo.objects.all()
    serializer_class = DimTempoSerializer

class DimUnidadeViewSet(viewsets.ModelViewSet):
    queryset = DimUnidade.objects.all()
    serializer_class = DimUnidadeSerializer

class DimPacienteViewSet(viewsets.ModelViewSet):
    queryset = DimPaciente.objects.all()
    serializer_class = DimPacienteSerializer

class DimMedicamentoViewSet(viewsets.ModelViewSet):
    queryset = DimMedicamento.objects.all()
    serializer_class = DimMedicamentoSerializer

class FatoEstoqueViewSet(viewsets.ModelViewSet):
    queryset = FatoEstoque.objects.all()
    serializer_class = FatoEstoqueSerializer

class FatoErrosMedicaoViewSet(viewsets.ModelViewSet):
    queryset = FatoErrosMedicao.objects.all()
    serializer_class = FatoErrosMedicaoSerializer

class DimTipoProcedimentoViewSet(viewsets.ModelViewSet):
    queryset = DimTipoProcedimento.objects.all()
    serializer_class = DimTipoProcedimentoSerializer

class DimEquipamentoViewSet(viewsets.ModelViewSet):
    queryset = DimEquipamento.objects.all()
    serializer_class = DimEquipamentoSerializer

class FatoProcedimentosViewSet(viewsets.ModelViewSet):
    queryset = FatoProcedimentos.objects.all()
    serializer_class = FatoProcedimentosSerializer

    @action(detail=False, methods=['get'])
    def procedure_stats(self, request):
        qs = apply_filters(FatoProcedimentos.objects.all(), request)
        total = qs.count()
        cancelados = qs.filter(status_agendamento='Cancelado').count()
        taxa_suspensao = (cancelados / total * 100) if total > 0 else 0
        giro_medio = qs.aggregate(media=Avg(F('tempo_preparo_minutos') + F('tempo_limpeza_minutos')))['media'] or 0
        produtividade = qs.values('id_equipamento__nome_maquina').annotate(total=Count('id_procedimento_instancia')).order_by('-total')
        return response.Response({
            "taxa_suspensao": round(taxa_suspensao, 1),
            "giro_medio_minutos": round(giro_medio, 1),
            "produtividade_equipamento": list(produtividade),
            "taxa_conversao": 78.5,
            "registros_afetados": total
        })

class FatoInfraestruturaViewSet(viewsets.ModelViewSet):
    queryset = FatoInfraestrutura.objects.all()
    serializer_class = FatoInfraestruturaSerializer

    @action(detail=False, methods=['get'])
    def hospital_stats(self, request):
        qs_infra = apply_filters(FatoInfraestrutura.objects.all(), request)
        qs_atend = apply_filters(FatoAtendimentos.objects.all(), request)
        
        total_saidas = qs_atend.count()
        total_infeccoes = qs_infra.aggregate(total=Sum('eventos_infeccao'))['total'] or 0
        taxa_iras = (total_infeccoes / total_saidas * 100) if total_saidas > 0 else 0
        
        higienizacoes = apply_filters(FatoHigienizacao.objects.all(), request)
        duracoes = [(h.data_hora_liberacao_leito - h.data_hora_saida_paciente).total_seconds() / 60 for h in higienizacoes]
        intervalo_medio = sum(duracoes) / len(duracoes) if duracoes else 0
        consumo_tendencia = qs_infra.values('id_tempo__data_registro').annotate(agua=Sum('consumo_agua_m3'), energia=Sum('consumo_energia_kwh')).order_by('id_tempo__data_registro')
        return response.Response({
            "taxa_iras": round(taxa_iras, 2),
            "intervalo_substituicao": round(intervalo_medio, 1),
            "consumo_tendencia": list(consumo_tendencia),
            "densidade_rh": 0.85,
            "registros_afetados": qs_infra.count()
        })

class DimMedicoViewSet(viewsets.ModelViewSet):
    queryset = DimMedico.objects.all()
    serializer_class = DimMedicoSerializer

class FatoDesempenhoClinicoViewSet(viewsets.ModelViewSet):
    queryset = FatoDesempenhoClinico.objects.all()
    serializer_class = FatoDesempenhoClinicoSerializer

    @action(detail=False, methods=['get'])
    def medical_stats(self, request):
        from django.db.models import Case, When, Value, FloatField
        qs_desempenho = apply_filters(FatoDesempenhoClinico.objects.all(), request)
        qs_escala = apply_filters(FatoEscalaMedica.objects.all(), request)
        
        adesao = qs_desempenho.values('id_protocolo__area_medica').annotate(valor=Avg(Case(When(aderente_ao_protocolo=True, then=Value(100.0)), default=Value(0.0), output_field=FloatField())))
        prontuario = qs_desempenho.values('id_medico__especialidade').annotate(media=Avg('tempo_fechamento_prontuario_min'))
        volume = qs_desempenho.values('id_medico__especialidade').annotate(total=Count('id_registro'))
        
        total_escalas = qs_escala.count()
        faltas = qs_escala.filter(status_presenca__in=['Falta', 'Falta Justificada']).count()
        taxa_absenteismo = (faltas / total_escalas * 100) if total_escalas > 0 else 0
        return response.Response({
            "adesao_protocolo": list(adesao),
            "tempo_prontuario": list(prontuario),
            "volume_especialidade": list(volume),
            "taxa_absenteismo": round(taxa_absenteismo, 1),
            "registros_afetados": qs_desempenho.count()
        })

class DimConvenioViewSet(viewsets.ModelViewSet):
    queryset = DimConvenio.objects.all()
    serializer_class = DimConvenioSerializer

class FatoFinanceiroViewSet(viewsets.ModelViewSet):
    queryset = FatoFinanceiro.objects.all()
    serializer_class = FatoFinanceiroSerializer

    @action(detail=False, methods=['get'])
    def financial_stats(self, request):
        qs = apply_filters(FatoFinanceiro.objects.all(), request)
        totals = qs.aggregate(
            receita=Sum('receita_bruta'),
            custos=Sum('custos_operacionais'),
            glosa_inicial=Sum('valor_glosa_inicial'),
            glosa_recuperada=Sum('valor_glosa_recuperada')
        )
        
        ebitda = (totals['receita'] or 0) - (totals['custos'] or 0) - ((totals['glosa_inicial'] or 0) - (totals['glosa_recuperada'] or 0))

        # 2. PMR (Prazo Médio de Recebimento)
        prazos = qs.filter(data_pagamento_real__isnull=False).annotate(
            prazo=F('data_pagamento_real') - F('id_tempo__data_registro')
        ).aggregate(avg_prazo=Avg('prazo'))
        
        pmr_dias = prazos['avg_prazo'].days if prazos['avg_prazo'] else 0

        # 3. Glosas por Convênio (Barras Comparativas)
        glosas_convenio = qs.values('id_convenio__nome_operadora').annotate(
            faturado=Sum('valor_glosa_inicial'),
            recebido=Sum('valor_glosa_recuperada')
        )

        filtered_atendimentos_count = apply_filters(FatoAtendimentos.objects.all(), request).count()

        return response.Response({
            "ebitda_components": {
                "receita": totals['receita'] or 0,
                "custos": totals['custos'] or 0,
                "glosa_perda": (totals['glosa_inicial'] or 0) - (totals['glosa_recuperada'] or 0),
                "ebitda": ebitda
            },
            "pmr_dias": pmr_dias,
            "glosas_convenio": list(glosas_convenio),
            "ticket_medio": round((totals['receita'] or 0) / filtered_atendimentos_count, 2) if filtered_atendimentos_count > 0 else 0,
            "registros_afetados": qs.count()
        })

class FatoEscalaMedicaViewSet(viewsets.ModelViewSet):
    queryset = FatoEscalaMedica.objects.all()
    serializer_class = FatoEscalaMedicaSerializer

class DimProtocoloViewSet(viewsets.ModelViewSet):
    queryset = DimProtocolo.objects.all()
    serializer_class = DimProtocoloSerializer

class FatoHigienizacaoViewSet(viewsets.ModelViewSet):
    queryset = FatoHigienizacao.objects.all()
    serializer_class = FatoHigienizacaoSerializer

class FatoAtendimentosViewSet(viewsets.ModelViewSet):
    queryset = FatoAtendimentos.objects.all()
    serializer_class = FatoAtendimentosSerializer

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        qs = apply_filters(FatoAtendimentos.objects.all(), request)
        stats = qs.aggregate(
            total_atendimentos=Count('id_atendimento'),
            media_permanencia=Avg('tempo_permanencia_dias'),
            total_reinternacoes=Count('id_atendimento', filter=Q(reinternacao_30d=True))
        )
        stats['nps_medio'] = DimPaciente.objects.aggregate(Avg('pontuacao_nps'))['pontuacao_nps__avg']
        
        # Calcular capacidade de leitos dinamica
        unidade_id = request.query_params.get('unidade')
        if unidade_id:
            cap_sum = DimUnidade.objects.filter(id_unidade=unidade_id).aggregate(total=Sum('capacidade_maxima'))['total'] or 545
        else:
            cap_sum = DimUnidade.objects.aggregate(total=Sum('capacidade_maxima'))['total'] or 545
            
        # Determinar quantidade de dias no periodo filtrado
        ano = request.query_params.get('ano')
        mes = request.query_params.get('mes')
        days = 30
        if mes:
            try:
                import calendar
                y = int(ano) if ano else timezone.now().year
                m = int(mes)
                _, days = calendar.monthrange(y, m)
            except Exception:
                days = 30
        elif ano:
            days = 365
            
        tot_atend = stats.get('total_atendimentos') or 0
        avg_stay = stats.get('media_permanencia') or 0
        
        if tot_atend > 0 and cap_sum > 0:
            # Little's Law: Ocupacao = (Atendimentos_Periodo / Dias * TMP) / Capacidade
            avg_daily_arrivals = tot_atend / days
            avg_active_patients = avg_daily_arrivals * float(avg_stay)
            occupancy_rate = (avg_active_patients / cap_sum) * 100
            stats['taxa_ocupacao'] = min(round(occupancy_rate, 1), 100.0)
        else:
            stats['taxa_ocupacao'] = 0.0
            
        stats['capacidade_leitos'] = cap_sum

        # Quantidade atendida por unidade de saude
        atends_por_unidade = qs.values('id_unidade__nome_unidade').annotate(total=Count('id_atendimento')).order_by('-total')
        stats['atendimentos_por_unidade'] = [
            {"name": item['id_unidade__nome_unidade'] or "Sem Unidade", "value": item['total']}
            for item in atends_por_unidade
        ]
        
        # Quantidade atendida por convenio (via FatoFinanceiro)
        qs_financeiro = apply_filters(FatoFinanceiro.objects.all(), request)
        atends_por_convenio = qs_financeiro.values('id_convenio__nome_operadora').annotate(total=Count('id_transacao')).order_by('-total')
        stats['atendimentos_por_convenio'] = [
            {"name": item['id_convenio__nome_operadora'] or "Sem Convênio", "value": item['total']}
            for item in atends_por_convenio
        ]
        stats['registros_afetados'] = qs.count()

        return response.Response(stats)

    @action(detail=False, methods=['get'])
    def occupancy_trend(self, request):
        qs = apply_filters(FatoAtendimentos.objects.all(), request)
        trend = qs.values('id_tempo__data_registro').annotate(total=Count('id_atendimento')).order_by('id_tempo__data_registro')
        data = [{"data": item['id_tempo__data_registro'], "total": item['total']} for item in trend]
        return response.Response(data)

    @action(detail=False, methods=['get'])
    def medication_stats(self, request):
        qs_erros = apply_filters(FatoErrosMedicao.objects.all(), request)
        qs_estoque = apply_filters(FatoEstoque.objects.all(), request)
        
        erros_por_tipo = qs_erros.values('tipo_erro').annotate(quantidade=Count('id_evento')).order_by('-quantidade')
        from django.db import models
        custo_total = qs_estoque.aggregate(total=Sum(F('quantidade_saida') * F('id_medicamento__custo_unitario'), output_field=models.DecimalField()))['total'] or 0
        giro = qs_estoque.values('id_medicamento__nome_farmaco').annotate(total_saida=Sum('quantidade_saida'), saldo=Avg('saldo_atual'))
        ruptura_count = qs_estoque.filter(saldo_atual__lt=50).count()
        total_mov = qs_estoque.count()
        taxa_ruptura = (ruptura_count / total_mov * 100) if total_mov > 0 else 0
        return response.Response({
            "erros_por_tipo": list(erros_por_tipo),
            "custo_total": float(custo_total),
            "giro_estoque": list(giro),
            "taxa_ruptura": round(taxa_ruptura, 1),
            "registros_afetados": total_mov
        })


# =============================================================
#  BI Custom Views
# =============================================================

class AuditoriaFaturamentoView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        has_high_ids = False
        with connection.cursor() as cursor:
            cursor.execute("SELECT MAX(id_transacao) FROM indicadores_fatofinanceiro")
            res_max = cursor.fetchone()
            if res_max and res_max[0] and res_max[0] > 20000:
                has_high_ids = True

        join_cond = "d.id_registro = (f.id_transacao - 20000)" if has_high_ids else "d.id_registro = f.id_transacao"

        ano = request.query_params.get("ano")
        mes = request.query_params.get("mes")
        unidade_filtro = request.query_params.get("unidade")
        convenio_filtro = request.query_params.get("convenio")

        query = f"""
            SELECT 
                f.receita_bruta,
                f.valor_glosa_inicial,
                f.valor_glosa_recuperada,
                u.nome_unidade,
                COALESCE(m.especialidade, 'Clínica Geral') as especialidade,
                COALESCE(d.tempo_fechamento_prontuario_min, 0) as tempo_fechamento_prontuario_min,
                t.data_registro,
                t.mes,
                t.ano
            FROM indicadores_fatofinanceiro f
            INNER JOIN indicadores_dimconvenio c ON f.id_convenio_id = c.id_convenio
            INNER JOIN indicadores_dimunidade u ON f.id_unidade_id = u.id_unidade
            INNER JOIN indicadores_dimtempo t ON f.id_tempo_id = t.id_tempo
            LEFT JOIN indicadores_fatodesempenhoclinico d ON {join_cond}
            LEFT JOIN indicadores_dimmedico m ON d.id_medico_id = m.id_medico
            WHERE c.nome_operadora ILIKE '%%SUS%%'
        """
        params = []
        if ano:
            query += " AND t.ano = %s"
            params.append(int(ano))
        if mes:
            query += " AND t.mes = %s"
            params.append(int(mes))
        if unidade_filtro:
            query += " AND f.id_unidade_id = %s"
            params.append(int(unidade_filtro))
        if convenio_filtro:
            query += " AND f.id_convenio_id = %s"
            params.append(int(convenio_filtro))

        with connection.cursor() as cursor:
            cursor.execute(query, params)
            columns = [col[0] for col in cursor.description]
            rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

        if not rows:
            return response.Response({
                "kpis": {
                    "faturamento_sus": 0.0,
                    "indice_glosa_inicial": 0.0,
                    "taxa_recuperacao": 0.0,
                    "evasao_receita": 0.0
                },
                "evolucao_temporal": [],
                "correlacao_prontuario": [],
                "tabela_analitica": []
            })

        total_faturamento = sum(r['receita_bruta'] for r in rows)
        total_glosa_inicial = sum(r['valor_glosa_inicial'] for r in rows)
        total_glosa_recuperada = sum(r['valor_glosa_recuperada'] for r in rows)
        
        evasao_receita = total_glosa_inicial - total_glosa_recuperada
        indice_glosa_inicial = (total_glosa_inicial / total_faturamento * 100) if total_faturamento > 0 else 0
        taxa_recuperacao = (total_glosa_recuperada / total_glosa_inicial * 100) if total_glosa_inicial > 0 else 0

        evolucao = {}
        for r in rows:
            mes_ano = f"{r['mes']:02d}/{r['ano']}"
            if mes_ano not in evolucao:
                evolucao[mes_ano] = {"receita_bruta": 0.0, "glosa_inicial": 0.0}
            evolucao[mes_ano]["receita_bruta"] += r['receita_bruta']
            evolucao[mes_ano]["glosa_inicial"] += r['valor_glosa_inicial']

        def parse_mes_ano(item):
            parts = item[0].split('/')
            return int(parts[1]), int(parts[0])

        sorted_evolucao = sorted(evolucao.items(), key=parse_mes_ano)
        evolucao_temporal_data = []
        for mes_ano, vals in sorted_evolucao:
            receita = vals["receita_bruta"]
            glosa = vals["glosa_inicial"]
            ind_glosa = (glosa / receita * 100) if receita > 0 else 0
            evolucao_temporal_data.append({
                "mes_ano": mes_ano,
                "receita_bruta": round(receita, 2),
                "indice_glosa_inicial": round(ind_glosa, 2)
            })

        correlacao = {}
        for r in rows:
            data_str = str(r['data_registro'])
            if data_str not in correlacao:
                correlacao[data_str] = {"tempo_fechamento": [], "glosa_total": 0.0}
            correlacao[data_str]["tempo_fechamento"].append(r['tempo_fechamento_prontuario_min'])
            correlacao[data_str]["glosa_total"] += r['valor_glosa_inicial']

        correlacao_data = []
        for data_str, vals in correlacao.items():
            avg_tempo = sum(vals["tempo_fechamento"]) / len(vals["tempo_fechamento"]) if vals["tempo_fechamento"] else 0
            correlacao_data.append({
                "tempo_prontuario": round(avg_tempo, 1),
                "valor_glosado": round(vals["glosa_total"], 2),
                "data": data_str
            })

        tabela = {}
        for r in rows:
            key = (r['nome_unidade'], r['especialidade'])
            if key not in tabela:
                tabela[key] = {"receita_bruta": 0.0, "glosa_inicial": 0.0, "glosa_recuperada": 0.0}
            tabela[key]["receita_bruta"] += r['receita_bruta']
            tabela[key]["glosa_inicial"] += r['valor_glosa_inicial']
            tabela[key]["glosa_recuperada"] += r['valor_glosa_recuperada']

        tabela_data = []
        for (unidade, especialidade), vals in tabela.items():
            evasao = vals["glosa_inicial"] - vals["glosa_recuperada"]
            ind_glosa = (vals["glosa_inicial"] / vals["receita_bruta"] * 100) if vals["receita_bruta"] > 0 else 0
            taxa_rec = (vals["glosa_recuperada"] / vals["glosa_inicial"] * 100) if vals["glosa_inicial"] > 0 else 0
            tabela_data.append({
                "unidade": unidade,
                "especialidade": especialidade,
                "receita_bruta": round(vals["receita_bruta"], 2),
                "glosa_inicial": round(vals["glosa_inicial"], 2),
                "glosa_recuperada": round(vals["glosa_recuperada"], 2),
                "evasao_receita": round(evasao, 2),
                "indice_glosa_inicial": round(ind_glosa, 2),
                "taxa_recuperacao": round(taxa_rec, 2)
            })

        tabela_data.sort(key=lambda x: x['evasao_receita'], reverse=True)

        return response.Response({
            "kpis": {
                "faturamento_sus": round(total_faturamento, 2),
                "indice_glosa_inicial": round(indice_glosa_inicial, 2),
                "taxa_recuperacao": round(taxa_recuperacao, 2),
                "evasao_receita": round(evasao_receita, 2)
            },
            "evolucao_temporal": evolucao_temporal_data,
            "correlacao_prontuario": correlacao_data,
            "tabela_analitica": tabela_data,
            "registros_afetados": len(rows)
        })


class RegulacaoFilaView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ano = request.query_params.get("ano")
        mes = request.query_params.get("mes")
        unidade_filtro = request.query_params.get("unidade")

        if ano and mes:
            import calendar
            try:
                last_day = calendar.monthrange(int(ano), int(mes))[1]
                reference_date = f"{ano}-{int(mes):02d}-{last_day:02d}"
            except Exception:
                reference_date = "2026-05-01"
        else:
            with connection.cursor() as cursor:
                cursor.execute("SELECT MAX(data_registro) FROM indicadores_dimtempo")
                res = cursor.fetchone()
                if res and res[0]:
                    reference_date = res[0]
                else:
                    reference_date = "2026-05-01"

        active_patients_by_unit = {}
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    a.id_unidade_id,
                    COUNT(*) as active_count
                FROM indicadores_fatoatendimentos a
                INNER JOIN indicadores_dimtempo t ON a.id_tempo_id = t.id_tempo
                WHERE t.data_registro <= %s
                  AND (t.data_registro + a.tempo_permanencia_dias * INTERVAL '1 day') > %s::date
                GROUP BY a.id_unidade_id
            """, [reference_date, reference_date])
            active_patients_by_unit = dict(cursor.fetchall())

        proc_qs = FatoProcedimentos.objects.all()
        atend_qs = FatoAtendimentos.objects.all()

        if ano:
            proc_qs = proc_qs.filter(id_tempo__ano=ano)
            atend_qs = atend_qs.filter(id_tempo__ano=ano)
        if mes:
            proc_qs = proc_qs.filter(id_tempo__mes=mes)
            atend_qs = atend_qs.filter(id_tempo__mes=mes)
        if unidade_filtro:
            proc_qs = proc_qs.filter(id_unidade=unidade_filtro)
            atend_qs = atend_qs.filter(id_unidade=unidade_filtro)

        total_procedimentos = proc_qs.count()
        agendados = proc_qs.filter(status_agendamento="Agendado").count()
        realizados = proc_qs.filter(status_agendamento="Realizado").count()
        cancelados = proc_qs.filter(status_agendamento="Cancelado").count()

        taxa_suspensao = (cancelados / total_procedimentos * 100) if total_procedimentos > 0 else 0
        tmp_medio = atend_qs.aggregate(media=Avg("tempo_permanencia_dias"))["media"] or 0

        hemocentro_u = DimUnidade.objects.filter(nome_unidade__icontains="Hemocentro").first()
        ceope_u = DimUnidade.objects.filter(nome_unidade__icontains="CEOPE").first()
        
        specialized_ids = []
        if hemocentro_u: specialized_ids.append(hemocentro_u.id_unidade)
        if ceope_u: specialized_ids.append(ceope_u.id_unidade)
        if not specialized_ids:
            specialized_ids = [1, 5]

        units_to_calc = DimUnidade.objects.all()
        if unidade_filtro:
            units_to_calc = units_to_calc.filter(id_unidade=unidade_filtro)
        else:
            units_to_calc = units_to_calc.filter(id_unidade__in=specialized_ids)

        occupancy_rates = []
        for u in units_to_calc:
            if u.capacidade_maxima > 0:
                active = active_patients_by_unit.get(u.id_unidade, 0)
                oc_rate = (active / u.capacidade_maxima) * 100
                occupancy_rates.append(oc_rate)

        taxa_ocupacao_media = sum(occupancy_rates) / len(occupancy_rates) if occupancy_rates else 0

        funnel_data = [
            {"etapa": "Solicitado", "quantidade": total_procedimentos},
            {"etapa": "Fila (Pendente)", "quantidade": agendados},
            {"etapa": "Realizado", "quantidade": realizados}
        ]

        equip_backlog = (
            proc_qs.filter(status_agendamento="Agendado")
            .values("id_equipamento__nome_maquina")
            .annotate(backlog=Count("id_procedimento_instancia"))
            .order_by("-backlog")
        )

        equip_backlog_data = []
        for item in equip_backlog:
            name = item["id_equipamento__nome_maquina"] or "Sem Equipamento"
            equip_backlog_data.append({
                "equipamento": name,
                "backlog": item["backlog"]
            })

        all_units = DimUnidade.objects.all()
        if unidade_filtro:
            all_units = all_units.filter(id_unidade=unidade_filtro)

        table_data = []
        for u in all_units:
            nome_amigavel = u.nome_unidade
            if hemocentro_u and u.id_unidade == hemocentro_u.id_unidade:
                nome_amigavel = "MT-Hemocentro - UTI"
            elif ceope_u and u.id_unidade == ceope_u.id_unidade:
                nome_amigavel = "CEOPE - Bloco Cirúrgico"
            
            active = active_patients_by_unit.get(u.id_unidade, 0)
            oc_rate = (active / u.capacidade_maxima * 100) if u.capacidade_maxima > 0 else 0
            fila_count = proc_qs.filter(id_unidade=u.id_unidade, status_agendamento="Agendado").count()
            
            table_data.append({
                "id_unidade": u.id_unidade,
                "unidade": nome_amigavel,
                "tipo_leito": u.tipo_leito,
                "capacidade": u.capacidade_maxima,
                "pacientes_ativos": active,
                "ocupacao_atual": round(oc_rate, 1),
                "fila_espera": fila_count
            })

        table_data.sort(key=lambda x: x["fila_espera"], reverse=True)

        return response.Response({
            "kpis": {
                "backlog": agendados,
                "taxa_ocupacao_media": round(taxa_ocupacao_media, 2),
                "taxa_suspensao": round(taxa_suspensao, 2),
                "tmp_medio": round(tmp_medio, 1)
            },
            "funil_regulacao": funnel_data,
            "gargalos_equipmento": equip_backlog_data,
            "tabela_regulacao": table_data,
            "registros_afetados": proc_qs.count()
        })


class MatrizRiscoView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ano = request.query_params.get("ano")
        mes = request.query_params.get("mes")
        unidade_filtro = request.query_params.get("unidade")

        escala_qs = FatoEscalaMedica.objects.all()
        infra_qs = FatoInfraestrutura.objects.all()
        atend_qs = FatoAtendimentos.objects.all()
        erros_qs = FatoErrosMedicao.objects.all()

        if ano:
            escala_qs = escala_qs.filter(id_tempo__ano=ano)
            infra_qs = infra_qs.filter(id_tempo__ano=ano)
            atend_qs = atend_qs.filter(id_tempo__ano=ano)
            erros_qs = erros_qs.filter(id_tempo__ano=ano)
        if mes:
            escala_qs = escala_qs.filter(id_tempo__mes=mes)
            infra_qs = infra_qs.filter(id_tempo__mes=mes)
            atend_qs = atend_qs.filter(id_tempo__mes=mes)
            erros_qs = erros_qs.filter(id_tempo__mes=mes)
        if unidade_filtro:
            infra_qs = infra_qs.filter(id_unidade=unidade_filtro)
            atend_qs = atend_qs.filter(id_unidade=unidade_filtro)
            erros_qs = erros_qs.filter(id_paciente__fatoatendimentos__id_unidade=unidade_filtro).distinct()

        total_plantoes = escala_qs.count()
        faltas_atrasos = escala_qs.filter(status_presenca__in=["Falta", "Falta Justificada", "Atraso"]).count()
        global_absenteismo = (faltas_atrasos / total_plantoes * 100) if total_plantoes > 0 else 0

        avg_colab_global = infra_qs.aggregate(avg=Avg("total_colaboradores_ativos"))["avg"] or 0
        total_capacidade_global = DimUnidade.objects.exclude(id_unidade=100).aggregate(total=Sum("capacidade_maxima"))["total"] or 1

        if unidade_filtro:
            u_obj = DimUnidade.objects.filter(id_unidade=unidade_filtro).first()
            if u_obj and u_obj.capacidade_maxima > 0:
                total_capacidade_global = u_obj.capacidade_maxima
            else:
                total_capacidade_global = 1

        global_densidade_rh = avg_colab_global / total_capacidade_global

        total_atendimentos_global = atend_qs.count()
        total_erros_global = erros_qs.count()
        global_indice_erros = (total_erros_global / total_atendimentos_global * 1000) if total_atendimentos_global > 0 else 0

        especialidades_escala = (
            escala_qs.values("id_medico__especialidade")
            .annotate(
                total_atrasos=Sum("horas_atraso"),
                total_faltas=Count("id_escala", filter=Q(status_presenca__in=["Falta", "Falta Justificada"]))
            )
            .order_by("-total_atrasos")
        )

        chart_especialidades = []
        for item in list(especialidades_escala):
            name = item["id_medico__especialidade"] or "Clínica Geral"
            chart_especialidades.append({
                "especialidade": name,
                "atrasos": round(item["total_atrasos"] or 0, 1),
                "faltas": item["total_faltas"] or 0
            })

        query_errors = """
            SELECT 
                a.id_unidade_id,
                COUNT(e.id_evento) as error_count
            FROM indicadores_fatoerrosmedicao e
            INNER JOIN indicadores_dimtempo te ON e.id_tempo_id = te.id_tempo
            INNER JOIN indicadores_fatoatendimentos a ON e.id_paciente_id = a.id_paciente_id
            INNER JOIN indicadores_dimtempo ta ON a.id_tempo_id = ta.id_tempo
            WHERE ta.data_registro <= te.data_registro
              AND te.data_registro <= (ta.data_registro + a.tempo_permanencia_dias * INTERVAL '1 day')::date
        """
        params = []
        if ano:
            query_errors += " AND te.ano = %s"
            params.append(int(ano))
        if mes:
            query_errors += " AND te.mes = %s"
            params.append(int(mes))
        if unidade_filtro:
            query_errors += " AND a.id_unidade_id = %s"
            params.append(int(unidade_filtro))
        query_errors += " GROUP BY a.id_unidade_id"

        errors_by_unit = {}
        with connection.cursor() as cursor:
            cursor.execute(query_errors, params)
            errors_by_unit = dict(cursor.fetchall())

        infra_by_unit = infra_qs.values("id_unidade_id").annotate(
            avg_colab=Avg("total_colaboradores_ativos"),
            total_inf=Sum("eventos_infeccao")
        )
        infra_dict = {item["id_unidade_id"]: item for item in infra_by_unit}

        atend_by_unit = atend_qs.values("id_unidade_id").annotate(
            total=Count("id_atendimento")
        )
        atend_dict = {item["id_unidade_id"]: item["total"] for item in atend_by_unit}

        has_high_ids = False
        with connection.cursor() as cursor:
            cursor.execute("SELECT MAX(id_transacao) FROM indicadores_fatofinanceiro")
            res_max = cursor.fetchone()
            if res_max and res_max[0] and res_max[0] > 20000:
                has_high_ids = True

        join_cond = "d.id_registro = (f.id_transacao - 20000)" if has_high_ids else "d.id_registro = f.id_transacao"

        query_escala_unidade = f"""
            SELECT 
                f.id_unidade_id,
                COUNT(e.id_escala) as total_escala,
                SUM(CASE WHEN e.status_presenca IN ('Falta', 'Falta Justificada', 'Atraso') THEN 1 ELSE 0 END) as faltas_atrasos
            FROM indicadores_fatoescalamedica e
            INNER JOIN indicadores_dimtempo t ON e.id_tempo_id = t.id_tempo
            INNER JOIN indicadores_fatodesempenhoclinico d ON e.id_medico_id = d.id_medico_id AND e.id_tempo_id = d.id_tempo_id
            INNER JOIN indicadores_fatofinanceiro f ON {join_cond}
        """
        params_escala = []
        where_clauses = []
        if ano:
            where_clauses.append("t.ano = %s")
            params_escala.append(int(ano))
        if mes:
            where_clauses.append("t.mes = %s")
            params_escala.append(int(mes))
        if unidade_filtro:
            where_clauses.append("f.id_unidade_id = %s")
            params_escala.append(int(unidade_filtro))

        if where_clauses:
            query_escala_unidade += " WHERE " + " AND ".join(where_clauses)
        query_escala_unidade += " GROUP BY f.id_unidade_id"

        unit_absenteismo_rates = {}
        with connection.cursor() as cursor:
            cursor.execute(query_escala_unidade, params_escala)
            for r in cursor.fetchall():
                unit_id = r[0]
                tot = r[1]
                fa = r[2] or 0
                rate = (fa / tot * 100) if tot > 0 else 0
                unit_absenteismo_rates[unit_id] = rate

        all_units = DimUnidade.objects.exclude(id_unidade=100)
        if unidade_filtro:
            all_units = all_units.filter(id_unidade=unidade_filtro)

        table_data = []
        unidades_criticas = 0

        hemocentro_u = DimUnidade.objects.filter(nome_unidade__icontains="Hemocentro").first()
        ceope_u = DimUnidade.objects.filter(nome_unidade__icontains="CEOPE").first()

        for u in all_units:
            nome_amigavel = u.nome_unidade
            if hemocentro_u and u.id_unidade == hemocentro_u.id_unidade:
                nome_amigavel = "MT-Hemocentro - UTI"
            elif ceope_u and u.id_unidade == ceope_u.id_unidade:
                nome_amigavel = "CEOPE - Bloco Cirúrgico"

            infra_stat = infra_dict.get(u.id_unidade, {"avg_colab": 0, "total_inf": 0})
            avg_colab = infra_stat.get("avg_colab") or 0
            total_inf = infra_stat.get("total_inf") or 0

            dens = (avg_colab / u.capacidade_maxima) if u.capacidade_maxima > 0 else 0
            err_count = errors_by_unit.get(u.id_unidade, 0)
            total_atends = atend_dict.get(u.id_unidade, 0)
            err_rate = (err_count / total_atends * 1000) if total_atends > 0 else 0

            abs_rate = unit_absenteismo_rates.get(u.id_unidade, 0)
            if abs_rate == 0:
                abs_rate = global_absenteismo * (0.8 + (u.id_unidade % 3) * 0.2)

            dens_factor = max(0, 1.5 - dens) / 1.5 * 100
            abs_factor = min(100, abs_rate * 3)
            inc_factor = min(100, err_rate * 2.5 + total_inf * 0.2)

            score_risco = 0.3 * dens_factor + 0.3 * abs_factor + 0.4 * inc_factor
            score_risco = min(100, max(0, round(score_risco, 1)))

            if score_risco > 60:
                unidades_criticas += 1

            table_data.append({
                "id_unidade": u.id_unidade,
                "unidade": nome_amigavel,
                "capacidade": u.capacidade_maxima,
                "colaboradores_ativos": round(avg_colab, 1),
                "densidade_rh": round(dens, 2),
                "absenteismo": round(abs_rate, 1),
                "erros": err_count,
                "erros_por_1000": round(err_rate, 1),
                "infeccoes": total_inf,
                "score_risco": score_risco
            })

        table_data.sort(key=lambda x: x["score_risco"], reverse=True)

        scatter_data = []
        for item in table_data:
            scatter_data.append({
                "unidade": item["unidade"],
                "densidade_rh": item["densidade_rh"],
                "erros_por_1000": item["erros_por_1000"],
                "score_risco": item["score_risco"]
            })

        return response.Response({
            "kpis": {
                "densidade_rh": round(global_densidade_rh, 2),
                "taxa_absenteismo": round(global_absenteismo, 1),
                "indice_erros": round(global_indice_erros, 1),
                "unidades_criticas": unidades_criticas
            },
            "especialidades_chart": chart_especialidades,
            "cause_effect_scatter": scatter_data,
            "tabela_risco": table_data,
            "registros_afetados": atend_qs.count()
        })


def normalize_text(text):
    if not text:
        return ""
    text = text.lower()
    text = "".join(c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn")
    text = "".join(c for c in text if c.isalnum() or c.isspace())
    return " ".join(text.split())

def get_api_keys(request):
    gemini_key = request.headers.get("x-gemini-key") or request.headers.get("X-Gemini-Key") or request.META.get("HTTP_X_GEMINI_KEY") or os.environ.get("GEMINI_API_KEY")
    openai_key = request.headers.get("x-openai-key") or request.headers.get("X-OpenAI-Key") or request.META.get("HTTP_X_OPENAI_KEY") or os.environ.get("OPENAI_API_KEY")
    if gemini_key in ["null", "undefined", ""]: gemini_key = None
    if openai_key in ["null", "undefined", ""]: openai_key = None
    return gemini_key, openai_key

def call_llm(gemini_key, openai_key, system_prompt, user_prompt, timeout=25):
    """
    Centralized LLM caller using urllib to avoid keep-alive connection pool hangs.
    Returns (text_response: str, error_detail: str | None)
    """
    import urllib.request
    import json

    full_prompt = f"{system_prompt}\n\n{user_prompt}" if system_prompt else user_prompt

    if gemini_key:
        models = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"]
        last_error = None
        for i, model in enumerate(models):
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
            payload = {"contents": [{"parts": [{"text": full_prompt}]}]}
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url, 
                data=data, 
                headers={"Content-Type": "application/json"}
            )
            print(f"--- call_llm: chamando Gemini model={model}...", flush=True)
            import time
            t0 = time.time()
            try:
                # Use a 20s timeout per model so fallback is quick
                with urllib.request.urlopen(req, timeout=20) as response:
                    dt = time.time() - t0
                    res_body = response.read().decode("utf-8")
                    res_json = json.loads(res_body)
                    print(f"--- call_llm: Gemini model={model} respondeu com sucesso em {dt:.2f}s", flush=True)
                    text = res_json["candidates"][0]["content"]["parts"][0]["text"]
                    return text, None
            except urllib.error.HTTPError as e:
                dt = time.time() - t0
                print(f"--- call_llm: Gemini model={model} falhou em {dt:.2f}s com HTTPError: {e.code}", flush=True)
                
                try:
                    err_body = e.read().decode("utf-8")
                    err_json = json.loads(err_body)
                    err_detail = err_json.get("error", {}).get("message", f"HTTP {e.code}")
                except Exception:
                    err_detail = f"HTTP {e.code}"
                
                last_error = f"Erro na chamada Gemini ({model}, HTTP {e.code}): {err_detail}"
                
                if i < len(models) - 1:
                    print(f"--- call_llm: Falha no modelo {model}. Tentando fallback...", flush=True)
                    continue
                return None, last_error
            except Exception as e:
                dt = time.time() - t0
                print(f"--- call_llm: Gemini model={model} falhou em {dt:.2f}s com erro: {e}", flush=True)
                last_error = f"Erro de conexão com Gemini ({model}): {e}"
                if i < len(models) - 1:
                    print(f"--- call_llm: Falha no modelo {model}. Tentando fallback...", flush=True)
                    continue
                return None, last_error

    if openai_key:
        url = "https://api.openai.com/v1/chat/completions"
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt or ""},
                {"role": "user", "content": user_prompt}
            ]
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {openai_key}",
                "Content-Type": "application/json"
            }
        )
        print("--- call_llm: chamando OpenAI gpt-4o-mini...", flush=True)
        import time
        t0 = time.time()
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                dt = time.time() - t0
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)
                print(f"--- call_llm: OpenAI respondeu com sucesso em {dt:.2f}s", flush=True)
                text = res_json["choices"][0]["message"]["content"]
                return text, None
        except urllib.error.HTTPError as e:
            dt = time.time() - t0
            print(f"--- call_llm: OpenAI falhou em {dt:.2f}s com HTTPError: {e.code}", flush=True)
            try:
                err_body = e.read().decode("utf-8")
                err_json = json.loads(err_body)
                err_detail = err_json.get("error", {}).get("message", f"HTTP {e.code}")
            except Exception:
                err_detail = f"HTTP {e.code}"
            return None, f"Erro na chamada OpenAI ({e.code}): {err_detail}"
        except Exception as e:
            dt = time.time() - t0
            print(f"--- call_llm: OpenAI falhou em {dt:.2f}s com erro: {e}", flush=True)
            return None, f"Erro de conexão com OpenAI: {e}"

    return None, None  # Sem chave configurada — sem erro


class ExplicarIndicadorView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        indicador = request.data.get("indicador")
        valor_atual = request.data.get("valor_atual")
        unidade = request.data.get("unidade", "Geral (Todas as Unidades)")

        if not indicador or not valor_atual:
            return response.Response({"erro": "Campos 'indicador' e 'valor_atual' são obrigatórios."}, status=400)

        indicador_norm = normalize_text(indicador)

        kpi_directives = {
            "Faturamento SUS": "Garantir o processamento integral da receita de serviços sob o regime do SUS, auditando as AIHs e APACs para evitar glosas.",
            "Índice de Glosa Inicial": "Identificar falhas de preenchimento e autorização de contas médicas junto às operadoras e gestor público.",
            "Taxa de Recuperação": "Maximizar a conversão de recursos de glosas por meio de contestação técnica e justificativa clínica rápida.",
            "Evasão de Receita": "Monitorar perdas definitivas para corrigir falhas processuais no faturamento e mitigar impacto na margem EBITDA.",
            "Pacientes na Fila (Backlog)": "Garantir a fluidez assistencial, otimizando o agendamento de exames e cirurgias eletivas represadas no AGHUse.",
            "Fila de Espera (Backlog)": "Garantir a fluidez assistencial, otimizando o agendamento de exames e cirurgias eletivas represadas no AGHUse.",
            "Taxa de Ocupação Média": "Otimizar o giro de leitos das unidades críticas e enfermarias para atender à demanda de admissões do pronto-socorro.",
            "Taxa de Ocupação": "Otimizar o giro de leitos das unidades críticas e enfermarias para atender à demanda de admissões do pronto-socorro.",
            "Taxa de Suspensão": "Reduzir o cancelamento de cirurgias programadas por falha de preparo clínico ou ociosidade do bloco cirúrgico.",
            "Taxa de Suspensão de Procedimentos": "Reduzir o cancelamento de cirurgias programadas por falha de preparo clínico ou ociosidade do bloco cirúrgico.",
            "TMP (Permanência)": "Reduzir a permanência desnecessária, agilizando deshospitalização segura e mitigando o risco de infecções secundárias.",
            "Densidade de RH": "Dimensionar adequadamente a relação entre profissionais assistenciais por leito para preservar a segurança assistencial.",
            "Densidade RH": "Dimensionar adequadamente a relação entre profissionais assistenciais por leito para preservar a segurança assistencial.",
            "Score de Risco Clínico": "Prevenir incidentes e prever o risco setorial associando dimensionamento de pessoal, absenteísmo e ocorrências clínicas.",
            "Taxa IRAS (Infecção)": "Garantir a adesão aos protocolos de controle de infecção e higienização de leitos nas unidades críticas.",
            "Substituição de Leito": "Agilizar o tempo de higienização e liberação do leito após a alta para diminuir o tempo de espera no pronto-socorro.",
            "Consumo Água/Energia": "Gerenciar o consumo de recursos naturais e custos fixos na infraestrutura predial hospitalar.",
            "NPS (Satisfação)": "Monitorar a fidelidade e a qualidade percebida pelo paciente com foco na melhoria da experiência de internação.",
            "Taxa Reinternação": "Auditar a qualidade clínica das altas, reduzindo reinternações evitáveis nos 30 dias subsequentes.",
            "Giro de Estoque": "Evitar capital parado garantindo abastecimento contínuo de insumos e medicamentos na farmácia central.",
            "Custo Total": "Monitorar a distribuição e gasto total de medicamentos para assegurar o controle orçamentário do estoque.",
            "Erros Medicação": "Mitigar a ocorrência de eventos adversos na administração de medicamentos via dupla checagem e barreiras eletrônicas.",
            "Ruptura Estoque": "Evitar a falta de itens essenciais na assistência garantindo compras tempestivas frente à variação de demanda.",
            "Taxa de Ruptura": "Evitar a falta de itens essenciais na assistência garantindo compras tempestivas frente à variação de demanda.",
            "Adesão Protocolos": "Monitorar a conformidade do corpo clínico com as diretrizes e protocolos institucionais (ex: Sepse, IAM).",
            "Tempo Prontuário": "Garantir o fechamento tempestivo do prontuário pelo médico para acelerar o processo de faturamento das contas.",
            "Absenteísmo Médico": "Reduzir faltas e atrasos na escala médica de plantão para evitar sobrecarga de equipe e demora no atendimento.",
            "Absenteísmo": "Reduzir faltas e atrasos na escala médica de plantão para evitar sobrecarga de equipe e demora no atendimento.",
            "Unidades em Risco Crítico": "Identificar e priorizar intervenções de liderança nas unidades hospitalares que apresentam score de risco clínico elevado.",
            "Ticket Médio": "Acompanhar o valor médio faturado por atendimento para analisar o perfil epidemiológico e financeiro das internações.",
            "PMR": "Prazo Médio de Recebimento: Controlar o ciclo financeiro entre a alta do paciente e a liquidação das contas pelos convênios.",
            "PMR (Recebimento)": "Prazo Médio de Recebimento: Controlar o ciclo financeiro entre a alta do pagamento pelas operadoras e convênios.",
            "Volume Especialidade": "Analisar a distribuição da volumetria assistencial por especialidade médica para subsidiar o planejamento de escalas e capacidade física.",
            "EBITDA Operacional": "Garantir a sustentabilidade operacional medindo o resultado financeiro primário gerado pelas atividades hospitalares (EBITDA), excluindo impostos e depreciações.",
            "Gestão de Glosas": "Monitorar e auditar as faturas com glosas iniciais aplicadas pelas operadoras de saúde, buscando maximizar a recuperação e mitigar perdas definitivas.",
            "Giro de Sala": "Otimizar a ocupação física das salas cirúrgicas, reduzindo o tempo de setup (preparo e limpeza) entre procedimentos consecutivos.",
            "Produtividade": "Avaliar a produtividade e ocupação operacional de equipamentos de alta complexidade instalados nas salas de exames e blocos.",
            "Taxa Conversão": "Monitorar a proporção de procedimentos programados que foram efetivamente concluídos, reduzindo cancelamentos e ociosidade médica."
        }

        definicao_institucional = "Monitorar a métrica para garantir a conformidade operacional e a eficiência clínica e financeira do hospital."
        
        sorted_directives = sorted(kpi_directives.items(), key=lambda x: len(normalize_text(x[0])), reverse=True)
        for k, v in sorted_directives:
            k_norm = normalize_text(k)
            if k_norm in indicador_norm or indicador_norm in k_norm:
                definicao_institucional = v
                break

        system_prompt = (
            f"Você é o Assistente Executivo de Inteligência Analítica do Hospital.\n"
            f"O usuário está visualizando o painel de BI e solicitou a explicação do indicador: '{indicador}'.\n"
            f"A diretriz estratégica oficial da nossa instituição para esta métrica é: '{definicao_institucional}'.\n"
            f"O valor atualmente registrado em tela é: {valor_atual} (na unidade: {unidade}).\n\n"
            f"Sua tarefa é retornar uma resposta curta, estruturada em formato markdown para o frontend, contendo exatamente dois parágrafos:\n"
            f"1. ### **[Conceito]**: Explique em português simples o que este indicador mede e por que ele importa para o hospital baseado na nossa diretriz estratégica.\n"
            f"2. ### **[Análise de Ação]**: Avalie o valor atual ({valor_atual}). Se for um valor crítico (como absenteísmo alto, glosa alta ou baixa densidade de RH), alerte o gestor e sugira uma linha de ação corretiva imediata. Seja direto, executivo e profissional.\n"
        )

        gemini_key, openai_key = get_api_keys(request)

        if gemini_key or openai_key:
            resposta_texto, error_detail = call_llm(gemini_key, openai_key, None, system_prompt, timeout=8)
            if resposta_texto:
                return response.Response({"resposta": resposta_texto})
            elif error_detail:
                return response.Response({"resposta": f"### ⚠️ Erro na Chamada da API de IA\n\n{error_detail}"})

        # Fallback offline templates
        p1_concepts = {
            "faturamento": "O **Faturamento SUS** mede o montante financeiro total faturado e homologado sob o regime do SUS no período. É crítico para a saúde financeira do hospital, pois o SUS representa uma fatia importante da receita operacional, exigindo o controle estrito das AIHs e APACs para evitar glosas administrativas.",
            "gestao de glosas": "A **Gestão de Glosas** avalia o andamento das faturas contestadas e o status de recuperação das glosas aplicadas pelos convênios, identificando a eficiência operacional das áreas de auditoria e faturamento.",
            "glosa": "O **Índice de Glosa Inicial** mede o percentual do faturamento total que foi inicialmente rejeitado pelas operadoras ou pelo gestor do SUS devido a inconsistências cadastrais, falhas de autorização de contas médicas ou falta de conformidade clínica.",
            "recupera": "A **Taxa de Recuperação** avalia a eficiência e agilidade da equipe de auditoria e faturamento em contestar e recuperar recursos inicialmente glosados pelas operadoras ou pelo gestor público, minimizando o impacto no fluxo de caixa.",
            "evas": "A **Evasão de Receita** representa as perdas financeiras definitivas decorrentes de glosas não recuperadas no período. É um indicador vital que impacta diretamente a margem EBITDA e a capacidade de investimento da instituição.",
            "backlog": "A **Fila de Espera (Backlog)** quantifica o total de pacientes com exames ou cirurgias programadas que se encontram em status 'Agendado' aguardando execução física, indicando a pressão assistencial do fluxo do AGHUse.",
            "fila": "A **Fila de Espera (Backlog)** quantifica o total de pacientes com exames ou cirurgias programadas que se encontram em status 'Agendado' aguardando execução física, indicando a pressão assistencial do fluxo do AGHUse.",
            "ocupa": "A **Taxa de Ocupação Média** mede o percentual médio de leitos ou cadeiras ocupados em relação à capacidade máxima. Ela avalia o aproveitamento dos recursos físicos e é fundamental para gerenciar o gargalo de admissões hospitalares.",
            "suspen": "A **Taxa de Suspensão de Procedimentos** monitora a proporção de cirurgias ou exames cancelados após o agendamento oficial. Reflete falhas no preparo clínico pré-operatório dos pacientes ou na coordenação das salas de cirurgia.",
            "tmp": "O **Tempo Médio de Permanência (TMP)** monitora o número médio de dias que os pacientes passam internados. É um indicador da eficiência clínica, no qual permanências prolongadas aumentam os custos fixos e os riscos de infecção.",
            "densidade": "A **Densidade de Recursos Humanos** mede a proporção média de profissionais assistenciais (como enfermeiros e técnicos) ativos por leito instalado, sendo uma métrica chave de segurança do paciente contra fadiga e sobrecarga.",
            "risco": "O **Score de Risco Clínico** é uma métrica preditiva que unifica absenteísmo médico, densidade de RH, e ocorrências de erros/infecções por setor para sinalizar preventivamente quais áreas necessitam de intervenção urgente.",
            "iras": "A **Taxa IRAS** avalia o percentual de Infecções Relacionadas à Assistência à Saúde sobre o total de saídas, funcionando como o principal termômetro de conformidade e segurança higiênica e clínica da instituição.",
            "substitui": "O tempo de **Substituição de Leito** monitora o intervalo entre a desocupação do leito por alta e a sua disponibilidade real para o próximo paciente, medindo a eficiência operacional da hotelaria.",
            "nps": "O **NPS (Net Promoter Score)** mede a satisfação e fidelidade do paciente após o atendimento hospitalar, indicando a percepção humana sobre o cuidado recebido e a experiência geral na instituição.",
            "reinterna": "A **Taxa de Reinternação** monitora o percentual de pacientes que voltam a ser hospitalizados em até 30 dias pela mesma causa. Altos índices apontam para problemas na eficácia do tratamento ou na qualidade do processo de alta.",
            "consumo": "O **Consumo Água/Energia** monitora a eficiência ecológica e financeira da infraestrutura hospitalar, visando otimizar custos operacionais de água e energia elétrica sem comprometer a operação e segurança clínica.",
            "giro de estoque": "O **Giro de Estoque** monitora a frequência com que o estoque de medicamentos da farmácia central se renova. Altos giros indicam boa gestão de capital de giro, enquanto baixos giros sugerem excesso de itens parados e risco de vencimento.",
            "giro de sala": "O **Giro de Sala** mede a duração média de ocupação das salas cirúrgicas, englobando o setup de anestesia, o tempo cirúrgico e o intervalo de limpeza física da sala pela enfermagem.",
            "custo": "O **Custo Total** de medicamentos monitora o consumo financeiro acumulado das dispensações da farmácia, servindo de termômetro para controle do orçamento de insumos da instituição.",
            "erro": "O indicador de **Erros Medicação** monitora incidentes na prescrição, dispensação ou administração de medicamentos, servindo como termômetro primário de segurança assistencial nas unidades.",
            "ruptura": "A **Ruptura Estoque** mede a ocorrência de falta de itens assistenciais críticos na farmácia quando solicitados pelas equipes. Altos índices indicam falhas de suprimentos que comprometem diretamente a assistência.",
            "ades": "A **Adesão Protocolos** clínicos avalia a conformidade das condutas médicas em relação às diretrizes oficiais adotadas no hospital (como os protocolos de Sepse e AVC), assegurando um cuidado homogêneo e seguro.",
            "prontu": "O **Tempo Prontuário** mede a média de minutos ou horas que os médicos levam para fechar o prontuário do paciente após o atendimento. Fechamentos tardios atrasam o faturamento da conta do SUS e operadoras.",
            "absen": "O **Absenteísmo Médico** monitora o índice de faltas e atrasos na escala de plantões, refletindo o grau de aderência dos profissionais às escalas físicas homologadas.",
            "ticket": "O **Ticket Médio** avalia o valor financeiro médio faturado por atendimento ou internação, auxiliando a gerência na análise da complexidade dos casos assistidos no hospital.",
            "pmr": "O **PMR (Prazo Médio de Recebimento)** monitora o intervalo de dias entre a alta clínica do paciente e o efetivo pagamento da conta faturada pelos convênios e SUS.",
            "ebitda": "O **EBITDA Operacional** mede a lucratividade operacional do hospital antes de juros, impostos, depreciação e amortização, demonstrando a capacidade de geração de caixa das atividades essenciais.",
            "volume": "O **Volume Especialidade** quantifica a distribuição dos atendimentos e procedimentos por especialidade médica, servindo para planejar a escala médica e a capacidade instalada.",
            "produtividade": "A **Produtividade por Equipamento** mede o volume de procedimentos e exames diagnósticos realizados nas máquinas de alta complexidade médica, otimizando o uso dos ativos.",
            "conversao": "A **Taxa Conversão** indica a proporção de cirurgias ou procedimentos de fato realizados em relação aos agendamentos solicitados, auxiliando a reduzir suspensões e ociosidade de equipes."
        }

        p2_actions = {
            "faturamento": "O valor atual de **{valor_atual}** na unidade **{unidade}** indica a receita processada. Sugere-se intensificar a auditoria preventiva em contas de alta complexidade (como cirurgias) antes do fechamento do lote para assegurar conformidade total e evitar prejuízos.",
            "gestao de glosas": "O andamento da gestão de glosas de **{valor_atual}** na unidade **{unidade}** aponta para oportunidades de conciliação. Sugere-se priorizar recursos junto às maiores operadoras parceiras e padronizar justificativas clínicas.",
            "glosa": "O índice atual de **{valor_atual}** na unidade **{unidade}** está em patamar considerável. Recomenda-se realizar um treinamento com a recepção para reduzir erros cadastrais e revisar o fluxo de pré-autorizações junto às operadoras.",
            "recupera": "A taxa de recuperação de **{valor_atual}** na unidade **{unidade}** reflete a eficácia dos recursos. Para maximizar esse indicador, sugere-se a padronização das justificativas clínicas e a automatização da conciliação de glosas.",
            "evas": "O valor de **{valor_atual}** na unidade **{unidade}** representa perda de receita definitiva. Alerta-se a gestão para implementar travas no prontuário eletrônico que impeçam a alta administrativa sem que todas as guias de cobrança estejam validadas.",
            "backlog": "A fila atual de **{valor_atual}** na unidade **{unidade}** representa um gargalo. Recomenda-se otimizar a escala das salas de cirurgia/exames e priorizar procedimentos que dependam de equipamentos com maior ociosidade operacional.",
            "fila": "A fila atual de **{valor_atual}** na unidade **{unidade}** representa um gargalo. Recomenda-se otimizar a escala das salas de cirurgia/exames e priorizar procedimentos que dependam de equipamentos com maior ociosidade operacional.",
            "ocupa": "A ocupação atual de **{valor_atual}** na unidade **{unidade}** está próxima da saturação. Recomenda-se agilizar as altas seguras pela manhã e implantar um painel de monitoramento do giro de leitos para diminuir o tempo de espera no pronto-socorro.",
            "suspen": "A taxa de suspensão de **{valor_atual}** na unidade **{unidade}** é crítica. Sugere-se implementar um contato telefônico de confirmação com o paciente 24h antes do procedimento para garantir o preparo pré-operatório adequado e reduzir absenteísmo.",
            "tmp": "O TMP atual de **{valor_atual}** na unidade **{unidade}** exige atenção. Recomenda-se auditar  casos de longa permanência (acima de 15 dias) e criar uma comissão multidisciplinar para agilizar desospitalizações seguras.",
            "densidade": "A densidade atual de **{valor_atual}** na unidade **{unidade}** aponta para sobrecarga de pessoal. Recomenda-se remanejar técnicos e enfermeiros temporariamente para este setor para evitar a fadiga da equipe e mitigar o risco de erros assistenciais.",
            "risco": "O score atual de **{valor_atual}** na unidade **{unidade}** é classificado como crítico. Recomenda-se intervenção preventiva imediata da liderança com auditoria volante e redimensionamento imediato das escalas de pessoal assistencial no setor.",
            "iras": "A taxa de infecções de **{valor_atual}** na unidade **{unidade}** demanda reforço. Sugere-se intensificar a fiscalização da lavagem de mãos e auditar o cumprimento estrito das rotinas de desinfecção de leitos da hotelaria.",
            "substitui": "O tempo atual de **{valor_atual}** na unidade **{unidade}** está acima do ideal (120 min). Recomenda-se criar alertas em tempo real para a equipe de limpeza assim que o paciente desocupe o leito, agilizando o fluxo.",
            "nps": "O NPS atual de **{valor_atual}** reflete a experiência do paciente. Recomenda-se mapear os principais detratores através de ligações pós-alta e agir nos gargalos de hotelaria e alimentação relatados.",
            "reinterna": "A taxa de reinternação atual de **{valor_atual}** na unidade **{unidade}** exige revisão. Sugere-se implantar um acompanhamento telefônico pós-alta de 48 horas para tirar dúvidas de prescrição e mitigar retornos evitáveis.",
            "consumo": "O consumo registrado de **{valor_atual}** na unidade **{unidade}** indica o nível de utilização de recursos prediais. Recomenda-se realizar uma auditoria de desperdício e checar contratos de demanda de energia para otimizar os custos fixos.",
            "giro de estoque": "O giro atual de **{valor_atual}** na unidade **{unidade}** aponta para a velocidade de escoamento. Recomenda-se ajustar a curva ABC de compras e calibrar os estoques mínimos de medicamentos de alto custo para evitar vencimentos.",
            "giro de sala": "O giro de sala atual de **{valor_atual}** na unidade **{unidade}** exige otimização. Recomenda-se paralelizar a limpeza física com o preparo anestésico da próxima cirurgia em sala contígua para reduzir a ociosidade do bloco.",
            "custo": "O custo total acumulado de **{valor_atual}** na unidade **{unidade}** exige conciliação orçamentária. Recomenda-se auditar prescrições de alta variabilidade clínica e padronizar o uso de genéricos de alta eficácia.",
            "erro": "O volume atual de **{valor_atual}** erros de medicação na unidade **{unidade}** exige revisão imediata. Recomenda-se reforçar a dupla checagem na enfermagem e revisar a clareza da prescrição no prontuário eletrônico.",
            "ruptura": "A taxa de ruptura de **{valor_atual}** na unidade **{unidade}** está elevada. Sugere-se adiantar os pedidos de compra junto aos fornecedores homologados e verificar eventuais atrasos logísticos na entrega.",
            "ades": "A taxa de adesão atual de **{valor_atual}** na unidade **{unidade}** indica a conformidade clínica. Sugere-se promover sessões de educação continuada com a equipe médica e simplificar as ferramentas de registro no sistema.",
            "prontu": "O tempo de fechamento de **{valor_atual}** na unidade **{unidade}** está acima do ideal. Recomenda-se disparar alertas automáticos aos médicos com pendências acima de 24 horas para evitar glosas por perda de prazo.",
            "absen": "O absenteísmo atual de **{valor_atual}** na unidade **{unidade}** está crítico. Recomenda-se acionar o banco de médicos de reserva para cobrir escalas e realizar entrevista de feedback com os profissionais com maior ocorrência de faltas.",
            "ticket": "O ticket médio atual de **{valor_atual}** na unidade **{unidade}** reflete a receita por paciente. Sugere-se auditar o registro correto de procedimentos nas contas para garantir que todo o cuidado prestado esteja sendo faturado.",
            "pmr": "O PMR atual de **{valor_atual}** na unidade **{unidade}** impacta o fluxo de caixa. Recomenda-se revisar as glosas recursais pendentes e estreitar a negociação com as operadoras para acelerar o ciclo de contas a receber.",
            "ebitda": "O EBITDA operacional atual de **{valor_atual}** na unidade **{unidade}** indica a capacidade de autofinanciamento. Sugere-se revisar os custos operacionais de insumos farmacológicos e taxa de glosa para melhorar a margem operacional líquida.",
            "volume": "O volume assistencial atual de **{valor_atual}** na unidade **{unidade}** deve ser avaliado contra a capacidade instalada. Recomenda-se redimensionar escalas médicas para especialidades com maior tempo médio de fila.",
            "produtividade": "A produtividade registrada de **{valor_atual}** na unidade **{unidade}** exige análise de ociosidade técnica. Sugere-se agendar exames eletivos em horários alternativos para otimizar o retorno operacional do ativo físico.",
            "conversao": "A taxa de conversão atual de **{valor_atual}** na unidade **{unidade}** indica a estabilidade da agenda. Recomenda-se implantar check-in cirúrgico digital 48h antes e revisar os tempos de liberação de leitos cirúrgicos."
        }

        key_match = "faturamento"
        sorted_keys = sorted(p1_concepts.keys(), key=lambda x: len(normalize_text(x)), reverse=True)
        for k in sorted_keys:
            k_norm = normalize_text(k)
            if k_norm in indicador_norm or indicador_norm in k_norm:
                key_match = k
                break

        concept_p = p1_concepts.get(key_match, p1_concepts["faturamento"])
        action_p = p2_actions.get(key_match, p2_actions["faturamento"]).format(valor_atual=valor_atual, unidade=unidade)

        response_markdown = f"### **[Conceito]**\n{concept_p}\n\n### **[Análise de Ação]**\n{action_p}"
        return response.Response({"resposta": response_markdown})


class DatabaseStatsView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        dimensoes = [
            {"tabela": "DimTempo", "label": "Dim. Tempo", "count": DimTempo.objects.count(), "icon": "Calendar"},
            {"tabela": "DimUnidade", "label": "Dim. Unidade", "count": DimUnidade.objects.count(), "icon": "Building2"},
            {"tabela": "DimPaciente", "label": "Dim. Paciente", "count": DimPaciente.objects.count(), "icon": "Users"},
            {"tabela": "DimMedicamento", "label": "Dim. Medicamento", "count": DimMedicamento.objects.count(), "icon": "Pill"},
            {"tabela": "DimTipoProcedimento", "label": "Dim. Tipo Procedimento", "count": DimTipoProcedimento.objects.count(), "icon": "Stethoscope"},
            {"tabela": "DimEquipamento", "label": "Dim. Equipamento", "count": DimEquipamento.objects.count(), "icon": "Wrench"},
            {"tabela": "DimMedico", "label": "Dim. Médico", "count": DimMedico.objects.count(), "icon": "UserCheck"},
            {"tabela": "DimProtocolo", "label": "Dim. Protocolo", "count": DimProtocolo.objects.count(), "icon": "FileText"},
            {"tabela": "DimConvenio", "label": "Dim. Convênio", "count": DimConvenio.objects.count(), "icon": "CreditCard"},
        ]
        
        fatos = [
            {"tabela": "FatoAtendimentos", "label": "Fato Atendimentos", "count": FatoAtendimentos.objects.count(), "icon": "Activity"},
            {"tabela": "FatoEstoque", "label": "Fato Estoque", "count": FatoEstoque.objects.count(), "icon": "Package"},
            {"tabela": "FatoErrosMedicao", "label": "Fato Erros Medicação", "count": FatoErrosMedicao.objects.count(), "icon": "AlertTriangle"},
            {"tabela": "FatoProcedimentos", "label": "Fato Procedimentos", "count": FatoProcedimentos.objects.count(), "icon": "Scissors"},
            {"tabela": "FatoInfraestrutura", "label": "Fato Infraestrutura", "count": FatoInfraestrutura.objects.count(), "icon": "Zap"},
            {"tabela": "FatoHigienizacao", "label": "Fato Higienização", "count": FatoHigienizacao.objects.count(), "icon": "Droplets"},
            {"tabela": "FatoDesempenhoClinico", "label": "Fato Desempenho Clínico", "count": FatoDesempenhoClinico.objects.count(), "icon": "TrendingUp"},
            {"tabela": "FatoEscalaMedica", "label": "Fato Escala Médica", "count": FatoEscalaMedica.objects.count(), "icon": "Clock"},
            {"tabela": "FatoFinanceiro", "label": "Fato Financeiro", "count": FatoFinanceiro.objects.count(), "icon": "DollarSign"},
        ]
        
        total_dimensoes = sum(d["count"] for d in dimensoes)
        total_fatos = sum(f["count"] for f in fatos)
        total_geral = total_dimensoes + total_fatos
        
        all_tables = dimensoes + fatos
        maior_tabela = max(all_tables, key=lambda x: x["count"]) if all_tables else {"label": "N/A", "count": 0}
        
        return response.Response({
            "dimensoes": dimensoes,
            "fatos": fatos,
            "summary": {
                "total_dimensoes": total_dimensoes,
                "total_fatos": total_fatos,
                "total_geral": total_geral,
                "maior_tabela_label": maior_tabela["label"],
                "maior_tabela_count": maior_tabela["count"],
                "ultima_atualizacao": timezone.now().isoformat(),
            }
        })


class SeedDataView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        records = int(request.data.get("records", 100))
        mode = request.data.get("mode", "db")
        clear = request.data.get("clear", False)
        dims_only = request.data.get("dims_only", False)
        facts_only = request.data.get("facts_only", False)

        if records < 1 or records > 50000:
            return response.Response({"erro": "Quantidade de registros deve ser entre 1 e 50000."}, status=400)
        if mode not in ["db", "csv", "both"]:
            return response.Response({"erro": "Modo invalido. Use 'db', 'csv' ou 'both'."}, status=400)

        # Build command — manage.py is two levels up from this file (indicadores/views.py)
        manage_py = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'manage.py')
        cmd = [sys.executable, manage_py, "generate_data", f"--records={records}", f"--mode={mode}"]
        if clear:
            cmd.append("--clear")
        if dims_only:
            cmd.append("--dims-only")
        if facts_only:
            cmd.append("--facts-only")

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,
                env={**os.environ, "PYTHONIOENCODING": "utf-8"},
                cwd=os.path.dirname(manage_py)
            )
            if result.returncode == 0:
                return response.Response({
                    "status": "ok",
                    "mensagem": "Geracao de dados concluida com sucesso.",
                    "log": result.stdout,
                    "records": records,
                    "mode": mode,
                })
            else:
                return response.Response({
                    "status": "erro",
                    "mensagem": "Erro durante a geracao de dados.",
                    "log": result.stderr or result.stdout,
                }, status=500)
        except subprocess.TimeoutExpired:
            return response.Response({"erro": "Timeout: geracao demorou mais de 5 minutos."}, status=504)
        except Exception as e:
            return response.Response({"erro": str(e)}, status=500)


import math
import pypdf
import zipfile
import xml.etree.ElementTree as ET
import psycopg
from rest_framework.parsers import MultiPartParser, FormParser
from .models import DocumentoConhecimento, BlocoDocumento, ResumoExecutivo

def extrair_texto_arquivo(file_obj, filename):
    ext = os.path.splitext(filename.lower())[1]
    text = ""
    if ext == '.docx':
        try:
            with zipfile.ZipFile(file_obj) as z:
                xml_content = z.read('word/document.xml')
                root = ET.fromstring(xml_content)
                ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                
                # Extrair todos os parágrafos
                text_list = []
                for p in root.findall('.//w:p', ns):
                    text_elems = p.findall('.//w:t', ns)
                    p_text = "".join([t.text for t in text_elems if t.text])
                    if p_text:
                        text_list.append(p_text)
                text = "\n".join(text_list)
        except Exception as e:
            text = f"Erro ao extrair DOCX: {e}"
    elif ext == '.pdf':
        reader = pypdf.PdfReader(file_obj)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
    else:
        try:
            text = file_obj.read().decode('utf-8')
        except Exception:
            text = file_obj.read().decode('latin-1', errors='ignore')
    return text

def clean_tokens(text):
    if not text:
        return []
    # Normalize text (lowercase, remove accents)
    normalized = normalize_text(text)
    tokens = normalized.split()
    stopwords = {
        'a', 'o', 'e', 'de', 'do', 'da', 'em', 'um', 'uma', 'os', 'as', 'com', 'para', 'por', 'que', 'se', 'no', 'na',
        'como', 'para', 'por', 'dos', 'das', 'nos', 'nas', 'ao', 'aos', 'ou', 'seja', 'este', 'esta', 'estes', 'estas',
        'um', 'uma', 'uns', 'umas'
    }
    cleaned = []
    for t in tokens:
        if t in stopwords or len(t) < 3:
            continue
        # Stem: strip trailing 's' / plural endings
        if t.endswith('s') and len(t) > 3:
            if t.endswith('oes'):
                t = t[:-3] + 'ao'
            elif t.endswith('res') or t.endswith('nes'):
                t = t[:-2]
            elif t.endswith('ns'):
                t = t[:-2] + 'm'
            else:
                t = t[:-1]
        cleaned.append(t)
    return cleaned


def compute_tfidf_similarity(query, documents):
    query_tokens = clean_tokens(query)
    if not query_tokens or not documents:
        return [(doc[0], 0.0) for doc in documents]

    doc_tokens = [clean_tokens(doc[1]) for doc in documents]
    all_tokens = set(query_tokens)
    for dt in doc_tokens:
        all_tokens.update(dt)

    df = {token: 0 for token in all_tokens}
    for dt in doc_tokens:
        seen = set(dt)
        for token in seen:
            df[token] += 1

    N = len(documents)
    idf = {}
    for token, count in df.items():
        idf[token] = math.log((1 + N) / (1 + count)) + 1

    query_vec = {}
    for token in query_tokens:
        query_vec[token] = query_vec.get(token, 0) + 1
    for token in query_vec:
        if token in idf:
            query_vec[token] *= idf[token]

    results = []
    for doc_id, tokens in zip([doc[0] for doc in documents], doc_tokens):
        doc_vec = {}
        for token in tokens:
            doc_vec[token] = doc_vec.get(token, 0) + 1
        for token in doc_vec:
            doc_vec[token] *= idf[token]

        dot_product = 0.0
        for token in query_vec:
            if token in doc_vec:
                dot_product += query_vec[token] * doc_vec[token]

        norm_q = math.sqrt(sum(v**2 for v in query_vec.values()))
        norm_d = math.sqrt(sum(v**2 for v in doc_vec.values()))

        score = dot_product / (norm_q * norm_d) if (norm_q * norm_d) > 0 else 0.0
        results.append((doc_id, score))

    results.sort(key=lambda x: x[1], reverse=True)
    return results


class ChatExecutivoView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        pergunta = request.data.get("pergunta", "").strip()
        chat_history = request.data.get("chat_history", [])

        if not pergunta:
            return response.Response({"erro": "O campo 'pergunta' é obrigatório."}, status=400)

        system_prompt = (
            "Você é o Consultor Executivo Sênior em Administração e Ocupação Hospitalar.\n"
            "Sua função é auxiliar o Diretor Geral do hospital analisando dados operacionais, financeiros, "
            "infraestrutura, escalas de RH e conformidade de faturamento. "
            "Forneça respostas estruturadas, profissionais e executivas. "
            "Atenção: Não forneça diagnósticos clínicos, prescrições de medicamentos ou orientações médicas."
        )

        # Primeira linha de defesa contra SQL Injection na pergunta
        danger_words = ["INSERT", "UPDATE", "DELETE", "DROP", "TRUNCATE", "ALTER", "CREATE", "GRANT", "REVOKE", "DATABASE", "SCHEMA"]
        for dw in danger_words:
            if re.search(r'\b' + dw + r'\b', pergunta.upper()):
                return response.Response({"erro": f"Operação perigosa '{dw}' detectada na pergunta."}, status=400)
        
        if ";" in pergunta:
            parts = pergunta.split(";")
            if len(parts) > 1 and any(p.strip() for p in parts[1:]):
                return response.Response({"erro": "Caracteres não permitidos identificados na pergunta."}, status=400)

        # 1. Verificar escopo médico/clínico (Recusa educada)
        pergunta_norm = normalize_text(pergunta)
        clinical_keywords = ["diagnostico", "remedio para", "tratamento de", "receitar", "dor de cabeca", "sintoma", "doenca", "medicacao clinica"]
        if any(kw in pergunta_norm for kw in clinical_keywords):
            return response.Response({
                "resposta": "Como **Consultor Executivo Sênior em Gestão Hospitalar**, meu escopo de atuação restringe-se ao planejamento operacional, gestão de leitos, controle financeiro (EBITDA, glosas), dimensionamento de escalas e segurança do paciente no fluxo hospitalar.\n\nPara diagnósticos médicos, prescrições clínicas ou conselhos assistenciais diretos, por favor, consulte um profissional médico habilitado.",
                "chart_data": None
            })

        # 2. Identificar intenção: Pergunta sobre o Projeto vs Text-to-SQL vs RAG Conceitual
        data_keywords = [
            "faturamento", "receita", "glosa", "erro", "procedimento", "medico", "paciente",
            "escala", "atendimento", "gargalo", "total", "media", "quantos", "valor", "ebitda",
            "financeiro", "ocupacao", "leito", "medicamento", "estoque", "absenteismo", "permanencia"
        ]

        # Detecta perguntas sobre o próprio sistema/projeto (KPIs, módulos, indicadores gerais)
        project_keywords = [
            "indicador", "kpi", "modulo", "projeto", "sistema", "dashboard", "painel",
            "quais sao", "quais são", "me mostre", "me liste", "capacidades", "funcionalidades",
            "o que voce faz", "o que você faz", "o que voce pode", "o que você pode",
            "me apresente", "overview", "visao geral", "visão geral", "resumo do sistema"
        ]
        is_project_question = any(kw in pergunta_norm for kw in project_keywords)

        is_sql = False
        if len(pergunta) < 150 and any(kw in pergunta_norm for kw in data_keywords):
            conv_keywords = ["analise", "comente", "explique", "discutir", "resumo", "gerencial", "relatorio"]
            if not any(ckw in pergunta_norm for ckw in conv_keywords):
                is_sql = True

        gemini_key, openai_key = get_api_keys(request)

        # ── RAMO 0: Pergunta sobre o próprio projeto/sistema (tem prioridade sobre SQL) ─
        if is_project_question:
            # Busca dados reais do banco para enriquecer a resposta
            try:
                from .models import FatoAtendimentos, FatoFinanceiro, FatoErrosMedicao, FatoEstoque, FatoProcedimentos
                n_atend = FatoAtendimentos.objects.count()
                n_fin   = FatoFinanceiro.objects.count()
                n_erros = FatoErrosMedicao.objects.count()
                n_estq  = FatoEstoque.objects.count()
                n_proc  = FatoProcedimentos.objects.count()
                from django.db.models import Sum as DjSum, Avg as DjAvg
                receita_total = FatoFinanceiro.objects.aggregate(t=DjSum('receita_bruta'))['t'] or 0
                glosa_total   = FatoFinanceiro.objects.aggregate(t=DjSum('valor_glosa_inicial'))['t'] or 0
                tmp_medio     = FatoAtendimentos.objects.aggregate(t=DjAvg('tempo_permanencia_dias'))['t'] or 0
                db_stats = (
                    f"📦 **Dados no banco de dados:**\n"
                    f"- **Atendimentos registrados:** {n_atend:,}\n"
                    f"- **Registros Financeiros:** {n_fin:,} | Receita Total: R$ {receita_total:,.0f} | Glosas: R$ {glosa_total:,.0f}\n"
                    f"- **Erros de Medicação:** {n_erros:,} ocorrências monitoradas\n"
                    f"- **Lotes de Estoque:** {n_estq:,} registros de farmácia\n"
                    f"- **Procedimentos:** {n_proc:,} registros | TMP Médio: {tmp_medio:.1f} dias\n"
                )
            except Exception:
                db_stats = "*(Dados do banco indisponíveis momentaneamente)*"

            projeto_prompt = (
                f"{system_prompt}\n\n"
                f"O Diretor perguntou: '{pergunta}'\n\n"
                f"Responda em português, de forma executiva e estruturada em markdown, descrevendo:\n"
                f"1. Os módulos analíticos disponíveis no sistema (Pacientes, Medicamentos, Procedimentos, Hospital, Médicos, Financeiro, Auditoria SUS, Regulação & Filas, Matriz de Risco, Copilot Executivo IA).\n"
                f"2. Os principais KPIs de cada módulo com suas metas.\n"
                f"3. As capacidades de IA disponíveis (Text-to-SQL, RAG local, Resumo Executivo Diário).\n"
                f"4. Os dados reais atualmente indexados no banco:\n{db_stats}\n"
                f"Seja conciso, executivo e profissional."
            )

            resposta_texto = ""
            error_detail = None
            if gemini_key or openai_key:
                resposta_texto, error_detail = call_llm(gemini_key, openai_key, system_prompt, projeto_prompt, timeout=12)

            if error_detail:
                resposta_texto = f"### ⚠️ Erro na Chamada da API de IA\n\n{error_detail}"

            if not resposta_texto:
                # Fallback offline rico e completo
                resposta_texto = (
                    "### 🏥 Health Analytics Dashboard — Visão Geral do Sistema\n\n"
                    "**Sou o Copilot Executivo**, seu Consultor Sênior em Administração e Ocupação Hospitalar. "
                    "Opero sobre um **Data Warehouse PostgreSQL** em arquitetura Star Schema, com os seguintes módulos analíticos:\n\n"
                    "---\n\n"
                    "#### 📊 Módulos e KPIs Principais\n\n"
                    "| Módulo | KPIs Monitorados | Meta |\n"
                    "|--------|-----------------|------|\n"
                    "| **Pacientes & Fluxo** | Taxa de Ocupação, TMP, Taxa de Reinternação, NPS | Ocupação ≥75%, TMP ≤8d |\n"
                    "| **Medicamentos** | Erros/1.000, Giro de Estoque, Taxa de Ruptura, Custo/dia | Erros <1‰ |\n"
                    "| **Procedimentos** | Giro de Sala, Taxa de Suspensão, Taxa de Conversão | Conversão ≥90% |\n"
                    "| **Hospital & Infraestrutura** | Taxa IRAS, Consumo Água/Energia, Densidade RH | IRAS <1‰ |\n"
                    "| **Médicos** | Adesão Protocolos, Tempo Prontuário, Absenteísmo, Volume | Absenteísmo <5% |\n"
                    "| **Financeiro** | EBITDA, PMR, Ticket Médio, Índice de Glosa | EBITDA ≥8% |\n"
                    "| **Auditoria SUS** | Faturamento SIA/SIH, Evasão de Receita, Glosa SUS | Glosa SUS <3% |\n"
                    "| **Regulação & Filas** | Backlog, Tempo de Espera, Taxa de Suspensão | Espera ≤48h |\n"
                    "| **Matriz de Risco** | Score de Risco, Correlação Sobrecarga×Segurança | Score <50pts |\n\n"
                    "---\n\n"
                    "#### 🤖 Capacidades de IA\n"
                    "- **Text-to-SQL:** Pergunte sobre dados reais — ex: *'Qual o faturamento por convênio?'*, *'Quais médicos têm mais absenteísmo?'*\n"
                    "- **RAG Local:** Base de conhecimento com manuais SUS e protocolos institucionais indexados\n"
                    "- **Resumo Executivo Diário:** Detecta automaticamente anomalias (Z-Score ≥2σ) nas tabelas Fato\n\n"
                    "---\n\n"
                    + db_stats + "\n\n"
                    "💡 **Dica:** Configure sua chave Gemini ou OpenAI nas ⚙️ *Configurações* para respostas síntéticas completas com IA Generativa."
                )

            return response.Response({
                "resposta": resposta_texto,
                "chart_data": None
            })

        if is_sql:
            # TEXT-TO-SQL
            sql_query = ""
            # Mapeamento de regras offline
            if "faturamento" in pergunta_norm or "receita" in pergunta_norm:
                if "convenio" in pergunta_norm or "operadora" in pergunta_norm:
                    sql_query = "SELECT c.nome_operadora as operadora, SUM(f.receita_bruta) as total_receita FROM indicadores_fatofinanceiro f JOIN indicadores_dimconvenio c ON f.id_convenio_id = c.id_convenio GROUP BY c.nome_operadora ORDER BY total_receita DESC;"
                elif "unidade" in pergunta_norm:
                    sql_query = "SELECT u.nome_unidade as unidade, SUM(f.receita_bruta) as total_receita FROM indicadores_fatofinanceiro f JOIN indicadores_dimunidade u ON f.id_unidade_id = u.id_unidade GROUP BY u.nome_unidade ORDER BY total_receita DESC;"
                else:
                    sql_query = "SELECT t.ano::text as ano, SUM(f.receita_bruta) as total_receita FROM indicadores_fatofinanceiro f JOIN indicadores_dimtempo t ON f.id_tempo_id = t.id_tempo GROUP BY t.ano ORDER BY t.ano DESC;"
            elif "glosa" in pergunta_norm:
                if "convenio" in pergunta_norm or "operadora" in pergunta_norm:
                    sql_query = "SELECT c.nome_operadora as operadora, SUM(f.valor_glosa_inicial) as total_glosa FROM indicadores_fatofinanceiro f JOIN indicadores_dimconvenio c ON f.id_convenio_id = c.id_convenio GROUP BY c.nome_operadora ORDER BY total_glosa DESC;"
                else:
                    sql_query = "SELECT t.ano::text as ano, SUM(f.valor_glosa_inicial) as total_glosa FROM indicadores_fatofinanceiro f JOIN indicadores_dimtempo t ON f.id_tempo_id = t.id_tempo GROUP BY t.ano ORDER BY t.ano DESC;"
            elif "erro" in pergunta_norm:
                if "tipo" in pergunta_norm:
                    sql_query = "SELECT f.tipo_erro as categoria, COUNT(*) as quantidade FROM indicadores_fatoerrosmedicao f GROUP BY f.tipo_erro ORDER BY quantidade DESC;"
                elif "severidade" in pergunta_norm:
                    sql_query = "SELECT f.severidade as categoria, COUNT(*) as quantidade FROM indicadores_fatoerrosmedicao f GROUP BY f.severidade ORDER BY quantidade DESC;"
                else:
                    sql_query = "SELECT u.nome_unidade as unidade, COUNT(*) as erros FROM indicadores_fatoerrosmedicao f JOIN indicadores_fatoatendimentos a ON f.id_paciente_id = a.id_paciente_id JOIN indicadores_dimunidade u ON a.id_unidade_id = u.id_unidade GROUP BY u.nome_unidade ORDER BY erros DESC;"
            elif "permanencia" in pergunta_norm or "tmp" in pergunta_norm:
                sql_query = "SELECT u.nome_unidade as unidade, ROUND(AVG(f.tempo_permanencia_dias)::numeric, 1) as media_dias FROM indicadores_fatoatendimentos f JOIN indicadores_dimunidade u ON f.id_unidade_id = u.id_unidade GROUP BY u.nome_unidade ORDER BY media_dias DESC;"
            elif "reinternacao" in pergunta_norm or "retorno" in pergunta_norm:
                sql_query = "SELECT u.nome_unidade as unidade, ROUND((SUM(CASE WHEN f.reinternacao_30d THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100)::numeric, 1) as taxa_reinternacao FROM indicadores_fatoatendimentos f JOIN indicadores_dimunidade u ON f.id_unidade_id = u.id_unidade GROUP BY u.nome_unidade ORDER BY taxa_reinternacao DESC;"
            elif "absenteismo" in pergunta_norm or "escala" in pergunta_norm:
                sql_query = "SELECT m.nome_medico as medico, ROUND((SUM(CASE WHEN f.status_presenca = 'Falta' THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100)::numeric, 1) as absent_rate FROM indicadores_fatoescalamedica f JOIN indicadores_dimmedico m ON f.id_medico_id = m.id_medico GROUP BY m.nome_medico ORDER BY absent_rate DESC LIMIT 10;"
            elif "prontuario" in pergunta_norm or "fechamento" in pergunta_norm:
                sql_query = "SELECT m.nome_medico as medico, ROUND(AVG(f.tempo_fechamento_prontuario_min)::numeric, 1) as media_minutos FROM indicadores_fatodesempenhoclinico f JOIN indicadores_dimmedico m ON f.id_medico_id = m.id_medico GROUP BY m.nome_medico ORDER BY media_minutos DESC LIMIT 10;"
            else:
                sql_query = "SELECT 'Total Atendimentos' as indicador, COUNT(*) as valor FROM indicadores_fatoatendimentos;"

            # Segurança e sanitização contra SQL Injection
            clean_query = sql_query.strip().rstrip(';').strip()
            # Validações estritas de segurança
            if not clean_query.upper().startswith("SELECT"):
                return response.Response({"erro": "Apenas consultas SELECT são permitidas."}, status=400)
            if ";" in clean_query or "--" in clean_query:
                return response.Response({"erro": "Caracteres não permitidos identificados na query."}, status=400)
            
            danger_words = ["INSERT", "UPDATE", "DELETE", "DROP", "TRUNCATE", "ALTER", "CREATE", "GRANT", "REVOKE", "DATABASE", "SCHEMA"]
            for dw in danger_words:
                if re.search(r'\b' + dw + r'\b', clean_query.upper()):
                    return response.Response({"erro": f"Operação perigosa '{dw}' bloqueada na query."}, status=400)

            # Executar query usando postgres_bi
            rows = []
            cols = []
            try:
                # Conexão separada sob postgres_bi
                conn = psycopg.connect(
                    dbname="indicadores_db",
                    user="postgres_bi",
                    password="BiSecurePass2026!",
                    host="localhost",
                    port="5432",
                    options="-c search_path=ind,public"
                )
                with conn.cursor() as cur:
                    cur.execute(clean_query)
                    rows = cur.fetchall()
                    cols = [d[0] for d in cur.description]
                conn.close()
            except Exception as db_err:
                return response.Response({"erro": f"Erro de banco na consulta executiva: {db_err}"}, status=500)

            # Formatar dados estruturados
            chart_data = []
            if len(rows) > 0 and len(cols) >= 2:
                for r in rows:
                    name_val = r[0]
                    # Converte Decimal ou float para float
                    try:
                        numeric_val = float(r[1])
                    except (ValueError, TypeError):
                        numeric_val = r[1]
                    chart_data.append({"name": str(name_val), "valor": numeric_val})

            # Explicar os resultados usando LLM ou Fallback
            result_formatted = f"Colunas: {cols}\nRegistros:\n"
            for r in rows[:15]:
                result_formatted += f"- {r}\n"

            prompt_sql = (
                f"O gestor hospitalar perguntou: '{pergunta}'.\n"
                f"A query SQL otimizada executada no banco foi:\n```sql\n{clean_query}\n```\n\n"
                f"Os resultados reais obtidos foram:\n{result_formatted}\n\n"
                f"Como Diretor de Operações Hospitalares, elabore uma resposta executiva clara em português explicando os dados. "
                f"Apresente observações gerenciais de impactos e sugestão de ações práticas imediatas com base nos números reais apresentados. "
                f"Adicione a query SQL formatada como curiosidade técnica para transparência do gestor."
            )

            resposta_texto = ""
            error_detail = None
            if gemini_key or openai_key:
                resposta_texto, error_detail = call_llm(gemini_key, openai_key, "Você é o COO/Consultor Executivo do Hospital.", prompt_sql, timeout=12)

            if error_detail:
                resposta_texto = (
                    f"### ⚠️ Erro na Chamada da API de IA\n\n{error_detail}\n\n"
                    f"#### 📊 **[Dados da Consulta BI (Fallback)]**\n"
                    f"Abaixo estão os dados reais da base de dados:\n\n"
                    f"{', '.join([f'**{r[0]}**: {r[1]:,.1f}' if isinstance(r[1], (int, float)) else f'**{r[0]}**: {r[1]}' for r in rows[:6]])}\n\n"
                    f"```sql\n{clean_query}\n```"
                )

            if not resposta_texto:
                # Fallback offline estruturado
                rows_summary = ", ".join([f"**{r[0]}**: {r[1]:,.1f}" if isinstance(r[1], (int, float)) else f"**{r[0]}**: {r[1]}" for r in rows[:6]])
                resposta_texto = (
                    f"### **[Consulta BI Concluída]**\n"
                    f"Para responder à sua pergunta, executei uma query Postgres estruturada contra o schema de Business Intelligence. "
                    f"Os dados reais obtidos foram:\n\n"
                    f"{rows_summary}\n\n"
                    f"**Análise de Gestão:**\n"
                    f"Com base nesses números na base de dados, observamos a distribuição de custos, faturamento ou ocorrências. "
                    f"Recomenda-se focar as atenções operacionais nos maiores gargalos apresentados acima. "
                    f"Isso otimiza o fluxo e reduz custos operacionais fixos no curto prazo.\n\n"
                    f"📊 *Gráfico dinâmico renderizado abaixo na tela de chat baseando-se nestes dados.*\n\n"
                    f"```sql\n-- Query executada com permissões de postgres_bi:\n{clean_query}\n```"
                )

            return response.Response({
                "resposta": resposta_texto,
                "chart_data": chart_data
            })

        else:
            # BUSCA CONCEITUAL / RAG / CHAT GERAL
            contexto_texto = ""
            fonte_nomes = ""
            
            chunks = BlocoDocumento.objects.all()
            if chunks.exists():
                docs_tuples = [(c.id_bloco, c.conteudo) for c in chunks]
                similarity_results = compute_tfidf_similarity(pergunta, docs_tuples)
                
                top_chunks = similarity_results[:4]
                retrieved_chunks = []
                for id_bloco, score in top_chunks:
                    if score > 0.01:
                        bloco = BlocoDocumento.objects.get(id_bloco=id_bloco)
                        retrieved_chunks.append(bloco)

                if retrieved_chunks:
                    for c in retrieved_chunks:
                        contexto_texto += f"[Manual: {c.documento.nome_arquivo} - Bloco {c.indice_bloco}]:\n{c.conteudo}\n\n"
                    fonte_nomes = ", ".join(list(set([c.documento.nome_arquivo for c in retrieved_chunks])))

            prompt_rag = pergunta
            if contexto_texto:
                prompt_rag = (
                    f"Aqui está o contexto semântico relevante recuperado dos manuais:\n{contexto_texto}\n"
                    f"Responda à pergunta do gestor baseando-se no contexto acima quando apropriado. Cite o nome das fontes: {fonte_nomes}.\n\n"
                    f"Pergunta: {pergunta}"
                )

            resposta_texto = ""
            error_detail = None
            if gemini_key or openai_key:
                resposta_texto, error_detail = call_llm(gemini_key, openai_key, system_prompt, prompt_rag, timeout=12)

            if error_detail:
                resposta_texto = f"### ⚠️ Erro na Chamada da API de IA\n\n{error_detail}"

            if not resposta_texto:
                # Fallback offline inteligente
                if "Resumo Executivo Diário" in pergunta:
                    resposta_texto = (
                        f"### **[Discussão do Resumo Executivo]**\n"
                        f"Compreendo perfeitamente o cenário operacional detalhado no Resumo Executivo Diário de hoje.\n\n"
                        f"**Pontos Críticos de Atenção:**\n"
                        f"1. **Segurança do Faturamento:** É essencial auditar as glosas iniciais aplicadas. Certifique-se de que a conciliação esteja sendo feita dentro do prazo contratual.\n"
                        f"2. **Fluxo de Leitos:** Caso haja queda de EBITDA ou picos de tempo de permanência, revise o giro de leitos da hotelaria para acelerar novas internações.\n"
                        f"3. **Segurança do Paciente:** Priorize a supervisão da enfermagem nas escalas para mitigar ocorrências de erros de medicação.\n\n"
                        f"Recomendo reunir-se com os coordenadores de faturamento e enfermagem hoje para alinhar estas ações corretivas de imediato."
                    )
                elif contexto_texto:
                    resposta_texto = (
                        f"### **[Busca Semântica Local (Modo Offline)]**\n"
                        f"Identifiquei as seguintes correspondências nos documentos indexados (**{fonte_nomes}**):\n\n"
                    )
                    for idx, chunk in enumerate(retrieved_chunks):
                        filename = chunk.documento.nome_arquivo
                        resposta_texto += (
                            f"#### 📄 Trecho {idx+1} — *{filename}*:\n"
                            f"> {chunk.conteudo.strip()}\n\n"
                        )
                    resposta_texto += (
                        f"💡 *Nota: Como nenhuma chave de API do Gemini/OpenAI foi detectada, o sistema está buscando e exibindo os trechos diretamente da base de conhecimento local. "
                        f"Para receber respostas cognitivas sintetizadas com IA, configure sua chave de API no menu de configurações do cabeçalho.*"
                    )
                else:
                    resposta_texto = (
                        f"### **[Consultoria de Gestão Hospitalar]**\n"
                        f"Olá! Como seu consultor de gestão, posso auxiliar a analisar os KPIs operacionais do hospital. "
                        f"Como atualmente estamos operando em modo de simulação offline e não há manuais indexados no RAG local, recomendo:\n\n"
                        f"• Realizar perguntas sobre indicadores específicos (ex: 'Qual a receita de faturamento?', 'Erros de medicação por tipo') para ver a extração de queries SQL reais do banco.\n"
                        f"• Carregar manuais e portarias do SUS no painel lateral para habilitar buscas cognitivas locais."
                    )

            return response.Response({
                "resposta": resposta_texto,
                "chart_data": None
            })


class UploadDocumentoView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        docs = DocumentoConhecimento.objects.order_by("-data_upload")
        lista = []
        for d in docs:
            lista.append({
                "id": d.id_documento,
                "nome": d.nome_arquivo,
                "tamanho": f"{d.tamanho_bytes / 1024:.1f} KB" if d.tamanho_bytes < 1024*1024 else f"{d.tamanho_bytes / (1024*1024):.1f} MB",
                "data": d.data_upload.strftime("%d/%m/%Y"),
                "status": "Sincronizado"
            })
        return response.Response(lista)

    def post(self, request):
        file_obj = request.FILES.get("arquivo")
        if not file_obj:
            return response.Response({"erro": "Nenhum arquivo enviado."}, status=400)

        filename = file_obj.name
        tamanho = file_obj.size

        # Limite de tamanho: 50MB
        if tamanho > 50 * 1024 * 1024:
            return response.Response({"erro": "Tamanho de arquivo excede o limite de 50MB."}, status=400)

        # Extrair texto
        try:
            texto = extrair_texto_arquivo(file_obj, filename)
        except Exception as e:
            return response.Response({"erro": f"Falha ao processar arquivo: {e}"}, status=400)

        if not texto.strip():
            return response.Response({"erro": "O documento enviado não contém texto legível."}, status=400)

        texto = texto.replace('\x00', '')

        # Criar documento
        doc_obj = DocumentoConhecimento.objects.create(
            nome_arquivo=filename,
            tipo_documento=os.path.splitext(filename)[1].replace(".", ""),
            tamanho_bytes=tamanho,
            conteudo_completo=texto
        )

        # Chunking: blocos de 2500 caracteres com overlap de 400
        chunk_size = 2500
        overlap = 400
        blocos_criados = 0

        i = 0
        while i < len(texto):
            chunk = texto[i : i + chunk_size].strip()
            if len(chunk) > 50: # Evita salvar chunks vazios ou ínfimos
                # Para embeddings, salvamos uma lista vazia ou nula.
                # Se tivéssemos chaves de API, faríamos o request de embedding aqui.
                # O local TF-IDF cuidará da busca se a lista for vazia, por isso salvamos null.
                BlocoDocumento.objects.create(
                    documento=doc_obj,
                    indice_bloco=blocos_criados,
                    conteudo=chunk,
                    embedding=None
                )
                blocos_criados += 1
            i += (chunk_size - overlap)

        return response.Response({
            "status": "ok",
            "mensagem": "Documento ingerido e indexado com sucesso para RAG local.",
            "documento": {
                "id": doc_obj.id_documento,
                "nome_arquivo": doc_obj.nome_arquivo,
                "tipo": doc_obj.tipo_documento,
                "tamanho": doc_obj.tamanho_bytes,
                "chunks": blocos_criados
            }
        }, status=201)

import os
from django.core.management import call_command

class GerarResumoDiarioView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            gemini_key = request.headers.get("X-Gemini-Key")
            openai_key = request.headers.get("X-OpenAI-Key")
            if gemini_key:
                os.environ["GEMINI_API_KEY"] = gemini_key
            if openai_key:
                os.environ["OPENAI_API_KEY"] = openai_key

            call_command('gerar_insights_diarios')
            return response.Response({
                "status": "ok",
                "mensagem": "Resumo executivo diário gerado com sucesso."
            })
        except Exception as e:
            return response.Response({
                "erro": f"Falha ao gerar resumo: {str(e)}"
            }, status=500)

class HistoricoResumosView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        resumos = ResumoExecutivo.objects.order_by("-data_geracao")
        lista = []
        for r in resumos:
            lista.append({
                "id_resumo": r.id_resumo,
                "data_geracao": r.data_geracao.strftime("%Y-%m-%d"),
                "dados_anomalias": r.dados_anomalias,
                "conteudo_resumo": r.conteudo_resumo
            })
        return response.Response(lista)


