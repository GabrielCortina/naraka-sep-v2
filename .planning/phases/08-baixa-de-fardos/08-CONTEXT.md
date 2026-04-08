# Phase 8: Baixa de Fardos - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Fardista pode escanear ou digitar codigo IN para dar baixa no fardo: busca no trafego, modal de confirmacao com detalhes e "para quem entregar", remove do trafego, desbloqueia linhas AGUARDAR FARDISTA na prateleira, registra na tabela baixados. Inclui: campo de input com auto-focus, leitor de camera opcional, modal de confirmacao com cores por marketplace, secao BAIXADOS HOJE, e atualizacao em tempo real.

Nota: Colunas F+ da planilha de estoque ja sao apagadas no fluxo OK da Phase 6 (D-17). Phase 8 NAO repete essa operacao.

</domain>

<decisions>
## Implementation Decisions

### Input e scanner
- **D-01:** Campo unico grande centralizado com auto-focus ao entrar na pagina. Enter dispara busca no trafego. Funciona com scanner Bluetooth e teclado manual
- **D-02:** Campo ocupa ~80% da largura no mobile, ~50% no desktop. Fonte grande. Tela de baixa e simples — layout centralizado em ambos
- **D-03:** Icone de camera opcional ao lado do campo para leitura de codigo de barras via camera do celular. Fallback para quem nao tem scanner BT
- **D-04:** Erro (codigo nao encontrado no trafego): toast vermelho "Fardo nao encontrado no trafego" + borda vermelha no campo por 2s. Campo limpa e volta ao foco

### Card de confirmacao (modal)
- **D-05:** Ao encontrar o fardo no trafego, abre modal/popup centralizado na tela com: codigo IN, SKU, quantidade (label "CONTEM" + numero grande bold, mesmo padrao Phase 6 D-03), endereco com icone pin verde (consistencia com Phase 6), e secao "Entregar para" com lista de separadores
- **D-06:** Modal com borda superior na cor do marketplace (Shopee #ee4d2d, ML #ffe600, TikTok #25F4EE, Shein #000000). Consistente com cores do sistema
- **D-07:** Botao verde "Confirmar Baixa" + botao cinza "Cancelar". Clique unico confirma, sem confirmacao dupla. Spinner + desabilita durante processamento para prevenir clique duplo
- **D-08:** Fardo ja baixado (duplicado): toast amarelo "Fardo IN-XX ja teve baixa" + campo limpa. NAO abre modal

### Multiplos separadores
- **D-09:** Secao "Entregar para:" com lista vertical. Cada separador em uma linha com nome + card_key completo (grupo_envio|tipo|importacao_numero). Cada linha na cor do marketplace
- **D-10:** Logica: buscar na tabela reservas quais card_keys usam esse codigo IN, depois buscar nas atribuicoes quem esta atribuido como separador de cada card_key
- **D-11:** Card sem separador atribuido: mostrar "Nao atribuido (card_key)". Fardista entrega ao lider para redistribuir
- **D-12:** Lista completa com scroll interno se necessario. Raro ter mais de 3-4 separadores

### Feedback pos-baixa
- **D-13:** Toast verde "Baixa confirmada — IN-XX". Modal fecha automaticamente. Campo limpa e recebe auto-focus para proximo scan. Fluxo continuo de escaneamento
- **D-14:** Secao "BAIXADOS HOJE" no final da tela. Mostra: codigo IN, SKU, quantidade, para quem foi entregue, horario da baixa. Contador no header da secao (ex: "BAIXADOS HOJE (3)")
- **D-15:** Secao comeca colapsada e expande automaticamente quando o primeiro fardo for baixado. Dados vem da tabela baixados
- **D-16:** Sem botao de desfazer. Baixa e operacao definitiva. Se erro, lider resolve manualmente

### Desbloqueio AGUARDAR FARDISTA
- **D-17:** Ao confirmar baixa: atualizar progresso das linhas AGUARDAR FARDISTA para 'pendente' (desbloqueado) no modal do separador. Fardo foi fisicamente entregue — separador pode trabalhar o item
- **D-18:** Identificar linhas AGUARDAR FARDISTA pelo SKU do fardo baixado + card_keys que usam esse fardo (via reservas)

### Operacoes no banco
- **D-19:** Confirmar baixa executa em sequencia: (1) inserir em tabela baixados {codigo_in, trafego_id, baixado_por, baixado_em}, (2) remover/atualizar fardo do trafego_fardos, (3) desbloquear linhas AGUARDAR FARDISTA na tabela progresso
- **D-20:** NAO apagar colunas F+ da planilha de estoque — ja feito no OK da Phase 6

### Claude's Discretion
- Biblioteca de leitura de camera (pesquisar melhor opcao leve para browser)
- Animacao do modal abrindo/fechando
- Layout exato da secao BAIXADOS HOJE (fontes, espacamento)
- Estrutura interna dos Route Handlers
- Debounce do campo de busca
- Como tratar fardo no trafego mas sem reserva vinculada (edge case)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos de baixa
- `.planning/REQUIREMENTS.md` §Discharge (Baixa) — BAIX-01 a BAIX-06
- `.planning/PROJECT.md` §Context — Google Sheet ID, colunas da planilha, cores por marketplace/urgencia

### Schema do banco
- `src/types/database.types.ts` — Tabelas baixados (codigo_in, trafego_id, baixado_por, baixado_em), trafego_fardos, progresso, reservas, atribuicoes
- `src/types/index.ts` — StatusTrafego, StatusProgresso (inclui 'aguardar_fardista')

### Contexto de fases anteriores
- `.planning/phases/06-lista-de-fardos/06-CONTEXT.md` — D-14 a D-19 (fluxo OK/NE, trafego_fardos, apagamento colunas F+ JA FEITO no OK)
- `.planning/phases/07-lista-de-prateleira-e-cascata/07-CONTEXT.md` — D-12/D-13 (desbloqueio AGUARDAR FARDISTA e Phase 8, NAO no OK do fardista)
- `.planning/phases/05-cards-e-ui-foundation/05-CONTEXT.md` — D-16 a D-24 (modal de itens, AGUARDAR FARDISTA visual)

### Componentes existentes reutilizaveis
- `app/(authenticated)/baixa/page.tsx` — Server component placeholder (SUBSTITUIR com implementacao real)
- `src/features/fardos/utils/fardo-ok-handler.ts` — findBaleInSheet, mapRowToTrafegoFields (referencia de padrao NFD)
- `src/features/cards/hooks/use-cards-realtime.ts` — Supabase subscription (escuta trafego_fardos, reservas, progresso)
- `src/features/cards/components/item-modal.tsx` — Referencia para logica AGUARDAR FARDISTA (isBlocked, split de linhas)

### APIs e utilitarios
- `src/lib/google-sheets.ts` — getSheetData, clearSheetRange (referencia, NAO usar clearSheetRange na baixa)
- `src/lib/supabase/admin.ts` — supabaseAdmin para operacoes de escrita

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `use-cards-realtime.ts`: Ja escuta trafego_fardos, reservas, progresso — baixa pode usar para atualizar prateleira em tempo real
- `fardo-ok-handler.ts`: Utilitarios de normalizacao NFD e busca na planilha (referencia de padrao, nao usar diretamente na baixa)
- `item-modal.tsx`: Logica de split de linhas AGUARDAR FARDISTA (linhas 72-95) — referencia para entender como prateleira trata o status
- `card-utils.ts`: aggregateItems ja reconhece status 'aguardar_fardista' (linha 146-147)
- `src/components/ui/sonner.tsx`: Toast para feedback visual
- `src/components/ui/dialog.tsx`: Dialog/modal shadcn para modal de confirmacao

### Established Patterns
- Auth: createClient() -> getUser() -> role check via admin DB lookup (padrao Phase 2)
- API routes: Route Handler com supabaseAdmin para escrita (padrao Phase 3-6)
- Realtime: Supabase subscription via useCardsRealtime (padrao Phase 5)
- Select-then-insert/update para tabelas sem UNIQUE constraint (padrao Phase 5)

### Integration Points
- Tabela `baixados` — inserir registro de baixa
- Tabela `trafego_fardos` — remover/marcar fardo como baixado
- Tabela `progresso` — atualizar status de 'aguardar_fardista' para 'pendente' (desbloqueio)
- Tabela `reservas` — buscar card_keys que usam o codigo IN
- Tabela `atribuicoes` — buscar separadores atribuidos a cada card_key
- useCardsRealtime — prateleira atualiza em tempo real quando AGUARDAR FARDISTA desbloqueia

</code_context>

<specifics>
## Specific Ideas

- Modal de confirmacao abre como popup centralizado (nao inline) — usuario especificou explicitamente
- "CONTEM" como label de quantidade no modal — mesmo padrao visual da lista de fardos Phase 6
- Icone pin verde para endereco — consistencia visual com Phase 6
- Borda superior do modal na cor do marketplace — visual consistente com sistema de cores existente
- Lista vertical para multiplos separadores, cada um com card_key completo (grupo|tipo|importacao)
- Secao "BAIXADOS HOJE" com contador, comeca colapsada, expande no primeiro fardo
- Toast amarelo para duplicados, toast vermelho para nao encontrado, toast verde para sucesso

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-baixa-de-fardos*
*Context gathered: 2026-04-08*
