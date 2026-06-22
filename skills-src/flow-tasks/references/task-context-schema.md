# Esquema de Frontmatter de Tarefa

Metadados de tarefa são lidos diretamente do YAML frontmatter do arquivo `task_*.md`.

## Campos Obrigatórios

- `id`: identificador da tarefa, por exemplo `task_01` ou `task_001`.
- `status`: estado do ciclo de vida.
- `title`: título legível. Deve corresponder ao primeiro H1 do corpo.
- `type`: tipo permitido. Use somente um dos tipos default: `frontend`, `backend`, `docs`, `test`, `infra`, `refactor`, `chore`, `bugfix`.
- `complexity`: deve ser `low`, `medium`, `high` ou `critical`.
- `dependencies`: lista YAML de tarefas que precisam ser concluídas antes. Use `[]` quando não houver dependências.

## Campos Condicionais

- `project`: opcional em single-project; obrigatório para tarefas executáveis em multi-project.
- `repository`: opcional, porém recomendado em multi-project.
- `area`: opcional, porém recomendado em multi-project para indicar fronteira técnica.

## Status

- `pending`: não iniciada.
- `in_progress`: em execução.
- `completed`: concluída e verificada.
- `blocked`: bloqueada explicitamente.
- `done`: tratado como concluída.
- `finished`: tratado como concluída.

## Nomes de Arquivo

Arquivos de tarefa devem seguir `task_\d+\.md` com zero à esquerda:

- `task_01.md`
- `task_02.md`
- `task_10.md`
- `task_099.md`

O prefixo `_` é reservado para metadocumentos:

- `_prd.md`: Documento de Requisitos de Produto
- `_techspec.md`: Especificação Técnica
- `_tasks.md`: lista mestre
- `_impact-map.md`: mapa de projetos impactados
- `_contracts.md`: contratos entre serviços
- `_release-plan.md`: ordem e estratégia de liberação
- `_rollback-plan.md`: estratégia de reversão e mitigação

## Compatibilidade

- O workflow lê arquivos que batem com `^task_\d+\.md$`.
- Em `workspace.mode: single`, tasks sem `project` são tratadas como pertencentes ao projeto implícito `default`.
- Em `workspace.mode: multi-project`, o valor de `project` deve existir em `projects` dentro de `flow.config.yaml`.
- O arquivo deve começar com YAML frontmatter.
