1: Created At: 2026-06-16T03:36:03Z
2: Completed At: 2026-06-16T03:36:03Z
3: File Path: `file:///c:/Users/Administrador/OneDrive/MBACD/Projeto/painel-saude-backend/indicadores/views.py`
4: Total Lines: 220
5: Total Bytes: 11552
6: Showing lines 220 to 220
7: The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
8: 220: 
9: The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
10: 
220: 
269: })
270: 
271: # 1. KPIs Globais
272: total_faturamento = sum(r['receita_bruta'] for r in rows)
273: total_glosa_inicial = sum(r['valor_glosa_inicial'] for r in rows)
274: total_glosa_recuperada = sum(r['valor_glosa_recuperada'] for r in rows)
275: 
276: evasao_receita = total_glosa_inicial - total_glosa_recuperada
277: indice_glosa_inicial = (total_glosa_inicial / total_faturamento * 100) if total_faturamento > 0 else 0
278: taxa_recuperacao = (total_glosa_recuperada / total_glosa_inicial * 100) if total_glosa_inicial > 0 else 0
279: 
280: # 2. Evolução Temporal (Agrupada por mês)
281: evolucao = {}
282: for r in rows:
283: mes_ano = f"{r['mes']:02d}/{r['ano']}"
284: if mes_ano not in evolucao:
285: evolucao[mes_ano] = {"receita_bruta": 0.0, "glosa_inicial": 0.0}
286: evolucao[mes_ano]["receita_bruta"] += r['receita_bruta']
287: evolucao[mes_ano]["glosa_inicial"] += r['valor_glosa_inicial']
288: 
289: # Converter para array ordenado cronologicamente (ex: 07/2025, 08/2025, ...)
290: def parse_mes_ano(item):
291: parts = item[0].split('/')
292: return int(parts[1]), int(parts[0])
293: 
294: sorted_evolucao = sorted(evolucao.items(), key=parse_mes_ano)
295: evolucao_temporal_data = []
296: for mes_ano, vals in sorted_evolucao:
297: receita = vals["receita_bruta"]
298: 
922: "consumo": "O consumo registrado de **{valor_atual}** na unidade **{unidade}** indica o nível de utilização de recursos prediais. Recomenda-se realizar uma auditoria de desperdício e checar contratos de demanda de energia para otimizar os custos fixos.",
923: "giro de estoque": "O giro atual de **{valor_atual}** na unidade **{unidade}** aponta para a velocidade de escoamento. Recomenda-se ajustar a curva ABC de compras e calibrar os estoques mínimos de medicamentos de alto custo para evitar vencimentos.",
924: "giro de sala": "O giro de sala atual de **{valor_atual}** na unidade **{unidade}** exige otimização. Recomenda-se paralelizar a limpeza física com o preparo anestésico da próxima cirurgia em sala contígua para reduzir a ociosidade do bloco.",
925: "giro": "O giro atual de **{valor_atual}** na unidade **{unidade}** aponta para a velocidade de escoamento. Recomenda-se ajustar a curva ABC de compras e calibrar os estoques mínimos de medicamentos de alto custo para evitar vencimentos.",
926: "custo": "O custo total acumulado de **{valor_atual}** na unidade **{unidade}** exige conciliação orçamentária. Recomenda-se auditar prescrições de alta variabilidade clínica e padronizar o uso de genéricos de alta eficácia.",
927: "erro": "O volume atual de **{valor_atual}** erros de medicação na unidade **{unidade}** exige revisão imediata. Recomenda-se reforçar a dupla checagem na enfermagem e revisar a clareza da prescrição no prontuário eletrônico.",
928: "ruptura": "A taxa de ruptura de **{valor_a
980: {"tabela": "DimPaciente",          "label": "Dim. Paciente",          "count": DimPaciente.objects.count(),          "icon": "Users"},
981: {"tabela": "DimMedicamento",       "label": "Dim. Medicamento",       "count": DimMedicamento.objects.count(),       "icon": "Pill"},
982: {"tabela": "DimTipoProcedimento",  "label": "Dim. Tipo Procedimento", "count": DimTipoProcedimento.objects.count(),  "icon": "Stethoscope"},
983: {"tabela": "DimEquipamento",       "label": "Dim. Equipamento",       "count": DimEquipamento.objects.count(),       "icon": "Wrench"},
984: {"tabela": "DimMedico",            "label": "Dim. Médico",            "count": DimMedico.objects.count(),            "icon": "UserCheck"},
985: {"tabela": "DimProtocolo",         "label": "Dim. Protocolo",         "count": DimProtocolo.objects.count(),         "icon": "FileText"},
986: {"tabela": "DimConvenio",          "label": "Dim. Convênio",          "count": DimConvenio.objects.count(),          "icon": "CreditCard"},
987: ]
988: 
989: fatos = [
990: {"tabela": "FatoAtendimentos",       "label": "Fato Atendimentos",        "count": FatoAtendimentos.objects.count(),       "icon": "Activity"},
991: {"tabela": "FatoEstoque",            "label": "Fato Estoque",             "count": FatoEstoque.objects.count(),            "icon": "Package"},
992: {"tabela": "FatoErrosMedicao",       "label": "Fato Erros Medicação",     "count": Fat
1006: maior_tabela = max(all_tables, key=lambda x: x["count"]) if all_tables else {"label": "N/A", "count": 0}
1007: 
1008: return response.Response({
1009: permission_classes = [permissions.IsAuthenticated]
1010: 
1011: def post(self, request):
1012: import subprocess
1013: import sys
1014: import os
1015: 
1016: records = int(request.data.get("records", 100))
1017: mode = request.data.get("mode", "db")
1018: clear = request.data.get("clear", False)
1019: dims_only = request.data.get("dims_only", False)
1020: facts_only = request.data.get("facts_only", False)
1021: 
1022: cmd.append("--facts-only")
1023: 
1024: try:
1025: result = subprocess.run(
1026: cmd,
1027: capture_output=True,
1028: text=True,
1029: timeout=300,
1030: cwd=os.path.dirname(manage_py)
1031: )
1032: if result.returncode == 0:
1033: return response.Response({
1034: "status": "ok",
1035: "mensagem": "Geração de dados concluída com sucesso.",
1036: "log": result.stdout,
1037: "records": records,
1038: "mode": mode,
1039: })
1040: else:
1041: return response.Response({
1042: "status": "erro",
1043: "mensagem": "Erro durante a geração de dados.",
1044: "log": result.stderr or result.stdout,
1045: }, status=500)
1046: except subprocess.TimeoutExpired:
1047: return response.Response({"erro": "Timeout: geração demorou mais de 5 minutos."}, status=504)
1048: except Exception as e:
1049: return response.Response({"erro": str(e)}, status=500)
1050: 
1051: return response.Response({
1052: "status": "ok",
1053: "mensagem": "Geração de dados concluída com sucesso.",
1054: "log": result.stdout,
1055: "records": records,
1056: "mode": mode,
1057: })
1058: else:
1059: return response.Response({
1060: "status": "erro",
1061: "mensagem": "Erro durante a geração de dados.",
1062: "log": result.stderr or result.stdout,
1063: }, status=500)
1064: except subprocess.TimeoutExpired:
1065: return response.Response({"erro": "Timeout: geração demorou mais de 5 minutos."}, status=504)
1066: except Exception as e:
1067: return response.Response({"erro": str(e)}, status=500)
1068: 
