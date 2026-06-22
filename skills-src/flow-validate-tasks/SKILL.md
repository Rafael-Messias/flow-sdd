---
name: flow-validate-tasks
description: Valida metadados de arquivos de tarefa diretamente, sem delegar para o CLI. Use quando uma skill `flow-*` precisar checar ou corrigir `task_*.md` antes da execucao, especialmente apos `flow-tasks` gerar ou enriquecer tarefas.
---

# Validar Tarefas

Valide arquivos `task_*.md` diretamente pelo conteúdo, sem delegar para o CLI.

## Entradas

- Nome da funcionalidade que identifica `tasks/<nome>/`; ou
- Caminho explícito do diretório de tarefas.

Resolução:

1. Se houver caminho explícito, use-o.
2. Senão, procure `tasks/<nome>/`.
3. Se não existir, pare e reporte o diretório ausente.

## Fluxo

1. Resolva o modo de workspace.
   - Leia `flow.config.yaml` quando existir.
   - Se `workspace.mode` não existir, assuma `single`.
   - Em `multi-project`, carregue `projects`.

2. Carregue tipos permitidos.
   - Se o projeto documentar tipos próprios no contexto local da feature, respeite essa convenção.
   - Caso contrário, use somente: `frontend`, `backend`, `docs`, `test`, `infra`, `refactor`, `chore`, `bugfix`.

3. Liste tarefas.
   - Considere apenas arquivos que casem com `^task_\d+\.md$`.
   - Ignore `_tasks.md`, `_prd.md`, `_techspec.md`, ADRs, reviews, memória e artefatos auxiliares.
   - Para fluxos de criação de tarefas, zero arquivos de tarefa é falha.

4. Valide frontmatter.
   - O arquivo deve começar com YAML frontmatter delimitado por `---`.
   - O frontmatter deve conter `id`, `status`, `title`, `type`, `complexity` e `dependencies`.
   - `dependencies` deve ser lista YAML; use `dependencies: []` quando vazia.
   - Preserve o corpo do arquivo ao corrigir metadados.

5. Valide valores.
   - `status` deve ser `pending`, `in_progress`, `completed` ou `blocked`.
   - `type` deve estar na lista de tipos permitidos.
   - `complexity` deve ser `low`, `medium`, `high` ou `critical`.
   - `title` não pode ser vazio.
   - `id` deve corresponder ao nome do arquivo sem extensão.

6. Valide projeto e contexto operacional.
   - Em single-project, `project`, `repository` e `area` são opcionais.
   - Em multi-project:
     - tarefas executáveis devem ter `project`;
     - `project` deve existir em `flow.config.yaml`;
     - `repository` e `area` são recomendados; se faltarem, corrija quando houver evidência clara, senão reporte.

7. Valide título contra H1.
   - Encontre o primeiro cabeçalho `# ...` no corpo.
   - Remova prefixos do H1 como `Tarefa N:`, `Tarefa N -`, `Task N:` ou `Task N -`.
   - O `title` do frontmatter deve corresponder ao H1 normalizado.
   - Se houver divergência, corrija preferindo o título humano do H1, salvo quando ele for claramente placeholder.

8. Valide dependências.
   - Cada dependência deve referenciar uma tarefa existente pelo id sem extensão, por exemplo `task_02`.
   - Não permita dependência em si mesma.
   - Não permita dependências circulares diretas ou transitivas.
   - Dependências devem apontar para tarefas anteriores quando a numeração representar ordem de execução.
   - Dependências cross-project são permitidas, mas devem continuar coerentes com `_tasks.md`.

9. Valide numeração e lista mestre.
   - Arquivos devem usar zero à esquerda: `task_01.md`, `task_02.md` etc.
   - A sequência deve ser contínua, sem buracos.
   - `_tasks.md`, quando existir, deve listar os mesmos ids, projetos, status, complexidades e dependências dos arquivos individuais.
   - Em single-project, aceite tabela `| # | ... |`.
   - Em multi-project, aceite tabela `| ID | Projeto | ... |`.

10. Corrija e revalide.
   - Corrija problemas estruturais de frontmatter, título, tipo, status, complexidade, dependências e lista mestre.
   - Se uma correção exigir decisão de produto ou arquitetura, pare e pergunte.
   - Releia os arquivos após corrigir e repita a validação do zero.
   - Não conclua até não haver problemas.

## Relatório

Ao final, reporte:

- Diretório validado.
- Quantidade de tarefas lidas.
- Correções feitas, se houver.
- Resultado final: `PASS` ou `FAIL`.

Todo texto gerado por esta skill deve seguir a prioridade: idioma pedido pelo usuário, depois idioma padrão do projeto, depois `pt-BR`, exceto valores técnicos parseáveis.
