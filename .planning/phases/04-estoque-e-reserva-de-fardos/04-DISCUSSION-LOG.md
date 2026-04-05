# Phase 4: Estoque e Reserva de Fardos - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 04-estoque-e-reserva-de-fardos
**Areas discussed:** Timing da reserva, Threshold 50 pecas, Algoritmo subset sum, Feedback da reserva

---

## Timing da reserva

| Option | Description | Selected |
|--------|-------------|----------|
| Automatico no upload | Apos persistir pedidos, Route Handler le estoque e reserva. Lider ve resultado completo | |
| Botao separado | Upload so salva pedidos, lider clica depois para reservar | |
| Automatico + re-reserva manual | Reserva automatica no upload + botao para re-executar | ✓ |

**User's choice:** Automatico + re-reserva manual
**Notes:** Re-reserva na tela de fardos (nao upload). Modo complementar (so SKUs sem reserva suficiente).

| Option | Description | Selected |
|--------|-------------|----------|
| Salva pedidos, pula reserva | Upload completa, reserva fica pendente | |
| Bloqueia upload inteiro | Se nao ler estoque, upload falha | |
| Retry automatico | Tenta 3x com backoff, se falhar salva sem reserva | ✓ |

**User's choice:** Retry automatico (3x com backoff, fallback salva sem reserva)

| Option | Description | Selected |
|--------|-------------|----------|
| Visao global | 2a importacao ve fardos ja reservados pela 1a | ✓ |
| Reserva isolada por importacao | Cada importacao independente | |

**User's choice:** Visao global

**Cache:** Cache por 2 minutos (resposta customizada — opcoes originais eram fresh/5min/por importacao)

---

## Threshold 50 pecas

**CORRECAO IMPORTANTE:** Usuario corrigiu a regra STOK-03/STOK-04.

| Option | Description | Selected |
|--------|-------------|----------|
| Soma do dia inteiro | Soma todas quantidades do SKU no dia | |
| Por importacao | Avalia cada importacao isoladamente | |
| Por pedido individual | Cada pedido decide sozinho | |

**User's choice:** CORRECAO — A regra nao e >= 50 pecas. Regra correta: se SKU tem fardo fisico disponivel no estoque → fardo. Se nao tem → prateleira. Quantidade de fardos irrelevante, importa soma de pecas.

| Option | Description | Selected |
|--------|-------------|----------|
| Reserva parcial + prateleira | Reserva o que tem, resto vai pra prateleira | ✓ |
| Tudo prateleira | Se nao cobre, nenhum fardo reservado | |
| Pendente | Diferenca fica aguardando fardo | |

**User's choice:** Reserva o que tem, resto vai pra prateleira

**Demanda agregada:** Por importacao (cada importacao calcula demanda do SKU isoladamente, reserva acumulativa com visao global dos fardos ja reservados)

**Vinculo da reserva:** SKU puro — schema: fardo_id + sku + qtd_reservada + status. Sem FK para pedido ou card. Um fardo pode atender multiplos cards.

---

## Algoritmo subset sum

| Option | Description | Selected |
|--------|-------------|----------|
| Mais proximo absoluto | Minimiza |soma - demanda| | |
| Preferencia por baixo | Prefere combinacoes abaixo da demanda | |
| Preferencia por cima | Busca soma >= demanda | |

**User's choice:** Preferencia por cima dentro dos 20%: soma >= demanda e <= demanda * 1.20. Se impossivel, pega melhor disponivel (mesmo abaixo). Diferenca vai pra prateleira.

| Option | Description | Selected |
|--------|-------------|----------|
| Menos fardos | Menos fardos fisicos no desempate | ✓ |
| Mais fardos | Fardos menores mais faceis de manusear | |
| Tanto faz | Claude decide | |

**User's choice:** Menos fardos

**Volume:** 20-50 fardos por SKU
**Execucao:** Servidor (Route Handler)

---

## Feedback da reserva

| Option | Description | Selected |
|--------|-------------|----------|
| Resumo no card de importacao | Card ganha secao de estoque com metricas | ✓ |
| Toast simples | Apenas toast com contagem | |
| Tela separada | Redireciona para detalhamento completo | |

**User's choice:** Resumo no card de importacao

| Option | Description | Selected |
|--------|-------------|----------|
| Indicador no resumo | SKUs parciais destacados no resumo | ✓ |
| Toast de aviso | Toast amarelo sobre parciais | |
| Sem alerta extra | Resumo ja mostra info suficiente | |

**User's choice:** Indicador no resumo

| Option | Description | Selected |
|--------|-------------|----------|
| Secao com aviso | Aviso no card orientando re-reserva | ✓ |
| Toast de erro | Toast vermelho apenas | |
| Modal de aviso | Modal com botao tentar novamente | |

**User's choice:** Secao de estoque com aviso no card de resumo

---

## Claude's Discretion

- Implementacao exata do cache (in-memory Map, LRU, etc.)
- Estrategia de backoff do retry
- Layout exato da secao de estoque
- Estrutura interna dos componentes
- Escolha do algoritmo (DP, branch-and-bound)
- Design do botao "Atualizar Reservas"

## Deferred Ideas

None — discussion stayed within phase scope
