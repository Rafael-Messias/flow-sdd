# Template de TechSpec

Use este template para estruturar toda Especificação Técnica. Preencha com base nos esclarecimentos técnicos e na exploração do código. Omita seções sem aplicação e registre o motivo.

## Resumo Executivo

Visão técnica em 1 a 2 parágrafos:

- Decisões arquiteturais principais
- Estratégia de implementação
- Trade-off técnico principal

## Histórico de Revisões

| Versão | Data         | Autor   | Comentário        |
| :----- | :----------- | :------ | :---------------- |
| [1.0]  | [06/04/2026] | [Autor] | [breve descrição] |

## Arquitetura do Sistema

### Visão dos Componentes

Componentes, responsabilidades e relações:

- Nome, propósito e fronteiras
- Fluxo de dados
- Interações com sistemas externos

## Desenho de Implementação

### Interfaces Centrais

Interfaces ou tipos principais com exemplos de até 20 linhas:

- Contratos
- Assinaturas e tipos
- Convenções de erro

### Modelos de Dados

Entidades e relações:

- Campos e tipos
- Tipos de requisição e resposta
- Esquemas ou estruturas de armazenamento

### Endpoints de API

Superfície de API por recurso:

- Método, caminho e descrição
- Formato da requisição e campos obrigatórios
- Resposta e códigos de status

## Pontos de Integração

Sistemas externos e fronteiras:

- Serviço e propósito
- Autenticação/autorização
- Erros, retentativas e timeouts

## Análise de Impacto

| Componente   | Tipo de Impacto              | Descrição e Risco | Ação Necessária |
| ------------ | ---------------------------- | ----------------- | --------------- |
| [componente] | [novo/modificado/depreciado] | [mudança e risco] | [ação]          |

## Coordenação Multi-Project (Opcional)

Use esta seção quando a feature atravessar mais de um projeto, repositório ou serviço.

- Projetos impactados e responsabilidade técnica de cada um
- Dependências cross-project e ordem de implementação
- Contratos que devem existir ou evoluir entre serviços
- Artefatos auxiliares esperados em `tasks/<feature>/`, como `_impact-map.md`, `_contracts.md`, `_release-plan.md` e `_rollback-plan.md`

## Estratégia de Entrega e Ativação (Opcional)

Use esta seção quando a implementação exigir cuidado operacional além de um deploy simples.

- Modo de ativação: release único, feature flag, dark launch, rollout gradual ou migração
- Compatibilidade retroativa e convivência entre versões
- Migrações, backfills ou ordem operacional de ativação
- Kill switch, rollback e critérios de reversão

## Abordagem de Testes

### Testes Unitários

- Estratégia e componentes
- Mocks e fronteiras
- Cenários críticos e bordas

### Testes de Integração

- Componentes testados juntos
- Dados e setup
- Dependências de ambiente

## Sequenciamento de Desenvolvimento

### Ordem de Construção

1. [Primeiro componente]: sem dependências
2. [Segundo componente]: depende do passo 1
3. [Continuar cadeia de dependências]

### Dependências Técnicas

- Infraestrutura necessária
- Serviços externos
- Entregas de outros times ou componentes compartilhados

## Monitoramento e Observabilidade

- Métricas principais
- Eventos de log e campos estruturados
- Alertas e limiares

## Considerações Técnicas

### Decisões Principais

- Decisão: o que foi escolhido
- Justificativa: por que esta opção
- Trade-offs: o que foi sacrificado
- Alternativas rejeitadas

### Riscos Conhecidos

- Risco e probabilidade
- Mitigação
- Áreas que exigem pesquisa ou protótipo

## Registros de Decisão de Arquitetura

ADRs criados no brainstorming de PRD e desenho técnico:

- [ADR-NNN: Título](adrs/adr-NNN.md): resumo em uma linha
