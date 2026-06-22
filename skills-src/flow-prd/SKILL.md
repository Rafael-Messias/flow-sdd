---
name: flow-prd
description: Cria um Documento de Requisitos de Produto (PRD) por brainstorming interativo com pesquisa paralela no código e na web. Use ao iniciar uma funcionalidade/produto, criar PRD ou amadurecer requisitos. Não use para especificação técnica, decomposição em tarefas ou implementação.
argument-hint: "[nome-ou-ideia-da-funcionalidade] [arquivo-de-ideia]"
---

# Criar PRD

Crie um PRD focado em negócio por meio de brainstorming estruturado.

<HARD-GATE>
NÃO escreva o arquivo do PRD até que todas as etapas estejam completas e o usuário aprove o rascunho final.
NÃO pule a etapa de pesquisa: todo PRD deve ser enriquecido com contexto do código e do mercado.
NÃO pule interações com o usuário: o usuário deve participar dos pontos de decisão.
NÃO exija aprovação seção por seção: gere o rascunho completo e deixe o usuário revisar.
Isto vale para todo PRD, mesmo quando a demanda parecer simples.
</HARD-GATE>

## Perguntas

Quando esta skill mandar perguntar algo ao usuário, use a ferramenta interativa do runtime que apresenta a pergunta e pausa a execução até a resposta. Se ela não existir, faça a pergunta como a mensagem completa e pare. Não responda à própria pergunta nem continue sem entrada do usuário.

## Entradas

- Nome da funcionalidade ou ideia de produto.
- Opcional: arquivo `_idea.md` existente como contexto primário.
- Opcional: arquivo `_prd.md` existente para modo de atualização.
- Opcional: idioma desejado para o artefato final.

## Checklist

Crie uma tarefa para cada etapa e conclua em ordem:

1. **Determinar projeto e diretório**: derivar o slug, criar `tasks/<slug>/` e `adrs/`.
2. **Descobrir contexto**: explorar código e pesquisar mercado em paralelo.
3. **Entender a necessidade**: fazer 3 a 6 perguntas direcionadas sobre escopo e intenção.
4. **Apresentar abordagens de produto**: oferecer 2 a 3 opções com trade-offs e registrar ADR da escolha.
5. **Rascunhar o PRD**: usar o template canônico em `references/prd-template.md`.
6. **Revisar com o usuário**: apresentar o rascunho e iterar até aprovação.
7. **Salvar o arquivo**: escrever em `tasks/<slug>/_prd.md`.

## Fluxo

1. Determine o nome do projeto e o diretório de trabalho.
   - Derive o slug a partir do nome informado pelo usuário.
   - Use `tasks/<slug>/` como diretório alvo.
   - Leia `flow.config.yaml` quando existir para entender se o workspace é `single` ou `multi-project`.
   - Se `_idea.md` existir no diretório alvo, leia como contexto primário.
   - Se `_prd.md` já existir, leia e opere em modo de atualização.
   - Crie o diretório se ele não existir.
   - Crie `tasks/<slug>/adrs/` se não existir.

2. Descubra contexto por pesquisa paralela. Execute os dois trilhos antes de perguntar.
   - **Trilho A: código**: busque arquivos, padrões, modelos e integrações relacionados; resuma em 3 a 5 bullets.
   - **Trilho B: mercado e usuários**: faça 3 a 5 buscas web sobre tendências, concorrentes e expectativas; resuma em 3 a 5 bullets.
   - Apresente um resumo combinado ao usuário antes das perguntas. Se busca web não estiver disponível, declare a limitação e prossiga com o contexto do código.

3. Faça perguntas usando `references/question-protocol.md`.
   - Foque somente em O QUE os usuários precisam, POR QUE isso gera valor e QUEM são os usuários.
   - Pergunte sobre critérios de sucesso e restrições.
   - Em multi-project, pergunte também quais sistemas, serviços ou repositórios são impactados do ponto de vista de negócio.
   - Nunca pergunte sobre bancos, APIs, frameworks, arquitetura, testes ou estratégia de implementação.
   - Faça exatamente uma pergunta por mensagem. Quando houver opções razoáveis, use múltipla escolha com letras e uma opção "Outro".
   - Complete ao menos uma rodada de esclarecimento antes de apresentar abordagens.

4. Apresente abordagens de produto.
   - Ofereça 2 a 3 abordagens com trade-offs.
   - Comece pela recomendada e explique o motivo.
   - Aguarde o usuário escolher.
   - Após a escolha, leia `references/adr-template.md`, determine o próximo número em `tasks/<slug>/adrs/`, preencha a decisão e escreva `tasks/<slug>/adrs/adr-NNN.md`.

5. Rascunhe o PRD.
   - Sintetize a direção aprovada sem pedir aprovação seção por seção.
   - Crie ADR adicional para decisões relevantes de escopo feitas no processo.
   - Leia `references/prd-template.md` e preencha todas as seções.
   - Inclua "Registros de Decisão de Arquitetura" com links para ADRs em `adrs/`.
   - Aplique YAGNI: remova tudo que nao pertence ao menor recorte viavel desta entrega.
   - O PRD deve descrever capacidades do usuário e resultados de negócio.
   - Em multi-project, preencha a seção de sistemas ou projetos impactados quando ela fizer sentido para a entrega.
   - So descreva rollout, fases de liberacao ou estrategia incremental quando isso realmente fizer parte da entrega.
   - Não inclua bancos, APIs, estrutura de código, frameworks, estratégia de testes ou decisões arquiteturais.
   - Escreva todo o conteúdo gerado no idioma explicitamente pedido pelo usuário.
   - Se o usuário não pedir idioma, siga o idioma padrão do projeto indicado no `Flow Package Overlay`.
   - Se o overlay não trouxer idioma, use `pt-BR`.
   - Mantenha tom claro, técnico e consistente.
   - Apresente o rascunho completo ao usuário.

6. Revise com o usuário.
   - Pergunte pela ferramenta interativa:
     - "Aqui está o rascunho do PRD. Revise e escolha:"
     - A) Aprovado: salvar como está
     - B) Ajustar seções específicas
     - C) Reescrever uma seção
     - D) Descartar e recomeçar
   - Se B ou C, ajuste e apresente novamente. Se D, volte às perguntas.

7. Salve o PRD.
   - Escreva em `tasks/<slug>/_prd.md`.
   - Confirme o caminho.
   - Informe que o próximo passo é criar a TechSpec com `flow-techspec`.

## Tratamento de Erros

- Se faltar contexto para uma seção, registre em "Perguntas em Aberto" em vez de adivinhar.
- Se a pesquisa web estiver indisponível, declare a limitação.
- Se o diretório alvo não puder ser criado, pare e informe o erro.
- Em modo de atualização, preserve seções que o usuário não pediu para mudar.

## Princípios

- Uma pergunta por vez.
- Múltipla escolha sempre que opções puderem ser previstas e trazer recomendação sempre que possível.
- YAGNI rigoroso.
- Aprovar abordagem, gerar rascunho completo e depois iterar.
- Foco de negócio; implementação pertence à TechSpec.
- `_idea.md` acelera o contexto quando existir.
- O PRD alimenta `flow-techspec`; foque em O QUE e POR QUE.
- Todo PRD deve seguir o template canônico.
- Todo conteúdo produzido por esta skill deve seguir a prioridade: idioma pedido pelo usuário, depois idioma padrão do projeto, depois `pt-BR`.
