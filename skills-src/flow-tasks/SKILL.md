---
name: flow-tasks
description: Decompõe PRDs e TechSpecs em arquivos de tarefa detalhados, independentes e enriquecidos por exploração do código. Use quando houver PRD ou TechSpec e for necessário gerar tarefas executáveis. Não use para criar PRD, criar TechSpec ou implementar código.
argument-hint: "[nome-da-funcionalidade] [arquivo-prd]"
---

# Criar Tarefas

Decomponha requisitos em tarefas acionáveis e informadas pelo código.

## Entradas

- Nome da funcionalidade que identifica `tasks/<nome>/`.
- Pelo menos `_prd.md` ou `_techspec.md` nesse diretório.

## Fluxo

1. Defina os tipos de tarefa.
   - Use somente os tipos default permitidos: `frontend`, `backend`, `docs`, `test`, `infra`, `refactor`, `chore`, `bugfix`.

2. Carregue contexto.
   - Leia `_prd.md` e `_techspec.md` de `tasks/<nome>/`.
   - Leia ADRs em `tasks/<nome>/adrs/`.
   - Se `_techspec.md` estiver ausente, avise que as tarefas serão mais altas, derive tarefas do PRD e explicite lacunas de implementação em vez de inventar detalhes.
   - Se ambos estiverem ausentes, pare e peça que o usuário crie pelo menos um.
   - Explore o código para arquivos a criar/alterar, padrões de teste e convenções.

3. Quebre em tarefas.
   - Decomponha a TechSpec em tarefas granulares e independentes.
   - Cada tarefa deve ser implementável quando suas dependências declaradas estiverem concluídas.
   - Não permita dependências circulares.
   - Cada tarefa precisa de título, tipo default, complexidade e dependências.
   - Complexidade:
     - `low`: alteração em um arquivo, sem novas interfaces, lógica simples.
     - `medium`: 2 a 4 arquivos, interface/struct nova ou integração limitada.
     - `high`: 5+ arquivos, subsistema novo, refatoração relevante ou concorrência.
     - `critical`: mudança transversal, alto risco e coordenação ampla.
   - Inclua referência a ADRs relacionados.
   - Embuta requisitos de teste em toda tarefa; não crie tarefas só para testes.
   - Use `references/task-template.md` e `references/task-context-schema.md`.

4. Apresente a decomposição para aprovação.
   - Mostre título, descrição, complexidade e dependências.
   - Aguarde feedback.
   - Revise até aprovação explícita.

5. Gere arquivos.
   - Escreva `_tasks.md` com esta tabela:
     ```markdown
     # [Nome da Feature] - Lista de Tarefas

     ## Tarefas

     | # | Título | Status | Complexidade | Dependências |
     |---|--------|--------|---------------|--------------|
     | 01 | [Título] | pending | [low/medium/high/critical] | [task_NN, ... ou -] |
     ```
   - Escreva `task_01.md`, `task_02.md` etc.
   - Cada arquivo começa com YAML frontmatter contendo `status`, `title`, `type`, `complexity` e `dependencies`.
   - Use `dependencies: []` quando não houver dependências.
   - Numeração deve ser sequencial e consistente.

6. Enriqueça cada tarefa.
   - Se `## Visão Geral`, `## Entregáveis` e `## Testes` já existirem, pule o arquivo.
   - Mapeie requisitos do PRD e orientação da TechSpec.
   - Explore arquivos relevantes, dependentes, pontos de integração e regras do projeto.
   - Preencha todas as seções do template. Omitir seção obrigatória é falha.
   - Reavalie complexidade após exploração e atualize se necessário.
   - Se uma tarefa falhar no enriquecimento, continue e reporte tudo ao final.

7. Valide.
   - Use a skill `flow-validate-tasks` para validar `tasks/<nome>/`.
   - Se a validação falhar, corrija os problemas reportados e invoque `flow-validate-tasks` novamente.
   - Não conclua até a skill reportar `PASS`.

## Anti-Padrões

- Mega-tarefas: mais de 7 arquivos ou 7 subtarefas exige divisão.
- Duplicar TechSpec: referencie seções em vez de copiar interfaces ou diagramas.
- Testes vagos: cada caso deve citar entrada, condição ou comportamento verificável.

## Tratamento de Erros

- Se `_prd.md` e `_techspec.md` faltarem, pare.
- Se o usuário rejeitar a decomposição, incorpore o feedback.
- Se a exploração revelar fronteiras incompatíveis com a TechSpec, peça decisão.
- Se o diretório alvo não existir, crie.
- Se uma tarefa já estiver totalmente enriquecida, pule.

Todo texto gerado por esta skill deve seguir a prioridade: idioma pedido pelo usuário, depois idioma padrão do projeto, depois `pt-BR`, exceto valores técnicos parseáveis.
