---
name: flow-validation-plan
description: Cria plano de validacao e cenarios de teste versionados, detalhados e passo a passo apos execucao, review e bugfix de uma feature em tasks/NAME/. Use quando a implementacao ja passou por flow-review/flow-fix-review e o usuario precisa preparar homologacao manual, automatizada ou hibrida com ferramentas como ApiDog, Postman, Playwright, Cypress, Swagger, oauthdebugger.com, scripts ou testes Go, incluindo comandos para subir ambiente, variaveis, seeds/massa de teste, configuracao de ferramentas e evidencias. Nao use para implementar codigo, executar PRD, revisar PR ou corrigir issues.
---

# Criar Plano de Validacao

Gere artefatos versionados de validacao para uma feature concluida, cobrindo estrategia de teste, cenarios, massa, ambiente, ferramentas e requisitos de evidencia.

O resultado deve ser operacional: uma pessoa de QA ou dev deve conseguir seguir o documento do zero, subir o ambiente correto, preparar dados, configurar a ferramenta, executar cada cenario e anexar evidencias sem precisar inferir comandos ou passos intermediarios.

## Entradas

Aceite uma destas formas:

- Nome da feature que identifica `tasks/<name>/`.
- Diretorio do PRD: `tasks/<name>/`.
- Opcional: modo de saida `preliminary` ou `final`.
- Opcional: ferramenta de teste, por exemplo `ApiDog`, `Postman`, `Playwright`, `Cypress`, `Swagger`, `oauthdebugger.com`, `go test`, script PowerShell ou `manual`.
- Opcional: modo de teste: `manual`, `automatizado` ou `hibrido`.
- Opcional: ambiente alvo: `local`, `dev`, `homologacao` ou outro ambiente informado.
- Opcional: formato de evidencias: markdown, imagens, export da ferramenta, logs, relatorio HTML, video, JUnit/coverage ou nenhum.
- Opcional: escopo adicional de endpoints, fluxos, arquivos, ADRs ou cenarios obrigatorios.
- Opcional: necessidade de criar seeds, massa via SQL, comandos CLI, fixtures, usuarios de teste, filas, topologias ou configuracoes temporarias.
- Opcional: idioma desejado para os artefatos finais ou preliminares.

## Perguntas

Se a entrada nao informar o suficiente para gerar artefatos acionaveis, pergunte antes de escrever arquivos.

Use a ferramenta interativa do runtime quando existir. Se ela nao existir, faca uma pergunta curta por mensagem e pare.

Pergunte no maximo o necessario:

1. O modo de saida deve ser `preliminary` ou `final`?
2. Qual sera o modo de validacao: `manual`, `automatizado` ou `hibrido`?
3. Quais ferramentas serao usadas?
4. Qual ambiente sera validado?
5. As evidencias precisam ser anexadas? Em quais formatos?
6. Ha cenarios obrigatorios, massas ou riscos que nao aparecem no PRD/TechSpec?
7. A validacao deve incluir comandos para subir ambiente local/dev e preparar seeds?

Se o usuario ja informou esses dados no prompt, nao repita perguntas.

## Fluxo

1. Resolva o diretorio da feature.
   - Se a entrada for nome, use `tasks/<name>/`.
   - Verifique que o diretorio existe.
   - Leia `_prd.md`, `_techspec.md`, `_tasks.md` e ADRs em `adrs/` quando existirem.
   - Leia artefatos de validacao existentes, tanto finais quanto preliminares, como `_validation_scenarios_*.md`, `_validation_scenarios_*.preliminary.md`, `_test_plan.md`, `_test_plan.preliminary.md`, `_validation_evidence_report.md` e `_validation_evidence_report.preliminary.md`, para evitar duplicacao.

2. Verifique prontidao pos-review.
   - Liste `reviews-NNN/`.
   - Leia `_meta.md` e `issue_*.md` das rodadas existentes.
   - Se o modo de saida for `final` e houver issue com `status: pending`, `status: valid`, `status: invalid` ou desconhecido, pare e informe que a validacao final deve aguardar `flow-fix-review`.
   - Se o modo de saida for `final` e `_tasks.md` indicar tarefas pendentes, pare e explique que apenas o rascunho preliminar pode ser gerado antes da conclusao da execucao.
   - Se o modo de saida for `preliminary`, aceite tarefas pendentes e issues abertas, mas registre explicitamente as lacunas e os riscos ainda nao estabilizados.
   - Nao declare a feature aprovada; esta skill so prepara validacao.

3. Descubra o escopo de teste.
   - Extraia requisitos, criterios de aceite, endpoints, eventos, filas, contratos, integracoes, regras de negocio e riscos do PRD/TechSpec/ADRs.
   - Use `_tasks.md` para mapear entregaveis implementados.
   - Explore o codigo apenas o suficiente para confirmar rotas, comandos, testes existentes, nomes de filas, arquivos Swagger ou scripts disponiveis.
   - Leia `README.md`, `docker-compose.yml`, `Makefile`, comandos em `cmd/`, docs de CLI e exemplos existentes para descobrir como subir API, workers, migracoes, seeds, filas, Redis, RabbitMQ, Swagger e testes.
   - Inspecione `.env.example`, documentacao e codigo de configuracao para listar variaveis necessarias, mas nunca leia nem copie valores reais de `.env`.
   - Localize seeds, migrations, factories, fixtures, comandos admin ou SQL seguro que permitam preparar massa de teste.
   - Quando houver Swagger/OpenAPI, use-o como fonte dos contratos HTTP.
   - Quando houver roteiros existentes, preserve formato e nomenclatura compativeis.

4. Defina estrategia.
   - Classifique os testes como manual, automatizado ou hibrido.
   - Relacione ferramentas e responsabilidades por tipo de evidencia.
   - Separe cenarios de smoke, fluxo feliz, negativos obrigatorios, regressao, seguranca, observabilidade e resiliencia quando aplicavel.
   - Inclua pre-requisitos de ambiente, massa de teste, comandos ou configuracoes sem expor segredos.
   - Defina criterios objetivos de aceite e bloqueio.
   - Se o modo de saida for `preliminary`, destaque quais partes ainda dependem da implementacao final, de review limpa ou de confirmacao do ambiente.

5. Detalhe ambiente, comandos e dados.
   - Inclua uma secao "Como subir o ambiente" com comandos copiaveis em PowerShell ou shell conforme o workspace.
   - Inclua verificacoes de prontidao apos subir o ambiente: healthcheck, Swagger, migrate version, filas, logs, containers, workers ou comandos equivalentes.
   - Inclua uma tabela de variaveis obrigatorias e opcionais, com "valor seguro para evidencia" e como confirmar que estao configuradas sem imprimir segredo.
   - Inclua massa/seeds por cenario: usuario, cliente, token fake, registro no banco, mensagem na fila, payload, fixture ou pre-condicao.
   - Quando for seguro e aplicavel, inclua SQL/CLI de preparacao usando placeholders; se nao for seguro automatizar, documente o passo manual e o criterio de verificacao.
   - Para cada ferramenta, inclua configuracao inicial: ambiente, variaveis, headers, auth, colecao, projeto, URL base, timeouts e como exportar evidencias.

6. Gere artefatos.
   - Leia `references/test-plan-template.md` para estruturar o plano de testes.
   - Leia `references/validation-scenarios-template.md` para estruturar os cenarios por ferramenta.
   - Se o usuario pediu documento de evidencias, leia `references/evidence-report-template.md` para estruturar o relatorio de evidencias.
   - Use slug da ferramenta em lowercase e hyphen-case; exemplos: `apidog`, `postman`, `playwright`, `oauthdebugger`, `manual`.
   - Se o modo de saida for `final`, gere `tasks/<name>/_test_plan.md`, `tasks/<name>/_validation_scenarios_<tool-slug>.md` e, quando solicitado, `tasks/<name>/_validation_evidence_report.md`.
   - Se o modo de saida for `preliminary`, gere `tasks/<name>/_test_plan.preliminary.md`, `tasks/<name>/_validation_scenarios_<tool-slug>.preliminary.md` e, quando solicitado, `tasks/<name>/_validation_evidence_report.preliminary.md`.
   - Se o modo for hibrido com ferramentas muito distintas, gere um arquivo de cenarios por ferramenta quando isso aumentar clareza.
   - Se ja existir rascunho preliminar e o modo atual for `final`, reaproveite o conteudo valido em vez de reescrever do zero, mas publique o resultado nos nomes canonicos finais.
   - Se o usuario pediu evidencia em documento, gere tambem o relatorio correspondente como template preenchivel; nao invente resultados observados.
   - Todo conteudo gerado deve seguir a prioridade: idioma pedido pelo usuario, depois idioma padrao do projeto indicado no `Flow Package Overlay`, depois `pt-BR`.
   - Nomes tecnicos, comandos, paths, headers, campos JSON e codigos de erro podem permanecer no formato tecnico original.

7. Proteja segredos e dados sensiveis.
   - Liste campos proibidos em claro para a feature: tokens, senhas, cookies, secrets, authorization codes, bearer, CPF/documento, telefone, e-mail real, URLs com credenciais e payloads sensiveis.
   - Use exemplos seguros como `***`, `<valor-mascarado>` ou variaveis de ferramenta como `{{token}}`.
   - Nunca copie valores reais de `.env`, banco, logs, ferramentas externas ou respostas HTTP.
   - Inclua checklist de sanitizacao antes de anexar evidencias.

8. Valide antes de concluir.
   - Use `flow-verify`.
   - Releia os arquivos criados.
   - Verifique links relativos para `_prd.md`, `_techspec.md`, ADRs e Swagger quando citados.
   - Confira que nenhum campo de "Resultado observado" foi preenchido sem execucao real.
   - Confira que os documentos nao contem segredos aparentes, como `Bearer ` seguido de token, `client_secret` com valor real, senha, cookie ou URL com credenciais.

## Artefatos Esperados

### Modo `final`

- `tasks/<name>/_test_plan.md`: estrategia, escopo, ferramentas, ambiente, massa, evidencias, criterios de aceite e matriz de cobertura.
- `tasks/<name>/_validation_scenarios_<tool>.md`: roteiro executavel por ferramenta, com passos, esperado, observado em branco e evidencias esperadas.
- `tasks/<name>/_validation_evidence_report.md`: somente quando o usuario exigir documento consolidado de evidencias.

### Modo `preliminary`

- `tasks/<name>/_test_plan.preliminary.md`: rascunho preliminar de estrategia, escopo, ferramentas, ambiente e lacunas.
- `tasks/<name>/_validation_scenarios_<tool>.preliminary.md`: rascunho preliminar de roteiros executaveis por ferramenta.
- `tasks/<name>/_validation_evidence_report.preliminary.md`: somente quando o usuario exigir documento consolidado preliminar de evidencias.

## Nivel Minimo de Detalhe

Cada plano e roteiro deve incluir:

- comandos para subir e verificar ambiente quando o ambiente nao for apenas externo;
- variaveis de configuracao necessarias e forma segura de validar presenca;
- preparacao de massa ou seeds para cada fluxo critico;
- setup da ferramenta de teste com variaveis, headers, auth e URL base;
- cenarios de smoke, fluxo feliz, negativos, regressao e observabilidade quando aplicavel;
- passo a passo numerado com uma acao verificavel por passo;
- resultado esperado por passo ou por bloco de passos, nao apenas por cenario;
- evidencia esperada por cenario, incluindo onde coletar logs, prints, exports ou relatorios;
- troubleshooting de falhas comuns quando houver dependencias como banco, Redis, RabbitMQ, OAuth, Swagger, workers ou provedores externos.

## Regras Criticas

- Nao implemente testes, codigo, fixtures ou scripts nesta skill.
- Nao execute homologacao real em ambiente externo; documente o roteiro.
- Nao marque cenario como aprovado sem evidencia real informada pelo usuario.
- Nao gere plano final se ainda houver review issue pendente, tarefas pendentes ou status de review nao resolvido.
- Nao trate artefatos `*.preliminary.md` como substitutos do plano final.
- Nao inclua segredos ou dados pessoais reais em exemplos, comandos, evidencias ou massas.
- Nao substitua PRD/TechSpec; referencie-os e destaque lacunas em "Perguntas em Aberto".

## Tratamento de Erros

- Se `tasks/<name>/` nao existir, pare e reporte o caminho tentado.
- Se PRD e TechSpec faltarem, gere apenas um esqueleto se o usuario confirmar; caso contrario, pare.
- Se a ferramenta escolhida nao for conhecida, trate como ferramenta manual generica e peca ao usuario os campos minimos de request, execucao e evidencia.
- Se houver conflito entre PRD, TechSpec e Swagger, registre a divergencia no plano e nao escolha silenciosamente um comportamento.
- Se ja existir artefato de validacao final, atualize preservando resultados observados e evidencias existentes; nao apague historico de execucao.
- Se ja existir artefato preliminar, atualize-o sem promover silenciosamente para final.
