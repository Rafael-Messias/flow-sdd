# Template de Arquivo de Tarefa

Use esta estrutura para toda tarefa individual. O arquivo deve começar com YAML frontmatter parseável.

```markdown
---
status: pending
title: [Título da tarefa]
type: [frontend, backend, docs, test, infra, refactor, chore ou bugfix]
complexity: [low, medium, high, critical]
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
- [Requisito 2: por exemplo, "DEVE autenticar usuários via tokens JWT"]
- [Requisito 3]
</requirements>

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
- Testes unitários com cobertura de 80%+ **(OBRIGATÓRIO)**
- Testes de integração para [funcionalidade] **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [ ] [Caso 1: caminho feliz]
  - [ ] [Caso 2: caminho de erro]
  - [ ] [Bordas e limites]
- Testes de integração:
  - [ ] [Fluxo de ponta a ponta]
- Meta de cobertura: >=80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >=80%
- [Resultado mensurável 1]
- [Resultado mensurável 2]
```

## Diretrizes

- Cada tarefa deve ser implementável de forma independente quando dependências estiverem concluídas.
- Toda tarefa deve incluir seção de Testes e itens de teste em Entregáveis.
- Nunca crie tarefas separadas apenas para teste.
- Subtarefas descrevem O QUE, não COMO.
- Evite código; referencie a TechSpec para padrões.
