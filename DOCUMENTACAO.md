# Documentação do Sistema: Health Analytics Dashboard

Esta documentação detalha a arquitetura, as tecnologias e as funcionalidades do sistema de Dashboard de Health Analytics desenvolvido para gestão hospitalar e análise de indicadores de saúde.

---

## 1. Visão Geral do Projeto
O sistema é uma plataforma de Business Intelligence (BI) para saúde, composta por um backend robusto em Django que gerencia dados complexos de atendimento, estoque, procedimentos e finanças, e um frontend moderno em React para visualização interativa desses indicadores.

## 2. Arquitetura do Sistema
O sistema utiliza uma arquitetura desacoplada (Decoupled Architecture):
- **Backend**: API RESTful construída com Django REST Framework.
- **Frontend**: Single Page Application (SPA) construída com React e Vite.
- **Banco de Dados**: PostgreSQL com modelagem dimensional (Star Schema).

---

## 3. Tecnologias Utilizadas

### Backend
- **Python 3.12+**
- **Django 6.0**: Framework web principal.
- **Django REST Framework (DRF)**: Para criação dos endpoints da API.
- **PostgreSQL**: Banco de dados relacional.
- **Psycopg2**: Adaptador para conexão com PostgreSQL.
- **django-cors-headers**: Para permitir comunicação entre domínios.

### Frontend
- **React 18**: Biblioteca UI.
- **Vite**: Ferramenta de build ultra-rápida.
- **Recharts**: Biblioteca para geração de gráficos dinâmicos.
- **Lucide React**: Biblioteca de ícones modernos.
- **Axios**: Para requisições HTTP à API.
- **React Router Dom**: Para navegação entre as páginas.
- **Vanilla CSS**: Estilização customizada e responsiva.

---

## 4. Backend: Estrutura e Dados

### Modelagem Dimensional (Star Schema)
O banco de dados foi modelado seguindo as melhores práticas de BI, utilizando tabelas de **Dimensão** e tabelas de **Fato**.

#### Dimensões principais:
- **DimTempo**: Gerencia datas, meses e anos.
- **DimUnidade**: Cadastro de unidades hospitalares e leitos.
- **DimPaciente**: Dados demográficos e NPS (Net Promoter Score).
- **DimMedicamento**: Cadastro de fármacos e custos.
- **DimMedico**: Cadastro de profissionais e CRM.
- **DimTipoProcedimento**: Tipos de exames e cirurgias.
- **DimEquipamento**: Máquinas e status de manutenção.

#### Tabelas de Fato (Indicadores):
- **FatoAtendimentos**: Tempos de permanência, taxas de reinternação e altas.
- **FatoEstoque**: Movimentações e saldos de medicamentos.
- **FatoProcedimentos**: Tempos de execução e status de agendamentos.
- **FatoFinanceiro**: Receitas, glosas, custos e prazos de pagamento.
- **FatoDesempenhoClinico**: Aderência a protocolos e tempo de prontuário.

### API Endpoints
A API está disponível no prefixo `/api/` e utiliza roteamento automático para todos os modelos listados acima.
- Exemplos: `/api/pacientes/`, `/api/atendimentos/`, `/api/financeiro/`.

---

## 5. Frontend: Dashboards e Visualização

O frontend é organizado em dashboards especializados, cada um focado em uma área crítica da operação hospitalar:

1.  **Dashboard de Pacientes**: Indicadores de satisfação (NPS), tempos de permanência e perfil etário.
2.  **Dashboard de Medicamentos**: Controle de estoque, custos de itens essenciais e erros de medicação.
3.  **Dashboard de Procedimentos**: Eficiência operacional, ocupação de equipamentos e tempos de limpeza/preparo.
4.  **Dashboard Hospitalar**: Visão geral de infraestrutura (consumo de água/luz) e taxas de infecção.
5.  **Dashboard de Médicos**: Desempenho clínico, aderência a protocolos e assiduidade (escala).
6.  **Dashboard Financeiro**: Receita bruta, análise de glosas e custos operacionais.

### Componentes Chave
- **KPICard**: Exibe métricas principais de forma destacada.
- **FilterBar**: Permite filtrar dados por unidade e período.
- **Charts**: Gráficos de Linha, Barra, Pizza e Composto para análise de tendências.

---

## 6. Funcionalidades de Integração
O sistema possui uma página dedicada de **Integrações** que permite:
- Monitorar a conexão com sistemas externos (HIS, LIS, ERP).
- Configurar frequências de sincronização.
- Visualizar logs de erros de integração.

---

## 7. Como Executar o Sistema

### Pré-requisitos
- Python instalado.
- Node.js instalado.
- PostgreSQL rodando localmente.

### Inicialização Rápida (Windows)
Existe um arquivo chamado `INICIAR_SISTEMA.bat` na raiz do projeto. Basta executá-lo para subir ambos os servidores simultaneamente.

### Execução Manual

**Backend:**
```powershell
cd painel-saude-backend
venv\Scripts\activate
python manage.py runserver
```
Acessível em: `http://localhost:8000`

**Frontend:**
```powershell
cd painel-saude-frontend
npm install
npm run dev
```
Acessível em: `http://localhost:3000`

---

## 8. Manutenção e CRUD
Para gerenciar os dados (inserir, editar ou remover registros), utilize o **Django Admin**:
- **Link**: `http://localhost:8000/admin/`
- Requer a criação de um superuser (`python manage.py createsuperuser`).

---
**Documentação gerada automaticamente para o projeto Health Analytics Dashboard.**
