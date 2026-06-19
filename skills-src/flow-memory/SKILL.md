---
name: flow-memory
description: Mantém memória de fluxo para execuções usando arquivos em tasks/<name>/memory/. Use quando o prompt fornecer caminhos de memória e exigir leitura, atualização, compactação e promoção de contexto durável entre tarefas de PRD.
---

# Memória de Fluxo

Mantenha os arquivos de memória fornecidos pelo chamador.

## Entradas

- Caminho do diretório de memória do fluxo.
- Caminho do arquivo de memória compartilhada.
- Caminho do arquivo de memória da tarefa atual.
- Opcional: sinal do chamador indicando compactação.

## Fluxo

1. Carregue memória antes de editar código.
   - Leia memória compartilhada e memória da tarefa atual.
   - Trate como contexto obrigatório.
   - Se houver compactação, leia `references/memory-guidelines.md` e compacte antes da implementação.

2. Mantenha memória atualizada.
   - Atualize memória da tarefa quando objetivo mudar, decisão não óbvia surgir, aprendizado importante aparecer ou erro mudar o plano.
   - Promova para memória compartilhada apenas contexto durável entre tarefas.
   - Mantenha detalhes locais na memória da tarefa.

3. Feche a execução.
   - Atualize memória antes de conclusão, handoff ou commit.
   - Registre só fatos que ajudam a próxima execução.
   - Releia as diretrizes se o arquivo ficar ruidoso.

## Regras Críticas

- Não invente histórico, decisões ou status.
- Não copie blocos grandes de código, stack traces ou specs.
- Não duplique fatos óbvios no repo, diff, tarefa ou PRD.
- Não leia memórias de tarefas não relacionadas sem indicação.
- Memória compartilhada é durável e transversal; memória de tarefa é local e operacional.

## Teste de Promoção

Antes de promover algo para memória compartilhada, pergunte:

1. Outra tarefa precisará disso para evitar erro ou redescoberta?
2. O fato é durável entre execuções?
3. A informação não está óbvia no PRD, TechSpec, tarefas ou repositório?

As três respostas devem ser "sim". Caso contrário, mantenha na memória da tarefa.

## Compactação

1. Se ambos precisam compactar, compacte a compartilhada primeiro.
2. Preserve estado atual, decisões duráveis, aprendizados reutilizáveis, riscos e handoff.
3. Remova repetição, notas antigas, transcrições longas e fatos deriváveis.
4. Reescreva em bullets factuais curtos.
5. Preserve headings padrão; remova seções vazias só quando inúteis.

## Quando Ler a Referência

Leia `references/memory-guidelines.md` quando:

- o chamador pedir compactação e as regras acima não bastarem;
- não estiver claro o que é memória compartilhada versus tarefa;
- o arquivo estiver ruidoso ou redundante.

## Tratamento de Erros

- Se um caminho fornecido não existir, pare e reporte.
- Se memória conflitar com repositório ou tarefa, confie no repo e nos documentos, depois corrija a memória.
- Se compactação removeria riscos, decisões ou handoff ativos, preserve esses itens.
