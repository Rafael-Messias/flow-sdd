# Isolamento de Contexto

Use esta referência ao orquestrar execução completa de PRD.

## Objetivo

Manter o contexto do orquestrador pequeno e impedir que o histórico de implementação de uma tarefa acumule na próxima.

## Regras

- Trate o orquestrador como agendador, não implementador.
- Inicie um contexto fresco por tarefa.
- Não faça fork ou clone da conversa do orquestrador quando a ferramenta permitir evitar isso.
- Passe caminhos em vez de conteúdos, salvo quando o worker não puder acessar o filesystem.
- Passe só arquivo da tarefa, diretório do PRD, lista mestre, auto-commit e memórias opcionais.
- Aguarde um worker terminar antes do próximo.
- Inicie worker separado para `flow-review`.
- Se contextos frescos não estiverem disponíveis, pare antes da implementação.

## Orçamento de Contexto do Pai

Mantenha apenas:
- Nome da funcionalidade e diretório do PRD.
- Lista de tarefas pendentes.
- Número da tarefa atual.
- Status de workers concluídos ou falhos.
- Resultado da revisão.

Não cole logs completos, diffs grandes, PRDs ou arquivos fonte no contexto pai. Resuma em uma ou duas frases por tarefa.

## Falhas

Pare quando um worker relatar:
- Requisitos conflitantes.
- Arquivos de tarefa ou tracking ausentes.
- Validação falha sem solução.
- Tracking que não pode ser aplicado com segurança.
- Estado do workspace que exigiria reverter mudanças não relacionadas.

Reporte a tarefa, o motivo e a próxima ação manual.
