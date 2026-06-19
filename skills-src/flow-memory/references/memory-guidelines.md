# Diretrizes de Memória de Fluxo

Use estas regras para manter a memória útil entre execuções de tarefas de PRD.

## Papéis dos Arquivos

### Memória compartilhada: `MEMORY.md`

Use para contexto que deve sobreviver a várias tarefas e execuções.

Mantenha:
- estado atual que afeta mais de uma tarefa
- decisões técnicas ou de produto duráveis
- aprendizados reutilizáveis
- riscos abertos ou notas de handoff

Evite:
- notas passo a passo
- grandes trechos de código
- fatos já explícitos em `_prd.md`, `_techspec.md`, `_tasks.md` ou no repo

### Memória da tarefa: `memory/<arquivo da tarefa>`

Use para contexto específico da tarefa atual.

Mantenha:
- snapshot do objetivo
- decisões locais importantes
- aprendizados e correções locais
- arquivos/superfícies tocados
- notas prontas para próxima execução

Evite:
- resumos transversais que pertencem a `MEMORY.md`
- repetição da especificação
- transcrições de comando com baixo sinal

## Promoção

Promova para memória compartilhada somente quando for:
- durável entre execuções
- útil a outra tarefa
- provável de evitar erro ou redescoberta

Deixe na memória da tarefa quando for operacional, temporário ou detalhado demais.

## Compactação

- preserve estado, decisões, aprendizados, riscos e handoffs
- remova repetição, notas antigas, transcrições e fatos deriváveis
- reescreva para clareza, não completude
- prefira bullets factuais curtos

## Seções Padrão

### `MEMORY.md`

- `## Estado Atual`
- `## Decisões Compartilhadas`
- `## Aprendizados Compartilhados`
- `## Riscos Abertos`
- `## Handoffs`

### `memory/<arquivo da tarefa>`

- `## Snapshot do Objetivo`
- `## Decisões Importantes`
- `## Aprendizados`
- `## Arquivos / Superfícies`
- `## Erros / Correções`
- `## Pronto para Próxima Execução`
