# Especificação de Evolução do `flow-sdd` para Suporte Multi-Project

## 1. Objetivo

Evoluir o pacote `flow-sdd` para oferecer suporte nativo a cenários **multi-project**, mantendo total compatibilidade com o cenário atual **mono-repo / single-project**.

A evolução deve permitir que uma única feature de negócio seja especificada, planejada, quebrada em tarefas, validada e acompanhada mesmo quando impactar vários projetos ou repositórios diferentes, por exemplo:

- Front-end / Portal
- Banco de dados
- Jobs / Workers
- API de boleto
- API de invoice / nota fiscal
- Serviços auxiliares
- Observabilidade / logs

O comportamento atual do pacote deve continuar funcionando sem exigir alteração nos projetos existentes.

---

## 2. Princípio de arquitetura

A evolução deve seguir o princípio:

> Multi-project deve ser uma camada adicional. Mono-repo deve continuar sendo o comportamento padrão.

Ou seja:

```txt
mono-repo      = workspace com 1 projeto
multi-project = workspace com vários projetos
```

Não devem existir dois fluxos completamente separados.  
O pacote deve trabalhar internamente sempre com o conceito de **workspace**, onde:

- um workspace com um único projeto representa o modelo atual;
- um workspace com múltiplos projetos representa o novo modelo multi-project.

---

## 3. Compatibilidade com o modelo atual

O uso atual deve continuar válido:

```bash
npx flow-sdd status --project . --feature shopping-cart
npx flow-sdd verify --project . --feature shopping-cart
npx flow-sdd next --project . --feature shopping-cart
```

A estrutura atual também deve continuar válida:

```txt
tasks/
  shopping-cart/
    _prd.md
    _techspec.md
    _tasks.md
    task_001.md
    task_002.md
```

Nenhum projeto existente deverá ser obrigado a adicionar `workspace.mode`, `projects`, `project` ou `repository` nas tasks.

Na ausência de configuração multi-project, o pacote deve assumir automaticamente:

```yaml
workspace:
  mode: single
```

E internamente resolver como:

```txt
project = default
```

---

## 4. Novo conceito: Workspace

### 4.1 Modo single

Representa o comportamento atual.

Exemplo de `flow.config.yaml` opcional:

```yaml
profile: strict
defaultLanguage: pt-BR

workspace:
  mode: single
```

Caso `workspace.mode` não esteja definido, o pacote deve assumir `single`.

### 4.2 Modo multi-project

Representa um workspace com múltiplos projetos envolvidos.

Exemplo:

```yaml
profile: strict
defaultLanguage: pt-BR

workspace:
  mode: multi-project

projects:
  frontend-portal:
    path: ../frontend-portal
    type: frontend
    stack: react

  database:
    path: ../database
    type: database
    stack: sqlserver

  jobs-fechamento-fatura:
    path: ../jobs-fechamento-fatura
    type: worker
    stack: dotnet

  api-boleto:
    path: ../api-boleto
    type: api
    stack: dotnet

  api-invoice:
    path: ../api-invoice
    type: api
    stack: dotnet
```

---

## 5. Estrutura de pastas recomendada

A estrutura principal deve continuar baseada em `tasks/<feature>/`.

Exemplo:

```txt
tasks/
  gerar-boleto-nota-fechamento-fatura/
    _prd.md
    _techspec.md
    _tasks.md
    _impact-map.md
    _contracts.md
    _release-plan.md
    _rollback-plan.md

    task_001.md
    task_002.md
    task_003.md
    task_004.md
    task_005.md
```

A evolução multi-project não deve exigir uma estrutura como:

```txt
projects/
  frontend/
    tasks/
```

A relação com projetos deve estar nos metadados das tasks e na configuração do workspace.

---

## 6. Novos artefatos recomendados por feature

Além dos artefatos já existentes, uma feature multi-project poderá conter:

```txt
_impact-map.md
_contracts.md
_release-plan.md
_rollback-plan.md
```

### 6.1 `_impact-map.md`

Responsável por mapear os projetos impactados.

Exemplo:

```md
# Impact Map

| Projeto | Tipo | Repositório | Responsabilidade |
|---|---|---|---|
| frontend-portal | Front-end | ../frontend-portal | Permitir ativação da configuração |
| database | Banco de dados | ../database | Criar tabela de configuração |
| jobs-fechamento-fatura | Worker | ../jobs-fechamento-fatura | Orquestrar fechamento da fatura |
| api-boleto | API | ../api-boleto | Gerar boleto |
| api-invoice | API | ../api-invoice | Gerar nota fiscal |
```

### 6.2 `_contracts.md`

Responsável por registrar contratos entre serviços.

Exemplo:

```md
# Service Contracts

## API de Boleto

### Endpoint

POST /boletos/gerar-por-fatura

### Request

```json
{
  "clienteId": "123",
  "faturaId": "456",
  "valor": 1500.75,
  "vencimento": "2026-07-10"
}
```

### Response

```json
{
  "sucesso": true,
  "boletoId": "789",
  "linhaDigitavel": "xxxxx",
  "urlBoleto": "https://..."
}
```

## API de Invoice

### Endpoint

POST /invoices/gerar-por-fatura

### Request

```json
{
  "clienteId": "123",
  "faturaId": "456",
  "valor": 1500.75,
  "competencia": "2026-06"
}
```

### Response

```json
{
  "sucesso": true,
  "invoiceId": "999",
  "numeroNota": "NF-12345",
  "urlDanfe": "https://..."
}
```
```

### 6.3 `_release-plan.md`

Responsável por descrever a estratégia de liberação.

Deve conter:

- ordem de deploy;
- feature flags;
- clientes piloto;
- dependências entre projetos;
- plano de comunicação;
- validações pós-deploy.

### 6.4 `_rollback-plan.md`

Responsável por descrever como desfazer ou mitigar problemas.

Deve conter:

- rollback de API;
- rollback de job;
- desativação de feature flag;
- reversão ou mitigação de migrations;
- procedimento em caso de falha parcial.

---

## 7. Metadados das tasks

### 7.1 Task atual

O modelo atual deve continuar válido:

```md
---
id: task_001
title: Criar carrinho de compras
status: pending
---

## Objetivo

Implementar a criação do carrinho de compras.
```

### 7.2 Task multi-project

As tasks poderão receber novos campos:

```md
---
id: task_002
title: Implementar endpoint idempotente de boleto
status: pending
complexity: medium
project: api-boleto
repository: ../api-boleto
area: backend
dependencies:
  - task_001
---

## Objetivo

Implementar endpoint para geração automática de boleto a partir da fatura.

## Critérios de aceite

- Não gerar boleto duplicado para a mesma fatura.
- Retornar status padronizado.
- Registrar logs de sucesso e falha.
```

### 7.3 Campos sugeridos

| Campo | Descrição | Single-project | Multi-project |
|---|---|---:|---:|
| `id` | Identificador da task | Obrigatório | Obrigatório |
| `title` | Título da task | Obrigatório | Obrigatório |
| `status` | Status atual | Obrigatório | Obrigatório |
| `complexity` | Complexidade estimada | Opcional | Opcional |
| `project` | Projeto responsável | Opcional | Obrigatório em tasks executáveis |
| `repository` | Caminho ou URL do repositório | Opcional | Recomendado |
| `area` | Área técnica | Opcional | Recomendado |
| `dependencies` | Dependências entre tasks | Opcional | Recomendado |

---

## 8. Regras de validação

### 8.1 Single-project

Quando `workspace.mode` for `single` ou não estiver configurado:

- `project` nas tasks é opcional;
- tasks sem `project` devem ser atribuídas ao projeto `default`;
- o comportamento atual do pacote deve ser preservado;
- nenhuma validação multi-project deve bloquear o fluxo.

### 8.2 Multi-project

Quando `workspace.mode` for `multi-project`:

- tasks executáveis devem ter `project`;
- o valor de `project` deve existir em `projects` no `flow.config.yaml`;
- dependências entre tasks devem continuar sendo validadas;
- dependências entre projetos diferentes devem ser destacadas;
- tasks bloqueadas por outro projeto devem aparecer claramente no `status`;
- o `verify` deve apontar inconsistências de projeto, dependência ou contrato.

---

## 9. Resolução interna de workspace

Criar uma função ou módulo responsável por resolver o workspace.

Exemplo conceitual:

```ts
function resolveWorkspace(config, projectRoot) {
  if (!config.workspace || config.workspace.mode !== "multi-project") {
    return {
      mode: "single",
      projects: {
        default: {
          name: "default",
          path: projectRoot,
          type: "repository"
        }
      }
    };
  }

  return {
    mode: "multi-project",
    projects: config.projects || {}
  };
}
```

O restante do pacote deve consumir o workspace resolvido, e não acessar diretamente `config.workspace` em vários pontos do código.

---

## 10. Evolução do comando `status`

### 10.1 Single-project

O comando deve continuar funcionando como hoje.

Exemplo de saída:

```txt
Feature: shopping-cart
Mode: single

Artifacts:
- PRD: ok
- TechSpec: ok
- Tasks: ok

Tasks:
- task_001: completed
- task_002: pending

Next step:
- Execute task_002
```

### 10.2 Multi-project

Adicionar agrupamento por projeto.

Exemplo:

```txt
Feature: gerar-boleto-nota-fechamento-fatura
Mode: multi-project

Projects:
- database: 1 completed, 0 pending
- api-boleto: 0 completed, 1 pending
- api-invoice: 0 completed, 1 pending
- jobs-fechamento-fatura: 0 completed, 1 blocked
- frontend-portal: 0 completed, 1 pending

Blocked:
- task_004 jobs-fechamento-fatura depende de task_002 api-boleto
- task_004 jobs-fechamento-fatura depende de task_003 api-invoice

Next step:
- Execute task_002
```

---

## 11. Evolução do comando `verify`

O `verify` deve continuar validando os itens atuais e adicionar validações multi-project quando aplicável.

### 11.1 Validações novas

Em modo multi-project, validar:

- se toda task executável possui `project`;
- se o `project` informado existe no `flow.config.yaml`;
- se existem dependências para tasks inexistentes;
- se existem dependências cross-project;
- se há tasks de projeto bloqueadas por outro projeto;
- se `_impact-map.md` existe quando a feature for multi-project;
- se `_contracts.md` existe quando houver integração entre APIs, jobs ou serviços;
- se `_release-plan.md` existe quando a feature impactar mais de um projeto;
- se `_rollback-plan.md` existe quando houver alteração de banco ou integração crítica.

### 11.2 Exemplo de saída

```txt
Verify: gerar-boleto-nota-fechamento-fatura

Artifacts:
- _prd.md: ok
- _techspec.md: ok
- _tasks.md: ok
- _impact-map.md: ok
- _contracts.md: ok
- _release-plan.md: missing
- _rollback-plan.md: missing

Projects:
- frontend-portal: ok
- database: ok
- jobs-fechamento-fatura: ok
- api-boleto: ok
- api-invoice: ok

Warnings:
- task_004 possui dependência cross-project com task_002
- task_004 possui dependência cross-project com task_003
- _release-plan.md recomendado para feature multi-project
- _rollback-plan.md recomendado para feature com alteração de banco
```

---

## 12. Evolução do comando `next`

O comando `next` deve considerar dependências entre projetos.

### 12.1 Regras

- Não sugerir task bloqueada por dependência pendente.
- Priorizar tasks sem dependência.
- Em multi-project, exibir o projeto da próxima task.
- Quando todas as tasks de um projeto estiverem bloqueadas, informar o motivo.

### 12.2 Exemplo

```txt
Next task:
- task_002
- Project: api-boleto
- Title: Implementar endpoint idempotente de boleto
- Reason: task_001 database já foi concluída
```

Exemplo de bloqueio:

```txt
No executable task for project jobs-fechamento-fatura.

Blocked by:
- task_002 api-boleto
- task_003 api-invoice
```

---

## 13. Novos comandos opcionais

Esses comandos podem ser implementados em uma segunda etapa.

### 13.1 `impact`

Exibe o mapa de impacto da feature.

```bash
npx flow-sdd impact --project . --feature gerar-boleto-nota-fechamento-fatura
```

Saída esperada:

```txt
Impact Map: gerar-boleto-nota-fechamento-fatura

- frontend-portal: configuração de ativação
- database: tabela de configuração
- jobs-fechamento-fatura: orquestração
- api-boleto: geração de boleto
- api-invoice: geração de nota fiscal
```

### 13.2 `projects`

Exibe o status agrupado por projeto.

```bash
npx flow-sdd projects --project . --feature gerar-boleto-nota-fechamento-fatura
```

Saída esperada:

```txt
Projects status:

database
- completed: 1
- pending: 0
- blocked: 0

api-boleto
- completed: 0
- pending: 1
- blocked: 0

jobs-fechamento-fatura
- completed: 0
- pending: 0
- blocked: 1
```

### 13.3 `contracts`

Valida a existência e referências de contratos entre serviços.

```bash
npx flow-sdd contracts --project . --feature gerar-boleto-nota-fechamento-fatura
```

---

## 14. Exemplo completo de feature multi-project

### 14.1 Estrutura

```txt
tasks/
  gerar-boleto-nota-fechamento-fatura/
    _prd.md
    _techspec.md
    _tasks.md
    _impact-map.md
    _contracts.md
    _release-plan.md
    _rollback-plan.md
    task_001.md
    task_002.md
    task_003.md
    task_004.md
    task_005.md
```

### 14.2 `_tasks.md`

```md
# Tasks

| ID | Projeto | Título | Status | Dependências |
|---|---|---|---|---|
| task_001 | database | Criar tabela de configuração de faturamento | pending | - |
| task_002 | api-boleto | Implementar geração idempotente de boleto | pending | task_001 |
| task_003 | api-invoice | Implementar geração idempotente de nota fiscal | pending | task_001 |
| task_004 | jobs-fechamento-fatura | Orquestrar geração automática no fechamento | pending | task_001, task_002, task_003 |
| task_005 | frontend-portal | Criar configuração no portal | pending | task_001 |
```

### 14.3 `task_004.md`

```md
---
id: task_004
title: Orquestrar geração automática no fechamento da fatura
status: pending
complexity: high
project: jobs-fechamento-fatura
repository: ../jobs-fechamento-fatura
area: worker
dependencies:
  - task_001
  - task_002
  - task_003
---

## Objetivo

Alterar o job de fechamento de fatura para consultar a configuração do cliente e acionar automaticamente a geração de boleto e nota fiscal.

## Regras

- Consultar configuração do cliente antes de acionar as APIs.
- Gerar boleto somente se `GerarBoletoAutomatico = true`.
- Gerar nota fiscal somente se `GerarNotaFiscalAutomatico = true`.
- Não gerar boleto duplicado.
- Não gerar nota fiscal duplicada.
- Registrar logs e status de cada operação.

## Critérios de aceite

- O job respeita as configurações do cliente.
- O job chama a API de boleto quando aplicável.
- O job chama a API de invoice quando aplicável.
- O job registra sucesso, falha e tentativas.
- O job não bloqueia indevidamente o fechamento sem regra explícita definida na spec.
```

---

## 15. Estratégia de implementação incremental

### Fase 1 — Compatibilidade e metadados

- Criar resolução de workspace.
- Adicionar suporte a `workspace.mode`.
- Adicionar suporte a `projects` no `flow.config.yaml`.
- Adicionar leitura de `project` no frontmatter das tasks.
- Tratar ausência de `project` como `default`.

### Fase 2 — Status multi-project

- Agrupar tasks por projeto no `status`.
- Exibir contagem por projeto.
- Exibir tasks bloqueadas por dependências cross-project.
- Manter saída atual para single-project.

### Fase 3 — Verify multi-project

- Validar `project` nas tasks em modo multi-project.
- Validar existência do projeto no config.
- Validar dependências cross-project.
- Recomendar `_impact-map.md`, `_contracts.md`, `_release-plan.md` e `_rollback-plan.md`.

### Fase 4 — Next inteligente

- Impedir sugestão de tasks bloqueadas.
- Exibir projeto da próxima task.
- Exibir motivo de bloqueio quando aplicável.

### Fase 5 — Comandos opcionais

- Implementar `impact`.
- Implementar `projects`.
- Implementar `contracts`.

---

## 16. Critérios de aceite da evolução

A evolução será considerada concluída quando:

- Projetos atuais sem configuração multi-project continuarem funcionando.
- `workspace.mode` ausente for tratado como `single`.
- Tasks antigas sem `project` continuarem válidas.
- Em modo multi-project, tasks executáveis exigirem `project`.
- O `status` exibir agrupamento por projeto.
- O `verify` validar projetos inexistentes.
- O `verify` identificar dependências cross-project.
- O `next` não sugerir task bloqueada.
- A documentação explicar claramente mono-repo e multi-project.
- Houver exemplos de configuração para os dois cenários.

---

## 17. Não objetivos desta evolução

Esta evolução não deve, inicialmente:

- clonar repositórios automaticamente;
- abrir pull requests;
- executar builds de cada projeto;
- executar testes em múltiplos repositórios;
- substituir ferramentas de CI/CD;
- criar dashboard web;
- exigir banco de dados externo;
- mudar a estrutura principal `tasks/<feature>/`.

Esses itens podem ser avaliados em versões futuras.

---

## 18. Riscos e cuidados

### 18.1 Quebra de compatibilidade

Risco: usuários atuais precisarem mudar seus arquivos.

Mitigação:

- `workspace.mode` opcional;
- `project` opcional em single-project;
- `default` como projeto implícito.

### 18.2 Complexidade excessiva

Risco: o pacote ficar complexo demais para uso simples.

Mitigação:

- manter comandos atuais;
- adicionar multi-project como camada opcional;
- evitar exigir novos arquivos em projetos simples.

### 18.3 Configuração inconsistente

Risco: tasks apontarem para projetos inexistentes.

Mitigação:

- validar no `verify`;
- exibir erro claro com sugestão de correção.

### 18.4 Dependência circular

Risco: tasks de projetos diferentes criarem dependências circulares.

Mitigação:

- detectar ciclos no grafo de dependências;
- impedir sugestão no `next`;
- exibir caminho do ciclo.

---

## 19. Exemplo de uso esperado

### Mono-repo

```bash
npx flow-sdd status --project . --feature shopping-cart
```

Resultado:

```txt
Feature: shopping-cart
Mode: single
Status: in_progress
Next: task_002
```

### Multi-project

```bash
npx flow-sdd status --project . --feature gerar-boleto-nota-fechamento-fatura
```

Resultado:

```txt
Feature: gerar-boleto-nota-fechamento-fatura
Mode: multi-project

Projects:
- database: completed
- api-boleto: pending
- api-invoice: pending
- jobs-fechamento-fatura: blocked
- frontend-portal: pending

Next:
- task_002 api-boleto
```

---

## 20. Resumo da decisão

A evolução recomendada é transformar o `flow-sdd` em uma ferramenta orientada a **workspace**, onde:

```txt
workspace com 1 projeto  = mono-repo / single-project
workspace com N projetos = multi-project
```

A estrutura atual deve ser preservada.

A evolução deve ser incremental, começando por:

1. `workspace.mode`;
2. `projects` no `flow.config.yaml`;
3. `project` no frontmatter das tasks;
4. agrupamento por projeto no `status`;
5. validações multi-project no `verify`;
6. inteligência de bloqueio no `next`.

Esse caminho permite que o pacote continue simples para projetos pequenos e passe a ser forte o suficiente para features corporativas que impactam múltiplos sistemas.
