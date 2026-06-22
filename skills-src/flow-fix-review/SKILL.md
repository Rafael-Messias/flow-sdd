---
name: flow-fix-review
description: Executa remediacao de revisao de PR usando arquivos de rodada existentes em tasks/NAME/reviews-NNN/, sem depender de CLI externo. Use para resolver issues de review a partir de nome da feature, diretorio do PRD ou diretorio reviews-NNN, atualizar markdowns, implementar correcoes e verificar resultado. Nao use para executar tarefas de PRD, buscar revisoes ou trabalho generico sem arquivos de issue.
---

# Corrigir Reviews

Execute o fluxo de remediacao em sequencia rigida. Os arquivos de revisao ja existem e definem o escopo. A skill deve resolver contexto sozinha e nao deve depender de CLI externo.

## Entradas

Aceite uma destas formas:

- Nome da feature: `sprint-c-backend-admin-branding-governanca`.
- Diretorio do PRD: `tasks/<name>/`.
- Diretorio da rodada: `tasks/<name>/reviews-NNN/`.
- Arquivos de issue explicitos: `tasks/<name>/reviews-NNN/issue_001.md ...`.

Entradas opcionais:

- Modo de auto-commit: `enabled` ou `disabled`. Padrao: `disabled`.
- Escopo adicional de arquivos. Use apenas para complementar os `file:` das issues.
- Comando de verificacao preferido. Se ausente, derive do repo e dos arquivos alterados.

## Fluxo

1. Resolva o contexto da rodada.
   - Se a entrada for nome, use `tasks/<name>/`.
   - Se a entrada for diretorio de PRD, use esse diretorio.
   - Se a entrada for `reviews-NNN/`, derive o PRD do diretorio pai.
   - Verifique que o diretorio do PRD existe.
   - Leia `_prd.md`, `_techspec.md`, `_tasks.md` e `adrs/` quando existirem.
   - Liste rodadas `reviews-NNN/` existentes.
   - Se a rodada foi informada, use-a.
   - Se a rodada nao foi informada, escolha a rodada mais recente que tenha `issue_*.md` com `status: pending` ou `status: valid`.
   - Se houver mais de uma rodada candidata e a escolha nao for confiavel, pare e peca a rodada.

2. Colete arquivos de issue e metadados.
   - Leia `_meta.md` da rodada escolhida.
   - Se arquivos de issue foram informados explicitamente, restrinja o lote a eles.
   - Caso contrario, use apenas `issue_*.md` com `status: pending` ou `status: valid`.
   - Nao modifique issues `resolved`.
   - Se nao houver issues pendentes ou validas, reporte que nao ha lote para corrigir e pare.
   - Leia cada issue por completo antes de editar codigo.

3. Derive o escopo de codigo.
   - Use o campo `file:` do frontmatter de cada issue como escopo primario.
   - Inclua testes correspondentes quando comportamento mudar ou regressao for possivel.
   - Inclua arquivos de wiring/config/documentacao apenas quando forem necessarios para resolver uma issue.
   - Se precisar tocar arquivo fora do escopo primario, faca a menor mudanca e registre o motivo em `## Triage`.
   - Nao use `<batch_scope>`; se existir algum arquivo de escopo complementar, trate-o apenas como informacao auxiliar.

4. Leia e faca triagem das issues.
   - Atualize `status` de `pending` para `valid` ou `invalid`.
   - Em `## Triage`, registre motivo tecnico, causa raiz se valida e plano de correcao.
   - Se a issue for invalida, explique por que o comportamento atual e correto ou por que a premissa da revisao nao se aplica.
   - Nao marque `resolved` ainda para issue valida.

5. Corrija issues validas.
   - Ordem: critical, high, medium, low.
   - Implemente correcoes de producao para toda issue `valid` no escopo.
   - Adicione ou atualize testes quando comportamento mudar ou regressao for possivel.
   - Nao refatore nem melhore codigo nao relacionado.
   - Nao reverta mudancas de usuario ou de outras tarefas.

6. Verifique antes de fechar issues.
   - Use `flow-verify`.
   - Rode comandos reais do repositorio; nao pare em checagens parciais.
   - Prefira o comando de verificacao informado pelo usuario.
   - Se nao houver comando informado, derive um comando adequado:
     - Para Go, use no minimo `go test -count=1` nos pacotes afetados.
     - Para mudancas amplas ou shared code, use `go test -count=1 ./...` quando viavel.
     - Rode formatacao/lint apenas quando a ferramenta existir no ambiente.
   - Se falhar, corrija a causa nos arquivos alterados.
   - Se for falha pre-existente nao relacionada, documente em `## Triage` e reporte claramente.

7. Feche issues corretamente.
   - Para issue valida, use `status: resolved` so apos codigo e verificacao passarem ou apos documentar falha externa nao relacionada.
   - Para issue invalida, documente o motivo tecnico e entao marque `status: resolved`.
   - Atualize `## Triage` com decisao, notas, arquivos alterados e comando de verificacao executado.
   - Todo texto escrito nas issues deve seguir a prioridade: idioma pedido pelo usuario, depois idioma padrao do projeto, depois `pt-BR`, exceto campos tecnicos parseaveis.

8. Atualize `_meta.md`.
   - Recalcule `Total`, `Resolvidas` e `Nao resolvidas` a partir dos `issue_*.md` da rodada.
   - Preserve `provider`, `pr`, `round` e `created_at`.
   - Mantenha YAML parseavel.

9. Commit ou diff.
   - Padrao: nao criar commit.
   - So faca commit se o usuario pedir explicitamente ou se a entrada trouxer auto-commit `enabled`.
   - Se todas as issues forem invalidas e nenhum codigo mudou, nao crie commit vazio.
   - Deixe o diff para revisao manual quando auto-commit estiver `disabled`.

10. Resuma resultado.
   - Informe rodada, issues resolvidas, issues invalidas, arquivos principais alterados e verificacao.
   - Se ainda houver issues nao resolvidas, diga quais e por que ficaram abertas.

## Regras Criticas

- Nao chame `gh`, scripts de provider ou exportadores de revisao neste fluxo.
- Nao busque nem exporte revisoes.
- Nao modifique issues fora do lote selecionado.
- Nao marque `resolved` antes de triagem, correcao quando aplicavel e verificacao.
- Nao dependa de `<batch_scope>` para funcionar.
- Nao assuma auto-commit ligado; o padrao e `disabled`.
- Todo texto escrito nas issues deve seguir a prioridade: idioma pedido pelo usuario, depois idioma padrao do projeto, depois `pt-BR`, exceto campos tecnicos parseaveis.

## Tratamento de Erros

- Se o diretorio do PRD nao existir, pare e reporte o caminho tentado.
- Se `_meta.md` faltar, continue apenas se a rodada tiver `issue_*.md`; crie ou repare `_meta.md` ao final com contagens corretas.
- Se uma issue tiver frontmatter invalido, pare antes de editar codigo e reporte o arquivo.
- Se a verificacao nao puder rodar por ferramenta ausente, rode o melhor comando substituto, documente a limitacao e nao declare cobertura que nao foi executada.
