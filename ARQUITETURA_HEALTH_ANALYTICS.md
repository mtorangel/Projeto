# Arquitetura Técnica: Health Analytics Dashboard

Este documento mapeia os componentes do projeto para o diagrama de arquitetura de alto nível, integrando as camadas de dados, inteligência e visualização.

---

## 1. Canais de Acesso & Usuários
- **Canais**: Navegadores Web (Chrome, Edge, Safari), Mobile Web Responsivo.
- **Usuários**: 
  - **Administradores Hospitalares**: Monitoramento de EBITDA e performance financeira.
  - **Diretores Clínicos**: Acompanhamento de desfechos (TMP, Reinternação).
  - **Gestores de Farmácia**: Controle de estoque e ruptura de medicamentos.
  - **Corpo Clínico**: Adesão a protocolos e produtividade cirúrgica.

---

## 2. Camada de Plataforma (Core)
A plataforma centralizada é composta por 6 módulos estratégicos integrados:

1. **Módulo de Pacientes**: Indicadores de fluxo (TMP, Ocupação, NPS).
2. **Módulo de Suprimentos**: Gestão de farmácia (Giro de Estoque, Custo, Ruptura).
3. **Módulo de Produção**: Eficiência de bloco cirúrgico (Giro de Sala, Suspensão).
4. **Módulo de Infraestrutura**: Monitoramento hospitalar (IRAS, Consumo, Higienização).
5. **Módulo Corpo Clínico**: Performance médica (Protocolos, Absenteísmo).
6. **Módulo Financeiro**: Saúde econômica (EBITDA, Glosas, Waterfall Chart).

---

## 3. Serviços e Regras de Negócio
- **Back-end Framework**: Django 6.0.4.
- **Interface de Comunicação**: Django REST Framework (Endpoints JSON).
- **Motores de Cálculo**: Lógica Python para cálculo de KPIs complexos (EBITDA, Taxas de IRAS).
- **Segurança**: Token Authentication e CORS Headers configurados.

---

## 4. Camada de Dados (Star Schema)
Modelagem baseada nos princípios de Kimball para alta performance analítica:

- **Banco Operacional**: PostgreSQL (Transacional).
- **Data Warehouse (Analítico)**: 
  - **Dimensões**: `DimTempo`, `DimUnidade`, `DimPaciente`, `DimMedicamento`, `DimMedico`, `DimProtocolo`, `DimConvenio`, `DimEquipamento`.
  - **Fatos**: `FatoAtendimentos`, `FatoEstoque`, `FatoProcedimentos`, `FatoInfraestrutura`, `FatoHigienizacao`, `FatoFinanceiro`.
- **Armazenamento**: PostgreSQL JSONB para dados semi-estruturados.

---

## 5. IA e Analytics (Evolução)
- **Predição de Reinternação**: Modelo XGBoost analisando padrões em `FatoAtendimentos`.
- **Previsão de Demanda**: Séries temporais (Prophet) para evitar rupturas no estoque de medicamentos.
- **Detecção de Glosas**: Algoritmos de anomalias para identificar perdas financeiras proativamente.

---

## 6. Infraestrutura e Integrações
- **Ambiente**: Python 3.12 (Virtualenv) + Node.js (Vite/React).
- **Fontes Externas**: Integração simulada via Scripts de Seeding e API de Integrações (`integracoes/sync`).
- **Segurança**: Conformidade com LGPD (Anonimização de DimPaciente) e RBAC (Controle de Acesso Baseado em Papéis).

---
**Documento gerado como referência técnica para o projeto Health Analytics Dashboard.**
