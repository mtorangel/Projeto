import os
import requests
import json
import math
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Avg, Sum, Count
from indicadores.models import (
    DimTempo, FatoFinanceiro, FatoErrosMedicao,
    FatoDesempenhoClinico, FatoAtendimentos, ResumoExecutivo
)

class Command(BaseCommand):
    help = "Analisa anomalias matemáticas nas tabelas Fato e gera o Resumo Executivo Diário via LLM ou fallback."

    def handle(self, *args, **options):
        self.stdout.write("Iniciando análise de anomalias operacionais e financeiras...")

        # 1. Definir o período dos últimos 30 dias com registros
        max_tempo = DimTempo.objects.order_by("-data_registro").first()
        if not max_tempo:
            self.stdout.write(self.style.WARNING("Nenhum registro de tempo encontrado no banco de dados. Abortando."))
            return

        data_fim = max_tempo.data_registro
        data_inicio = data_fim - timedelta(days=30)

        self.stdout.write(f"Analisando intervalo de {data_inicio} a {data_fim}")

        # 2. Coletar séries diárias para as métricas críticas
        datas = [data_inicio + timedelta(days=i) for i in range((data_fim - data_inicio).days + 1)]
        daily_series = {d: {
            "erros_medicao": 0,
            "ebitda": 0.0,
            "tempo_prontuario": 0.0,
            "tempo_prontuario_count": 0,
            "reinternacoes": 0,
            "atendimentos": 0,
            "glosa_inicial": 0.0
        } for d in datas}

        # Query FatoFinanceiro
        fin_qs = FatoFinanceiro.objects.filter(id_tempo__data_registro__range=(data_inicio, data_fim))
        for item in fin_qs:
            dt = item.id_tempo.data_registro
            if dt in daily_series:
                ebitda = item.receita_bruta - item.custos_operacionais
                daily_series[dt]["ebitda"] += ebitda
                daily_series[dt]["glosa_inicial"] += item.valor_glosa_inicial

        # Query FatoErrosMedicao
        err_qs = FatoErrosMedicao.objects.filter(id_tempo__data_registro__range=(data_inicio, data_fim))
        for item in err_qs:
            dt = item.id_tempo.data_registro
            if dt in daily_series:
                daily_series[dt]["erros_medicao"] += 1

        # Query FatoDesempenhoClinico
        des_qs = FatoDesempenhoClinico.objects.filter(id_tempo__data_registro__range=(data_inicio, data_fim))
        for item in des_qs:
            dt = item.id_tempo.data_registro
            if dt in daily_series:
                daily_series[dt]["tempo_prontuario"] += item.tempo_fechamento_prontuario_min
                daily_series[dt]["tempo_prontuario_count"] += 1

        # Query FatoAtendimentos
        at_qs = FatoAtendimentos.objects.filter(id_tempo__data_registro__range=(data_inicio, data_fim))
        for item in at_qs:
            dt = item.id_tempo.data_registro
            if dt in daily_series:
                daily_series[dt]["atendimentos"] += 1
                if item.reinternacao_30d:
                    daily_series[dt]["reinternacoes"] += 1

        # 3. Calcular métricas finais consolidadas por dia
        list_ebitda = []
        list_erros = []
        list_prontuario = []
        list_reinternacao_pct = []
        list_glosa = []

        for d, vals in daily_series.items():
            list_ebitda.append(vals["ebitda"])
            list_erros.append(vals["erros_medicao"])
            avg_pront = (vals["tempo_prontuario"] / vals["tempo_prontuario_count"]) if vals["tempo_prontuario_count"] > 0 else 0.0
            list_prontuario.append(avg_pront)
            pct_reint = (vals["reinternacoes"] / vals["atendimentos"] * 100) if vals["atendimentos"] > 0 else 0.0
            list_reinternacao_pct.append(pct_reint)
            list_glosa.append(vals["glosa_inicial"])

        # 4. Detecção de Anomalias no último dia
        idx_fim = -1
        val_ebitda = list_ebitda[idx_fim]
        val_erros = list_erros[idx_fim]
        val_prontuario = list_prontuario[idx_fim]
        val_reinternacao = list_reinternacao_pct[idx_fim]
        val_glosa = list_glosa[idx_fim]

        anomalias = []
        dados_anomalias = {}

        # Funções estatísticas auxiliares em Python puro
        def py_mean(lst):
            return sum(lst) / len(lst) if lst else 0.0

        def py_std(lst):
            if not lst or len(lst) < 2:
                return 0.0
            m = py_mean(lst)
            var = sum((x - m)**2 for x in lst) / len(lst)
            return math.sqrt(var)

        def verificar_anomalia(nome, valores, val_atual, menor_melhor=True, threshold_absoluto=None):
            std_val = py_std(valores)
            if len(valores) < 5 or std_val == 0:
                if threshold_absoluto is not None:
                    excedeu = val_atual > threshold_absoluto if menor_melhor else val_atual < threshold_absoluto
                    if excedeu:
                        status = "crítico"
                        detalhe = f"Valor de {val_atual:.1f} violou o limite de segurança operacional ({threshold_absoluto:.1f})."
                        return True, status, detalhe
                return False, "", ""

            historico = valores[:-1]
            media = py_mean(historico)
            desvio = py_std(historico)
            score_z = (val_atual - media) / desvio if desvio > 0 else 0

            if abs(score_z) > 2.0:
                is_bad = score_z > 2.0 if menor_melhor else score_z < -2.0
                status = "crítico" if is_bad else "positivo"
                detalhe = f"Desvio detectado: {val_atual:.1f} contra média histórica de {media:.1f} (Z-Score: {score_z:.2f}, Desvio Padrão: {desvio:.1f})."
                return True, status, detalhe
            return False, "", ""

        # Testes de anomalia
        anom_ebitda, st_ebitda, det_ebitda = verificar_anomalia("EBITDA Operacional", list_ebitda, val_ebitda, menor_melhor=False, threshold_absoluto=10000)
        if anom_ebitda:
            anomalias.append(f"EBITDA Operacional ({st_ebitda}): {det_ebitda}")
            dados_anomalias["ebitda"] = {"valor": val_ebitda, "status": st_ebitda, "detalhe": det_ebitda}

        anom_erros, st_erros, det_erros = verificar_anomalia("Erros de Medicação", list_erros, val_erros, menor_melhor=True, threshold_absoluto=3)
        if anom_erros:
            anomalias.append(f"Erros de Medicação ({st_erros}): {det_erros}")
            dados_anomalias["erros_medicao"] = {"valor": val_erros, "status": st_erros, "detalhe": det_erros}

        anom_pront, st_pront, det_pront = verificar_anomalia("Tempo de Fechamento de Prontuário", list_prontuario, val_prontuario, menor_melhor=True, threshold_absoluto=120)
        if anom_pront:
            anomalias.append(f"Tempo de Fechamento de Prontuário ({st_pront}): {det_pront}")
            dados_anomalias["tempo_prontuario"] = {"valor": val_prontuario, "status": st_pront, "detalhe": det_pront}

        anom_reint, st_reint, det_reint = verificar_anomalia("Taxa de Reinternação 30d", list_reinternacao_pct, val_reinternacao, menor_melhor=True, threshold_absoluto=15.0)
        if anom_reint:
            anomalias.append(f"Taxa de Reinternação ({st_reint}): {det_reint}")
            dados_anomalias["reinternacao"] = {"valor": val_reinternacao, "status": st_reint, "detalhe": det_reint}

        anom_glosa, st_glosa, det_glosa = verificar_anomalia("Glosas Iniciais", list_glosa, val_glosa, menor_melhor=True, threshold_absoluto=12000)
        if anom_glosa:
            anomalias.append(f"Glosas Iniciais ({st_glosa}): {det_glosa}")
            dados_anomalias["glosa"] = {"valor": val_glosa, "status": st_glosa, "detalhe": det_glosa}

        # 5. Criar Prompt para LLM
        prompt_data = (
            f"Data de Análise: {data_fim}\n"
            f"Métricas do Dia:\n"
            f"- EBITDA Operacional: R$ {val_ebitda:,.2f}\n"
            f"- Glosas Iniciais: R$ {val_glosa:,.2f}\n"
            f"- Ocorrências de Erros de Medicação: {val_erros} eventos\n"
            f"- Tempo Médio de Fechamento de Prontuário: {val_prontuario:.1f} minutos\n"
            f"- Taxa de Reinternação 30d: {val_reinternacao:.1f}%\n\n"
            f"Anomalias Detectadas:\n" + ("\n".join([f"• {a}" for a in anomalias]) if anomalias else "• Nenhuma anomalia crítica estatística detectada hoje.")
        )

        system_prompt = (
            "Você é o Diretor de Operações Hospitalares (COO) e Consultor Executivo Sênior em Gestão Hospitalar.\n"
            "Sua tarefa é redigir um 'Resumo Executivo Diário' focado nas métricas de gestão do dia recebidas.\n"
            "Regras fundamentais:\n"
            "1. NÃO dê conselhos médicos nem diagnósticos clínicos. Foco exclusivo em gestão predial, financeira, escalas de RH, compras, auditoria e fluxos operacionais.\n"
            "2. Formato: Markdown limpo e executivo, estruturado com títulos claros: '📊 Visão Geral', '🚨 Alertas e Anomalias' (comente cada desvio detectado e suas causas gerenciais) e '💡 Recomendações e Ações Corretivas'.\n"
            "3. Tom: Sênior, objetivo, direto ao ponto e baseado em dados.\n"
            "4. Idioma: Português do Brasil."
        )

        # 6. Chamar LLM ou Fallback
        resumo_texto = ""
        gemini_key = os.environ.get("GEMINI_API_KEY")
        openai_key = os.environ.get("OPENAI_API_KEY")

        if gemini_key:
            models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
            for i, model in enumerate(models):
                url_api = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
                payload = {
                    "contents": [
                        {"parts": [{"text": f"{system_prompt}\n\nDados analíticos recolhidos:\n{prompt_data}"}]}
                    ]
                }
                try:
                    res = requests.post(url_api, json=payload, timeout=15)
                    if res.status_code == 200:
                        resumo_texto = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                        break
                    elif res.status_code == 404 and i < len(models) - 1:
                        continue  # Tenta o próximo modelo
                    else:
                        self.stdout.write(self.style.ERROR(f"Erro ao chamar Gemini API ({model}): HTTP {res.status_code} - {res.text}"))
                        break
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Erro ao chamar Gemini API ({model}): {e}"))
                    break

        elif openai_key and not resumo_texto:
            url_api = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Redija o resumo executivo diário para as seguintes informações:\n{prompt_data}"}
                ]
            }
            try:
                res = requests.post(url_api, json=payload, headers=headers, timeout=15)
                if res.status_code == 200:
                    resumo_texto = res.json()["choices"][0]["message"]["content"]
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Erro ao chamar OpenAI API: {e}"))

        # Fallback offline
        if not resumo_texto:
            self.stdout.write(self.style.WARNING("LLM indisponível (chaves ausentes). Gerando resumo analítico simulado off-line..."))
            
            anomalias_list = []
            recomendacoes_list = []

            if dados_anomalias:
                for k, info in dados_anomalias.items():
                    if k == "ebitda":
                        anomalias_list.append(f"• **Queda de EBITDA Operacional**: EBITDA diário registrado em **R$ {info['valor']:,.2f}** ({info['detalhe']}).")
                        recomendacoes_list.append("• **Gestão de Custos:** Revisar imediatamente os custos com fornecedores de OPME e adiar despesas prediais não essenciais desta semana.")
                    elif k == "erros_medicao":
                        anomalias_list.append(f"• **Pico de Erros de Medicação**: Registrados **{info['valor']} eventos** de erro assistencial ({info['detalhe']}).")
                        recomendacoes_list.append("• **Barreiras de Segurança:** Implantar dupla checagem volante na enfermagem nos setores mais críticos e auditar legibilidade de prescrições no sistema.")
                    elif k == "tempo_prontuario":
                        anomalias_list.append(f"• **Gargalo no Fechamento de Prontuários**: Tempo médio em **{info['valor']:.1f} minutos** ({info['detalhe']}).")
                        recomendacoes_list.append("• **Faturamento:** Enviar alertas automáticos via sistema para os médicos com pendências superiores a 24 horas para evitar atraso no fechamento do lote SUS.")
                    elif k == "reinternacao":
                        anomalias_list.append(f"• **Alta na Taxa de Reinternação 30d**: Registrado índice de **{info['valor']:.1f}%** ({info['detalhe']}).")
                        recomendacoes_list.append("• **Transição de Cuidado:** Auditar o protocolo de alta das enfermarias e realizar ligações de monitoramento clínico pós-alta em até 48 horas.")
                    elif k == "glosa":
                        anomalias_list.append(f"• **Pico de Glosa Inicial**: Valor retido de **R$ {info['valor']:,.2f}** ({info['detalhe']}).")
                        recomendacoes_list.append("• **Faturamento:** Auditar cadastros de elegibilidade no pronto-socorro e padronizar justificativas de guias críticas.")
            else:
                anomalias_list.append("• **Sem anomalias críticas:** Todos os indicadores operacionais e financeiros flutuaram dentro do desvio padrão esperado nos últimos 30 dias.")
                recomendacoes_list.append("• **Manutenção de Rotina:** Continuar monitorando a matriz de risco clínico e o giro de leitos nas unidades cirúrgicas.")

            resumo_texto = (
                f"# Resumo Executivo Diário - {data_fim.strftime('%d/%m/%Y')}\n\n"
                f"📊 **Visão Geral**\n"
                f"Análise operacional consolidada referente à competência de **{data_fim.strftime('%d/%m/%Y')}**. "
                f"A engine de auditoria preditiva mapeou o histórico de 30 dias das tabelas Fato para identificar picos operacionais de risco.\n\n"
                f"🚨 **Alertas e Anomalias**\n"
                + "\n".join(anomalias_list) + "\n\n"
                f"💡 **Recomendações e Ações Corretivas**\n"
                + "\n".join(recomendacoes_list) + "\n\n"
                f"--- \n*Gerado automaticamente pelo motor de anomalias matemáticas do Health Analytics.*"
            )

        # 7. Salvar no Banco de Dados
        resumo_obj = ResumoExecutivo.objects.create(
            data_geracao=data_fim,
            dados_anomalias=dados_anomalias,
            conteudo_resumo=resumo_texto
        )

        self.stdout.write(self.style.SUCCESS(f"Resumo executivo do dia {data_fim} gerado e armazenado com sucesso! ID: {resumo_obj.id_resumo}"))
