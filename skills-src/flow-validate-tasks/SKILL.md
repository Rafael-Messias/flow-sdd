---
name: flow-validate-tasks
description: Valida metadados de arquivos de tarefa diretamente, sem delegar para o CLI. Use quando uma skill `flow-*` precisar checar ou corrigir `task_*.md` antes da execucao, especialmente apos `flow-tasks` gerar ou enriquecer tarefas.
---

# Validar Tarefas

Valide arquivos `task_*.md` diretamente pelo conteudo, sem delegar para o CLI.

## Entradas

- Nome da funcionalidade que identifica `tasks/<nome>/`; ou
- Caminho explicito do diretorio de tarefas.

Resolucao:

1. Se houver caminho explicito, use-o.
2. Senao, procure `tasks/<nome>/`.
3. Se nao existir, pare e reporte o diretorio ausente.

## Fluxo

1. Carregue tipos permitidos.
   - Se o projeto documentar tipos proprios no contexto local da feature, respeite essa convencao.
   - Caso contrario, use somente: `frontend`, `backend`, `docs`, `test`, `infra`, `refactor`, `chore`, `bugfix`.

2. Liste tarefas.
   - Considere apenas arquivos que casem com `^task_\d+\.md$`.
   - Ignore `_tasks.md`, `_prd.md`, `_techspec.md`, ADRs, reviews e memoria.
   - Para fluxos de criacao de tarefas, zero arquivos de tarefa e falha.

3. Valide frontmatter.
   - O arquivo deve comecar com YAML frontmatter delimitado por `---`.
   - O frontmatter deve conter `status`, `title`, `type`, `complexity` e `dependencies`.
   - `dependencies` deve ser lista YAML; use `dependencies: []` quando vazia.
   - Preserve o corpo do arquivo ao corrigir metadados.

4. Valide valores.
   - `status` deve ser `pending`, `in_progress`, `completed` ou `blocked`.
   - `type` deve estar na lista de tipos permitidos.
   - `complexity` deve ser `low`, `medium`, `high` ou `critical`.
   - `title` nao pode ser vazio.

5. Valide titulo contra H1.
   - Encontre o primeiro cabecalho `# ...` no corpo.
   - Remova prefixos do H1 como `Tarefa N:`, `Tarefa N -`, `Task N:` ou `Task N -`.
   - O `title` do frontmatter deve corresponder ao H1 normalizado.
   - Se houver divergencia, corrija preferindo o titulo humano do H1, salvo quando ele for claramente placeholder.

6. Valide dependencias.
   - Cada dependencia deve referenciar uma tarefa existente pelo id sem extensao, por exemplo `task_02`.
   - Nao permita dependencia em si mesma.
   - Nao permita dependencias circulares diretas ou transitivas.
   - Dependencias devem apontar para tarefas anteriores quando a numeracao representar ordem de execucao.

7. Valide numeracao.
   - Arquivos devem usar zero a esquerda: `task_01.md`, `task_02.md`, etc.
   - A sequencia deve ser continua, sem buracos.
   - `_tasks.md`, quando existir, deve listar os mesmos ids, status, complexidades e dependencias dos arquivos individuais.

8. Corrija e revalide.
   - Corrija problemas estruturais de frontmatter, titulo, tipo, status, complexidade, dependencias e lista mestre.
   - Se uma correcao exigir decisao de produto ou arquitetura, pare e pergunte.
   - Releia os arquivos apos corrigir e repita a validacao do zero.
   - Nao conclua ate nao haver problemas.

## Relatorio

Ao final, reporte:

- Diretorio validado.
- Quantidade de tarefas lidas.
- Correcoes feitas, se houver.
- Resultado final: `PASS` ou `FAIL`.

Todo texto gerado por esta skill deve seguir a prioridade: idioma pedido pelo usuario, depois idioma padrao do projeto, depois `pt-BR`, exceto valores tecnicos parseaveis.
