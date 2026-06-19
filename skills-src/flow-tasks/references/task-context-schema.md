# Esquema de Frontmatter de Tarefa

Metadados de tarefa são lidos do YAML frontmatter pela função `ParseTaskFile()` em `internal/core/prompt/common.go`.

## Campos Obrigatórios

- `status`: estado do ciclo de vida.
- `title`: título legível. Deve corresponder ao primeiro H1 do corpo.
- `type`: tipo permitido. Use somente um dos tipos default: `frontend`, `backend`, `docs`, `test`, `infra`, `refactor`, `chore`, `bugfix`.
- `complexity`: deve ser `low`, `medium`, `high` ou `critical`.
- `dependencies`: lista YAML de arquivos de tarefa que precisam ser concluídos antes. Use `[]` quando não houver dependências.

## Status

- `pending`: não iniciada.
- `in_progress`: em execução.
- `completed`: concluída e verificada.
- `done`: tratado como concluída.
- `finished`: tratado como concluída.

## Nomes de Arquivo

Arquivos de tarefa devem seguir `task_\d+\.md` com zero à esquerda:
- `task_01.md`, `task_02.md`, `task_10.md`, `task_99.md`

O prefixo `_` é reservado para metadocumentos:
- `_prd.md`: Documento de Requisitos de Produto
- `_techspec.md`: Especificação Técnica
- `_tasks.md`: lista mestre

## Compatibilidade

O workflow lê arquivos que batem com `^task_\d+\.md$`. Arquivos com prefixo antigo `_task_` não são reconhecidos. O arquivo deve começar com YAML frontmatter.
