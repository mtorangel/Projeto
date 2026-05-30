export const indicadoresExplicacoes = {
  // 1. Pacientes
  taxa_ocupacao: "Percentual de leitos ocupados em relação à capacidade total instalada. Crucial para o planejamento de expansão e gestão de gargalos.",
  tmp: "Tempo Médio de Permanência: Média de dias que um paciente fica internado. Indica a eficiência do giro de leitos e protocolos de alta.",
  nps: "Net Promoter Score: Média da pontuação de satisfação (0-10). Mede a fidelidade e a experiência do paciente com a instituição.",
  reinternacao: "Percentual de pacientes que retornam ao hospital em até 30 dias pela mesma causa. Indicador de qualidade do desfecho clínico.",

  // 2. Medicamentos
  giro_estoque: "Frequência com que o estoque é renovado. Giro alto indica eficiência logística; giro baixo pode significar capital parado ou excesso de compras.",
  custo_total: "Soma dos custos unitários de todos os medicamentos que saíram da farmácia para uso clínico no período.",
  erros_medicacao: "Eventos adversos ou quase-erros na administração de fármacos. O Pareto ajuda a identificar as causas raízes mais críticas.",
  ruptura_estoque: "Frequência com que itens solicitados não estão disponíveis. Indica falhas no processo de compras ou variações bruscas de demanda.",

  // 3. Procedimentos
  taxa_suspensao: "Percentual de cirurgias/procedimentos cancelados após o agendamento. Impacta diretamente na ociosidade de salas e custos fixos.",
  giro_sala: "Tempo total entre o fim de um procedimento e o início do próximo (limpeza + preparo). Mede a agilidade operacional do bloco.",
  produtividade_equipamento: "Volume de exames ou procedimentos realizados por máquina. Essencial para calcular o ROI de equipamentos caros (Ex: Tomógrafos).",
  taxa_conversao: "Relação entre procedimentos orçados/agendados e os efetivamente realizados.",

  // 4. Hospital
  iras: "Infecção Relacionada à Assistência à Saúde: Relação entre infecções e total de saídas. Principal indicador de segurança hospitalar.",
  substituicao_leito: "Intervalo entre a saída de um paciente e a disponibilidade real do leito para o próximo. Meta recomendada: < 120 min.",
  consumo_recursos: "Monitoramento de gastos com água e energia. Impacta diretamente nos custos fixos operacionais.",
  densidade_rh: "Proporção de colaboradores ativos por leito. Indica se a unidade está com equipe dimensionada corretamente para a carga de trabalho.",

  // 5. Médicos
  adesao_protocolos: "Percentual de atendimentos que seguiram rigorosamente as diretrizes clínicas institucionais (Ex: Protocolo de SEPSE).",
  tempo_prontuario: "Tempo médio que o médico leva para encerrar o prontuário após o atendimento. Crucial para faturamento rápido e qualidade do dado.",
  absenteismo_medico: "Percentual de faltas e atrasos médicos em relação à escala planejada. Impacta o tempo de espera dos pacientes.",
  volume_especialidade: "Distribuição da carga de trabalho por área médica. Ajuda a identificar gargalos em especialidades específicas.",

  // 6. Financeiro
  ebitda: "Lucro antes de juros, impostos, depreciação e amortização. Representa a capacidade de geração de caixa puramente operacional.",
  ticket_medio: "Receita média gerada por cada atendimento realizado. Ajuda a entender o valor agregado de cada linha de serviço.",
  glosas: "Monitoramento de faturamentos negados pelos convênios. A taxa de recuperação mede a eficiência do setor de recursos de glosas.",
  pmr: "Prazo Médio de Recebimento: Tempo decorrido entre a prestação do serviço e a entrada efetiva do dinheiro no caixa."
};
