# Template de Relatorio de Evidencias

Use este template para `tasks/<name>/_validation_evidence_report.md` ou `tasks/<name>/_validation_evidence_report.preliminary.md` quando o usuario exigir documento consolidado de evidencias. Nao preencha status de aprovacao, resultado observado ou links de anexos sem execucao real informada pelo usuario.

```markdown
# Relatorio de Evidencias - <Nome da Feature>

Este relatorio consolida as evidencias da validacao da feature `<slug>`.

Modo do documento: <final|preliminary>

## Referencias

- Plano de testes: [`<test-plan-file>`](<test-plan-file>)
- Cenarios: [`<scenarios-file>`](<scenarios-file>)
- PRD: [`_prd.md`](_prd.md)
- TechSpec: [`_techspec.md`](_techspec.md)

## Execucao

| Campo | Valor |
| --- | --- |
| Ambiente |  |
| Data/hora inicial |  |
| Data/hora final |  |
| Responsavel |  |
| Versao/commit validado |  |
| Ferramentas usadas |  |

## Evidencias por Cenario

| Cenario | Status QA | Evidencia | Segredos mascarados? | Observacoes |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Evidencias de Ambiente

- Comando usado para subir ambiente:
  ```powershell
  <comando>
  ```
- Healthcheck/API:
- Migracoes:
- Workers/filas:
- Logs:
- Swagger/OpenAPI:

## Sanitizacao

- [ ] Tokens e bearer foram mascarados.
- [ ] Senhas, cookies e secrets foram mascarados.
- [ ] Dados pessoais foram removidos ou anonimizados.
- [ ] URLs nao contem credenciais.
- [ ] Exports e prints foram revisados antes de anexar.

## Defeitos ou Divergencias

| ID | Cenario | Descricao | Severidade | Link |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Conclusao QA

Preencher somente apos execucao real:

- Status final:
- Riscos remanescentes:
- Recomendacao:
```
