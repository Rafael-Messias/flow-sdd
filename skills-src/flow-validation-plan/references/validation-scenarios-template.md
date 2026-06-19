# Template de Cenarios de Validacao

Use este template para `tasks/<name>/_validation_scenarios_<tool>.md` ou `tasks/<name>/_validation_scenarios_<tool>.preliminary.md`. Cada cenario deve ser quase um procedimento operacional: preparar massa, executar passos, observar logs/respostas, coletar evidencias e limpar dados quando necessario. Nunca preencha "Resultado observado", "Status QA" ou links de evidencia sem execucao real informada pelo usuario.

```markdown
# Cenarios de Validacao <Ferramenta> - <Nome da Feature>

Este roteiro valida a feature `<slug>` usando `<ferramenta>` no modo `<manual|automatizado|hibrido>`.

Modo do documento: <final|preliminary>

## Referencias

- Plano de testes: [`<test-plan-file>`](<test-plan-file>)
- PRD: [`_prd.md`](_prd.md)
- TechSpec: [`_techspec.md`](_techspec.md)
- Swagger/OpenAPI: <link quando aplicavel>

## Preparacao

Pre-requisitos:

- <servicos, variaveis, permissoes e massa necessarios>

### Subida do Ambiente

Inclua comandos reais quando o ambiente for local/dev. Se a validacao usar ambiente externo ja provisionado, documente como confirmar disponibilidade.

```powershell
Set-Location "C:\Projetos\Hinode\aurora-platform"

# Validar configuracao sem imprimir segredos.
Test-Path .env

<comando-para-verificar-dependencias>
<comando-para-subir-api-ou-servicos>
<comando-para-subir-workers-ou-dependencias>
```

### Verificacao de Ambiente

```powershell
<comando-healthcheck>
<comando-swagger-ou-contrato>
<comando-migracao-ou-versao>
<comando-logs-ou-filas>
```

Variaveis seguras:

| Variavel | Valor seguro | Observacao |
| --- | --- | --- |
| `baseUrl` | `https://<ambiente>` |  |
| `<VARIAVEL>` | `<valor-mascarado>` | <obrigatoria/opcional> |

### Configuracao da Ferramenta

| Item | Valor seguro | Como configurar |
| --- | --- | --- |
| Ambiente/projeto |  |  |
| URL base |  |  |
| Headers globais |  |  |
| Auth |  | Usar vault/secret manager da ferramenta quando existir. |
| Variaveis |  |  |
| Export de evidencias |  |  |

### Massa e Seeds

| Cenario | Massa/seed | Preparacao | Validacao do preparo |
| --- | --- | --- | --- |
|  |  |  |  |

Comandos ou SQL seguros:

```sql
-- Substituir por SQL real quando aplicavel.
SELECT '<validacao-segura>';
```

```powershell
# Substituir por CLI real quando aplicavel.
<comando-para-preparar-massa>
```

## Cuidados com Evidencias

- Nao anexar tokens, senhas, cookies, bearer, secrets, authorization codes ou dados pessoais reais em claro.
- Mascarar campos sensiveis antes de salvar prints, exports, logs ou relatorios.
- Registrar data/hora com timezone e responsavel pela execucao.

## Cenarios

### 1. <Nome do Cenario>

Objetivo: <comportamento validado>.

Tipo: <smoke|fluxo feliz|negativo|regressao|seguranca|observabilidade|resiliencia>

Ferramenta: `<ferramenta>`

Massa/pre-condicao:

- <registro, usuario, cliente, fila, token fake, payload, fixture ou seed necessaria>

Preparacao especifica:

```powershell
<comando-ou-passo-para-preparar-este-cenario>
```

Passos detalhados:

1. <passo executavel>
   - Esperado: <resposta, log, estado ou evidencia intermediaria>
2. <passo executavel>
   - Esperado: <resposta, log, estado ou evidencia intermediaria>
3. <passo executavel>
   - Esperado: <resposta, log, estado ou evidencia intermediaria>

Resultado esperado:

- <status HTTP, evento, log, registro, tela, fila ou contrato esperado>

Evidencias esperadas:

- <print/export/log/relatorio com dados mascarados>
- <comando ou local de coleta da evidencia>

Coleta de logs/evidencias:

```powershell
<comando-para-coletar-log-ou-evidencia>
```

Limpeza/rollback, se aplicavel:

```powershell
<comando-ou-passo-de-limpeza>
```

Registro de execucao:

| Campo | Valor |
| --- | --- |
| Cenario | `<id-do-cenario>` |
| Ambiente |  |
| Data/hora |  |
| Responsavel |  |
| Resultado observado |  |
| Status QA |  |
| Evidencia anexada |  |
| Segredos mascarados? |  |
| Defeito/observacao |  |

## Consolidado de Execucao

| Cenario | Tipo | Massa pronta? | Esperado | Observado | Status QA | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| `<id-do-cenario>` |  |  |  |  |  |  |

## Troubleshooting por Ferramenta/Ambiente

| Sintoma | Diagnostico | Acao |
| --- | --- | --- |
| 401/403 na ferramenta | Conferir auth/header/usuario de teste sem expor token. |  |
| API indisponivel | Conferir comando de subida, porta e logs. |  |
| Massa nao encontrada | Conferir seed/query/fixture do cenario. |  |
| Log sem correlacao | Conferir `trace_id`/`request_id` enviado. |  |

## Checklist Final

- [ ] Todos os cenarios obrigatorios foram executados.
- [ ] Resultados observados foram preenchidos somente apos execucao real.
- [ ] Evidencias foram sanitizadas.
- [ ] Falhas foram registradas como defeito ou pergunta em aberto.
- [ ] Logs, exports e imagens nao contem segredo em claro.
```
