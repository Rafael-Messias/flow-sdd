---
name: flow-doc-workshop
description: Elabora documentos genericos do repositorio por descoberta de contexto, perguntas interativas, outline aprovado e rascunho iterativo. Use para README, runbook, migration guide, onboarding doc, RFC curta ou ADR avulso. Nao use para PRD, TechSpec, tarefas, review ou plano de validacao quando houver skill especializada.
argument-hint: "[document-type] [topic-ou-caminho-alvo]"
---

# Elaborar Documento

Crie ou atualize documentos do repositorio fora do pipeline SDD principal.

<HARD-GATE>
NAO escreva o arquivo final ate entender objetivo, audiencia, escopo e aprovar o outline com o usuario.
NAO use esta skill para substituir `flow-prd`, `flow-techspec`, `flow-tasks`, `flow-review` ou `flow-validation-plan`.
NAO pule a exploracao do repositorio: o documento deve refletir o estado real do projeto.
NAO faca perguntas em lote: use uma pergunta por vez.
</HARD-GATE>

## Perguntas

Quando esta skill mandar perguntar algo ao usuario, use a ferramenta interativa do runtime quando existir. Se ela nao existir, faca a pergunta como a mensagem completa e pare. Nao responda pelo usuario nem prossiga sem entrada explicita.

## Entradas

- Tipo de documento: `readme`, `runbook`, `migration-guide`, `onboarding`, `rfc` ou `adr`.
- Tema, problema ou objetivo do documento.
- Opcional: caminho alvo explicito.
- Opcional: documento existente para modo de atualizacao.
- Opcional: idioma desejado para o documento final.
- Opcional: arquivos, diretorios, comandos, ADRs, PRD, TechSpec ou docs relacionadas.

## Presets Suportados

Leia `references/document-presets.md` e selecione o preset apropriado para o `documentType`.

## Checklist

Crie uma tarefa para cada fase e conclua em ordem:

1. **Determinar tipo, escopo e caminho**: decidir preset, diretorio alvo e modo de criacao ou atualizacao.
2. **Descobrir contexto**: explorar repositorio, docs vizinhas e fontes tecnicas relevantes.
3. **Esclarecer necessidade**: fazer 3 a 6 perguntas sobre audiencia, objetivo, escopo, pre-requisitos e linguagem.
4. **Propor estrutura**: apresentar outline recomendado e alternativas quando houver formatos plausiveis diferentes.
5. **Aprovar outline**: obter confirmacao do usuario antes do rascunho completo.
6. **Rascunhar documento**: gerar o documento completo com base no preset e no contexto coletado.
7. **Revisar com o usuario**: iterar ate aprovacao.
8. **Salvar o arquivo**: gravar no caminho final.

## Fluxo

1. Determine o tipo de documento e o caminho alvo.
   - Se o `documentType` nao vier explicito, tente inferir a partir do caminho, do nome e do objetivo informado.
   - Se ainda houver ambiguidade, pergunte antes de prosseguir.
   - Se houver caminho alvo explicito, use-o.
   - Se nao houver, use o caminho sugerido pelo preset.
   - Se o arquivo ja existir, leia-o e opere em modo de atualizacao.
   - Crie diretorios necessarios apenas depois que o outline estiver aprovado.

2. Descubra contexto antes de perguntar.
   - Leia o preset escolhido em `references/document-presets.md`.
   - Leia docs vizinhas e fontes proximas ao escopo.
   - Explore arquivos, scripts, comandos, configuracoes e exemplos necessarios para o documento.
   - Para `readme`, priorize `README.md`, `package.json`, scripts, comandos e docs publicas do pacote ou modulo.
   - Para `runbook`, priorize comandos operacionais, compose files, scripts, healthchecks, troubleshooting e logs esperados.
   - Para `migration-guide`, priorize docs antigas, guias de migracao, changelogs, comandos e pontos de compatibilidade.
   - Para `onboarding`, priorize README, docs de setup, scripts de desenvolvimento e fluxo diario do repo.
   - Para `rfc`, priorize docs existentes, ADRs, PRD, TechSpec e conflitos ou lacunas de decisao.
   - Para `adr`, priorize ADRs existentes e a convencao ja usada pelo repositorio.
   - Resuma o contexto em 3 a 6 bullets antes das perguntas.

3. Faca perguntas.
   - Pergunte uma coisa por vez.
   - Cubra no minimo:
     - quem vai ler;
     - qual decisao ou acao o documento deve viabilizar;
     - o que fica dentro e fora do escopo;
     - qual nivel de detalhe e esperado;
     - qual lingua usar quando isso nao estiver explicito no pedido do usuario nem no padrao do projeto.
   - Prefira multipla escolha quando as opcoes forem previsiveis e inclua "Outro".
   - Para `runbook` e `migration-guide`, pergunte tambem sobre risco, rollback e validacao.
   - Para `rfc` e `adr`, pergunte tambem sobre alternativas e criterio de decisao.

4. Proponha estrutura.
   - Se houver mais de uma estrutura plausivel, ofereca 2 a 3 abordagens com trade-offs e recomende uma.
   - Se a estrutura for obvia, apresente apenas o outline recomendado.
   - O outline deve respeitar as secoes obrigatorias do preset.
   - Nao escreva o documento completo ainda.

5. Aprovacao do outline.
   - Pergunte pela ferramenta interativa:
     - "Aqui esta o outline do documento. Revise e escolha:"
     - A) Aprovado: gerar rascunho completo
     - B) Ajustar secoes
     - C) Trocar a abordagem
     - D) Reabrir perguntas
   - Se B ou C, ajuste e apresente novamente.
   - Se D, volte para as perguntas.

6. Rascunhe o documento completo.
   - Use a linguagem pedida pelo usuario.
   - Se ele nao definir, siga o idioma padrao do projeto indicado no `Flow Package Overlay`.
   - Se o overlay nao trouxer idioma, siga a linguagem predominante nas docs proximas ao escopo; se ainda houver ambiguidade, use `pt-BR`.
   - Preencha todas as secoes obrigatorias do preset.
   - Nao invente comandos, caminhos ou comportamento do sistema. Quando faltar confirmacao, registre em "Perguntas em Aberto", "Observacoes" ou equivalente.
   - Para `adr`, mantenha compatibilidade com a estrutura de ADR ja usada no repositorio.
   - Para `readme` e `onboarding`, prefira clareza operacional a marketing.
   - Para `runbook` e `migration-guide`, inclua verificacoes e rollback quando aplicavel.
   - Para `rfc`, destaque alternativas, trade-offs e recomendacao.
   - Apresente o rascunho completo ao usuario.

7. Revise com o usuario.
   - Pergunte:
     - "Aqui esta o rascunho do documento. Revise e escolha:"
     - A) Aprovado: salvar como esta
     - B) Ajustar secoes especificas
     - C) Reescrever uma secao
     - D) Descartar e reabrir o outline
   - Se B ou C, ajuste e apresente novamente.
   - Se D, volte ao outline.

8. Salve o arquivo.
   - Crie o diretorio final se necessario.
   - Escreva o documento no caminho aprovado.
   - Confirme o caminho salvo.
   - Se o documento gerar follow-up obvio, indique o proximo passo recomendado.

## Tratamento de Erros

- Se o tipo de documento estiver ambiguo, pergunte antes de continuar.
- Se o caminho sugerido conflitar com convencao real do repo, siga a convencao do repo e explique o ajuste.
- Se faltar contexto para afirmar um passo operacional, registre a lacuna em vez de adivinhar.
- Se o usuario pedir um PRD, TechSpec, tarefas, review ou plano de validacao, redirecione para a skill especializada correta.
- Em modo de atualizacao, preserve secoes fora do escopo pedido.

## Principios

- Uma pergunta por vez.
- Contexto real do repo antes do rascunho.
- Outline antes do documento completo.
- Preset guia a estrutura, nao engessa o conteudo.
- Clareza operacional acima de texto genérico.
- Nao substituir skills especializadas do fluxo SDD.
