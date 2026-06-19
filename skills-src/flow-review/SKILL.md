---
name: flow-review
description: Realiza revisão estruturada de uma implementação de PRD e gera diretório de rodada com arquivos de issue compatíveis com flow-fix-review. Use para revisar tarefas implementadas, criar rodada manual ou auditar qualidade. Não use para buscar reviews, corrigir issues ou editar código.
---

# Rodada de Review

Revise uma implementação de PRD e produza um diretório de rodada que `flow-fix-review` consiga processar.

## Entradas

- Nome da funcionalidade que identifica `tasks/<nome>/`.
- Opcional: arquivos ou diretórios específicos para limitar a revisão.
- Opcional: idioma desejado para resumo e issues geradas.

## Fluxo

1. Determine o diretório da rodada.
   - Derive o diretório do PRD: `tasks/<nome>/`.
   - Verifique que ele existe.
   - Liste `reviews-NNN/` existentes para determinar o próximo número.
   - Leia issues de rodadas anteriores para não duplicar problemas já rastreados.
   - Determine `tasks/<nome>/reviews-NNN/` com zero à esquerda. Não crie ainda; espere confirmar issues.

2. Identifique o escopo.
   - Leia `_prd.md`, `_techspec.md` e `_tasks.md` para entender intenção.
   - Leia ADRs em `tasks/<nome>/adrs/`.
   - Se PRD e TechSpec faltarem, avise que a revisão terá apenas contexto de qualidade de código.
   - Se o usuário forneceu escopo, use-o.
   - Se não houver escopo, rode `git diff main...HEAD --name-only`; se vazio, peça arquivos.
   - Explore arquivos, imports e dependências.

3. Faça a revisão.
   - Leia `references/review-criteria.md`.
   - Se o escopo tiver mais de 15 arquivos, priorize arquivos centrais antes de leituras profundas.
   - Leia cada arquivo priorizado por completo antes de concluir.
   - Valide requisitos do PRD/TechSpec quando disponíveis.
   - Avalie: segurança, correção, concorrência, performance, erros, qualidade, testes, arquitetura e operação.
   - Registre issues por severidade: critical, high, medium, low.
   - Para cada issue: caminho relativo, linha aproximada, severidade, título até 72 caracteres e comentário acionável.
   - Deduplicate padrões repetidos.
   - Verifique intenção antes de abrir issue.
   - Rode `make lint` primeiro para evitar issues que linter já captura; se falhar por ferramenta/build, registre e continue.
   - Foque em sinal: poucas issues boas valem mais que muitas marginais.
   - Se não houver issues, reporte revisão limpa e não crie diretório.

4. Gere arquivos de issue.
   - Crie o diretório da rodada.
   - Leia `references/issue-template.md`.
   - Crie `issue_NNN.md` para cada issue.
   - Use exatamente:
     ```markdown
     ---
     status: pending
     file: caminho/para/arquivo.go
     line: 42
     severity: high
     author: claude-code
     provider_ref:
     ---

     # Issue NNN: <título>

     ## Comentário de Revisão

     <corpo detalhado>

     ## Triage

     - Decisão: `UNREVIEWED`
     - Notas:
     ```
   - `author` deve ser `claude-code`.
   - `provider_ref` fica vazio.
   - `severity` deve ser `critical`, `high`, `medium` ou `low`.
   - O corpo textual das issues deve seguir a prioridade: idioma pedido pelo usuario, depois idioma padrao do projeto, depois `pt-BR`.

5. Gere `_meta.md`.
   - Escreva:
     ```markdown
     ---
     provider: manual
     pr:
     round: <N>
     created_at: <UTC RFC3339>
     ---

     ## Resumo
     - Total: <número>
     - Resolvidas: 0
     - Não resolvidas: <mesmo Total>
     ```
   - Campos YAML devem permanecer parseáveis.
   - Contagens devem bater com arquivos criados.

6. Apresente resumo.
   - Recomendação de merge:
     - critical/high: "Precisa de correções antes do merge".
     - só medium/low: "Pode fazer merge com follow-ups".
     - nenhuma: "Limpo: pronto para merge".
   - Totais por severidade.
   - Caminho da rodada.
   - Lista de arquivos gerados.
   - Aspectos bem implementados.
   - Sugira `flow-fix-review <name>` para processar a rodada.

7. Verifique antes de concluir.
   - Use `flow-verify`.
   - Releia issue files e verifique frontmatter.
   - Verifique `_meta.md` e contagens.
   - Confirme padrão `reviews-NNN`.

## Regras Críticas

- Não corrija as issues; esta skill só identifica e documenta.
- Não crie issues para problemas que linters/formatters pegam.
- Frontmatter das issues deve ser parseável por `prompt.ParseReviewContext()`.
- `_meta.md` deve ser parseável por `reviews.ReadRoundMeta()`.
- Não crie rodada vazia.
- Não modifique código.
- Não chame scripts de provider nem `gh`.
- O texto livre de issues e resumo deve seguir a prioridade: idioma pedido pelo usuario, depois idioma padrao do projeto, depois `pt-BR`.

## Tratamento de Erros

- Se o diretório do PRD não existir, pare.
- Se não houver arquivos para revisar, peça escopo.
- Se faltarem PRD e TechSpec, avise e continue com revisão de qualidade.
- Se criar diretório ou escrever issue falhar, pare e reporte.
