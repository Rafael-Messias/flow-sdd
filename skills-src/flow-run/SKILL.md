---
name: flow-run
description: Orquestra a execução completa de um PRD planejado rodando flow-run-task uma vez para cada tarefa pendente em contexto isolado e, ao final, flow-review. Use para executar todas as tarefas de tasks/NOME de ponta a ponta controlando crescimento de contexto. Não use para tarefa única ou revisão isolada.
---

# Executar PRD

Execute todas as tarefas pendentes de um PRD sem deixar o histórico de uma tarefa contaminar a próxima.

## Entradas

- Nome da funcionalidade que identifica `tasks/<nome>/`, ou caminho explícito do diretório do PRD.
- Modo de auto-commit.
- Opcional: diretório de memória do fluxo.
- Opcional: caminho da memória compartilhada.
- Opcional: padrão de caminho da memória da tarefa atual.
- Opcional: escopo de revisão para `flow-review`.

## Regra Central

Rode cada tarefa em um contexto de worker novo e isolado. Não execute tarefas diretamente no contexto do orquestrador e não reutilize worker entre tarefas.

Ao usar Agent/subagent, inicie cada worker sem copiar a conversa atual. Passe só caminhos e instruções necessários. Se o runtime não permitir contexto fresco, pare e explique que a skill não pode garantir isolamento.

Leia `references/context-isolation.md` antes de despachar a primeira tarefa.

## Fluxo

1. Resolva o diretório do PRD.
   - Se o usuário informar nome da funcionalidade, use `tasks/<nome>/`.
   - Verifique o diretório e `_tasks.md`.
   - Identifique `_prd.md`, `_techspec.md` e `adrs/`.

2. Descubra tarefas executáveis.
   - Leia `_tasks.md` e arquivos referenciados.
   - Identifique tarefas não concluídas.
   - Prefira arquivos `task_NN.md` explícitos.
   - Se o status for ambíguo, inspecione o arquivo e a lista mestre; pergunte só se não houver distinção confiável.

3. Monte checklist de orquestração.
   - Liste tarefas pendentes em ordem com id/título, caminho da tarefa, diretório do PRD, `_tasks.md` e modo de auto-commit.
   - Inclua a revisão planejada após todas as tarefas.
   - Mostre o checklist antes de despachar workers.

4. Execute uma tarefa por vez.
   - Inicie um worker isolado para exatamente uma tarefa.
   - Instrua o worker a usar `flow-run-task`.
   - Passe especificação da tarefa, diretório do PRD, arquivo da tarefa, `_tasks.md`, auto-commit e memórias opcionais.
   - Aguarde terminar antes da próxima.
   - Verifique tracking após cada worker e registre resultado: concluída, bloqueada ou falhou.
   - Se uma tarefa falhar ou relatar conflito de requisitos, pare.

5. Reconcilie entre tarefas.
   - Verifique o estado do workspace após cada tarefa.
   - Se auto-commit estiver ligado, confirme commit da tarefa ou justificativa.
   - Se desligado, mantenha o diff acumulado.
   - Não reverta mudanças não relacionadas do usuário.

6. Rode a rodada de revisao.
   - Após todas as tarefas, inicie worker fresco para revisão.
   - Instrua o worker a usar `flow-review`.
   - Passe nome da feature e escopo.
   - Garanta que a revisão não edite código.

7. Ofereca o plano final de validacao quando fizer sentido.
   - Inspecione o resultado da rodada de revisao.
   - Se houver issue aberta com status `pending`, `valid`, `invalid` ou desconhecido, nao ofereca a geracao do plano final ainda.
   - Nesse caso, registre no resumo que o proximo passo continua sendo `flow-fix-review`.
   - Se a rodada de revisao terminar sem issues abertas, pergunte explicitamente ao usuario se ele quer gerar agora o plano final de validacao.
   - Se o usuario aceitar, inicie worker fresco dedicado a `flow-validation-plan`.
   - Passe o diretorio da feature e deixe explicito que o modo de saida e `final`.
   - Se ja existir rascunho preliminar, instrua o worker a reaproveitar esse material, promovendo-o para os artefatos finais quando apropriado.

8. Verificacao final e resumo.
   - Use `flow-verify` antes de afirmar conclusão.
   - Resuma resultados das tarefas, revisao, diretorio de revisao, artefatos de validacao gerados e bloqueios.

## Templates de Prompt para Workers

### Worker de Tarefa

```text
Use flow-run-task para executar uma tarefa de PRD de ponta a ponta.

Especificação markdown da tarefa: <task-file>
Caminho do diretório do PRD: <prd-dir>
Caminho do arquivo da tarefa: <task-file>
Caminho da lista mestre: <prd-dir>/_tasks.md
Modo de auto-commit: <enabled|disabled>
Diretório de memória do fluxo: <opcional>
Memória compartilhada do fluxo: <opcional>
Memória da tarefa atual: <opcional>

Execute somente esta tarefa neste contexto. Não inicie outras tarefas. Pare e reporte conflitos, arquivos ausentes, validação falha ou problemas de tracking.
```

### Worker de Revisão

```text
Use flow-review para realizar uma rodada de revisão da implementação concluída.

Nome da funcionalidade: <nome>
Escopo da revisão: <arquivos ou diretórios opcionais>

Este trabalho é somente revisão. Não edite código fonte.
```

### Worker de Validacao Final

```text
Use flow-validation-plan para gerar o plano final de validacao desta feature.

Nome da funcionalidade: <nome>
Diretorio do PRD: <prd-dir>
Modo de saida: final

Se houver artefatos preliminares como _test_plan.preliminary.md e _validation_scenarios_<tool>.preliminary.md, reaproveite o material valido e gere os artefatos finais canonicos.
```

## Critérios de Conclusão

- Toda tarefa pendente inicial foi concluída ou o loop parou no primeiro bloqueio.
- Cada tarefa rodou em contexto fresco distinto.
- Arquivos de tracking refletem apenas trabalho realmente concluído.
- `flow-review` rodou apos as tarefas ou o motivo de nao rodar esta explicito.
- Quando a revisao terminou sem issues abertas e o usuario pediu o plano final, `flow-validation-plan` rodou em worker fresco distinto.
- A saída final traz evidência suficiente do que mudou e do que resta.
