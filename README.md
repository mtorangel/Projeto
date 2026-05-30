# 🏥 Dashboard de Indicadores de Saúde (BI Hospitalar)

Este projeto é uma solução completa de Business Intelligence para gestão hospitalar, desenvolvida com uma arquitetura de dados moderna (**Star Schema**) e uma interface de alta performance.

## 🚀 Tecnologias Utilizadas

### **Back-end**
- **Django 5.0**: Framework principal.
- **Django Rest Framework (DRF)**: Criação de endpoints analíticos.
- **PostgreSQL**: Banco de dados relacional com modelagem dimensional.
- **Psycopg 3**: Driver de conexão otimizado.

### **Front-end**
- **React (Vite)**: Framework de interface.
- **Recharts**: Biblioteca de visualização de dados (Gráficos de Radar, Cascata, Treemap, etc).
- **Lucide React**: Biblioteca de ícones modernos.
- **Vanilla CSS**: Estilização premium com *Glassmorphism* e *Dark Mode*.

---

## 🏗️ Arquitetura de Dados (Star Schema)

O banco de dados foi modelado seguindo os princípios de **Kimball**, utilizando dimensões e tabelas fato para otimizar as consultas analíticas:

- **Dimensões**: `DimTempo`, `DimUnidade`, `DimPaciente`, `DimMedicamento`, `DimMedico`, `DimProtocolo`, `DimConvenio`, `DimEquipamento`, `DimTipoProcedimento`.
- **Fatos**: `FatoAtendimentos`, `FatoEstoque`, `FatoErrosMedicao`, `FatoProcedimentos`, `FatoInfraestrutura`, `FatoHigienizacao`, `FatoDesempenhoClinico`, `FatoEscalaMedica`, `FatoFinanceiro`.

---

## 📊 Módulos do Dashboard

O sistema é dividido em 6 categorias estratégicas:

1.  **👥 Pacientes**: Taxa de ocupação, Tempo Médio de Permanência (TMP), NPS e Reinternação.
2.  **💊 Medicamentos**: Giro de estoque, Custo total de saídas, Erros de medicação (Pareto) e Ruptura.
3.  **💉 Procedimentos**: Taxa de suspensão de cirurgias, Produtividade por equipamento e Giro de sala.
4.  **🏥 Hospital**: Taxa de Infecção (IRAS), Intervalo de substituição de leito e Consumo (Água/Energia).
5.  **🩺 Médicos**: Adesão a protocolos clínicos (Radar Chart), Absenteísmo e Volume por especialidade (Treemap).
6.  **💰 Financeiro**: EBITDA (Waterfall Chart), Glosas por convênio e Prazo Médio de Recebimento (PMR).

---

## 🛠️ Como Executar o Projeto

### 1. Configuração do Back-end
```powershell
cd painel-saude-backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
```

### 2. Popular o Banco (Scripts de Seed)
Execute os comandos na ordem abaixo para gerar a base de dados completa:
```powershell
python manage.py seed_data           # Base: Tempos, Unidades e Pacientes
python manage.py seed_meds           # Módulo Farmácia
python manage.py seed_procedimentos  # Módulo Produção
python manage.py seed_hospital       # Módulo Infraestrutura
python manage.py seed_medicos        # Módulo Corpo Clínico
python manage.py seed_financeiro     # Módulo Financeiro
```

### 3. Configuração do Front-end
```powershell
cd painel-saude-frontend
npm install
npm run dev
```

---

## 🎨 Design System
- **Tema**: Dark Premium.
- **Efeitos**: Glassmorphism (cartões translúcidos com bordas brilhantes).
- **Responsividade**: Grid System adaptável para diferentes resoluções.

---
**Desenvolvido como projeto final para o MBA em Ciência de Dados.**
