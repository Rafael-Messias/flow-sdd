# Template de Arquivo de Issue

Use esta estrutura exata para cada issue. O arquivo é lido por `reviews.ReadReviewEntries()` e `prompt.ParseReviewContext()`.

## Formato

```markdown
---
status: pending
file: caminho/para/arquivo.go
line: 42
severity: critical|high|medium|low
author: claude-code
provider_ref:
---

# Issue NNN: <título conciso do problema>

## Comentário de Revisão

<descrição detalhada do problema, por que importa e sugestão de correção>

## Triage

- Decisão: `UNREVIEWED`
- Notas:
```

## Campos

- **NNN**: número com três dígitos.
- **status**: começa `pending`, passa por `valid` ou `invalid` e termina `resolved`.
- **title**: resumo em uma linha, até 72 caracteres.
- **file**: caminho relativo ao repositório; use `unknown` para issue arquitetural sem arquivo.
- **line**: linha mais visível; use `0` quando não houver linha específica.
- **severity**: exatamente `critical`, `high`, `medium` ou `low`.
- **author**: sempre `claude-code`.
- **provider_ref**: sempre vazio em rodadas manuais.

## Compatibilidade

- O YAML frontmatter deve ser válido.
- Arquivos devem seguir `issue_NNN.md`.

## Regras

- Uma issue por arquivo.
- Comentário deve ser acionável.
- Snippets devem ter menos de 15 linhas.
- Título deve ser descritivo e curto.
