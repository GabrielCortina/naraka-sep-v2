# Phase 7: Lista de Prateleira e Cascata - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Separador pode trabalhar itens da prateleira com acoes Confirmar/Parcial/NE e cascata automatica para fardos ou Transformacao. Inclui: acoes no modal do separador (confirmar quantidade, parcial com cascata automatica, NE com cascata), busca de fardo alternativo no estoque externo, criacao de linha AGUARDAR FARDISTA, registro de transformacao, header com contadores e busca, atribuicao de separadores pelo lider, e atualizacao em tempo real. Desbloqueio de AGUARDAR FARDISTA e Phase 8 (Baixa). Aba de Transformacao completa e Phase 7.1 (nova).

</domain>

<decisions>
## Implementation Decisions

### Fluxo de cascata — Confirmar/Parcial/NE
- **D-01:** Spinner + toast durante busca de alternativo. Botao mostra spinner enquanto API processa. Se achou fardo: toast "Fardo alternativo reservado — AGUARDAR FARDISTA". Se nao achou: toast "Sem fardo — enviado para Transformacao"
- **D-02:** Parcial dispara cascata automatica. Separador digita quantidade no numpad (Phase 5). Se quantidade < necessaria, sistema calcula diferenca e busca fardo alternativo automaticamente para o RESTANTE. Zero atrito extra — sem confirmacao adicional
- **D-03:** NE aplica por LINHA INDIVIDUAL, nao por SKU inteiro. Se SKU tem multiplas linhas (prateleira + fardos), separador marca NE em cada linha separadamente. Granularidade por linha
- **D-04:** Na cascata: ambos os lados atualizam. No modal do separador: item muda para AGUARDAR FARDISTA (bloqueado). Na lista de fardos: novo fardo aparece automaticamente com is_cascata=true, NAO ATRIBUIDO. Lider deve atribuir manualmente
- **D-05:** Status muda direto para AGUARDAR FARDISTA apos spinner. Sem estado intermediario

### Regra de busca em cascata (diferente da importacao normal)
- **D-06:** Em cascata NAO existe regra dos 20%. Qualquer fardo disponivel do SKU e aceito, independente da quantidade
- **D-07:** Criterio de selecao com 4 prioridades:
  1. Fardo cuja quantidade mais se aproxima da demanda (menor diferenca absoluta)
  2. Se nenhum cobre sozinho: qualquer fardo que cubra a demanda completa, mesmo com muito mais pecas
  3. Se nenhum fardo cobre sozinho: melhor combinacao de fardos que maximize cobertura. Restante vai para Transformacao
  4. Se nenhum fardo disponivel do SKU: tudo vai para Transformacao
- **D-08:** Excluir da busca: fardos ja reservados E fardos em fardos_nao_encontrados. Evita loop

### Cascata em cadeia (NE no fardo de cascata)
- **D-09:** Sem limite de tentativas. Quando fardista marca NE em fardo de cascata, sistema busca outro fardo alternativo do mesmo SKU. Continua buscando ate esgotar fardos disponiveis
- **D-10:** Cada NE registra em fardos_nao_encontrados. Fardos ja marcados NE sao excluidos de buscas futuras — previne loop
- **D-11:** So vai para Transformacao quando nao existir mais NENHUM fardo disponivel do SKU no estoque

### Desbloqueio AGUARDAR FARDISTA
- **D-12:** Desbloqueio NAO acontece no OK do fardista. Fluxo correto: OK = fardo em transito (trafego_fardos). Desbloqueio so acontece na Baixa (Phase 8) quando fardo e fisicamente entregue ao separador
- **D-13:** Na Phase 7: linhas AGUARDAR FARDISTA permanecem bloqueadas enquanto fardo estiver em trafego sem baixa. Logica de desbloqueio e Phase 8

### Destaque visual fardo de cascata
- **D-14:** Badge laranja 'CASCATA' na linha do fardo na lista de fardos. Lider identifica rapidamente que e urgente/precisa atribuir
- **D-15:** Toast no realtime para lider quando novo fardo de cascata aparece na lista de fardos

### Transformacao (escopo Phase 7 — backend apenas)
- **D-16:** Quando cascata nao encontra fardo: item some do modal do separador. Nao fica com badge — desaparece da lista
- **D-17:** Registro em nova tabela `transformacoes` com: sku, quantidade, card_key, numero_pedido, lider_id, lider_nome, separador_id, separador_nome, status (pendente/atribuido/concluido), created_at, concluido_at
- **D-18:** Pecas de transformacao sao REMOVIDAS do total do card. Card pode chegar a 100% sem elas. Phase 7.1 lida com a aba de transformacao
- **D-19:** Aba completa de Transformacao (nova aba, kanban, modal com validacao exata, fluxo lider/separador) e Phase 7.1 — DEFERRED

### Progresso do card
- **D-20:** Barra de progresso so conta pecas efetivamente separadas. AGUARDAR FARDISTA NAO conta como progresso
- **D-21:** Pecas de transformacao removidas do denominador (total). Card fecha quando tudo que ele pode separar esta separado

### Impressao PDF
- **D-22:** Impressao so por card individual, usando botao que ja existe no modal (Phase 5 D-32). SEM botao global "Imprimir Todos" na prateleira

### Filtros e header da prateleira
- **D-23:** Header com contadores: "X pecas separadas / Y total" + "Z cards pendentes, W concluidos". Visao rapida de progresso global
- **D-24:** Campo de busca por SKU: filtra cards que contem aquele SKU. Limpa busca = volta ao kanban normal
- **D-25:** KanbanBoard existente (Phase 5) mantido como layout principal. Colunas por metodo de envio, cards colapsaveis no mobile

### Atribuicao de separadores
- **D-26:** Atribuicao de cards de prateleira: um card por vez pelo lider (Phase 5 D-27). Reutiliza AssignModal com filterRole='separador'
- **D-27:** Separador so ve cards atribuidos a ele. Cards sem atribuicao so aparecem para lider/admin (Phase 5 D-29)

### Claude's Discretion
- Implementacao exata do campo de busca (debounce, posicao no header)
- Design dos contadores no header (chips, texto, badges)
- Animacao do item sumindo do modal ao ir para transformacao
- Estrutura interna dos Route Handlers de cascata
- Texto exato dos toasts de cascata
- Layout exato do badge CASCATA na lista de fardos

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos de prateleira
- `.planning/REQUIREMENTS.md` §Shelf (Prateleira) — PRAT-01 a PRAT-08

### Schema do banco
- `src/types/database.types.ts` — Tabelas progresso, reservas, trafego_fardos, fardos_nao_encontrados (PRECISA migration: criar tabela transformacoes)
- `src/types/index.ts` — StatusProgresso (precisa adicionar 'transformacao')

### Contexto de fases anteriores
- `.planning/phases/05-cards-e-ui-foundation/05-CONTEXT.md` — D-16 a D-24 (modal de itens, AGUARDAR FARDISTA, ordenacao dinamica, numpad), D-27 (atribuicao), D-29 (visibilidade por role)
- `.planning/phases/06-lista-de-fardos/06-CONTEXT.md` — D-14 a D-22 (fluxo OK/NE, busca alternativo, liberacao para prateleira), D-29 (realtime)
- `.planning/phases/04-estoque-e-reserva-de-fardos/04-CONTEXT.md` — D-06 (regra fardo vs prateleira), D-09 (reserva vinculada ao SKU), D-10 (subset sum)

### Componentes existentes reutilizaveis
- `app/(authenticated)/prateleira/prateleira-client.tsx` — Client component ATUAL com KanbanBoard, ItemModal, handlers Confirmar/NaoTem (ESTENDER: adicionar logica de cascata real)
- `app/(authenticated)/prateleira/page.tsx` — Server component com auth e role check
- `src/features/cards/components/kanban-board.tsx` — KanbanBoard com colunas por metodo de envio
- `src/features/cards/components/item-modal.tsx` — Modal com Confirmar (numpad) e NaoTem
- `src/features/cards/components/completed-section.tsx` — Secao CONCLUIDOS colapsavel
- `src/features/cards/components/assign-modal.tsx` — AssignModal com filterRole
- `src/features/cards/hooks/use-card-data.ts` — Hook principal de dados dos cards
- `src/features/cards/hooks/use-cards-realtime.ts` — Supabase subscription (escuta progresso, trafego_fardos, reservas)
- `src/features/cards/lib/card-utils.ts` — groupByCardKey, calcProgress, aggregateItems, getUrgencyTier

### Motor de reserva e estoque (Phase 4)
- `src/features/fardos/utils/reservation-engine.ts` — executeReservation (base para busca de alternativo em cascata)
- `src/features/fardos/utils/subset-sum.ts` — findOptimalCombination (NAO usar para cascata — cascata tem regra propria sem 20%)
- `src/features/fardos/utils/stock-parser.ts` — fetchStock com NFD normalization

### Google Sheets API
- `src/lib/google-sheets.ts` — getSheetData (leitura estoque para cascata)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `prateleira-client.tsx`: Ja tem KanbanBoard + ItemModal + handlers Confirmar/NaoTem. Precisa estender handlers para chamar API de cascata real ao inves de so atualizar progresso
- `use-card-data.ts`: Hook principal que busca pedidos, progresso, reservas, atribuicoes. Precisa ajustar calculo de progresso para remover pecas de transformacao do total
- `use-cards-realtime.ts`: Ja escuta progresso, trafego_fardos, reservas. Precisa escutar tabela transformacoes tambem
- `card-utils.ts`: calcProgress e aggregateItems precisam ajuste para novo status transformacao e calculo sem pecas removidas
- `item-modal.tsx`: Modal com acoes. NaoTem handler precisa chamar cascata real. Parcial precisa disparar cascata para o restante
- `reservation-engine.ts`: Base para busca de alternativo mas cascata tem regra diferente (sem 20%, prioridades proprias)
- `stock-parser.ts`: fetchStock reutilizavel para leitura de estoque na cascata
- `assign-modal.tsx`: Reutilizar para atribuicao de separadores com filterRole='separador'

### Established Patterns
- Auth: createClient() -> getUser() -> role check via admin DB lookup (padrao Phase 2)
- API routes: Route Handler com supabaseAdmin para escrita (padrao Phase 3-5)
- Realtime: Supabase subscription via useCardsRealtime (padrao Phase 5)
- Feature folders: src/features/{domain}/components/, hooks/, lib/, utils/
- NFD normalization para headers da planilha (padrao Phase 4)

### Integration Points
- Tabela `progresso` — atualizar status e quantidade_separada nas acoes Confirmar/Parcial/NE
- Tabela `reservas` — criar reserva para fardo de cascata
- Tabela `trafego_fardos` — fardo de cascata aparece na lista de fardos apos reserva
- Tabela `transformacoes` — NOVA tabela para itens sem fardo disponivel
- Tabela `fardos_nao_encontrados` — excluir fardos NE de buscas futuras
- Google Sheets — leitura de estoque para busca de fardo alternativo na cascata

</code_context>

<specifics>
## Specific Ideas

- Cascata sem regra dos 20% — diferente da importacao normal. Qualquer fardo disponivel aceito
- Criterio de selecao: mais proximo da demanda (1o), depois qualquer que cubra (2o), depois melhor combinacao (3o), depois transformacao (4o)
- Fardo de cascata aparece na lista de fardos NAO ATRIBUIDO — lider atribui manualmente com toast no realtime
- Badge laranja 'CASCATA' para destaque visual do lider
- NE em fardo de cascata: cascata ilimitada ate esgotar estoque do SKU (excluindo NE anteriores)
- Desbloqueio AGUARDAR FARDISTA = Phase 8 (baixa fisica), NAO no OK do fardista
- Item de transformacao SOME do modal (nao fica com badge)
- Pecas de transformacao removidas do total do card — card pode fechar sem elas

</specifics>

<deferred>
## Deferred Ideas

- **Phase 7.1: Aba de Transformacao** — Nova capacidade completa: nova aba com layout kanban por metodo de envio, modal com validacao exata de quantidade (sem NE, sem Parcial), fluxo lider (ve todos, atribui) + separador (ve atribuidos, completa), nova tabela transformacoes, status pendente/atribuido/concluido. Escopo proprio que justifica fase dedicada
- **Phase 8 (Baixa): Desbloqueio AGUARDAR FARDISTA** — Quando fardista da baixa (entrega fisica), linha AGUARDAR FARDISTA desbloqueia no modal do separador em tempo real via Supabase subscription

</deferred>

---

*Phase: 07-lista-de-prateleira-e-cascata*
*Context gathered: 2026-04-06*
