---
name: flow-explore
description: Explora dominio, arquitetura, riscos e opcoes antes do fluxo formal. Use quando a ideia ainda estiver nebulosa, quando houver varias abordagens plausiveis ou quando o usuario pedir investigacao sem compromisso de gerar artefatos. Nao use para criar PRD, TechSpec, tarefas ou implementar codigo sem alinhamento explicito.
argument-hint: "[ideia, problema ou nome da feature]"
---

# Explorar

Investigue o problema de forma orientada por decisao, sem formalizar o fluxo por padrao.

## Objetivo

Chegar a uma resposta clara para uma destas perguntas:

- o problema vale virar feature formal?
- quais opcoes tecnicas ou de produto existem?
- quais riscos e desconhecidos precisam ser esclarecidos antes de planejar?
- qual deve ser o proximo passo: parar, `flow-prd`, `flow-techspec` ou `flow-plan`?

## Regras Criticas

- Nao grave artefatos por padrao.
- Nao crie `_prd.md`, `_techspec.md`, `_tasks.md` ou `task_NN.md` durante a exploracao.
- Nao promova silenciosamente para planejamento formal.
- So escreva `_idea.md` ou notas persistentes se o usuario pedir explicitamente.
- Prefira mapear opcoes, riscos e perguntas em aberto a convergir cedo demais.

## Fluxo

1. Entenda o alvo da exploracao.
   - Clarifique o problema, a decisao ou a duvida principal.
   - Identifique restricoes, sinais de sucesso e o que ja foi tentado.

2. Explore o contexto existente.
   - Leia docs, codigo, artefatos de workflow e configuracoes relevantes.
   - Se houver `tasks/<slug>/`, aproveite o contexto sem criar novos artefatos.
   - Use `references/exploration-checklist.md` para garantir cobertura minima.

3. Estruture a analise.
   - Resuma estado atual, lacunas de contexto, riscos e dependencias.
   - Proponha 2 ou 3 caminhos com trade-offs concretos.
   - Diferencie claramente fatos, inferencias e perguntas em aberto.

4. Recomende o proximo passo.
   - Se o problema ainda estiver mal definido, recomende continuar explorando.
   - Se faltar definicao de negocio, recomende `flow-prd`.
   - Se ja houver PRD e a duvida for tecnica, recomende `flow-techspec`.
   - Se a ideia ja estiver madura para o fluxo completo, recomende `flow-plan`.

## Saida Esperada

Ao concluir, entregue:

- objetivo da exploracao;
- estado atual observado;
- opcoes consideradas;
- riscos e perguntas em aberto;
- recomendacao final com proximo passo.

## Tratamento de Erros

- Se o contexto estiver insuficiente, diga exatamente o que falta.
- Se o runtime impedir exploracao minima do repo, reporte a limitacao antes de concluir.
- Se a decisao depender de escolha de produto ou arquitetura nao resolvida, pare e leve a decisao ao usuario.
