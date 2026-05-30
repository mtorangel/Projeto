# 🏥 Health Analytics Dashboard: Prospecto Consolidado do Projeto

Este documento apresenta um prospecto técnico e funcional completo do ecossistema **Health Analytics Dashboard (BI Hospitalar)**. O projeto foi arquitetado como uma solução de Business Intelligence de ponta para a gestão hospitalar estratégica, transformando dados operacionais fragmentados em indicadores analíticos robustos e insights preditivos orientados a valor.

---

## 🎯 1. Visão Geral e Proposta de Valor

O **Health Analytics Dashboard** é uma plataforma analítica centralizada projetada para atender às necessidades críticas de tomadores de decisão em ambientes hospitalares (diretores clínicos, administradores, gestores de suprimentos e corpo médico). 

A proposta de valor central reside em:
*   **Redução de Silos de Dados**: Consolidação de dados de sistemas transacionais heterogêneos (prontuários, ERP, estoque, financeiro).
*   **Gestão Baseada em Valor (Value-Based Healthcare)**: Foco em desfechos clínicos (como taxa de reinternação e tempo de permanência) cruzados com eficiência financeira.
*   **Experiência Premium do Usuário**: Interface altamente interativa com tema escuro (Dark Mode), efeito *Glassmorphism* (translúcido) e visualizações dinâmicas sofisticadas.

---

## 📂 2. Estrutura Organizacional do Projeto

O ecossistema é dividido em uma arquitetura desacoplada moderna (decoupled):

```
c:\Projeto
├── 📂 painel-saude-backend/     # Backend robusto em Django & DRF
│   ├── 📂 core/                 # Configurações do projeto e segurança
│   ├── 📂 indicadores/          # App principal (Modelagem Dimensional e API REST)
│   ├── 📂 integracoes/          # Módulo de sincronização em tempo real (HIS, LIS, ERP)
│   ├── 📂 carga_dados/          # Scripts utilitários de seeding de dados
│   ├── 📄 generate_bulk_data.py # Script de simulação de dados em larga escala
│   └── 📄 manage.py             # CLI de gerenciamento do Django
├── 📂 painel-saude-frontend/    # Frontend responsivo em React e Vite
│   ├── 📂 src/
│   │   ├── 📂 components/       # Componentes reutilizáveis (KPICard, FilterBar, etc.)
│   │   ├── 📂 data/             # Mocks e conectores de dados
│   │   ├── 📂 pages/            # Páginas do dashboard por especialidade (Financeiro, IA, etc.)
│   │   └── 📄 App.jsx           # Componente raiz e roteador
│   └── 📄 vite.config.js        # Configuração rápida do bundler Vite
├── 📄 INICIAR_SISTEMA.bat       # Script de inicialização automática em 1 clique
├── 📄 DOCUMENTACAO.md           # Manual de referência técnica do sistema
├── 📄 ARQUITETURA_HEALTH_ANALYTICS.md  # Mapeamento técnico de alto nível
└── 📄 ARQUITETURA_IA.md         # Roadmap de implementação de Inteligência Artificial
```

---

## 🏗️ 3. Arquitetura de Dados (Star Schema - Modelagem Kimball)

Para garantir máxima performance nas consultas analíticas complexas e relatórios, o banco de dados **PostgreSQL** está estruturado sob uma modelagem dimensional clássica de **Star Schema** (Esquema Estrela), projetado a partir dos princípios de Ralph Kimball.

```mermaid
graph GD
    DimTempo["DimTempo<br/>(Datas, Meses, Anos)"] --> FatoAtendimentos
    DimUnidade["DimUnidade<br/>(Unidades, Leitos)"] --> FatoAtendimentos
    DimPaciente["DimPaciente<br/>(Idade, Gênero, NPS)"] --> FatoAtendimentos
    DimMedico["DimMedico<br/>(Médicos, CRM, Especialidades)"] --> FatoAtendimentos

    subgraph Fatos [Tabelas de Fato - Métricas]
        FatoAtendimentos["FatoAtendimentos<br/>(TMP, Altas, Reinternações)"]
        FatoEstoque["FatoEstoque<br/>(Movimentações, Custo, Ruptura)"]
        FatoProcedimentos["FatoProcedimentos<br/>(Tempos, Ocupação, Suspensão)"]
        FatoInfraestrutura["FatoInfraestrutura<br/>(Consumo Água/Luz, Hotelaria)"]
        FatoDesempenhoClinico["FatoDesempenhoClinico<br/>(Adesão a Protocolos)"]
        FatoFinanceiro["FatoFinanceiro<br/>(EBITDA, Glosas, Custos)"]
    end
    
    DimMedicamento["DimMedicamento<br/>(Fármacos, Custos Unitários)"] --> FatoEstoque
    DimConvenio["DimConvenio<br/>(Planos de Saúde, Glosas)"] --> FatoFinanceiro
    DimEquipamento["DimEquipamento<br/>(Manutenção, Ocupação)"] --> FatoProcedimentos
```

### Detalhamento das Dimensões (Master Data)
*   **`DimTempo`**: Abstração temporal para permitir granularidade diária, mensal, trimestral e anual.
*   **`DimUnidade`**: Cadastro das unidades do grupo hospitalar (ex: UTI, Emergência, Ala Pediátrica).
*   **`DimPaciente`**: Informações sociodemográficas anonimizadas em conformidade com a LGPD.
*   **`DimMedicamento`**: Lista de medicamentos cadastrados com custo unitário padrão.
*   **`DimMedico`**: Informações do corpo clínico estruturado por especialidade e CRM.
*   **`DimProtocolo`**: Catálogo de diretrizes clínicas (ex: Protocolo de Sepse, Protocolo de AVC).
*   **`DimConvenio`**: Relação de operadoras de planos de saúde parceiras.
*   **`DimEquipamento`**: Cadastro de aparelhos de alto custo (ex: Ressonância Magnética, Tomógrafo).

---

## 📊 4. Módulos do Dashboard & Indicadores de Performance (KPIs)

O frontend oferece seis dashboards focados e estratégicos, permitindo análises granulares das operações hospitalares:

### 1. 👥 Módulo de Pacientes
*   **Taxa de Ocupação**: Percentual de leitos ativos ocupados em tempo real.
*   **Tempo Médio de Permanência (TMP)**: Duração da internação por diagnóstico/especialidade.
*   **Net Promoter Score (NPS)**: Índice de satisfação do paciente mensurado na alta.
*   **Taxa de Reinternação (30 dias)**: Monitoramento de pacientes que voltaram ao hospital no mesmo mês.

### 2. 💊 Módulo de Medicamentos (Suprimentos)
*   **Giro de Estoque**: Frequência com que o estoque é consumido e renovado.
*   **Custo Total de Saídas**: Valor financeiro total de medicamentos dispensados.
*   **Curva ABC / Gráfico de Pareto**: Identificação dos 20% de medicamentos que representam 80% do custo total.
*   **Taxa de Ruptura**: Indicador de falta de medicamentos críticos para atendimento.

### 3. 💉 Módulo de Procedimentos (Centro Cirúrgico & Exames)
*   **Taxa de Suspensão de Cirurgias**: Percentual de procedimentos cancelados e suas respectivas causas (administrativa, clínica, etc.).
*   **Produtividade de Equipamento**: Horas de uso efetivo vs tempo ocioso de aparelhos de alta complexidade.
*   **Giro de Sala (Turnover)**: Tempo médio gasto para higienização e preparo da sala entre cirurgias.

### 4. 🏥 Módulo Hospitalar (Infraestrutura & Hotelaria)
*   **Taxa de Infecção Hospitalar (IRAS)**: Incidência de infecções associadas à assistência de saúde.
*   **Intervalo de Substituição de Leito**: Tempo entre a alta de um paciente e a internação do próximo (tempo de higienização).
*   **Consumo de Recursos**: Indicadores mensais de eficiência energética e consumo hídrico por leito.

### 5. 🩺 Módulo de Médicos (Corpo Clínico)
*   **Adesão a Protocolos Clínicos (Radar Chart)**: Grau de conformidade dos médicos às diretrizes clínicas padrão do hospital (ex: Protocolo de Sepse).
*   **Absenteísmo**: Índice de ausências planejadas ou não planejadas nas escalas médicas.
*   **Volume de Atendimento por Especialidade (Treemap)**: Distribuição de consultas e cirurgias.

### 6. 💰 Módulo Financeiro
*   **EBITDA (Waterfall Chart)**: Lucro antes de juros, impostos, depreciação e amortização, demonstrando a saúde operacional real.
*   **Taxa de Glosas por Convênio**: Percentual de cobranças recusadas pelas operadoras de saúde, facilitando a identificação de gargalos de faturamento.
*   **Prazo Médio de Recebimento (PMR)**: Média de dias para que os convênios efetuem os pagamentos das faturas.

---

## 🛠️ 5. Stack Tecnológica

### Backend (API & Modelos)
*   **Django (v6.0.4)**: Framework web em Python de alta produtividade.
*   **Django REST Framework (DRF)**: Criação automatizada de rotas de API com serializers otimizados.
*   **PostgreSQL**: Banco de dados de produção robusto, usando o driver moderno **Psycopg 3** para otimização máxima de queries analíticas.
*   **django-cors-headers**: Habilitado para permitir conexões de origens cruzadas, garantindo segurança na integração com o React SPA.

### Frontend (SPA Analítico)
*   **React (v18) + Vite**: Ferramental ágil e moderno para carregamento instantâneo.
*   **Recharts**: Biblioteca responsiva baseada em SVG para renderização impecável dos gráficos complexos (Radar, Cascata/Waterfall, Pareto, Barras Acumuladas).
*   **Lucide React**: Ícones de categoria médica e financeira de alta resolução estética.
*   **Vanilla CSS Premium**: Design exclusivo com efeitos de **Glassmorphism** (cartões com fundos desfocados translúcidos e bordas sutis brilhantes) com suporte nativo a **Dark Mode** para reduzir o cansaço visual.

---

## 🧠 6. Inteligência Artificial: Roadmap Preditivo e Prescritivo

O sistema possui uma camada desenhada especificamente para evoluir com **Machine Learning** e inteligência preditiva estruturada na API Django REST (`/api/ai/`):

```
                     🤖 FLUXO DE INTELIGÊNCIA ARTIFICIAL
 ┌────────────────┐     ┌─────────────────────┐     ┌────────────────────────┐
 │ Dados de Fato  │ ──> │ Feature Engineering │ ──> │      Motores de IA     │
 │ (Star Schema)  │     │ (Pandas & Sklearn)  │     │   (Modelos Treinados)  │
 └────────────────┘     └─────────────────────┘     └────────────────────────┘
                                                                 │
                                                                 ▼
 ┌────────────────┐     ┌─────────────────────┐     ┌────────────────────────┐
 │ React UI       │ <── │ Django REST API     │ <── │ 📈 Insights & Risco    │
 │ (Badges/Cards) │     │ (Endpoints /ai/)    │     │ (Previsão de Demanda)  │
 └────────────────┘     └─────────────────────┘     └────────────────────────┘
```

### Modelos Planejados:
1.  **Risco de Reinternação (Classificação)**:
    *   *Algoritmo*: XGBoost ou Random Forest.
    *   *Como funciona*: Analisa dados demográficos e comorbidades de `DimPaciente` cruzando com a frequência de altas em `FatoAtendimentos` para calcular um *Score de Risco de Reinternação em 30 dias* na hora da alta.
2.  **Previsão de Demanda (Séries Temporais)**:
    *   *Algoritmo*: Facebook Prophet ou LSTM (Redes Neurais).
    *   *Como funciona*: Analisa dados históricos de saídas em `FatoEstoque` para prever a demanda por medicamentos e insumos críticos para as próximas 4 a 6 semanas, reduzindo o risco de rupturas graves.
3.  **Detecção de Glosas Financeiras (Detecção de Anomalias)**:
    *   *Algoritmo*: Isolation Forest ou Redes Neurais Autoencoders.
    *   *Como funciona*: Escaneia as notas de faturamento da `FatoFinanceiro` antes do envio às operadoras para identificar de forma proativa faturas fora do padrão de conformidade histórica, reduzindo perdas e retrabalhos.

---

## ⚙️ 7. Fluxo de Inicialização e Seed do Banco de Dados

O projeto conta com scripts prontos para facilitar o deploy local imediato.

### A. Inicialização Automática (1 Clique)
Na pasta raiz do projeto, execute o script em lote:
```powershell
.\INICIAR_SISTEMA.bat
```
*Este arquivo cria dois sub-processos do terminal CMD rodando o Django na porta 8000 e o React na porta 3000.*

### B. Inicialização Manual do Backend
1.  Navegue e ative o ambiente virtual:
    ```powershell
    cd painel-saude-backend
    python -m venv venv
    .\venv\Scripts\activate
    ```
2.  Instale os pacotes necessários:
    ```powershell
    pip install -r requirements.txt
    ```
3.  Aplique as migrações estruturais do banco:
    ```powershell
    python manage.py migrate
    ```
4.  Crie uma base rica de simulação utilizando os scripts de seeding na ordem lógica:
    ```powershell
    python manage.py seed_data           # Base: Tempo, Unidade, Pacientes, Atendimentos
    python manage.py seed_meds           # Dados do estoque e medicamentos
    python manage.py seed_procedimentos  # Agendamento e eficiência cirúrgica
    python manage.py seed_hospital       # Dados de IRAS e infraestrutura
    python manage.py seed_medicos        # Escala médica e assiduidade
    python manage.py seed_financeiro     # Receitas, despesas e glosas
    ```
5.  Inicie o servidor de desenvolvimento:
    ```powershell
    python manage.py runserver
    ```

### C. Inicialização Manual do Frontend
1.  Navegue e instale as dependências Node.js:
    ```powershell
    cd painel-saude-frontend
    npm install
    ```
2.  Execute o servidor de desenvolvimento Vite:
    ```powershell
    npm run dev
    ```
3.  Abra seu navegador em [http://localhost:3000](http://localhost:3000).

---
*Prospecto técnico desenvolvido em Maio de 2026 para mapeamento de produto.*
