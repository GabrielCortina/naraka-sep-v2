# Phase 3: Upload e Processamento - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Lider pode importar planilha .xlsx do ERP UpSeller e o sistema processa, classifica e persiste todos os pedidos corretamente. Inclui: parse do arquivo, filtro por status/metodo de envio, classificacao automatica (Unitario/Kit/Combo), deduplicacao entre importacoes, virada de dia com limpeza, numeracao sequencial de importacoes, classificacao de metodo de envio nos 6 grupos. Integracao com estoque externo e reserva de fardos sao Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Experiencia de upload
- **D-01:** Drag-and-drop + botao 'Selecionar arquivo' como drop zone — zona de arrastar com fallback de botao, reusa Card do shadcn
- **D-02:** Um arquivo .xlsx por vez — lider importa, ve resultado, depois pode importar outro
- **D-03:** Apos selecionar arquivo: mostra nome do .xlsx + botao 'Processar' — lider controla quando inicia a analise
- **D-04:** Preview com resumo numerico antes de confirmar importacao — total de pedidos validos, filtrados (Full/Fulfillment), duplicados, por tipo (Unitario/Kit/Combo). Lider confirma com botao antes de persistir

### Processamento hibrido
- **D-05:** SheetJS parse no frontend (gera preview), confirmacao envia dados parseados para Route Handler que classifica, deduplica e persiste no Supabase server-side
- **D-06:** Classificacao automatica no backend: Unitario (1 SKU, qtd=1), Kit (1 SKU, qtd>1), Combo (2+ SKUs diferentes no mesmo pedido)
- **D-07:** Deduplicacao no backend: consulta numero_pedido existente no banco antes de inserir. Linhas com mesmo numero dentro da planilha sao agrupadas normalmente
- **D-08:** Classificacao de metodo de envio nos 6 grupos por correspondencia parcial case-insensitive (TikTok verificado antes de Shopee Xpress para evitar conflito)

### Feedback de processamento
- **D-09:** Toast de sucesso 'Importacao #N concluida' + card de resumo abaixo da drop zone com breakdown
- **D-10:** Spinner com texto 'Importando pedidos...' durante processamento (apos confirmacao)
- **D-11:** Se nenhum pedido valido: mensagem amigavel na tela — 'Nenhum pedido novo encontrado — X filtrados, Y ja importados'. Sem importacao criada

### Virada de dia
- **D-12:** Limpeza automatica com toast informativo: 'Virada de dia — pedidos anteriores removidos'. Sem modal de confirmacao
- **D-13:** Limpa na virada: pedidos, progresso, reservas, atribuicoes. NAO limpa: trafego_fardos, baixados, fardos_nao_encontrados (sobrevivem entre dias)
- **D-14:** Deteccao via tabela config (chave: 'ultima_importacao_data') — le antes de cada importacao, compara com data de hoje
- **D-15:** Numeracao de importacoes reseta para 1 no novo dia

### Historico de importacoes
- **D-16:** Lista de importacoes do dia abaixo da drop zone — cada item mostra: # da importacao, horario, pedidos por tipo (Unitario/Kit/Combo), por grupo de envio
- **D-17:** Botao 'Desfazer ultima importacao' remove os pedidos da importacao mais recente do banco

### Claude's Discretion
- Design exato da drop zone (icone, cores, bordas)
- Layout interno do card de resumo
- Implementacao do spinner/loading state
- Estrutura interna dos componentes (quantos componentes, nomes)
- Validacao do formato do arquivo (.xlsx check)
- Tratamento de erros de parse (arquivo corrompido, formato inesperado)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Upload e processamento
- `.planning/REQUIREMENTS.md` §Upload — UPLD-01 a UPLD-10 com criterios de aceitacao
- `.planning/PROJECT.md` §Context — Mapeamento ERP (13 colunas), grupos de envio (6), cores por marketplace

### Schema do banco
- `src/types/database.types.ts` — Tabela pedidos com todos os campos (card_key, grupo_envio, importacao_numero, tipo, etc.)
- `src/types/index.ts` — Tipos TipoPedido, StatusProgresso ja definidos

### Infraestrutura existente
- `src/lib/google-sheets.ts` — getSheetData, updateSheetData, clearSheetRange prontos (Phase 4+ usa para estoque)
- `src/lib/supabase/server.ts` — Client server-side para Route Handlers
- `src/lib/supabase/admin.ts` — Client admin para operacoes privilegiadas
- `app/(authenticated)/upload/page.tsx` — Pagina placeholder a ser substituida

### UI components disponiveis
- `src/components/ui/` — button, card, input, label, sonner (toast) ja instalados via shadcn

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/card.tsx`: Card component para drop zone e resumo de importacao
- `src/components/ui/button.tsx`: Botoes processar, confirmar, desfazer
- `src/components/ui/sonner.tsx`: Toast para feedback de sucesso/virada de dia
- `src/lib/supabase/server.ts`: Client server-side para Route Handler de importacao
- `src/types/index.ts`: TipoPedido type pronto ('unitario' | 'kit' | 'combo')

### Established Patterns
- Feature-based: `src/features/upload/` ja existe (vazio) — criar components/, hooks/, utils/ dentro
- Route Handlers em `app/api/` para logica server-side (padrao da Phase 1)
- Supabase SSR com `@supabase/ssr` para autenticacao no Route Handler

### Integration Points
- `app/(authenticated)/upload/page.tsx`: Substituir placeholder pelo componente real
- Tabela `pedidos`: Insert dos pedidos processados
- Tabela `config`: Ler/escrever 'ultima_importacao_data' e 'ultimo_importacao_numero'
- SheetJS (`xlsx`): Precisa ser adicionado como dependencia do projeto

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Fluxo e decisoes bem definidos acima.

</specifics>

<deferred>
## Deferred Ideas

- **Tabela historico_performance** — Guardar permanentemente metricas de separadores/fardistas (pecas separadas, cards concluidos, fardos confirmados, data) para ranking por dia, 15 dias, mes e periodo selecionado. Nunca limpar na virada de dia. Pertence a Phase 9 (Dashboard)
- **Botoes de limpeza manual** — Na tela de Usuarios (admin only), botoes para limpar trafego_fardos, baixados e fardos_nao_encontrados individualmente, com confirmacao. Pertence a Phase 10 (Gestao de Usuarios)

</deferred>

---

*Phase: 03-upload-e-processamento*
*Context gathered: 2026-04-04*
