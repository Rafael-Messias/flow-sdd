---
name: flow-run-task
description: Executa uma tarefa de PRD de ponta a ponta usando arquivo de tarefa, diretório de PRD, tracking e modo de auto-commit. Use quando o prompt trouxer uma especificação de tarefa que deve ser implementada, validada e refletida nos arquivos de tracking.
---

# Executar Tarefa de PRD

Execute uma tarefa de PRD desde exploração até atualização de tracking.

## Entradas

- Markdown de especificação da tarefa.
- Caminho do diretório do PRD.
- Caminho do arquivo da tarefa.
- Caminho da lista mestre `_tasks.md`.
- Modo de auto-commit.
- Opcional: diretório de memória do fluxo.
- Opcional: memória compartilhada.
- Opcional: memória da tarefa atual.

## Fluxo

1. Aterre no repositório e no PRD.
   - Leia a especificação da tarefa.
   - Leia orientações do repositório indicadas pelo chamador.
   - Leia documentos do PRD, especialmente `_techspec.md` e `_tasks.md`.
   - Leia ADRs em `adrs/`.
   - Se houver conflito entre tarefa, TechSpec e ADRs, pare e reporte.
   - Se houver caminhos de memória, use `flow-memory` antes de editar.
   - Reconcilie o estado atual do workspace.

2. Monte checklist de execução.
   - Extraia entregáveis, critérios de aceite e itens de validação/teste para checklist numerado.
   - Mostre o checklist antes da implementação.
   - Capture o sinal pré-mudança que prova que a tarefa ainda não está concluída.
   - Use o checklist como gate.

3. Implemente.
   - Mantenha escopo estrito.
   - Siga padrões do repositório e APIs reais.
   - Registre trabalho fora de escopo como follow-up.

4. Valide e faça auto-revisão.
   - Rode todos os comandos de teste/validação da tarefa.
   - Use `flow-verify` antes de qualquer afirmação de conclusão.
   - Faça auto-revisão e corrija bloqueios.

5. Atualize tracking.
   - Se houver memória, atualize-a primeiro.
   - Use os caminhos de tarefa e lista mestre fornecidos.
   - Marque subtarefas concluídas só com evidência.
   - Mude status para `completed` só após verificação limpa e auto-revisão.
   - Leia `references/tracking-checklist.md`.
   - Sequência: memória -> checkboxes -> status -> lista mestre -> commit se aplicável.

6. Commit.
   - Se auto-commit estiver ligado, crie um commit local após verificação, revisão e tracking.
   - Se desligado, deixe o diff pronto.
   - Nunca faça push automaticamente.

## Tratamento de Erros

- Se o sinal pré-mudança não puder ser reproduzido, registre o melhor baseline disponível.
- Se validação falhar, não altere status até resolver.
- Se tracking faltar, pare e reporte o caminho ausente.
