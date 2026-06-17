import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileDown, Building2, Brain, ShieldCheck, Layers, Code2,
  Database, Globe, BarChart3, Users, Wallet, Pill, Activity,
  Stethoscope, Landmark, ListTodo, ShieldAlert, TrendingUp, Target,
  CheckCircle2, AlertTriangle, BookOpen, Server, Cpu, GitBranch
} from 'lucide-react';

// ─── Seções de dados ─────────────────────────────────────────────────────────

const KPI_GROUPS = [
  {
    module: 'Pacientes & Fluxo Assistencial',
    icon: Users,
    color: '#2dd4bf',
    kpis: [
      { name: 'Taxa de Ocupação de Leitos', formula: 'Leitos Ocupados / Leitos Disponíveis × 100', meta: '≥ 75%', desc: 'Percentual de utilização da capacidade instalada. Abaixo de 75% indica ociosidade; acima de 95% indica superlotação e risco assistencial.' },
      { name: 'Tempo Médio de Permanência (TMP)', formula: 'Σ Dias de Internação / Total de Saídas', meta: '≤ 8 dias', desc: 'Mede a eficiência do fluxo clínico e de alta. TMP elevado impacta diretamente na rotatividade de leitos e no faturamento.' },
      { name: 'Taxa de Reinternação em 30 Dias', formula: 'Reinternações (30d) / Total Altas × 100', meta: '≤ 8%', desc: 'Indicador crítico de qualidade assistencial e de continuidade do cuidado pós-alta. Parâmetro do Programa Nacional de Segurança do Paciente (PNSP).' },
      { name: 'NPS (Net Promoter Score) Hospitalar', formula: '% Promotores − % Detratores', meta: '≥ 50', desc: 'Mede a satisfação e fidelização de pacientes e familiares. Base para benchmarking com a ANS e acreditações (ONA, JCI).' },
      { name: 'Intervalo de Substituição de Leito', formula: '(Total de Leito-dias − Dias Ocupados) / Saídas', meta: '≤ 3 horas', desc: 'Tempo médio que um leito fica vazio entre uma internação e outra. Mede a eficiência da higienização e da logística hospitalar.' },
    ]
  },
  {
    module: 'Medicamentos & Farmácia Clínica',
    icon: Pill,
    color: '#fbbf24',
    kpis: [
      { name: 'Taxa de Erros de Medicação (por 1.000)', formula: 'Erros Relatados / Total Administrações × 1.000', meta: '≤ 1,0 por 1.000', desc: 'Indicador de segurança do paciente. Inclui erros de dose, via de administração e identificação. Monitorado pela ANVISA e PNSP.' },
      { name: 'Giro de Estoque', formula: 'Consumo do Período / Estoque Médio', meta: '≥ 4x/mês', desc: 'Mede a eficiência do controle de estoque farmacêutico. Giro baixo implica capital imobilizado; giro muito alto indica risco de ruptura.' },
      { name: 'Taxa de Ruptura de Estoque', formula: 'Itens em Falta / Total de Itens Monitorados × 100', meta: '< 2%', desc: 'Percentual de itens com saldo zero ou crítico. Rupturas em medicamentos essenciais ou antimicrobianos representam risco direto ao paciente.' },
      { name: 'Custo de Medicamentos por Paciente-dia', formula: 'Custo Total de Medicamentos / Total de Paciente-dias', meta: 'Benchmark setorial', desc: 'Indicador de eficiência farmacoeconômica. Monitora o impacto do mix de prescritores, protocolos e negociação com fornecedores.' },
    ]
  },
  {
    module: 'Procedimentos & Eficiência Cirúrgica',
    icon: Activity,
    color: '#f87171',
    kpis: [
      { name: 'Giro de Sala Cirúrgica', formula: '(Prep + Execução + Limpeza) / N° de Procedimentos', meta: '≤ 60 min turnaround', desc: 'Mede a produtividade do Centro Cirúrgico. Reduzir o giro aumenta o número de procedimentos realizados sem ampliação de infraestrutura.' },
      { name: 'Taxa de Suspensão de Cirurgias', formula: 'Cirurgias Suspensas / Cirurgias Agendadas × 100', meta: '≤ 5%', desc: 'Alto índice de suspensão indica falhas em triagem, disponibilidade de materiais ou no mapa cirúrgico. Impacta faturamento e NPS.' },
      { name: 'Taxa de Conversão (Agendado → Realizado)', formula: 'Procedimentos Realizados / Procedimentos Agendados × 100', meta: '≥ 90%', desc: 'Mede a confiabilidade do agendamento e da cadeia logística do procedimento (materiais, equipe, anestesia, leito de recuperação).' },
      { name: 'Produtividade de Equipamentos', formula: 'Horas Utilizadas / Horas Disponíveis × 100', meta: '≥ 70%', desc: 'Mede o aproveitamento do parque tecnológico (salas, equipamentos). Subutilização impacta o ROIC (retorno sobre capital investido).' },
    ]
  },
  {
    module: 'Hospital & Infraestrutura',
    icon: Building2,
    color: '#818cf8',
    kpis: [
      { name: 'Taxa de IRAS (Infecção Relacionada à Assistência em Saúde)', formula: 'Casos de IRAS / Paciente-dias × 1.000', meta: '< 1 por 1.000', desc: 'Indicador mandatório para acreditações e ANVISA. IRAS elevan mortalidade, TMP e custo assistencial, sendo a principal causa de óbitos evitáveis.' },
      { name: 'Consumo de Água (m³/leito-dia)', formula: 'Consumo Total m³ / Total Leito-dias', meta: 'Meta ANO definida por consórcio', desc: 'Indicador de sustentabilidade e eficiência operacional. Monitorado para metas ESG e redução de custos de concessionária.' },
      { name: 'Consumo de Energia Elétrica (kWh/m²)', formula: 'kWh Consumidos / Área Hospitalar (m²)', meta: 'Eficiência energética setorial', desc: 'Hospitais consomem em média 300-500 kWh/m²/ano. Redução de consumo energético pode representar economias de 15-25% no OPEX.' },
      { name: 'Densidade de Recursos Humanos', formula: 'Total de Profissionais / Total de Leitos', meta: '≥ 0,85 prof/leito', desc: 'Mede a adequação de equipe por capacidade hospitalar. Abaixo de 0,85 indica sobrecarga de equipe e risco de incidentes assistenciais.' },
    ]
  },
  {
    module: 'Médicos & Desempenho Clínico',
    icon: Stethoscope,
    color: '#c084fc',
    kpis: [
      { name: 'Taxa de Adesão a Protocolos Clínicos', formula: 'Atendimentos com Protocolo / Total Atendimentos × 100', meta: '≥ 80%', desc: 'Mede a conformidade clínica. Protocolos baseados em evidência reduzem variabilidade, complicações e tempo de internação.' },
      { name: 'Tempo de Fechamento de Prontuário', formula: 'Média do tempo (em min) para fechamento pós-alta', meta: '≤ 24 horas', desc: 'Fundamental para faturamento imediato (SUS e convênios). Atraso no fechamento impacta diretamente o fluxo de caixa hospitalar.' },
      { name: 'Taxa de Absenteísmo Médico', formula: 'Faltas / Escalas Programadas × 100', meta: '< 5%', desc: 'Alto absenteísmo exige coberturas de escala emergenciais, eleva custo de pessoal e reduz a qualidade assistencial por sobrecarga.' },
      { name: 'Volume por Especialidade', formula: 'N° Atendimentos por CRM / Especialidade', meta: 'Meta por contrato', desc: 'Monitora a produtividade individual e por especialidade, base para modelo de remuneração por performance (pay-for-performance).' },
    ]
  },
  {
    module: 'Financeiro & EBITDA',
    icon: Wallet,
    color: '#4ade80',
    kpis: [
      { name: 'EBITDA Operacional', formula: 'Receita Líquida − Custos Operacionais − Despesas Administrativas', meta: 'Margem ≥ 8%', desc: 'Principal indicador de rentabilidade operacional. Margem EBITDA abaixo de 8% em hospitais privados indica risco financeiro severo.' },
      { name: 'Prazo Médio de Recebimento (PMR)', formula: 'Contas a Receber / (Faturamento / 30)', meta: '≤ 30 dias', desc: 'Mede a eficiência do ciclo de caixa. PMR elevado compromete capital de giro e pode exigir linhas de crédito onerosas.' },
      { name: 'Ticket Médio por Atendimento', formula: 'Receita Total / N° de Atendimentos', meta: 'Meta por contrato', desc: 'Indicador de mix de complexidade assistencial e eficiência de faturamento. Monitora desvios no case mix do hospital.' },
      { name: 'Índice de Glosa Inicial', formula: 'Valor Glosado / Valor Faturado × 100', meta: '< 5%', desc: 'Percentual de receitas negadas na primeira análise do convênio/SUS. Glosas acima de 8% indicam problemas sérios na codificação e documentação.' },
      { name: 'Taxa de Recuperação de Glosas', formula: 'Glosas Recuperadas / Glosas Iniciais × 100', meta: '≥ 60%', desc: 'Mede a eficiência do setor de auditoria de faturamento na contestação e recurso de glosas junto às operadoras.' },
    ]
  },
  {
    module: 'Auditoria SUS & Faturamento',
    icon: Landmark,
    color: '#60a5fa',
    kpis: [
      { name: 'Faturamento SUS (SIA/SIH)', formula: 'Σ AIH/BPA Aprovadas × Tabela SIGTAP', meta: 'Teto financeiro definido pelo MS', desc: 'Controle de produção ambulatorial (SIA/BPA) e hospitalar (SIH/AIH) conforme a Tabela de Procedimentos SIGTAP do Ministério da Saúde.' },
      { name: 'Evasão de Receita SUS', formula: 'Produção Realizada − Produção Faturada (em R$)', meta: '< 2% da produção', desc: 'Identifica serviços prestados e não cobrados ao SUS. Mede perdas por subregistro, codificação incorreta ou prazo expirado de envio.' },
      { name: 'Taxa de Glosa SUS por Tipo de Procedimento', formula: 'AIHs Glosadas / AIHs Enviadas por Grupo × 100', meta: '< 3%', desc: 'Identifica grupos de procedimentos com maior incidência de glosas no SUS, permitindo correção direcionada de codificações e CIDs.' },
    ]
  },
  {
    module: 'Regulação & Gestão de Filas',
    icon: ListTodo,
    color: '#f43f5e',
    kpis: [
      { name: 'Tamanho da Fila de Espera (Backlog)', formula: 'N° de Solicitações Pendentes de Regulação', meta: '< 5% dos atendimentos/mês', desc: 'Volume de pacientes aguardando regulação de vaga. Indicador direto de pressão sobre a capacidade instalada do hospital ou da rede.' },
      { name: 'Tempo Médio de Espera por Regulação', formula: 'Σ Tempo Espera / N° Regulações Concluídas', meta: '≤ 48 horas (eletivos)', desc: 'Mede a agilidade do serviço de Regulação. Tempos altos em urgências indicam risco para desfechos clínicos.' },
      { name: 'Taxa de Suspensão por Capacidade', formula: 'Suspensões por Leito Indisponível / Total Suspensões × 100', meta: '< 20%', desc: 'Identifica se suspensões cirúrgicas são causadas por falta de leito de UTI ou enfermaria, revelando gargalos estruturais.' },
    ]
  },
  {
    module: 'Matriz de Risco Assistencial & RH',
    icon: ShieldAlert,
    color: '#a855f7',
    kpis: [
      { name: 'Score de Risco por Setor (Índice Composto)', formula: 'Ponderação: Erros (40%) + Absenteísmo (30%) + Densidade RH (30%)', meta: '< 50 pontos', desc: 'Índice proprietário que prioriza setores com maior vulnerabilidade operacional, guiando intervenções preventivas de gestão de pessoas.' },
      { name: 'Taxa de Absenteísmo por Unidade', formula: 'Dias Faltados / Dias Programados × 100 por Setor', meta: '< 5%', desc: 'Granularidade por unidade permite identificar setores com sobrecarga de trabalho, doenças ocupacionais ou conflitos de gestão.' },
      { name: 'Índice de Erros de Medicação por 1.000 Paciente-dias', formula: 'Erros / Paciente-dias × 1.000 por Unidade', meta: '≤ 1 por 1.000', desc: 'Visão granular por setor para identificação de unidades de alto risco (UTI, CME, Pronto-socorro) e necessidade de treinamento.' },
      { name: 'Correlação Sobrecarga × Segurança', formula: 'Scatter plot: Density RH vs. Taxa de Erros por Unidade', meta: 'Coeficiente Pearson < 0.3', desc: 'Análise estatística que correlaciona a sobrecarga de equipe com incidentes de segurança, fornecendo evidência para dimensionamento.' },
    ]
  },
];

const TECH_STACK = [
  { layer: 'Backend & API', color: '#2dd4bf', icon: Server, items: [
    { name: 'Django 6.0', desc: 'Framework principal Python (MTV). Fornece ORM, autenticação via Token, sistema de migrations e WSGI server.' },
    { name: 'Django REST Framework (DRF)', desc: 'Construção de todos os endpoints RESTful do sistema, com suporte a autenticação por Token e serializers de dados.' },
    { name: 'drf-spectacular', desc: 'Geração automática de documentação interativa OpenAPI 3.0 (Swagger UI e Redoc) a partir das views do DRF.' },
    { name: 'django-cors-headers', desc: 'Gerenciamento de Cross-Origin Resource Sharing para comunicação segura entre frontend (porta 3000) e backend (porta 8000).' },
    { name: 'pypdf', desc: 'Extração de texto de documentos PDF para ingestão no motor RAG local (base de conhecimento do agente de IA).' },
    { name: 'requests', desc: 'Integração HTTP com APIs externas de IA: Google Gemini API e OpenAI Chat Completions API.' },
  ]},
  { layer: 'Banco de Dados', color: '#818cf8', icon: Database, items: [
    { name: 'PostgreSQL 14+', desc: 'Banco relacional principal. Armazena o Star Schema (Dimensões + Fatos), base de conhecimento RAG e resumos executivos.' },
    { name: 'Star Schema (Modelo Dimensional)', desc: 'Arquitetura de Data Warehouse com 9 tabelas Dimensão (Tempo, Unidade, Médico, Convênio…) e 8 tabelas Fato para analytics de alto desempenho.' },
    { name: 'psycopg3', desc: 'Driver Python de baixa latência para PostgreSQL. Usado tanto pelo ORM Django quanto pelo conector direto do Text-to-SQL executivo.' },
    { name: 'Usuário postgres_bi (read-only)', desc: 'Usuário isolado com permissões somente de leitura (SELECT) para execução segura das queries geradas pelo agente de IA.' },
    { name: 'JSONField (Embeddings)', desc: 'Campo nativo do Django para armazenar vetores de embedding no BlocoDocumento, permitindo futura integração com pgvector.' },
  ]},
  { layer: 'Frontend & Visualização', color: '#f87171', icon: Globe, items: [
    { name: 'React 18 + Vite', desc: 'SPA (Single Page Application) com hot-reload, bundling otimizado e suporte a ES modules nativos.' },
    { name: 'React Router DOM v6', desc: 'Roteamento client-side com 14 rotas independentes (Home, 11 dashboards, Copilot, Sobre).' },
    { name: 'Recharts 2', desc: 'Biblioteca de gráficos SVG baseada em React. Usada para BarChart, LineChart, ScatterChart, Radar, AreaChart nos 11 dashboards.' },
    { name: 'Lucide React', desc: 'Biblioteca de ícones SVG com 1.000+ ícones modernos. Utilizada em toda a interface para consistência visual.' },
    { name: 'Axios', desc: 'Cliente HTTP para todas as chamadas à API DRF do backend, com suporte a cabeçalhos customizados (X-Gemini-Key, X-OpenAI-Key).' },
    { name: 'CSS Glassmorphism (Vanilla CSS)', desc: 'Design system proprietário com modo escuro, backdrop-filter, gradientes e micro-animações. Paleta: Teal (#2dd4bf) + Indigo (#818cf8).' },
  ]},
  { layer: 'Inteligência Artificial (Camada Cognitiva)', color: '#e879f9', icon: Brain, items: [
    { name: 'Google Gemini 1.5 Flash API', desc: 'LLM principal para geração de explicações de KPIs, resumos executivos e respostas conversacionais via REST API.' },
    { name: 'OpenAI GPT-4o Mini API (fallback)', desc: 'LLM secundário ativado automaticamente caso a chave Gemini não esteja disponível. Mesmo prompt, compatibilidade total.' },
    { name: 'TF-IDF (Term Frequency-Inverse Document Frequency)', desc: 'Motor RAG local desenvolvido em Python puro. Tokenização com stemmer de plural PT-BR e normalização de acentos para busca semântica offline.' },
    { name: 'Text-to-SQL (Offline Rule Engine)', desc: 'Motor de geração de queries SQL para queries analíticas comuns, com sanitização dupla anti-SQL Injection e execução via usuário read-only.' },
    { name: 'Django Management Command (Cron)', desc: 'Comando `gerar_insights_diarios` que detecta anomalias estatísticas (Z-Score ≥ 2σ) nas tabelas Fato e gera o Resumo Executivo Diário.' },
  ]},
  { layer: 'DevOps & Integração', color: '#fbbf24', icon: GitBranch, items: [
    { name: 'Git + .gitignore', desc: 'Controle de versão com branches estruturadas. Secrets (senha DB, chaves de API) excluídos do versionamento.' },
    { name: 'INICIAR_SISTEMA.bat', desc: 'Script de inicialização automática para Windows que sobe backend (Django) e frontend (Vite) simultaneamente.' },
    { name: 'Schema YAML (OpenAPI 3.0)', desc: 'Especificação completa da API exportada para Health Analytics API (BI Hospitalar).yaml, documentando todos os 25+ endpoints.' },
    { name: 'CSV Batch Import', desc: 'Sistema de importação em lote via CSV para carga histórica das dimensões e fatos no Data Warehouse PostgreSQL.' },
    { name: 'SeedData (Generate Script)', desc: 'Script Python para geração de dados coerentes e realistas de 36 meses para desenvolvimento e validação dos KPIs.' },
  ]},
];

const IMPORTANCE_ITEMS = [
  { icon: TrendingUp, color: '#4ade80', title: 'Decisões em Tempo Real', text: 'Gestores hospitalares tomam decisões críticas sem dados confiáveis, dependendo de planilhas desatualizadas. O sistema consolida 25+ KPIs em tempo real a partir do Data Warehouse, reduzindo o ciclo de decisão de dias para segundos.' },
  { icon: Wallet, color: '#fbbf24', title: 'Recuperação de Receita e Controle de Glosas', text: 'Hospitais de médio porte perdem em média 8-15% de receita em glosas não contestadas. A Auditoria SUS do sistema identifica automaticamente gargalos por unidade, convênio e tipo de procedimento, maximizando a recuperação financeira.' },
  { icon: ShieldCheck, color: '#f87171', title: 'Segurança do Paciente e PNSP', text: 'O módulo de Matriz de Risco monitora correlações entre sobrecarga de RH e incidentes de segurança (erros de medicação, IRAS), atendendo às diretrizes do Programa Nacional de Segurança do Paciente (PNSP/Portaria 529/2013).' },
  { icon: Target, color: '#818cf8', title: 'Conformidade e Acreditação (ONA/JCI)', text: 'Os indicadores rastreados seguem os padrões da Organização Nacional de Acreditação (ONA) e Joint Commission International (JCI), facilitando auditorias e processos de certificação hospitalar.' },
  { icon: Brain, color: '#e879f9', title: 'IA Generativa como Vantagem Competitiva', text: 'O Copilot Executivo transforma dados em linguagem executiva. Diretores podem fazer perguntas em português e receber análises completas com dados reais do banco, insights narrativos e sugestões de ação — sem necessidade de treinamento técnico.' },
  { icon: BookOpen, color: '#2dd4bf', title: 'Rastreabilidade e Gestão do Conhecimento', text: 'O sistema RAG permite ingerir manuais do SUS, portarias ministeriais e protocolos internos, criando uma base de conhecimento institucional consultável e integrada ao agente cognitivo.' },
];

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function SobreSistema() {
  const navigate = useNavigate();
  const printRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentW = pageW - margin * 2;
      let y = margin;

      const sanitizePdfText = (str) => {
        if (!str) return '';
        return str
          .replace(/−/g, '-')
          .replace(/–/g, '-')
          .replace(/—/g, '-')
          .replace(/≤/g, '<=')
          .replace(/≥/g, '>=')
          .replace(/×/g, 'x')
          .replace(/•/g, '-')
          .replace(/▸/g, '>')
          .replace(/°/g, 'o')
          .replace(/“/g, '"')
          .replace(/”/g, '"')
          .replace(/‘/g, "'")
          .replace(/’/g, "'");
      };

      const checkPage = (needed = 10) => {
        if (y + needed > pageH - 20) {
          doc.addPage();
          y = 25;
        }
      };

      const writeTitle = (text, size = 15, color = [15, 23, 42]) => {
        checkPage(size + 6);
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.setFont('helvetica', 'bold');
        doc.text(sanitizePdfText(text), margin, y);
        y += size * 0.6;
      };

      const writeSubtitle = (text, size = 11, color = [51, 65, 85]) => {
        checkPage(size + 5);
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.setFont('helvetica', 'bold');
        doc.text(sanitizePdfText(text), margin, y);
        y += size * 0.55;
      };

      const writeBody = (text, size = 9.5, color = [30, 41, 59]) => {
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(sanitizePdfText(text), contentW);
        lines.forEach(line => {
          checkPage(size * 0.5);
          doc.text(line, margin, y);
          y += size * 0.5;
        });
        y += 2;
      };

      const writeDivider = () => {
        checkPage(5);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageW - margin, y);
        y += 5;
      };

      // ── Capa ──
      doc.setFontSize(26);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('Health Analytics Dashboard', pageW / 2, 70, { align: 'center' });

      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.5);
      doc.line(margin + 20, 80, pageW - margin - 20, 80);

      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text('BI Hospitalar — Relatório Técnico de Especificação do Sistema', pageW / 2, 90, { align: 'center' });

      doc.line(margin + 20, 98, pageW - margin - 20, 98);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Equipe de Desenvolvimento e Business Intelligence', pageW / 2, 140, { align: 'center' });
      doc.text('Banco de Dados Dimensional & Inteligência Artificial Generativa', pageW / 2, 146, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'italic');
      const overview = [
        'Sistema de Business Intelligence Hospitalar com Star Schema PostgreSQL,',
        'dashboards em tempo real (React + Recharts), REST API (Django DRF),',
        'e Camada Cognitiva com IA Generativa (Gemini / GPT-4o + RAG local).',
      ];
      overview.forEach((line, i) => doc.text(sanitizePdfText(line), pageW / 2, 175 + i * 6, { align: 'center' }));

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageW / 2, 240, { align: 'center' });
      doc.text('São Paulo, Brasil', pageW / 2, 246, { align: 'center' });

      // ── Sumário ──
      doc.addPage();
      y = margin;

      writeTitle('Sumário Executivo', 18, [15, 23, 42]);
      writeDivider();
      y += 10;

      const tocItems = [
        { num: '1.', name: 'Introdução e Justificativa do Projeto', page: '3' },
        { num: '2.', name: 'Catálogo de Indicadores (KPIs) por Módulo', page: '3' },
        { num: '3.', name: 'Stack Tecnológico do Sistema', page: '6' },
        { num: '4.', name: 'Plano de Desenvolvimento e Cronograma', page: '7' },
        { num: '5.', name: 'Arquitetura e Modelagem Dimensional', page: '8' },
      ];

      tocItems.forEach(item => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${item.num} ${sanitizePdfText(item.name)}`, margin, y);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);

        const textWidth = doc.getTextWidth(`${item.num} ${sanitizePdfText(item.name)}`);
        const pageVal = item.page;
        const pageValWidth = doc.getTextWidth(pageVal);

        let dotX = margin + textWidth + 3;
        const endX = pageW - margin - pageValWidth - 3;
        let dots = '';
        while (dotX < endX) {
          dots += '.';
          dotX += doc.getTextWidth('.');
        }
        doc.text(dots, margin + textWidth + 3, y);

        doc.setTextColor(15, 23, 42);
        doc.text(pageVal, pageW - margin, y, { align: 'right' });
        y += 10;
      });

      doc.addPage();
      y = margin;

      // ── Importância ──
      writeTitle('1. Importância e Justificativas do Projeto', 15);
      writeDivider();
      IMPORTANCE_ITEMS.forEach((item, index) => {
        writeSubtitle(`1.${index + 1} ${item.title}`, 11);
        writeBody(item.text);
        y += 3;
      });

      // ── KPIs ──
      writeTitle('2. Catálogo de KPIs por Módulo', 15);
      writeDivider();
      KPI_GROUPS.forEach((group, index) => {
        checkPage(20);
        writeSubtitle(`2.${index + 1} Módulo: ${group.module}`, 12, [15, 23, 42]);
        y += 1.5;

        group.kpis.forEach(kpi => {
          const kpiText = kpi.desc;
          const formulaText = `Fórmula: ${kpi.formula}`;
          const metaText = `Meta: ${kpi.meta}`;

          const descLines = doc.splitTextToSize(sanitizePdfText(kpiText), contentW - 8);
          const blockHeight = 5 + 4 + 4 + 4 + (descLines.length * 4.5) + 4;

          checkPage(blockHeight);

          doc.setDrawColor(15, 23, 42);
          doc.setLineWidth(0.5);
          doc.line(margin, y, margin, y + blockHeight - 2);

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(sanitizePdfText(kpi.name), margin + 4, y + 4);

          doc.setFontSize(8.5);
          doc.setFont('courier', 'bold');
          doc.setTextColor(29, 78, 216);
          doc.text(sanitizePdfText(formulaText), margin + 4, y + 8);

          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(22, 101, 52);
          doc.text(sanitizePdfText(metaText), margin + 4, y + 12);

          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          let currentY = y + 16.5;
          descLines.forEach(line => {
            doc.text(line, margin + 4, currentY);
            currentY += 4.5;
          });

          y += blockHeight;
        });
        y += 4;
      });

      // ── Stack Tecnológico ──
      writeTitle('3. Stack Tecnológico', 15);
      writeDivider();
      TECH_STACK.forEach((layer, index) => {
        checkPage(15);
        writeSubtitle(`3.${index + 1} Camada: ${layer.layer}`, 12, [15, 23, 42]);
        y += 1.5;

        layer.items.forEach(item => {
          const descLines = doc.splitTextToSize(sanitizePdfText(item.desc), contentW - 6);
          const itemH = 5 + (descLines.length * 4) + 3;
          checkPage(itemH);

          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(`- ${sanitizePdfText(item.name)}`, margin + 3, y + 3.5);

          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          let currentY = y + 7.5;
          descLines.forEach(line => {
            doc.text(line, margin + 6, currentY);
            currentY += 4;
          });

          y += itemH;
        });
        y += 3;
      });

      // ── Plano de Desenvolvimento ──
      writeTitle('4. Plano de Desenvolvimento', 15);
      writeDivider();
      const phases = [
        { phase: 'Fase 1 — Modelagem e Arquitetura (Semanas 1-2)', items: [
          'Definição do Star Schema: 9 Dimensões e 8 tabelas Fato',
          'Mapeamento de KPIs hospitalares baseados em ONA, ANS e PNSP',
          'Criação dos modelos Django e migrations PostgreSQL',
          'Script de geração de dados sintéticos (36 meses) para validação',
        ]},
        { phase: 'Fase 2 — API RESTful (Semanas 3-4)', items: [
          'Desenvolvimento de 25+ endpoints DRF para todos os módulos',
          'Implementação de autenticação por Token e sistema de filtros dinâmicos',
          'Documentação automática OpenAPI via drf-spectacular (Swagger/Redoc)',
          'Configuração de CORS, rotas de integração e usuário read-only BI',
        ]},
        { phase: 'Fase 3 — Frontend e Dashboards (Semanas 5-7)', items: [
          'Setup do projeto React + Vite com design system Glassmorphism',
          '11 dashboards especializados com KPIs, gráficos Recharts e filtros',
          'Componente AITrigger para explicações contextuais de indicadores',
          'Telas de Auditoria SUS, Regulação de Filas e Matriz de Risco Assistencial',
        ]},
        { phase: 'Fase 4 — Camada Cognitiva de IA (Semanas 8-10)', items: [
          'Desenvolvimento do Copilot Executivo (interface de chat premium)',
          'Implementação do Text-to-SQL com sanitização anti-SQL Injection',
          'Motor RAG local TF-IDF com stemmer PT-BR e normalização de acentos',
          'Upload e chunking de manuais PDF/DOCX (chunks 2500 chars + 400 overlap)',
          'Cron Job de detecção de anomalias e geração de Resumo Executivo Diário',
        ]},
        { phase: 'Fase 5 — Polimento, Testes e Documentação (Semanas 11-12)', items: [
          'Tela "Sobre o Sistema" com toda a documentação exportável em PDF',
          'Testes unitários Django (segurança SQL Injection, recusa clínica da IA)',
          'Admin DB avançado com dicionário de dados das tabelas Dimensão e Fato',
          'Documentação técnica: YAML OpenAPI, Guia de Conexão BI, Canvas do Projeto',
        ]},
      ];

      phases.forEach((phase, index) => {
        let neededH = 10;
        phase.items.forEach(item => {
          const lines = doc.splitTextToSize(sanitizePdfText(item), contentW - 10);
          neededH += (lines.length * 4) + 1.5;
        });
        neededH += 4;

        checkPage(neededH);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(sanitizePdfText(phase.phase), margin, y + 4);
        y += 8;

        phase.items.forEach(item => {
          const lines = doc.splitTextToSize(sanitizePdfText(item), contentW - 10);
          lines.forEach((line, liIndex) => {
            checkPage(5);
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            if (liIndex === 0) {
              doc.text('-', margin + 3, y);
              doc.text(line, margin + 8, y);
            } else {
              doc.text(line, margin + 8, y);
            }
            y += 4;
          });
          y += 1.5;
        });
        y += 3;
      });

      // ── Seção 5: Arquitetura ──
      writeTitle('5. Arquitetura e Modelagem Dimensional', 15);
      writeDivider();

      const layers = [
        { label: 'Camada de Dados', desc: 'PostgreSQL + Star Schema', items: ['9 Dimensões (DimTempo, DimUnidade, DimMédico, DimConvênio, DimMedicamento, DimProtocolo, DimEquipamento, DimPaciente, DimTipoProcedimento)', '8 Fatos (Atendimentos, Estoque, Erros, Procedimentos, Infraestrutura, Higienização, Desempenho Clínico, Escala Médica, Financeiro)', 'DocumentoConhecimento + BlocoDocumento (RAG)', 'ResumoExecutivo (histórico de anomalias)'] },
        { label: 'Camada de Negócio', desc: 'Django DRF', items: ['REST API com 25+ endpoints autenticados', 'Cálculo de KPIs em Python (Z-Score, TF-IDF, Cosine Similarity)', 'Geração de Insights com Google Gemini ou OpenAI', 'Cron Job de detecção de anomalias diárias'] },
        { label: 'Camada de Apresentação', desc: 'React + Vite', items: ['14 rotas (Home + 11 dashboards + Copilot + Sobre)', 'Recharts: 15+ tipos de visualizações', 'Glassmorphism Dark Mode', 'Exportação PDF completa (jsPDF + print)'] },
        { label: 'Camada Cognitiva', desc: 'IA Generativa', items: ['RAG local TF-IDF (PT-BR stemmer)', 'Text-to-SQL com sanitização dupla', 'LLM: Gemini 1.5 Flash / GPT-4o Mini', 'Persona blindada de COO hospitalar'] },
      ];

      layers.forEach(layer => {
        let neededH = 10;
        layer.items.forEach(item => {
          const lines = doc.splitTextToSize(sanitizePdfText(item), contentW - 10);
          neededH += (lines.length * 4) + 1.5;
        });
        neededH += 4;

        checkPage(neededH);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${sanitizePdfText(layer.label)}: ${sanitizePdfText(layer.desc)}`, margin, y + 4);
        y += 8;

        layer.items.forEach(item => {
          const lines = doc.splitTextToSize(sanitizePdfText(item), contentW - 10);
          lines.forEach((line, liIndex) => {
            checkPage(5);
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            if (liIndex === 0) {
              doc.text('-', margin + 3, y);
              doc.text(line, margin + 8, y);
            } else {
              doc.text(line, margin + 8, y);
            }
            y += 4;
          });
          y += 1.5;
        });
        y += 3;
      });

      // ── Rodapé e Cabeçalho de cada página ──
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        if (i > 1) {
          // Running Header
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(148, 163, 184);
          doc.text('Health Analytics Dashboard — Relatório Técnico de Especificação', margin, 12);
          
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.2);
          doc.line(margin, 14, pageW - margin, 14);
          
          // Running Footer
          doc.line(margin, pageH - 14, pageW - margin, pageH - 14);
          doc.setTextColor(100, 116, 139);
          doc.text('Documentação Técnica do Sistema', margin, pageH - 9);
          doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 9, { align: 'right' });
        }
      }

      doc.save('HealthAnalytics_Documentacao_Completa.pdf');
    }).catch(err => {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar PDF. Usando impressão do navegador como alternativa.');
      window.print();
    });
  };

  // ─── JSX ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', color: 'var(--text-main)', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Print CSS injected via style tag */}
      <style>{`
        @media print {
          body { background: #fff !important; color: #000 !important; }
          .no-print { display: none !important; }
          .print-page { page-break-before: always; }
        }
      `}</style>

      {/* ── Header Fixo ── */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0.85rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#2dd4bf', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Voltar para Home
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={20} style={{ color: '#2dd4bf' }} />
          <span style={{ fontWeight: 700, fontSize: '1rem', background: 'linear-gradient(90deg, #2dd4bf, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Health Analytics Dashboard
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handlePrint}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', color: '#94a3b8', cursor: 'pointer',
              padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#f8fafc'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <FileDown size={14} /> Imprimir
          </button>
          <button
            id="btn-export-pdf"
            onClick={handleExportPdf}
            style={{
              background: 'linear-gradient(135deg, rgba(45,212,191,0.15), rgba(129,140,248,0.15))',
              border: '1px solid rgba(45,212,191,0.4)',
              borderRadius: '8px', color: '#2dd4bf', cursor: 'pointer',
              padding: '6px 16px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(45,212,191,0.3), rgba(129,140,248,0.3))'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(45,212,191,0.15), rgba(129,140,248,0.15))'; }}
          >
            <FileDown size={14} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div ref={printRef} style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 2rem 5rem' }}>

        {/* ── Hero Section ── */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <Building2 size={40} style={{ color: '#2dd4bf' }} />
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(90deg, #2dd4bf, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              Health Analytics Dashboard
            </h1>
          </div>
          <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '700px', margin: '0 auto 1rem', lineHeight: 1.7 }}>
            Sistema de Business Intelligence Hospitalar com Star Schema PostgreSQL, dashboards analíticos em tempo real e Agente Cognitivo executivo baseado em IA Generativa.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            {[
              { label: '11 Módulos', color: '#2dd4bf' }, { label: '50+ KPIs', color: '#818cf8' },
              { label: '25+ Endpoints', color: '#4ade80' }, { label: 'IA Generativa', color: '#e879f9' },
              { label: 'Star Schema', color: '#fbbf24' }, { label: 'RAG Local', color: '#f87171' },
            ].map(tag => (
              <span key={tag.label} style={{
                background: `rgba(${tag.color === '#2dd4bf' ? '45,212,191' : tag.color === '#818cf8' ? '129,140,248' : tag.color === '#4ade80' ? '74,222,128' : tag.color === '#e879f9' ? '232,121,249' : tag.color === '#fbbf24' ? '251,191,36' : '248,113,113'},0.1)`,
                border: `1px solid ${tag.color}44`,
                borderRadius: '20px', padding: '4px 14px', fontSize: '0.8rem', color: tag.color, fontWeight: 600
              }}>{tag.label}</span>
            ))}
          </div>
        </div>

        {/* ── Seção 1: Importância ── */}
        <Section icon={Target} title="1. Importância e Justificativas do Projeto" color="#4ade80">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {IMPORTANCE_ITEMS.map((item, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '8px',
                borderLeft: `3px solid ${item.color}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <item.icon size={20} style={{ color: item.color, flexShrink: 0 }} />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>{item.title}</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Seção 2: Funcionalidades e KPIs ── */}
        <Section icon={BarChart3} title="2. Funcionalidades e Catálogo de KPIs" color="#818cf8">
          {KPI_GROUPS.map((group, gi) => (
            <div key={gi} style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                <group.icon size={22} style={{ color: group.color }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>{group.module}</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
                {group.kpis.map((kpi, ki) => (
                  <KpiCard key={ki} kpi={kpi} color={group.color} />
                ))}
              </div>
            </div>
          ))}
        </Section>

        {/* ── Seção 3: Stack Tecnológico ── */}
        <Section icon={Cpu} title="3. Stack Tecnológico" color="#2dd4bf">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {TECH_STACK.map((layer, li) => (
              <div key={li} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px', padding: '1.5rem', borderTop: `3px solid ${layer.color}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
                  <layer.icon size={20} style={{ color: layer.color }} />
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: layer.color, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{layer.layer}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {layer.items.map((item, ii) => (
                    <div key={ii} style={{ borderLeft: '2px solid rgba(255,255,255,0.08)', paddingLeft: '10px' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '2px' }}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.55 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Seção 4: Plano de Desenvolvimento ── */}
        <Section icon={GitBranch} title="4. Plano de Desenvolvimento" color="#fbbf24">
          <div style={{ position: 'relative' }}>
            {[
              {
                phase: 'Fase 1 — Modelagem e Arquitetura', weeks: 'Semanas 1-2', color: '#2dd4bf',
                items: ['Definição do Star Schema: 9 Dimensões e 8 tabelas Fato', 'Mapeamento de KPIs hospitalares baseados em ONA, ANS e PNSP', 'Criação dos modelos Django e migrations PostgreSQL', 'Script de geração de 36 meses de dados sintéticos coerentes para validação']
              },
              {
                phase: 'Fase 2 — API RESTful', weeks: 'Semanas 3-4', color: '#818cf8',
                items: ['25+ endpoints DRF para todos os módulos hospitalares', 'Autenticação por Token, filtros dinâmicos (ano/mês/unidade/convênio)', 'Documentação automática OpenAPI 3.0 (Swagger + Redoc) via drf-spectacular', 'Usuário postgres_bi read-only para segurança no Text-to-SQL']
              },
              {
                phase: 'Fase 3 — Frontend e Dashboards', weeks: 'Semanas 5-7', color: '#f87171',
                items: ['Design system Glassmorphism Dark Mode + sistema de gradientes', '11 dashboards especializados com Recharts (Bar, Line, Area, Scatter, Radar)', 'Componente AITrigger para análise contextual de qualquer indicador', 'Telas de Auditoria SUS, Regulação de Filas e Matriz de Risco']
              },
              {
                phase: 'Fase 4 — Camada Cognitiva de IA', weeks: 'Semanas 8-10', color: '#e879f9',
                items: ['Copilot Executivo: chat premium com parser markdown e mini-gráficos inline', 'Text-to-SQL com dupla sanitização anti-SQL Injection', 'RAG local TF-IDF com stemmer PT-BR, chunks 2500 chars e overlap de 400', 'Upload PDF/DOCX até 50MB; Base de Conhecimento de Manuais SUS', 'Cron Job de anomalias (Z-Score ≥ 2σ) e Resumo Executivo Diário']
              },
              {
                phase: 'Fase 5 — Polimento, Testes e Docs', weeks: 'Semanas 11-12', color: '#4ade80',
                items: ['Tela Sobre o Sistema com documentação completa e exportação PDF', 'Testes unitários de segurança e comportamento do agente de IA', 'Dicionário de dados das tabelas Dimensão e Fato no Admin DB', 'Documentação: YAML OpenAPI, Guia de Conexão BI, Matriz de Métricas, Canvas']
              },
            ].map((phase, i) => (
              <div key={i} style={{ display: 'flex', gap: '20px', marginBottom: '2rem' }}>
                {/* Timeline bullet */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${phase.color}22`, border: `2px solid ${phase.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: phase.color }}>
                    {i + 1}
                  </div>
                  {i < 4 && <div style={{ width: '2px', flex: 1, background: `${phase.color}33`, marginTop: '6px' }} />}
                </div>
                {/* Card */}
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: '12px', padding: '1.25rem', borderLeft: `3px solid ${phase.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '6px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>{phase.phase}</h3>
                    <span style={{ background: `${phase.color}22`, border: `1px solid ${phase.color}44`, borderRadius: '20px', padding: '2px 10px', fontSize: '0.75rem', color: phase.color, fontWeight: 600 }}>{phase.weeks}</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', listStyle: 'none' }}>
                    {phase.items.map((item, ii) => (
                      <li key={ii} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px', lineHeight: 1.5 }}>
                        <CheckCircle2 size={14} style={{ color: phase.color, flexShrink: 0, marginTop: '2px' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Seção 5: Arquitetura ── */}
        <Section icon={Layers} title="5. Arquitetura do Sistema" color="#e879f9">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Camada de Dados', desc: 'PostgreSQL + Star Schema', color: '#818cf8', items: ['9 Dimensões (DimTempo, DimUnidade, DimMédico, DimConvênio, DimMedicamento, DimProtocolo, DimEquipamento, DimPaciente, DimTipoProcedimento)', '8 Fatos (Atendimentos, Estoque, Erros, Procedimentos, Infraestrutura, Higienização, Desempenho Clínico, Escala Médica, Financeiro)', 'DocumentoConhecimento + BlocoDocumento (RAG)', 'ResumoExecutivo (histórico de anomalias)'] },
              { label: 'Camada de Negócio', desc: 'Django DRF', color: '#2dd4bf', items: ['REST API com 25+ endpoints autenticados', 'Cálculo de KPIs em Python (Z-Score, TF-IDF, Cosine Similarity)', 'Geração de Insights com Google Gemini ou OpenAI', 'Cron Job de detecção de anomalias diárias'] },
              { label: 'Camada de Apresentação', desc: 'React + Vite', color: '#f87171', items: ['14 rotas (Home + 11 dashboards + Copilot + Sobre)', 'Recharts: 15+ tipos de visualizações', 'Glassmorphism Dark Mode', 'Exportação PDF completa (jsPDF + print)'] },
              { label: 'Camada Cognitiva', desc: 'IA Generativa', color: '#e879f9', items: ['RAG local TF-IDF (PT-BR stemmer)', 'Text-to-SQL com sanitização dupla', 'LLM: Gemini 1.5 Flash / GPT-4o Mini', 'Persona blindada de COO hospitalar'] },
            ].map((layer, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem', borderTop: `3px solid ${layer.color}` }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: layer.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>{layer.label}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>{layer.desc}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {layer.items.map((item, ii) => (
                    <li key={ii} style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '5px', lineHeight: 1.5, display: 'flex', gap: '6px' }}>
                      <span style={{ color: layer.color, flexShrink: 0 }}>▸</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Footer ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#475569', fontSize: '0.8rem', lineHeight: 1.7 }}>
            Health Analytics Dashboard — Sistema de BI Hospitalar com IA Generativa<br />
            Desenvolvido com Django DRF + PostgreSQL + React/Vite + Gemini API<br />
            Documentação gerada automaticamente em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function Section({ icon: Icon, title, color, children }) {
  return (
    <div style={{ marginBottom: '4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={22} style={{ color }} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>{title}</h2>
          <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${color}, transparent)`, marginTop: '4px', borderRadius: '2px' }} />
        </div>
      </div>
      {children}
    </div>
  );
}

function KpiCard({ kpi, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '12px', padding: '1.1rem', borderLeft: `3px solid ${color}`
    }}>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px' }}>{kpi.name}</div>
      <div style={{ fontSize: '0.78rem', color: '#818cf8', fontFamily: 'monospace', background: 'rgba(129,140,248,0.07)', padding: '4px 8px', borderRadius: '6px', marginBottom: '6px', wordBreak: 'break-word' }}>
        {kpi.formula}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Meta:</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color, background: `${color}18`, borderRadius: '12px', padding: '1px 8px' }}>{kpi.meta}</span>
      </div>
      <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.55, margin: 0 }}>{kpi.desc}</p>
    </div>
  );
}
