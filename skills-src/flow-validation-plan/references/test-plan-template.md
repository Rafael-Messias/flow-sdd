# Template de Plano de Testes

Use este template para `tasks/<name>/_test_plan.md` ou `tasks/<name>/_test_plan.preliminary.md`. Ajuste secoes ao contexto, mas nao remova ambiente, comandos, variaveis, massa/seeds, cuidados com segredos, criterios de aceite ou matriz de cobertura.

```markdown
# Plano de Testes - <Nome da Feature>

Este plano define a validacao <manual|automatizada|hibrida> da feature `<slug>`.

Modo do documento: <final|preliminary>

Se o modo for `preliminary`, registrar explicitamente as lacunas que ainda dependem da implementacao final, da estabilizacao da review ou da confirmacao do ambiente.

## Referencias

- PRD: [`_prd.md`](_prd.md)
- TechSpec: [`_techspec.md`](_techspec.md)
- Tasks: [`_tasks.md`](_tasks.md)
- ADRs: <links relevantes>
- Swagger/OpenAPI: <link quando aplicavel>

## Status de Prontidao

| Item | Status | Evidencia |
| --- | --- | --- |
| Tarefas concluidas |  |  |
| Reviews resolvidos |  |  |
| Ambiente sobe com comandos documentados |  |  |
| Migracoes aplicadas ou versao confirmada |  |  |
| Massa de teste preparada |  |  |
| Ferramenta configurada |  |  |
| Evidencias definidas |  |  |

## Escopo Validado

- <fluxo, endpoint, worker, contrato, integracao ou regra>

## Fora de Escopo

- <itens explicitamente nao validados neste ciclo>

## Modo e Ferramentas

| Tipo | Ferramenta | Uso | Evidencia |
| --- | --- | --- | --- |
| Manual |  |  |  |
| Automatizado |  |  |  |

## Como Subir o Ambiente

Descrever o caminho recomendado para a validacao. Preferir comandos reais do repo, por exemplo `go run`, `docker compose`, `make`, CLI do projeto ou scripts existentes. Nao inventar comandos: se nao houver certeza, marcar como pergunta em aberto.

### Pre-requisitos Locais

- <Go/Docker/Node/ferramenta/banco/Redis/RabbitMQ/acesso externo>

### Variaveis de Ambiente

Nao imprimir valores reais. Confirmar presenca por nome e usar placeholders seguros.

| Variavel | Valor seguro para evidencia | Observacao |
| --- | --- | --- |
| `baseUrl` | `https://<ambiente>` | Nao incluir credenciais. |
| `<VARIAVEL>` | `<valor-mascarado>` | <obrigatoria/opcional e como validar> |

### Comandos de Inicializacao

```powershell
Set-Location "C:\Projetos\Hinode\aurora-platform"

# Confirmar arquivos/configuracoes sem imprimir segredos.
Test-Path .env

# Exemplo: substituir por comandos reais do repo.
<comando-para-validar-dependencias>
<comando-para-aplicar-ou-verificar-migracoes>
<comando-para-subir-api>
<comando-para-subir-workers-ou-servicos>
```

### Verificacoes de Prontidao

```powershell
# Healthcheck/API.
<comando-ou-request>

# Swagger/OpenAPI, se aplicavel.
<comando-ou-url>

# Banco/migracoes, se aplicavel.
<comando-ou-query-segura>

# Filas/workers/logs, se aplicavel.
<comando-ou-inspecao>
```

## Configuracao da Ferramenta de Teste

Detalhar por ferramenta usada.

| Configuracao | Valor seguro | Observacao |
| --- | --- | --- |
| Ambiente/projeto |  |  |
| `baseUrl` |  |  |
| Headers globais |  |  |
| Autenticacao |  | Nao salvar bearer/secret em claro. |
| Timeouts/retries |  |  |
| Export de evidencias |  |  |

## Massa de Teste

Documentar dados por cenario. Incluir seeds, SQL ou comandos seguros quando aplicavel.

| Cenario | Massa/seed necessaria | Como preparar | Como validar preparo | Dado sensivel? | Mascaramento |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

### Comandos ou SQL de Preparacao

Use placeholders. Nunca colar segredo, token real, senha ou dado pessoal real.

```sql
-- Exemplo seguro; substituir por SQL real quando aplicavel.
SELECT '<validacao-segura>';
```

```powershell
# Exemplo seguro; substituir por CLI real quando aplicavel.
<comando-para-criar-ou-validar-massa>
```

## Cuidados com Segredos

Campos proibidos em claro:

- tokens, bearer e headers `Authorization`;
- senhas, cookies, API keys, `client_secret` e secrets de `.env`;
- CPF/documento, telefone, e-mail real e identificadores pessoais quando nao forem necessarios;
- payloads completos com dados sensiveis;
- URLs contendo usuario, senha ou token.

## Matriz de Cobertura

| Requisito | Fonte | Cenario | Tipo | Ferramenta | Massa/seed | Evidencia | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  | PRD/TechSpec/ADR/Swagger |  | manual/automatizado |  |  |  | planejado |

## Roteiro Resumido de Execucao

1. Subir ambiente com os comandos deste plano.
2. Confirmar prontidao com healthcheck, migracoes, Swagger, filas ou logs aplicaveis.
3. Preparar massa/seeds.
4. Configurar ferramenta de teste.
5. Executar smoke.
6. Executar fluxo feliz.
7. Executar cenarios negativos.
8. Coletar logs/evidencias.
9. Sanitizar evidencias.
10. Preencher resultado observado nos roteiros.

## Criterios de Aceite

- [ ] Todos os cenarios obrigatorios foram executados.
- [ ] Todos os resultados observados foram registrados.
- [ ] Evidencias exigidas foram anexadas ou referenciadas.
- [ ] Nenhuma evidencia contem segredo ou dado sensivel em claro.
- [ ] Divergencias foram registradas como defeito, decisao ou pergunta em aberto.

## Criterios de Bloqueio

- Falha em fluxo critico definido no PRD.
- Erro de contrato em endpoint ou evento publico.
- Vazamento de segredo, token ou dado pessoal em log/evidencia.
- Inconsistencia entre comportamento observado e TechSpec sem decisao registrada.

## Troubleshooting

| Sintoma | Possivel causa | Como diagnosticar | Acao |
| --- | --- | --- | --- |
| API nao sobe |  |  |  |
| Migracao falha |  |  |  |
| Ferramenta recebe 401/403 |  |  |  |
| Worker/fila nao processa |  |  |  |

## Perguntas em Aberto

- <perguntas que impedem execucao completa ou aceite final>
```
