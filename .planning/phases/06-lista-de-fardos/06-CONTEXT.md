# Phase 6: Lista de Fardos - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Fardista pode ver, trabalhar e imprimir sua lista de fardos com acoes OK e N/E em tempo real. Inclui: tela dedicada de lista de fardos (NAO usa KanbanBoard), acoes OK (encontrado — copia para trafego e limpa planilha) e N/E (busca alternativo ou libera prateleira), atribuicao em lote pelo lider, impressao PDF, e atualizacao em tempo real via Supabase subscriptions.

</domain>

<decisions>
## Implementation Decisions

### Layout da pagina de fardos
- **D-01:** Tela de fardos e uma LISTA PLANA dedicada — completamente diferente da prateleira. NAO usa KanbanBoard, NAO usa kanban por metodo de envio, NAO agrupa por card. Fardista nao precisa saber para qual marketplace o fardo vai
- **D-02:** Cada fardo e uma linha/card branco com borda lateral esquerda azul. Fundo geral cinza claro
- **D-03:** Layout de cada linha (horizontal, compacto):
  - Checkbox a esquerda (apenas lider/admin)
  - SKU em bold grande a esquerda
  - Abaixo do SKU: "ID: IN04" em texto menor cinza
  - Abaixo do ID: endereco com icone pin verde (ex: "pin 16PAREDE")
  - Se fardo encontrado: badge "Encontrado" em verde abaixo do endereco, fundo verde claro, botoes desabilitados/opacos
  - Se fardo nao encontrado: badge "Nao Encontrado" em vermelho, fundo vermelho claro, botoes desabilitados
  - A direita: label "CONTEM" em texto pequeno cinza + numero grande bold (quantidade de pecas)
  - Botoes OK (verde) e N/E (vermelho) no canto direito
  - Separador sutil entre linhas
- **D-04:** Visao do lider/admin: ve TODOS os fardos do dia com checkboxes para selecao multipla
- **D-05:** Visao do fardista: ve APENAS fardos atribuidos a ele, sem checkboxes, apenas botoes OK e N/E

### Header e filtros
- **D-06:** Busca por codigo IN — campo de busca para filtrar fardos pelo codigo IN
- **D-07:** Filtro por status: tabs ou chips — Pendentes / Encontrados / Nao Encontrados / Todos
- **D-08:** Filtro por atribuicao: Todos / Atribuidos / Nao Atribuidos
- **D-09:** Contadores no header: "X pendentes, Y encontrados, Z N/E" — visao geral rapida
- **D-10:** Botao "Selecionar Todos" no header (so lider/admin) para selecao em massa
- **D-11:** Ordenacao: por SKU (A-Z), por Endereco (A-Z), ou Padrao (ordem de importacao)
- **D-12:** Botao "Sincronizar Estoque" visivel apenas para lider/admin — rele planilha externa e re-executa reserva para pedidos do dia sem reimportar ERP (reutiliza executeReservation com forceRefresh=true da Phase 4)

### Ordenacao padrao
- **D-13:** Ordem padrao: por endereco (A-Z). Otimiza rota do fardista no armazem. Usuario pode trocar para SKU ou ordem de importacao

### Fluxo OK (fardo encontrado)
- **D-14:** Direto sem confirmacao — toque em OK processa imediatamente. Sem popup de confirmacao
- **D-15:** Passo 1: Buscar fardo na planilha de estoque (Google Sheets ID 1tL5as2Q0QEZCj_6Kc4xGGqPqU4T5uduHmaGmntC8W58, aba "Estoque") pela coluna H (CODIGO UPSELLER) com match EXATO usando trim().toLowerCase() em ambos os lados. Normalizar headers com NFD (mesmo padrao do stock-parser.ts). Se nao encontrar correspondencia exata, retornar erro sem modificar nada
- **D-16:** Passo 2: Copiar linha COMPLETA para tabela trafego_fardos no Supabase com todos os campos mapeados da planilha:
  - prioridade (col A), prateleira (col B), posicao (col C), altura (col D), endereco (col E)
  - sku (col F), quantidade (col G), codigo_upseller (col H)
  - data_entrada (col I), hora_entrada (col J), operador (col K)
  - transferencia (col L), data_transferencia (col M), operador_transferencia (col N)
  - fardista_nome (nome do usuario logado), fardista_id (UUID do usuario logado)
  - clicked_at (timestamp atual America/Sao_Paulo)
- **D-17:** Passo 3: Apagar conteudo das colunas F ate o final da linha na planilha de estoque. PRESERVAR colunas A-E (endereco fisico). Dupla verificacao obrigatoria antes de apagar — se linha nao bate mais, retornar erro sem apagar
- **D-18:** Tratamento de erros transacional: se falhar ao inserir no trafego_fardos, NAO apagar da planilha. Se falhar ao apagar da planilha, manter registro no trafego_fardos (logar erro). Fardo nao encontrado na planilha = erro 404
- **D-19:** Visual pos-OK: linha fica com fundo verde claro, badge "Encontrado", botoes desabilitados

### Fluxo N/E (nao encontrado)
- **D-20:** Passo 1: Buscar fardo alternativo na planilha externa para o mesmo SKU
  - Se fardo de IMPORTACAO NORMAL: buscar usando regra dos 20% (subset sum — combinacao dentro de 20% margem)
  - Se fardo de CASCATA: buscar qualquer fardo disponivel para aquele SKU, independente da quantidade
- **D-21:** Passo 2A — Se encontrou alternativo: reservar novo fardo, mostrar na lista automaticamente via realtime no lugar do nao encontrado, linha volta a estado pendente
- **D-22:** Passo 2B — Se NAO encontrou alternativo:
  - Visual: linha com fundo vermelho claro, badge "Nao Encontrado", botoes desabilitados
  - Registrar em tabela fardos_nao_encontrados: codigo_upseller, sku, quantidade, endereco, fardista_nome, fardista_id, timestamp
  - NAO apagar nada da planilha externa
  - Cancelar reserva desse fardo na tabela reservas
  - Liberar quantidade para prateleira — desbloquear linha "AGUARDAR FARDISTA" no modal do separador

### Atribuicao em lote
- **D-23:** Barra flutuante no rodape aparece quando ha checkboxes selecionados: "X fardos selecionados" + botao "Atribuir"
- **D-24:** Botao "Atribuir" abre AssignModal (reutilizado da Phase 5) filtrando por role 'fardista'
- **D-25:** Checkboxes apenas para lider/admin. Fardista nao ve checkboxes

### Impressao PDF
- **D-26:** PDF imprime fardos selecionados via checkbox. Se nenhum selecionado, imprime todos
- **D-27:** Conteudo do PDF: codigo IN, SKU, endereco, quantidade, "para quem entregar" (nome do separador do card). Se card nao tem separador atribuido, mostra traco "---"
- **D-28:** Botao imprimir no header da pagina (junto com controles), nao dentro de modal

### Realtime e feedback visual
- **D-29:** Animacao suave na transicao de status (verde/vermelho) + toast breve ("Fardo IN-4421 encontrado"). Contadores atualizam em tempo real via Supabase subscription (useCardsRealtime ja escuta trafego_fardos e reservas)
- **D-30:** Spinner no botao clicado (OK ou N/E) enquanto API processa. Outros botoes desabilitados na mesma linha. Previne clique duplo

### Migracao do banco
- **D-31:** Tabela trafego_fardos precisa de migration para adicionar TODOS os campos da planilha: prioridade, prateleira, posicao, altura, data_entrada, hora_entrada, operador, transferencia, data_transferencia, operador_transferencia, fardista_nome, clicked_at. Campos existentes (codigo_in, sku, quantidade, endereco, fardista_id, reserva_id, status) permanecem

### Claude's Discretion
- Implementacao exata dos filtros (tabs vs chips vs dropdown)
- Animacao especifica da transicao de status
- Layout exato do PDF (fontes, espacamento, margens)
- Estrutura interna dos componentes e Route Handlers
- Debounce/throttle do campo de busca
- Design exato da barra flutuante de selecao

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos de fardos
- `.planning/REQUIREMENTS.md` §Bales (Fardos) — FARD-01 a FARD-06
- `.planning/PROJECT.md` §Context — Google Sheet ID, colunas da planilha, cores por marketplace/urgencia

### Schema do banco
- `src/types/database.types.ts` — Tabelas trafego_fardos (PRECISA migration: adicionar campos da planilha), reservas, fardos_nao_encontrados
- `src/types/index.ts` — StatusTrafego, StatusProgresso

### Tipos existentes
- `src/features/fardos/types.ts` — StockItem, SubsetResult, ReservationResult
- `src/features/cards/types.ts` — CardItem (tem campo reservas[]), CardData

### Reserva de fardos (Phase 4)
- `src/features/fardos/utils/reservation-engine.ts` — executeReservation (reutilizar com forceRefresh para "Sincronizar Estoque")
- `src/features/fardos/utils/subset-sum.ts` — findOptimalCombination (reutilizar para busca de alternativo no N/E)
- `src/features/fardos/utils/stock-parser.ts` — fetchStock com normalizacao NFD (mesmo padrao para busca no OK)

### Google Sheets API
- `src/lib/google-sheets.ts` — getSheetData, updateSheetData, clearSheetRange

### Componentes reutilizaveis (Phase 5)
- `src/features/cards/components/assign-modal.tsx` — AssignModal com filterRole (reutilizar para atribuicao de fardistas)
- `src/features/cards/hooks/use-cards-realtime.ts` — useCardsRealtime ja escuta trafego_fardos e reservas
- `src/features/cards/lib/pdf-generator.ts` — Referencia para PDF (adaptar para formato de lista de fardos)

### Tela existente
- `app/(authenticated)/fardos/page.tsx` — Server component com auth e role check
- `app/(authenticated)/fardos/fardos-client.tsx` — Client component atual (SUBSTITUIR: remover KanbanBoard, implementar lista plana)

### Contexto de fases anteriores
- `.planning/phases/04-estoque-e-reserva-de-fardos/04-CONTEXT.md` — D-02: botao re-reserva, D-06: regra fardo vs prateleira, D-09: reserva vinculada ao SKU
- `.planning/phases/05-cards-e-ui-foundation/05-CONTEXT.md` — D-28: atribuicao multipla para fardos, D-29: visibilidade por role

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/fardos/utils/reservation-engine.ts`: executeReservation com forceRefresh — base para "Sincronizar Estoque" e busca de alternativo no N/E
- `src/features/fardos/utils/subset-sum.ts`: findOptimalCombination — reutilizar para busca de fardo alternativo
- `src/features/fardos/utils/stock-parser.ts`: fetchStock com normalizacao NFD — padrao para headers com acento
- `src/features/cards/components/assign-modal.tsx`: AssignModal com filterRole — reutilizar para atribuicao de fardistas
- `src/features/cards/hooks/use-cards-realtime.ts`: useCardsRealtime escuta trafego_fardos e reservas
- `src/lib/google-sheets.ts`: getSheetData, clearSheetRange — base para leitura/escrita na planilha
- `src/components/ui/sonner.tsx`: Toast para feedback visual

### Established Patterns
- Auth: createClient() -> getUser() -> role check via admin DB lookup (padrao Phase 2)
- API routes: Route Handler com supabaseAdmin para operacoes de escrita (padrao Phase 3-5)
- NFD normalization para headers da planilha (padrao Phase 4)
- Array.from(Map) para iteracao de Maps (padrao tsconfig)
- Select-then-insert/update para tabelas sem UNIQUE constraint (padrao Phase 5)

### Integration Points
- `app/(authenticated)/fardos/fardos-client.tsx` — substituir FardosClient atual (remove KanbanBoard)
- Tabela `reservas` — cancelar reserva no fluxo N/E, status update no fluxo OK
- Tabela `trafego_fardos` — inserir fardo encontrado com todos os campos
- Tabela `fardos_nao_encontrados` — registrar fardos nao encontrados sem alternativo
- Tabela `progresso` — liberar linha AGUARDAR_FARDISTA quando N/E sem alternativo
- Google Sheets — leitura para buscar fardo, escrita para apagar colunas F+

</code_context>

<specifics>
## Specific Ideas

- Layout baseado em print de referencia do usuario: cards brancos compactos com borda azul, informacoes em linha horizontal
- "CONTEM" como label de quantidade no estilo do print de referencia
- Icone pin verde para endereco
- Fardo encontrado = fundo verde claro com badge "Encontrado"
- Fardo nao encontrado = fundo vermelho claro com badge "Nao Encontrado"
- Dupla verificacao obrigatoria antes de qualquer escrita/apagamento na planilha de estoque
- Regra diferente de busca de alternativo: importacao normal usa 20% margem, cascata aceita qualquer fardo

</specifics>

<deferred>
## Deferred Ideas

- **Phase 8 (Baixa) — escopo reduzido:** A limpeza de colunas F+ da planilha de estoque agora acontece no OK da Phase 6, nao na Baixa. Phase 8 foca em: scanner de codigo IN, confirmacao, remover do trafego, liberar prateleira
- **Phase 7 (Prateleira) — efeito do N/E:** Quando N/E sem alternativo libera para prateleira, a linha "AGUARDAR FARDISTA" desbloqueia no modal do separador. O efeito visual e na Phase 7, mas a logica backend (cancelar reserva + update progresso) e implementada aqui na Phase 6

</deferred>

---

*Phase: 06-lista-de-fardos*
*Context gathered: 2026-04-05*
