# 📋 Roteiro de Importação de Dados (Star Schema)

Este guia orienta o processo de importação dos dados do **Health Analytics Dashboard** através do painel de controle de integração (Integration Hub).

Os arquivos CSV foram gerados e validados para garantir **coerência lógica** (incluindo validações clínicas como reinternação de 30 dias coerente e escalas médicas sem inconsistências de atraso).

---

## 🔑 Token de Autenticação (Admin)

Para realizar qualquer importação (seja via interface web ou API direta), utilize o seguinte Token de Autenticação:

```
618a1ecc975393339a8f8c1a35c779cc142e7654
```

---

## 🏛️ Estrutura de Diretórios dos Arquivos CSV

Os arquivos de simulação estão organizados da seguinte forma dentro da pasta `/arquivos_importacao`:

*   **`01_dimensoes/`**: Contém o cadastro geral (dimensões master) do hospital. Devem ser importadas **apenas uma vez** no início do processo.
*   **`02_fatos_por_mes/`**: Contém subpastas divididas por mês de competência (de `2025_07` a `2026_04`). Cada pasta possui os arquivos de fatos (transações/atendimentos) daquele mês.

---

## 🚦 Ordem Passo a Passo de Importação

> [!IMPORTANT]
> **Atenção:** Siga rigorosamente a ordem abaixo. Tentar importar uma tabela fato antes das dimensões correspondentes causará erro de **chave estrangeira (Foreign Key/Integridade Referencial)**.

### Passo 1: Importar as Dimensões (Uma única vez)

Acesse `http://localhost:3000/integracoes` (ou clique em **CSV Batch Import / Fazer Upload**), insira o Token de Autenticação, selecione a **Tabela Alvo** correspondente e faça o upload dos seguintes arquivos presentes na pasta `01_dimensoes/`:

1.  **Tabela Alvo:** `Dimensão: Tempo` ➡️ Arquivo: `dim_tempo.csv`
2.  **Tabela Alvo:** `Dimensão: Unidades` ➡️ Arquivo: `dim_unidade.csv`
3.  **Tabela Alvo:** `Dimensão: Pacientes` ➡️ Arquivo: `dim_paciente.csv`
4.  **Tabela Alvo:** `Dimensão: Medicamentos` ➡️ Arquivo: `dim_medicamento.csv`
5.  **Tabela Alvo:** `Dimensão: Tipos de Procedimento` ➡️ Arquivo: `dim_tipo_procedimento.csv`
6.  **Tabela Alvo:** `Dimensão: Equipamentos` ➡️ Arquivo: `dim_equipamento.csv`
7.  **Tabela Alvo:** `Dimensão: Protocolos` ➡️ Arquivo: `dim_protocolo.csv`
8.  **Tabela Alvo:** `Dimensão: Médicos` ➡️ Arquivo: `dim_medico.csv`
9.  **Tabela Alvo:** `Dimensão: Convênios` ➡️ Arquivo: `dim_convenio.csv`

---

### Passo 2: Importar as Tabelas Fato por Competência Mensal

Para cada mês de competência (começando em **`2025_07`** e avançando mês a mês até **`2026_04`**), acesse a pasta do respectivo mês em `02_fatos_por_mes/` e faça o upload das tabelas fato na seguinte ordem recomendada:

1.  **Tabela Alvo:** `Fato: Atendimentos` ➡️ Arquivo: `fato_atendimentos.csv`
2.  **Tabela Alvo:** `Fato: Estoque` ➡️ Arquivo: `fato_estoque.csv`
3.  **Tabela Alvo:** `Fato: Erros Medicação` ➡️ Arquivo: `fato_erros_medicao.csv`
4.  **Tabela Alvo:** `Fato: Procedimentos` ➡️ Arquivo: `fato_procedimentos.csv`
5.  **Tabela Alvo:** `Fato: Infraestrutura` ➡️ Arquivo: `fato_infraestrutura.csv`
6.  **Tabela Alvo:** `Fato: Higienização` ➡️ Arquivo: `fato_higienizacao.csv`
7.  **Tabela Alvo:** `Fato: Desempenho Clínico` ➡️ Arquivo: `fato_desempenho_clinico.csv`
8.  **Tabela Alvo:** `Fato: Escala Médica` ➡️ Arquivo: `fato_escala_medica.csv`
9.  **Tabela Alvo:** `Fato: Financeiro` ➡️ Arquivo: `fato_financeiro.csv`

---

## 🖥️ Verificação no Monitor de Ingestão

Após realizar o upload de cada arquivo CSV, você poderá acompanhar no **Monitor de Ingestão** na parte inferior da página de integrações:
*   A confirmação do nome da tabela processada.
*   O status de sincronização (**Sucesso** ou **Erro**).
*   A quantidade exata de registros processados/carregados.
*   O timestamp exato do processamento.

---
*Manual desenvolvido em Junho de 2026 como parte do projeto de Business Intelligence Hospitalar.*
