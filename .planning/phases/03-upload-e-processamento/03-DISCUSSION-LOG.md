# Phase 3: Upload e Processamento - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 03-upload-e-processamento
**Areas discussed:** Experiencia de upload, Feedback de processamento, Virada de dia, Historico de importacoes

---

## Experiencia de upload

| Option | Description | Selected |
|--------|-------------|----------|
| Drag-and-drop + botao | Zona de arrastar com botao 'Selecionar arquivo' — mais moderno, familiar | ✓ |
| So botao | Botao simples 'Importar planilha' abre seletor de arquivo | |
| Voce decide | Claude escolhe | |

**User's choice:** Drag-and-drop + botao
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, com resumo | Apos selecionar: mostra total de pedidos, filtrados, duplicados. Lider confirma | ✓ |
| Nao, importa direto | Arquivo selecionado -> processa e persiste automaticamente | |
| Voce decide | Claude escolhe | |

**User's choice:** Sim, com resumo (preview antes de confirmar)
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Um por vez | Lider importa um .xlsx, ve resultado, depois pode importar outro | ✓ |
| Multiplos | Lider seleciona varios .xlsx de uma vez | |
| Voce decide | Claude escolhe | |

**User's choice:** Um por vez
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Frontend (browser) | SheetJS no browser, logica no client, envia processado pro Supabase | |
| Backend (Route Handler) | Envia .xlsx pro servidor, processa tudo server-side | |
| Hibrido | SheetJS parse no frontend (preview), Route Handler classifica/deduplica/persiste | ✓ |
| Voce decide | Claude escolhe | |

**User's choice:** Hibrido
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Nome do arquivo + botao processar | Mostra nome do .xlsx, botao para iniciar analise | ✓ |
| Processamento automatico | Ao selecionar, ja comeca a processar | |
| Voce decide | Claude escolhe | |

**User's choice:** Nome do arquivo + botao processar
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Resumo numerico | Numeros: X validos, Y filtrados, Z duplicados, por tipo | ✓ |
| Resumo + tabela | Numeros + tabela scrollavel com pedidos | |
| Voce decide | Claude escolhe | |

**User's choice:** Resumo numerico
**Notes:** —

---

## Feedback de processamento

| Option | Description | Selected |
|--------|-------------|----------|
| Card de resumo na tela | Card persistente com breakdown | |
| Toast + resumo | Toast de sucesso + card de resumo abaixo da drop zone | ✓ |
| Modal de resultado | Modal com resumo detalhado | |
| Voce decide | Claude escolhe | |

**User's choice:** Toast + resumo
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Aviso amigavel | Mensagem clara na tela: nenhum pedido novo encontrado | ✓ |
| Toast de erro | Toast vermelho com mensagem curta | |
| Voce decide | Claude escolhe | |

**User's choice:** Aviso amigavel
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Spinner + texto | Spinner com 'Importando pedidos...' | ✓ |
| Barra de progresso | Barra que avanca conforme pedidos sao processados | |
| Voce decide | Claude escolhe | |

**User's choice:** Spinner + texto
**Notes:** —

---

## Virada de dia

| Option | Description | Selected |
|--------|-------------|----------|
| Confirmacao explicita | Modal com botoes Confirmar/Cancelar | |
| Limpeza automatica com aviso | Limpa automaticamente + toast informativo | ✓ |
| Limpeza totalmente silenciosa | Limpa sem avisar | |
| Voce decide | Claude escolhe | |

**User's choice:** Limpeza automatica com aviso
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Tudo (cascata) | Limpa todas as tabelas | |
| So pedidos | Limpa so tabela pedidos | |
| Voce decide | Claude analisa FK | |

**User's choice:** Custom — Limpar pedidos, progresso, reservas, atribuicoes. NAO limpar trafego_fardos, baixados, fardos_nao_encontrados (sobrevivem entre dias).
**Notes:** Usuario tambem sugeriu criar tabela historico_performance para metricas permanentes de separadores/fardistas — anotado como deferred (Phase 9).

| Option | Description | Selected |
|--------|-------------|----------|
| Tabela config | Salvar data na tabela config | ✓ |
| Campo importacao_data | Consultar MAX(importacao_data) da tabela pedidos | |
| Voce decide | Claude escolhe | |

**User's choice:** Tabela config
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Sobrevivem entre dias | trafego_fardos, baixados, fardos_nao_encontrados nunca apagados pela virada | ✓ |
| Limpar depois | Fases 6-8 decidem | |
| Voce decide | Claude avalia | |

**User's choice:** Sobrevivem entre dias
**Notes:** Usuario tambem pediu botoes de limpeza manual na tela de Usuarios (admin only) — anotado como deferred (Phase 10).

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, reseta | Novo dia = Importacao 1, 2, 3... | ✓ |
| Nao, continua | Numeracao sequencial global | |
| Voce decide | Claude escolhe | |

**User's choice:** Sim, reseta
**Notes:** —

---

## Historico de importacoes

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, abaixo da drop zone | Lista com # importacao, horario, total de pedidos | ✓ |
| Nao, so o ultimo resultado | Apenas resumo da ultima importacao | |
| Voce decide | Claude escolhe | |

**User's choice:** Sim, abaixo da drop zone
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Sim | Botao 'Desfazer ultima importacao' | ✓ |
| Nao | Sem desfazer — deduplicacao protege | |
| Voce decide | Claude avalia | |

**User's choice:** Sim
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Minimo | # importacao, horario, total | |
| Com breakdown | # importacao, horario, por tipo e por grupo de envio | ✓ |
| Voce decide | Claude escolhe | |

**User's choice:** Com breakdown
**Notes:** —

---

## Claude's Discretion

- Design exato da drop zone (icone, cores, bordas)
- Layout interno do card de resumo
- Implementacao do spinner/loading state
- Estrutura interna dos componentes
- Validacao do formato do arquivo
- Tratamento de erros de parse

## Deferred Ideas

- Tabela historico_performance para metricas permanentes de separadores/fardistas — Phase 9 (Dashboard)
- Botoes de limpeza manual por tabela na tela de Usuarios (admin only) — Phase 10 (Gestao de Usuarios)
