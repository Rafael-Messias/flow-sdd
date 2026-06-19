# Isolamento de Contexto Para Planejamento

Use esta referencia ao orquestrar PRD, TechSpec e Tasks em uma unica experiencia interativa.

## Objetivo

Manter o orquestrador pequeno enquanto cada fase especializada preserva sua propria memoria local de perguntas, respostas, rascunhos e aprovacoes.

## Regras

- Trate o orquestrador como agendador, nao autor dos documentos.
- Inicie um worker fresco por fase: PRD, TechSpec e Tasks.
- Nao faca fork da conversa do orquestrador quando a ferramenta permitir contexto vazio.
- Reutilize o mesmo worker apenas ate a fase atual terminar.
- Passe caminhos e nomes, nao conteudos longos.
- Aguarde uma fase terminar antes de iniciar a proxima.
- Feche o worker concluido antes de iniciar o proximo.
- Se nao houver worker fresco, pare e recomende rodar `flow-prd`, `flow-techspec` e `flow-tasks` manualmente.

## Orçamento do Pai

Mantenha apenas:

- Nome da feature e slug.
- Diretorio `tasks/<slug>/`.
- Fase atual.
- Caminhos dos artefatos canonicos.
- Status curto por fase.
- Decisoes do usuario em formato resumido.

Evite carregar:

- PRD completo.
- TechSpec completa.
- Conteudo completo de task files.
- Logs, diffs ou pesquisa longa.
- Conteudo de codigo fonte descoberto pelos workers.

## Aprovacoes Longas

Quando um rascunho for grande:

1. O worker deve preferir gravar um rascunho temporario fora do arquivo canonico.
2. O orquestrador deve informar o caminho ao usuario e apresentar as opcoes de aprovacao.
3. O arquivo canonico (`_prd.md`, `_techspec.md`, `_tasks.md`) so deve ser escrito apos aprovacao explicita.
4. A resposta do usuario deve ser enviada ao mesmo worker da fase.

Se o runtime nao permitir revisao por arquivo temporario, repasse o rascunho completo ao usuario e compacte imediatamente no resumo do orquestrador: caminho, decisao e status.

## Falhas

Pare quando um worker relatar:

- Falta de entrada obrigatoria.
- Conflito entre PRD, TechSpec ou decisao do usuario.
- Impossibilidade de salvar artefato canonico.
- Validacao de tasks falhando sem correcao segura.
- Necessidade de editar codigo fonte durante planejamento.

Reporte a fase, o motivo e a proxima acao manual.
