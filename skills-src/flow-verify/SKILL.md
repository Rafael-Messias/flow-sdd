---
name: flow-verify
description: Verifica alinhamento entre PRD, TechSpec, tarefas, reviews, validacao e codigo, alem de exigir evidência fresca antes de qualquer afirmação de conclusão, correção, aprovação, commit ou PR. Use antes de `flow-review`, antes de fechar uma feature e sempre que houver risco de drift entre artefatos e implementacao. Não use no planejamento inicial.
---

# Verificacao de Alinhamento e Evidencia

## Visão Geral

`flow-verify` possui duas funcoes complementares:

1. auditar alinhamento entre artefatos e implementacao;
2. exigir evidencia fresca antes de qualquer afirmacao de conclusao.

O objetivo nao e substituir `flow-review`, e sim detectar drift e claims fracos antes que eles virem problema.

**Principio central:** evidencia antes de afirmacoes, sempre.

## Camada 1: Auditoria de Alinhamento

Antes de concluir, revisar ou validar uma feature, verifique pelo menos estes eixos:

- **completude**: PRD, TechSpec, `_tasks.md`, tarefas, reviews e validacao existem quando deveriam existir;
- **corretude**: frontmatters, referencias de arquivo, status e comandos de verificacao fazem sentido;
- **coerencia**: PRD, TechSpec, tarefas e codigo contam a mesma historia sem drift estrutural.

## Fluxo de Auditoria

1. Resolva o escopo.
   - Use nome da feature ou caminho de `tasks/<name>/`.

2. Leia o conjunto minimo de artefatos.
   - `_prd.md`
   - `_techspec.md`
   - `_tasks.md`
   - `task_NN.md`
   - ADRs
   - `reviews-NNN/`
   - artefatos de validacao, se existirem

3. Compare os artefatos entre si e com o workspace.
   - Tarefas completas devem bater com `_tasks.md`.
   - Dependencias devem apontar para tarefas reais.
   - Reviews devem apontar para arquivos reais ou justificar `unknown`.
   - Validacao nao deve parecer concluida se execucao ou review ainda estao abertas.

4. Reporte gaps por categoria.
   - **Completude**
   - **Corretude**
   - **Coerencia**

5. Recomende o proximo passo.
   - `flow-tasks`
   - `flow-run`
   - `flow-review`
   - `flow-fix-review`
   - `flow-validation-plan`
   - ou bloqueio manual quando houver inconsistencia estrutural

## Lei de Ferro

```text
NENHUMA AFIRMACAO DE CONCLUSAO SEM EVIDENCIA FRESCA DE VERIFICACAO
```

Se o comando de verificacao nao rodou na mensagem atual, seu resultado nao pode ser usado como prova.

## Função de Gate

```text
ANTES de afirmar status ou satisfacao:

1. IDENTIFIQUE: qual comando prova esta afirmação?
2. RODE: execute o comando completo e fresco.
3. LEIA: saída completa, exit code e falhas.
4. VERIFIQUE: a saida confirma a afirmacao?
   - Se NAO: relate o estado real com evidencia.
   - Se SIM: afirme com evidencia.
5. SÓ ENTÃO: faça a afirmação.
```

## Escopo

O escopo da verificação deve cobrir o escopo da afirmação:

- Afirmação estreita: rode o teste específico.
- Afirmação ampla: rode pipeline completo de formatação, lint, testes e build, ou o gate do projeto como `make verify`.

Verificação estreita não sustenta afirmação ampla. Se estiver em dúvida, rode o pipeline completo.

Pipeline verde nao prova requisitos atendidos. Para "tarefa concluida" ou "requisitos atendidos", confira entregaveis contra a especificacao original, linha por linha.

## Falhas Comuns

| Afirmação | Exige | Não Basta |
|----------|-------|-----------|
| Testes passam | Saída do comando com 0 falhas | Execução antiga |
| Linter limpo | 0 erros | Checagem parcial |
| Build OK | Exit code 0 | Logs aparentam bons |
| Bug corrigido | Sintoma original testado | Código alterado |
| Regressão coberta | Ciclo vermelho-verde | Passou uma vez |
| Agente concluiu | Diff revisado | Relato do agente |
| Requisitos atendidos | Checklist linha a linha | Testes passando |

## Aplique Antes De

- Qualquer afirmacao de sucesso ou conclusao.
- Commit ou PR.
- Handoff que implique correcao.
- Avancar para proxima tarefa por conclusao.

## Gate Pré-Commit e Pré-PR

Antes de `git commit`:
1. Rode o pipeline completo.
2. Confirme zero erros, warnings e falhas.
3. Produza relatório de verificação com veredito PASS.
4. Só então faça commit.

Antes de PR:
1. Faça tudo acima.
2. Revise `git diff`.
3. Confirme que não há arquivos não relacionados staged.

## Relatório de Verificação

Toda verificação deve ser reportada assim:

```text
RELATÓRIO DE VERIFICAÇÃO
------------------------
Afirmação: [o que está sendo afirmado]
Comando: [comando exato]
Executado: [timestamp ou "agora, após todas as mudanças"]
Exit code: [0 ou não zero]
Resumo da saída: [linhas-chave, contagem de testes, resultado do build]
Warnings: [warnings ou "nenhum"]
Erros: [erros ou "nenhum"]
Veredito: PASS ou FAIL
```

Se o veredito for FAIL, nao use linguagem de conclusao. Diga o que falhou e o que resta.

## Quando Falhar

1. Leia a falha e identifique erro exato.
2. Diagnostique a causa raiz.
3. Corrija a menor causa real.
4. Revalide do zero.
5. Reporte com evidência.

Nunca declare sucesso parcial como suficiente, pule revalidacao, culpe ferramentas sem evidencia ou avance com verificacao falhando.
