# Critérios de Review

## Severidades

### critical

Falhas de segurança, crashes, perda de dados, comportamento indefinido ou races que podem causar incidente de produção ou expor dados.

### high

Bugs de correção, gargalos visíveis ao usuário ou padrões que prejudicam escala, confiabilidade ou usabilidade. Corrigir antes do merge.

### medium

Manutenibilidade, lacunas de teste ou padrões não idiomáticos que degradam a saúde de longo prazo. Não bloqueia, mas deve ser tratado.

### low

Melhorias menores, documentação ou nomenclatura. Opcional.

## Áreas de Avaliação

### 1. Segurança

- Autenticação/autorização.
- Validação de entrada.
- Segredos hardcoded.
- Criptografia ou armazenamento inseguro.
- Dados sensíveis em logs ou erros.

### 2. Correção

- Erros de lógica.
- Bordas e off-by-one.
- Nil/null pointer.
- Erros ignorados.
- Conversões ou type assertions incorretas.

### 3. Concorrência

- Data races.
- Vazamento de goroutines.
- Deadlocks.
- Uso incorreto de channels.
- Falta de `sync.WaitGroup`.

### 4. Performance e Escala

- Complexidade desnecessária.
- Vazamentos de recursos.
- Crescimento não limitado.
- Cache ausente em operação cara repetida.
- I/O bloqueante sem timeout.

### 5. Tratamento de Erros

- Erros engolidos.
- Falta de contexto (`fmt.Errorf("contexto: %w", err)`).
- `panic()` ou `log.Fatal()` em biblioteca/handler.
- Tratamento genérico demais.
- Uso incorreto de `errors.Is()` ou `errors.As()`.

### 6. Qualidade e Manutenção

- Nomes confusos.
- Duplicação.
- Funções complexas demais.
- Código morto.
- Violação de convenções do projeto.

### 7. Testes

- Falta de testes críticos.
- Testes de mock em vez de comportamento.
- Testes flaky.
- Bordas sem cobertura.
- Falta de `t.Parallel()` quando aplicável.

### 8. Arquitetura

- Dependências circulares.
- Violação de camadas.
- Abstrações vazando detalhes.
- Acoplamento excessivo.
- Padrões inconsistentes.

### 9. Operação

- Logs estruturados ausentes ou pobres.
- Falta de contexto para debug.
- Config hardcoded.
- Shutdown gracioso ausente.
- Lacunas de métricas/tracing.

## Abordagem

- Leia PRD e TechSpec antes do código.
- Revise por severidade.
- Ignore estilo que linters pegam.
- Dê sugestões acionáveis.
- Severidade depende do impacto real.
- Crie uma issue por arquivo por problema distinto.
- Reconheça bons padrões no resumo, sem criar issue.
