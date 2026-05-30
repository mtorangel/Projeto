# 🏥 Health Analytics Dashboard: Contexto Consolidado do Projeto

Este arquivo serve como o **Context Canvas** oficial do projeto, resumindo toda a inteligência técnica e funcional desenvolvida.

---

## 🚀 1. Identidade do Projeto
- **Nome**: Health Analytics Dashboard (BI Hospitalar).
- **Objetivo**: Solução de Business Intelligence para gestão estratégica de hospitais, transformando dados operacionais em indicadores analíticos e insights preditivos.
- **Design System**: Interface Premium Dark Mode com efeitos de *Glassmorphism*.

---

## 🛠️ 2. Stack Tecnológica
- **Back-end**: Django 6.0.4 + Django Rest Framework (DRF).
- **Banco de Dados**: PostgreSQL (Schema: `ind`).
- **Driver DB**: Psycopg 3 (Alta performance).
- **Front-end**: React (Vite) + Recharts (Gráficos) + Lucide (Ícones).
- **IA/Data Science**: Python (Scikit-learn, Pandas, Prophet).

---

## 🏗️ 3. Arquitetura de Dados (Star Schema - Kimball)
O sistema utiliza uma modelagem dimensional para otimizar consultas analíticas complexas:

### **Dimensões (Master Data)**
- `DimTempo`, `DimUnidade`, `DimPaciente`, `DimMedicamento`, `DimMedico`, `DimProtocolo`, `DimConvenio`, `DimEquipamento`.

### **Tabelas Fato (Métricas)**
- `FatoAtendimentos`: Ocupação e TMP.
- `FatoEstoque`: Ruptura e Giro de Medicamentos.
- `FatoProcedimentos`: Eficiência de Centro Cirúrgico.
- `FatoInfraestrutura`: Consumo e Hotelaria.
- `FatoDesempenhoClinico`: Adesão a Protocolos e IRAS.
- `FatoFinanceiro`: EBITDA, Glosas e Faturamento.

---

## 📊 4. Módulos Funcionais (Dashboards)
1. **👥 Pacientes**: Taxa de Ocupação, Tempo Médio de Permanência (TMP), NPS e Reinternação.
2. **💊 Medicamentos**: Giro de estoque, Curva ABC, Custo e Ruptura.
3. **💉 Procedimentos**: Taxa de suspensão de cirurgias e produtividade por equipamento.
4. **🏥 Hospital**: Taxa de Infecção (IRAS) e intervalo de substituição de leitos.
5. **🩺 Médicos**: Adesão a protocolos clínicos e absenteísmo.
6. **💰 Financeiro**: EBITDA, Glosas por convênio e PMR.

---

## 🧠 5. Inteligência Artificial (Roadmap de IA)
Modelos integrados à API Django para análise preditiva:
- **Modelo de Readmissão**: Classificação (XGBoost) para risco de volta em 30 dias.
- **Modelo de Demanda**: Séries Temporais para previsão de estoque de medicamentos.
- **Detecção de Fraudes/Anomalias**: Identificação de glosas financeiras fora do padrão.

---

## 🔐 6. Segurança e Integração
- **Autenticação**: Token-based Authentication (DRF Tokens).
- **Integração**: App `integracoes` com endpoint de sincronização em tempo real via JSON.
- **CORS**: Configurado para permitir conexões do frontend React.

---

## ⚙️ 7. Comandos de Execução
- **Backend**: `python manage.py runserver`
- **Frontend**: `npm run dev` (Porta 3000)
- **Migrações**: `python manage.py migrate`
- **Carga de Dados**: Scripts `seed_data`, `seed_meds`, `seed_procedimentos`, etc.

---
**Criado como documento de referência mestre para o ecossistema Health Analytics.**
