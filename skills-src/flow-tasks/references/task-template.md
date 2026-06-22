# Template de Arquivo de Tarefa

Use esta estrutura para toda tarefa individual. O arquivo deve começar com YAML frontmatter parseável.

```markdown
---
id: task_01
status: pending
title: [Título da tarefa]
type: [frontend, backend, docs, test, infra, refactor, chore ou bugfix]
complexity: [low, medium, high, critical]
project: [nome-do-projeto quando aplicável]
repository: [../repositorio ou URL quando aplicável]
area: [frontend, backend, worker, database, api, infra ou equivalente]
dependencies:
  - task_01
  - task_02
---

# Tarefa N: [Título]

## Visão Geral
[2 a 3 frases: o que a tarefa entrega e por que importa no projeto.]

<critical>
- LEIA SEMPRE o PRD e a TechSpec antes de começar
- REFERENCIE A TECHSPEC para detalhes de implementação; não duplique aqui
- FOQUE NO "O QUE"; descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO; mostre código só para ilustrar estrutura atual ou problemas
- TESTES OBRIGATÓRIOS; toda tarefa deve incluir testes nos entregáveis
</critical>

<requirements>
- [Requisito 1: requisito técnico específico]
- [Requisito 2]
- [Requisito 3]
</requirements>

## Contexto Operacional
- Projeto responsável: [nome-do-projeto ou "default" em single-project]
- Repositório: [caminho relativo, absoluto ou URL]
- Área técnica: [frontend/backend/api/worker/database/etc.]

## Subtarefas
- [ ] N.1 [Descrição da subtarefa: O QUE realizar]
- [ ] N.2 [Descrição da subtarefa]
- [ ] N.3 [Descrição da subtarefa]

## Detalhes de Implementação
[Caminhos de arquivos a criar ou modificar, pontos de integração e dependências.
Referencie a seção de implementação da TechSpec para padrões e interfaces.]

### Arquivos Relevantes
- `caminho/para/arquivo`: [motivo breve]

### Arquivos Dependentes
- `caminho/para/dependencia`: [por que será afetado]

### ADRs Relacionados
- [ADR-NNN: Título](../adrs/adr-NNN.md): relevância para esta tarefa

## Entregáveis
- [Saída concreta 1]
- [Saída concreta 2]
- Testes unitários com cobertura adequada ao risco **(OBRIGATÓRIO)**
- Testes de integração para [funcionalidade] **(OBRIGATÓRIO quando houver integração)**

## Testes
- Testes unitários:
  - [ ] [Caso 1: caminho feliz]
  - [ ] [Caso 2: caminho de erro]
  - [ ] [Bordas e limites]
- Testes de integração:
  - [ ] [Fluxo de ponta a ponta]
- Validação operacional:
  - [ ] [Logs, métricas, eventos, rollback ou verificação pós-deploy quando aplicável]
- Todos os testes planejados devem passar

## Critérios de Sucesso
- Todos os testes aplicáveis passando
- Tracking da tarefa atualizado
- [Resultado mensurável 1]
- [Resultado mensurável 2]
```

## Diretrizes

- Em `workspace.mode: single`, `project`, `repository` e `area` são opcionais.
- Em `workspace.mode: multi-project`, tarefas executáveis devem informar `project`; `repository` e `area` são fortemente recomendados.
- Cada tarefa deve ser implementável de forma independente quando dependências estiverem concluídas.
- Toda tarefa deve incluir seção de Testes e itens de teste em Entregáveis.
- Nunca crie tarefas separadas apenas para teste.
- Subtarefas descrevem O QUE, não COMO.
- Evite código; referencie a TechSpec para padrões.
