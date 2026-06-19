---
name: flow-techspec
description: Cria uma Especificação Técnica traduzindo requisitos de PRD em desenho de implementação por esclarecimento técnico interativo. Use quando houver PRD e for necessário plano técnico ou ADRs. Não use para criar PRD, decompor tarefas ou implementar código.
argument-hint: "[nome-da-funcionalidade] [arquivo-prd]"
---

# Criar TechSpec

Traduza requisitos de negócio em especificação técnica detalhada.

<HARD-GATE>
NÃO escreva a TechSpec até todas as fases estarem completas e o usuário aprovar o rascunho final.
NÃO pule exploração do código: toda TechSpec deve refletir a arquitetura existente.
NÃO pule interação com o usuário.
NÃO exija aprovação seção por seção: gere o rascunho completo e deixe o usuário revisar.
</HARD-GATE>

## Perguntas

Use a ferramenta interativa de perguntas quando disponível. Se não existir, faça a pergunta como mensagem completa e pare.

## Entradas

- Nome da funcionalidade que identifica `tasks/<nome>/`.
- Opcional: `_prd.md` como entrada primária.
- Opcional: `_techspec.md` para modo de atualização.
- Opcional: idioma desejado para o artefato final.

## Checklist

1. **Coletar contexto**: ler PRD, ADRs e explorar arquitetura do código.
2. **Fazer perguntas técnicas**: 3 a 6 perguntas sobre arquitetura, dados, APIs, testes e operação.
3. **Criar ADRs**: registrar decisões técnicas relevantes.
4. **Rascunhar TechSpec**: usar `references/techspec-template.md`.
5. **Revisar com usuário**: apresentar rascunho e iterar.
6. **Salvar arquivo**: escrever `tasks/<nome>/_techspec.md`.

## Fluxo

1. Colete contexto.
   - Verifique `tasks/<nome>/_prd.md`; se existir, leia como entrada primária.
   - Se não houver PRD, peça descrição do que precisa de especificação técnica.
   - Leia ADRs em `tasks/<nome>/adrs/`.
   - Crie `tasks/<nome>/adrs/` se necessário.
   - Explore o código para padrões arquiteturais, componentes, dependências e stack.
   - Se `_techspec.md` já existir, opere em modo de atualização.

2. Faça perguntas técnicas.
   - Foque em COMO implementar, ONDE componentes vivem e QUAIS tecnologias usar.
   - Cubra arquitetura, fronteiras de componentes, dados, APIs, integração, testes e desempenho.
   - Faça uma pergunta por mensagem.
   - Prefira múltipla escolha e inclua opção "Outro".

3. Crie ADRs para decisões relevantes.
   - Para cada decisão significativa, leia `references/adr-template.md`.
   - Determine o próximo número em `tasks/<nome>/adrs/`.
   - Preencha decisão, alternativas rejeitadas e consequências.
   - Use status "Aceito" e data atual.
   - Escreva `tasks/<nome>/adrs/adr-NNN.md`.

4. Rascunhe a TechSpec.
   - Leia `references/techspec-template.md` e preencha as seções aplicáveis.
   - A seção "Registros de Decisão de Arquitetura" é obrigatória e deve listar todos os ADRs criados.
   - Mesmo funcionalidades simples exigem pelo menos um ADR com a abordagem técnica principal e alternativas rejeitadas.
   - Aplique YAGNI: não proponha pacotes, diretórios ou abstrações sem necessidade.
   - Mapeie todo objetivo e história do PRD para um componente técnico.
   - Referencie seções do PRD sem duplicar contexto de negócio.
   - Inclua exemplos de código só para interfaces centrais, no máximo 20 linhas cada.
   - A seção de Sequenciamento deve ter ordem numerada, com dependências explícitas após o primeiro passo.
   - Escreva todo conteúdo gerado no idioma explicitamente pedido pelo usuário.
   - Se o usuário não pedir idioma, siga o idioma padrão do projeto indicado no `Flow Package Overlay`.
   - Se o overlay não trouxer idioma, use `pt-BR`.
   - Mantenha tom claro e técnico.
   - Apresente o rascunho completo.

5. Revise com o usuário.
   - Pergunte:
     - "Aqui está o rascunho da TechSpec. Revise e escolha:"
     - A) Aprovado: salvar como está
     - B) Ajustar seções específicas
     - C) Reescrever uma seção
     - D) Descartar e recomeçar
   - Se B ou C, ajuste e apresente novamente. Se D, volte às perguntas técnicas.

6. Salve.
   - Escreva em `tasks/<nome>/_techspec.md`.
   - Confirme o caminho.
   - Informe que o próximo passo é criar tarefas com `flow-tasks`.

## Tratamento de Erros

- Se faltar PRD, prossiga com contexto do usuário e registre ausência no resumo.
- Se padrões arquiteturais conflitarem, documente e recomende uma opção.
- Se o usuário rejeitar a proposta, incorpore feedback.
- Se o diretório alvo não existir, crie.
- Em modo de atualização, preserve seções fora do escopo pedido.

## Princípios

- Uma pergunta por vez.
- Múltipla escolha quando possível e trazer recomendação sempre que possível.
- YAGNI rigoroso.
- Rascunho completo, depois revisão.
- Foco técnico; negócio pertence ao PRD.
- Trade-offs são obrigatórios.
- A TechSpec alimenta `flow-tasks`.
- Todo conteúdo produzido deve seguir a prioridade: idioma pedido pelo usuário, depois idioma padrão do projeto, depois `pt-BR`, exceto identificadores técnicos.
