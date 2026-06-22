# Template de PRD

Use este template para estruturar todo Documento de Requisitos de Produto. Preencha cada seção com base no brainstorming. Quando faltar informação, registre a lacuna em "Perguntas em Aberto".

## Visão Geral

Descreva em alto nível:

- Qual problema resolve
- Para quem é
- Por que gera valor

## Objetivos

Objetivos específicos e mensuráveis:

- Métricas de sucesso e indicadores
- Objetivos de negócio e resultados esperados
- Marcos ou prazos alvo

## Histórico de Revisões

| Versão | Data         | Autor   | Comentário        |
| :----- | :----------- | :------ | :---------------- |
| [1.0]  | [06/04/2026] | [Autor] | [breve descrição] |

## Histórias de Usuário

Histórias organizadas por persona:

- Como [tipo de usuário], quero [ação] para [benefício]
- Personas principais e fluxos principais
- Personas secundárias e casos de borda

## Funcionalidades Principais

Funcionalidades agrupadas por prioridade:

- Nome, comportamento em alto nível e valor
- Requisitos funcionais
- Interações entre funcionalidades

## Sistemas ou Projetos Impactados (Opcional)

Use esta seção quando a entrega atravessar mais de um projeto, repositório ou serviço.

- Projeto ou sistema impactado
- Papel de negócio ou responsabilidade
- Dependências relevantes entre sistemas

## Experiência e Fluxos Impactados

Jornada e fluxos criados, alterados ou afetados por esta entrega:

- Personas e objetivos
- Fluxos principais passo a passo
- Estados, bordas, feedbacks e acessibilidade
- Descoberta da mudança, onboarding específico ou comunicação in-product, quando aplicável

## Restrições Técnicas de Alto Nível

Limites necessários sem prescrever implementação:

- Integrações obrigatórias
- Requisitos legais, regulatórios ou de conformidade
- Metas de desempenho vistas pelo usuário
- Privacidade e segurança de dados

Não inclua bancos específicos, frameworks, desenho de API ou padrões arquiteturais.

## Não Objetivos (Fora de Escopo)

Limites explícitos:

- Funcionalidades adiadas
- Problemas adjacentes não tratados
- Fronteiras deste esforço

## Estratégia de Entrega (Opcional)

Use esta seção apenas quando a entrega exigir ativação controlada, rollout gradual, migração ou dependências operacionais relevantes.

- Tipo de entrega: release único, feature flag, dark launch, rollout gradual, migração ou combinação
- Pré-condições para ativação
- Critérios para ampliar, liberar para todos ou encerrar rollout
- Backout ou fallback de produto, quando aplicável

## Métricas de Sucesso

Medidas quantificáveis:

- Engajamento
- Desempenho percebido pelo usuário
- Impacto de negócio
- Atributos de qualidade

## Riscos e Mitigações

Riscos não técnicos:

- Adoção
- Concorrência
- Prazo e recursos
- Dependências externas

Não inclua dívida técnica ou complexidade arquitetural.

## Registros de Decisão de Arquitetura

ADRs criados durante o brainstorming:

- [ADR-NNN: Título](adrs/adr-NNN.md): resumo em uma linha

## Perguntas em Aberto

Itens pendentes:

- Requisitos incertos
- Casos de borda que exigem stakeholders
- Dependências de decisões futuras
