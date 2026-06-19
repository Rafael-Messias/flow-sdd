---
name: flow-plan
description: Orquestra a etapa interativa de documentacao e planejamento SDD executando flow-prd, flow-techspec e flow-tasks em workers frescos por fase, preservando perguntas e aprovacoes do usuario e controlando crescimento de contexto. Use para transformar uma ideia em PRD, TechSpec e tarefas validadas de ponta a ponta. Nao use para implementar codigo ou revisar PR.
---

# Planejar Feature

Orquestre a fase de documentacao e planejamento SDD sem eliminar os gates interativos dos skills especializados.

## Regra Central

Rode cada fase em um worker/subagente fresco e isolado:

1. `flow-prd`
2. `flow-techspec`
3. `flow-tasks`
4. `flow-validate-tasks`
5. Opcional: `flow-validation-plan` em modo `preliminary`

Nao execute PRD, TechSpec e Tasks diretamente no contexto do orquestrador. Nao reutilize worker entre fases. Reutilize o mesmo worker apenas dentro da fase atual para preservar as perguntas, respostas e aprovacoes daquela fase.

Se o runtime nao permitir contexto fresco por worker, pare antes de iniciar e explique que a skill nao pode garantir controle de janela de contexto.

Leia `references/planning-context-isolation.md` antes de despachar o primeiro worker.

## Entradas

- Nome da funcionalidade, ideia ou caminho de arquivo de ideia.
- Opcional: slug desejado para `tasks/<slug>/`.
- Opcional: `_idea.md`, `_prd.md` ou `_techspec.md` ja existente para modo de atualizacao.

## Fluxo

1. Resolva o diretorio de planejamento.
   - Derive o slug a partir do nome informado quando o usuario nao fornecer um caminho.
   - Use `tasks/<slug>/` como diretorio alvo.
   - Identifique artefatos existentes: `_idea.md`, `_prd.md`, `_techspec.md`, `_tasks.md` e `adrs/`.
   - Crie um checklist de fases com status `pending`.

2. Execute PRD em worker fresco.
   - Inicie um worker sem copiar a conversa do orquestrador.
   - Instrua o worker a usar `flow-prd`.
   - Passe somente nome/ideia, caminho de ideia se houver e diretorio alvo.
   - Quando o worker pedir entrada, repasse a pergunta ao usuario e aguarde resposta.
   - Envie a resposta do usuario ao mesmo worker da fase.
   - Repita ate o worker salvar `tasks/<slug>/_prd.md`.
   - Verifique que `_prd.md` existe antes de encerrar o worker.

3. Execute TechSpec em worker fresco.
   - Feche o worker de PRD.
   - Inicie outro worker sem copiar a conversa do orquestrador.
   - Instrua o worker a usar `flow-techspec`.
   - Passe o diretorio alvo e o caminho de `_prd.md`.
   - Preserve todas as perguntas e aprovacoes tecnicas do worker.
   - Verifique que `tasks/<slug>/_techspec.md` existe antes de encerrar o worker.

4. Execute Tasks em worker fresco.
   - Feche o worker de TechSpec.
   - Inicie outro worker sem copiar a conversa do orquestrador.
   - Instrua o worker a usar `flow-tasks`.
   - Passe o diretorio alvo, `_prd.md` e `_techspec.md`.
   - Preserve a aprovacao explicita da decomposicao.
   - Verifique `_tasks.md` e arquivos `task_NN.md`.

5. Valide tarefas.
   - Use `flow-validate-tasks` no diretorio `tasks/<slug>/`.
   - Se a validacao falhar, corrija somente problemas de metadata/estrutura reportados pela validacao ou retorne ao worker de tasks quando a correcao exigir decisao de decomposicao.
   - Nao conclua ate a validacao reportar `PASS` ou ate registrar bloqueio explicito.

6. Ofereca rascunho preliminar de validacao.
   - Depois que `flow-validate-tasks` reportar `PASS`, pergunte explicitamente ao usuario se ele quer gerar agora um rascunho preliminar do plano de validacao.
   - Se o usuario recusar, siga para o resumo final sem gerar artefatos de validacao.
   - Se o usuario aceitar, inicie um worker fresco dedicado a `flow-validation-plan`.
   - Passe o diretorio alvo e deixe explicito que o modo de saida e `preliminary`.
   - Diga ao worker para gerar artefatos com nomes preliminares, como `_test_plan.preliminary.md` e `_validation_scenarios_<tool>.preliminary.md`.
   - Nao trate esse rascunho como validacao final; o objetivo e antecipar escopo, massa, ferramentas e riscos.
   - Se o worker precisar de perguntas adicionais, preserve a interacao com o usuario no mesmo worker dessa fase.

7. Resuma o resultado.
   - Liste caminhos gerados: `_prd.md`, `_techspec.md`, `_tasks.md`, `task_NN.md` e ADRs.
   - Se houve rascunho preliminar, liste tambem `_test_plan.preliminary.md`, `_validation_scenarios_<tool>.preliminary.md` e artefatos preliminares equivalentes.
   - Informe se cada fase usou contexto fresco.
   - Informe se o rascunho preliminar foi gerado, recusado pelo usuario ou adiado.
   - Informe o proximo passo recomendado: `flow-run`.

## Interacao Com Usuario

- Preserve uma pergunta por vez quando o worker perguntar.
- Nao responda perguntas pelo usuario.
- Nao aprove rascunhos pelo usuario.
- Nao transforme uma escolha do usuario em outra opcao; repasse a resposta de forma fiel ao worker.
- Se o usuario pedir ajuste, envie o ajuste ao worker da fase atual e aguarde novo rascunho/aprovacao.
- A pergunta sobre rascunho preliminar de validacao deve ser objetiva e acontecer somente apos `flow-validate-tasks` concluir com `PASS`.

## Orcamento do Contexto do Orquestrador

Mantenha no contexto pai apenas:

- Slug e diretorio alvo.
- Fase atual.
- Caminhos dos artefatos.
- Status resumido de cada worker.
- Bloqueios e decisoes do usuario em uma frase cada.

Nao cole PRD completo, TechSpec completa, listas longas de tarefas, diffs, logs completos ou arquivos fonte no contexto pai. Quando um rascunho longo precisar de aprovacao, prefira artefato em arquivo e repasse ao usuario o caminho e as opcoes de revisao.

## Templates de Prompt Para Workers

### Worker de PRD

```text
Use flow-prd para criar ou atualizar o PRD desta feature.

Nome/ideia: <nome-ou-ideia>
Caminho de ideia, se houver: <arquivo-ou-vazio>
Diretorio alvo: <tasks/slug>

Modo obrigatorio: estritamente interativo. Quando precisar de pergunta, escolha ou aprovacao do usuario, emita exatamente uma pergunta/opcoes e pare. Nao responda pelo usuario. Nao prossiga sem entrada explicita.

Controle de contexto: nao cole conteudo longo na resposta final ao orquestrador. Use caminhos de arquivos para rascunhos longos quando necessario. O arquivo canonico _prd.md so pode existir apos aprovacao.
```

### Worker de TechSpec

```text
Use flow-techspec para criar ou atualizar a especificacao tecnica desta feature.

Diretorio alvo: <tasks/slug>
PRD: <tasks/slug>/_prd.md

Modo obrigatorio: estritamente interativo. Preserve perguntas tecnicas e aprovacao final. Nao prossiga sem entrada explicita do usuario.

Controle de contexto: retorne perguntas, opcoes e caminhos. Evite colar documentos longos no contexto do orquestrador. O arquivo canonico _techspec.md so pode existir apos aprovacao.
```

### Worker de Tasks

```text
Use flow-tasks para decompor a feature em tarefas executaveis.

Diretorio alvo: <tasks/slug>
PRD: <tasks/slug>/_prd.md
TechSpec: <tasks/slug>/_techspec.md

Modo obrigatorio: estritamente interativo. Apresente a decomposicao para aprovacao e pare. Nao aprove pelo usuario.

Controle de contexto: retorne perguntas, opcoes e caminhos. Evite colar documentos longos no contexto do orquestrador. Gere _tasks.md e task_NN.md somente apos aprovacao.
```

### Worker de Validacao Preliminar

```text
Use flow-validation-plan para gerar um rascunho preliminar do plano de validacao desta feature.

Diretorio alvo: <tasks/slug>
Modo de saida: preliminary

Modo obrigatorio: estritamente interativo. Pergunte somente o minimo necessario para produzir um rascunho acionavel. Se a informacao nao for necessaria agora, registre como pergunta em aberto em vez de bloquear o rascunho.

Controle de contexto: retorne perguntas, opcoes e caminhos. Gere artefatos preliminares com nomes distintos dos finais, como _test_plan.preliminary.md e _validation_scenarios_<tool>.preliminary.md.
```

## Criterios de Conclusao

- `_prd.md`, `_techspec.md`, `_tasks.md` e `task_NN.md` existem ou ha bloqueio documentado.
- As aprovacoes exigidas pelos skills de PRD, TechSpec e Tasks foram obtidas do usuario.
- Cada fase rodou em worker fresco distinto.
- `flow-validate-tasks` reportou `PASS` ou o motivo de falha esta claro.
- Quando o usuario pediu rascunho preliminar, os artefatos preliminares existem ou o bloqueio esta documentado.
- O resumo final contem caminhos e proximo passo.
