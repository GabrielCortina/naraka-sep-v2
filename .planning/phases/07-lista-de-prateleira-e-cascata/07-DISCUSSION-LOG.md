# Phase 7: Lista de Prateleira e Cascata - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 07-lista-de-prateleira-e-cascata
**Areas discussed:** Fluxo de cascata, Transformacao, Impressao PDF, Filtros e header

---

## Fluxo de cascata

### Feedback visual durante busca

| Option | Description | Selected |
|--------|-------------|----------|
| Spinner + toast | Botao mostra spinner, toast com resultado | ✓ |
| Modal de confirmacao | Pergunta antes de buscar | |
| Feedback inline | Status muda sem toast | |

**User's choice:** Spinner + toast
**Notes:** —

### Parcial: cascata automatica vs manual

| Option | Description | Selected |
|--------|-------------|----------|
| Cascata automatica | Calcula diferenca, busca fardo para restante | ✓ |
| Pergunta antes | Modal confirma antes de cascata | |
| Parcial sem cascata | So registra quantidade, cascata so no NE | |

**User's choice:** Cascata automatica para o restante
**Notes:** —

### Cascata: onde aparece

| Option | Description | Selected |
|--------|-------------|----------|
| Ambos (modal + lista fardos) | Item bloqueado no modal + fardo na lista | ✓ |
| So no modal | Fardista consulta separadamente | |

**User's choice:** Ambos, com adendos importantes
**Notes:** Regra de busca em cascata sem 20%. Fardo de cascata aparece NAO ATRIBUIDO na lista (lider atribui). Se fardo nao cobre tudo, restante vai para Transformacao. is_cascata=true para flag

### Desbloqueio AGUARDAR FARDISTA

| Option | Description | Selected |
|--------|-------------|----------|
| Realtime + toast | Subscription detecta insert, desbloqueia | |
| Realtime silencioso | Desbloqueia sem toast | |
| Refresh manual | Fechar/reabrir modal | |

**User's choice:** CORRECAO — desbloqueio NAO acontece no OK do fardista. So na Baixa (Phase 8)
**Notes:** OK = fardo em transito. Baixa = entrega fisica = desbloqueio. Phase 7 mantem linhas bloqueadas

### Status apos cascata

| Option | Description | Selected |
|--------|-------------|----------|
| Direto AGUARDAR FARDISTA | Sem estado intermediario | ✓ |
| Estado intermediario | Cascata em andamento antes de bloquear | |
| Split instantaneo | Linha original + nova Transformacao | |

**User's choice:** Direto para AGUARDAR FARDISTA
**Notes:** —

### NE: escopo por item vs por linha

| Option | Description | Selected |
|--------|-------------|----------|
| NE por item/SKU | Afeta todas as pecas do SKU no card | |
| NE por linha individual | Cada linha pode ser marcada NE separadamente | ✓ |
| NE so para prateleira | NE so na linha de prateleira | |

**User's choice:** NE por linha individual
**Notes:** Granularidade por linha, nao por SKU

### Parcial: cascata para restante vs tudo

| Option | Description | Selected |
|--------|-------------|----------|
| Cascata para restante | Registra parcial, busca fardo para diferenca | ✓ |
| Cascata para tudo | Busca fardo para quantidade total | |
| Sem cascata no parcial | So registra quantidade | |

**User's choice:** Cascata para o restante
**Notes:** —

### Destaque fardo cascata na lista

| Option | Description | Selected |
|--------|-------------|----------|
| Badge CASCATA | Badge laranja na linha do fardo | ✓ |
| Borda lateral diferente | Borda laranja ao inves de azul | |
| Sem destaque | Igual aos outros fardos | |

**User's choice:** Badge CASCATA laranja
**Notes:** —

### Criterio de selecao em cascata

| Option | Description | Selected |
|--------|-------------|----------|
| Maior quantidade | Pega o maior fardo | |
| Mais proximo da demanda | Menor diferenca absoluta | ✓ |
| Primeiro disponivel | Qualquer fardo | |
| Menor quantidade | Preserva fardos grandes | |

**User's choice:** 4 prioridades: (1) mais proximo, (2) qualquer que cubra, (3) melhor combinacao, (4) transformacao
**Notes:** Sem regra dos 20% — qualquer quantidade aceita. Excluir fardos reservados e NE

### Cascata em cadeia

| Option | Description | Selected |
|--------|-------------|----------|
| Direto Transformacao | NE em cascata = transformacao | |
| Uma nova tentativa | Max 2 niveis | |
| Cascata ilimitada | Busca ate esgotar estoque | ✓ |

**User's choice:** Sem limite de tentativas, busca ate esgotar estoque do SKU
**Notes:** Cada NE registra em fardos_nao_encontrados. Exclui NE anteriores das buscas. So transformacao quando zero fardos disponiveis

### Notificacao ao lider

| Option | Description | Selected |
|--------|-------------|----------|
| Sem notificacao | Badge realtime suficiente | |
| Contador no header | X cascatas pendentes | |
| Toast no realtime | Toast quando fardo cascata aparece | ✓ |

**User's choice:** Toast no realtime para lider
**Notes:** —

### Progresso do card com cascata

| Option | Description | Selected |
|--------|-------------|----------|
| So conta separado | AGUARDAR e Transformacao nao contam | ✓ |
| Conta cascata como progresso | AGUARDAR conta como parcial | |
| Exclui transformacao do total | Remove do denominador | |

**User's choice:** So conta pecas efetivamente separadas
**Notes:** —

---

## Transformacao

### Visual no modal

| Option | Description | Selected |
|--------|-------------|----------|
| Badge TRANSFORMACAO | Badge laranja, botoes desabilitados | |
| Some do modal | Item desaparece | ✓ |
| Secao separada | Colapsavel no final do modal | |

**User's choice:** Item some do modal
**Notes:** —

### Rastreamento

**User's choice:** Nova tabela `transformacoes` com fluxo completo
**Notes:** Aba dedicada de Transformacao com kanban, modal com validacao exata, fluxo lider/separador. DEFERRED para Phase 7.1 — capacidade nova que justifica fase separada. Phase 7 so cria registro na tabela

### Progresso com transformacao

| Option | Description | Selected |
|--------|-------------|----------|
| Mantem no total | Transformacao = nao separado | |
| Remove do total | Pecas saem do denominador | ✓ |
| Progresso duplo | Barra principal + secundaria | |

**User's choice:** Remove do total — card pode fechar sem pecas de transformacao
**Notes:** —

---

## Impressao PDF

**User's choice:** Impressao so por card individual via botao existente no modal (Phase 5 D-32). SEM botao global "Imprimir Todos"
**Notes:** Botao ja implementado na Phase 5. Nada a fazer na Phase 7

---

## Filtros e header

### Header da prateleira

| Option | Description | Selected |
|--------|-------------|----------|
| Contadores + busca | Pecas/cards + busca SKU | ✓ |
| Filtros completos | Tabs status + busca + atribuicao | |
| Sem header extra | KanbanBoard puro | |

**User's choice:** Contadores + busca por SKU
**Notes:** —

### Busca por SKU

| Option | Description | Selected |
|--------|-------------|----------|
| Filtra cards | Kanban mostra so cards com SKU | ✓ |
| Abre modal direto | Enter abre modal do card | |
| Highlight sem filtro | Destaca cards, nao esconde | |

**User's choice:** Filtra cards que contem o SKU
**Notes:** —

### Contadores

| Option | Description | Selected |
|--------|-------------|----------|
| Pecas + cards | X separadas / Y total + Z pendentes, W concluidos | ✓ |
| So pecas | X / Y pecas | |
| Pecas + cascata | X separadas + Z cascata + W transformacao | |

**User's choice:** Pecas + cards
**Notes:** —

---

## Claude's Discretion

- Implementacao exata do campo de busca (debounce, posicao)
- Design dos contadores no header
- Animacao do item sumindo do modal
- Estrutura interna dos Route Handlers
- Texto exato dos toasts
- Layout do badge CASCATA

## Deferred Ideas

- Phase 7.1: Aba de Transformacao completa (kanban, modal validacao exata, fluxo lider/separador, tabela transformacoes)
- Phase 8: Desbloqueio AGUARDAR FARDISTA no momento da baixa
