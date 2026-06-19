# Presets de Documento

Selecione o preset apropriado para o `documentType` e use-o como guia de estrutura, caminho sugerido e nivel minimo de detalhe.

## `readme`

Objetivo:

- explicar o que o modulo, pacote ou repositorio faz;
- ensinar como instalar, configurar e usar;
- apontar troubleshooting e proximos links.

Caminho sugerido:

- `README.md` no escopo alvo

Secoes minimas:

- visao geral
- instalacao ou setup
- uso
- comandos principais
- configuracao
- troubleshooting ou links

## `runbook`

Objetivo:

- orientar rotina operacional, resposta a incidente ou manutencao critica.

Caminho sugerido:

- `docs/runbooks/<slug>.md`

Secoes minimas:

- objetivo
- quando usar
- pre-requisitos
- procedimento
- verificacao
- rollback ou escalacao

## `migration-guide`

Objetivo:

- orientar mudanca segura entre versoes, convencoes ou estados do sistema.

Caminho sugerido:

- `docs/migrations/<slug>.md`

Secoes minimas:

- contexto
- impacto
- pre-requisitos
- passos de migracao
- validacao
- rollback

## `onboarding`

Objetivo:

- colocar uma pessoa nova em condicao de operar no contexto do repo.

Caminho sugerido:

- `docs/onboarding/<slug>.md`

Secoes minimas:

- audiencia
- pre-requisitos
- setup local
- fluxo diario
- pontos de atencao
- proximos passos

## `rfc`

Objetivo:

- registrar uma proposta curta antes da execucao, com opcoes e trade-offs.

Caminho sugerido:

- `docs/rfcs/YYYY-MM-DD-<slug>.md`

Secoes minimas:

- contexto
- problema
- objetivos e nao objetivos
- opcoes consideradas
- recomendacao
- rollout ou perguntas em aberto

## `adr`

Objetivo:

- registrar uma decisao arquitetural fora do fluxo de TechSpec.

Caminho sugerido:

- `tasks/<name>/adrs/adr-NNN.md` quando o escopo for de feature
- `docs/adrs/adr-NNN.md` quando for decisao mais geral

Secoes minimas:

- status
- contexto
- decisao
- alternativas
- consequencias
- referencias
