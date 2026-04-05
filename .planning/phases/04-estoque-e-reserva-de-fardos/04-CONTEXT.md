# Phase 4: Estoque e Reserva de Fardos - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Sistema le estoque externo do Google Sheets e reserva fardos automaticamente usando subset sum com margem de 20%. Inclui: leitura da planilha de estoque via API, identificacao de fardos disponiveis por SKU, algoritmo de reserva otima, persistencia das reservas, classificacao fardo vs prateleira, e feedback visual no card de importacao. Telas de fardos e prateleira sao fases separadas (Phase 6 e 7).

</domain>

<decisions>
## Implementation Decisions

### Timing da reserva
- **D-01:** Reserva automatica apos upload — Route Handler de upload, apos persistir pedidos, le estoque e executa reserva automaticamente. Lider ve resultado completo (pedidos + reservas) de uma vez
- **D-02:** Botao de re-reserva manual na tela de fardos — permite re-executar reserva quando estoque atualiza apos primeira leitura. Modo complementar: so tenta reservar SKUs que ainda nao tem reserva suficiente, nao mexe em fardos ja reservados/em trafego
- **D-03:** Retry 3x com backoff se Google Sheets indisponivel — se falhar apos retries, salva pedidos normalmente sem reserva. Toast + aviso no resumo orientando usar re-reserva depois
- **D-04:** Visao global de reservas entre importacoes — 2a importacao ve fardos ja reservados pela 1a e so usa os disponiveis restantes. Impede reserva duplicada do mesmo fardo
- **D-05:** Cache de estoque por 2 minutos — evita chamadas repetidas a API do Google em operacoes proximas. Cache em memoria no servidor

### Regra fardo vs prateleira (CORRECAO de STOK-03/STOK-04)
- **D-06:** A regra NAO e >= 50 pecas. Regra correta: se o SKU tem fardo fisico disponivel no estoque externo, vai para lista de fardos. Se nao tem fardo, vai para prateleira. Quantidade de fardos e irrelevante — o que importa e a soma das pecas
- **D-07:** Demanda do SKU agregada por importacao — cada importacao calcula a demanda total de cada SKU (soma das quantidades de todos os pedidos daquele SKU naquela importacao)
- **D-08:** Se fardos nao cobrem demanda total, reserva o que tem e a diferenca vai para prateleira como item livre
- **D-09:** Reserva vinculada ao SKU puro — schema: fardo_id (codigo_in) + sku + qtd_reservada + status. Sem FK para pedido ou card especifico. Um fardo pode atender o mesmo SKU em multiplos cards de diferentes grupos de envio. Migration necessaria para alterar tabela reservas

### Algoritmo subset sum
- **D-10:** Preferencia por cima: busca combinacoes onde soma >= demanda e soma <= demanda * 1.20. Se nao conseguir cobrir dentro de 20%, pega a melhor combinacao disponivel (mesmo abaixo). Diferenca entre demanda e reservado vai para prateleira
- **D-11:** Criterio de desempate: menos fardos fisicos. Entre combinacoes com mesma soma de pecas, prefere a que usa menos fardos (menos trabalho para o fardista)
- **D-12:** Volume esperado: 20-50 fardos por SKU — programacao dinamica ou subset sum com poda. Complexidade aceitavel para rodar no servidor
- **D-13:** Algoritmo roda no servidor (Route Handler) — consistente com padrao da Phase 3 (logica no backend)

### Feedback da reserva
- **D-14:** Resumo no card de importacao — card de resumo pos-upload ganha secao de estoque: X SKUs com fardo, Y SKUs para prateleira, Z fardos reservados total
- **D-15:** Indicador de cobertura parcial — SKUs com cobertura parcial aparecem destacados no resumo (icone de aviso + contagem: "3 SKUs com cobertura parcial")
- **D-16:** Se estoque indisponivel (retry falhou), secao de estoque no card mostra: "Estoque indisponivel — reserva pendente. Use Atualizar Reservas na tela de fardos"

### Claude's Discretion
- Implementacao exata do cache (in-memory Map, LRU, etc.)
- Estrategia de backoff do retry (exponencial, linear)
- Layout exato da secao de estoque no card de resumo
- Estrutura interna dos componentes e Route Handlers
- Escolha exata do algoritmo (DP tabular, branch-and-bound, etc.)
- Design do botao "Atualizar Reservas" na tela de fardos

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos de estoque
- `.planning/REQUIREMENTS.md` §Stock Integration — STOK-01 a STOK-07 (NOTA: STOK-03 e STOK-04 corrigidos — regra real e por disponibilidade de fardo, nao por quantidade >= 50)
- `.planning/PROJECT.md` §Context — Google Sheet ID, colunas da planilha (SKU, QUANTIDADE, CODIGO UPSELLER/IN, ENDERECO)

### Schema do banco
- `src/types/database.types.ts` — Tabela reservas (PRECISA migration: trocar pedido_id por sku + fardo_id), tabela pedidos (campos sku, quantidade)
- `src/types/index.ts` — StatusTrafego, StatusProgresso ja definidos

### Google Sheets API
- `src/lib/google-sheets.ts` — getSheetData, updateSheetData, clearSheetRange prontos. Usar getSheetData("Estoque") para leitura

### Upload existente (Phase 3)
- `app/api/upload/route.ts` — Route Handler de upload que sera estendido para chamar reserva apos persistir pedidos

### Contexto de importacao (Phase 3)
- `.planning/phases/03-upload-e-processamento/03-CONTEXT.md` — Decisoes de upload: card de resumo, toast de sucesso, historico de importacoes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/google-sheets.ts`: getSheetData pronto para ler planilha de estoque (range "Estoque")
- `src/components/ui/card.tsx`: Card component para secao de estoque no resumo de importacao
- `src/components/ui/sonner.tsx`: Toast para feedback de reserva/falha
- `src/components/ui/button.tsx`: Botao "Atualizar Reservas" na tela de fardos
- `src/lib/supabase/server.ts`: Client server-side para Route Handlers
- `src/lib/supabase/admin.ts`: Client admin para operacoes privilegiadas (bypass RLS)

### Established Patterns
- Route Handlers em `app/api/` para logica server-side (Phase 1 e 3)
- Feature-based: `src/features/fardos/` ja existe (vazio) — criar components/, hooks/, utils/ dentro
- Supabase SSR com `@supabase/ssr` para autenticacao nos Route Handlers
- Processamento hibrido: frontend envia dados, backend processa e persiste (Phase 3)

### Integration Points
- `app/api/upload/route.ts`: Estender para chamar reserva automatica apos insert de pedidos
- Tabela `reservas`: Migration para novo schema (sku + fardo_id ao inves de pedido_id)
- Tabela `pedidos`: Leitura para calcular demanda por SKU por importacao
- `app/(authenticated)/fardos/page.tsx`: Placeholder onde ficara o botao "Atualizar Reservas"
- Google Sheets planilha "Estoque": Leitura de fardos disponiveis (codigo IN, SKU, quantidade, endereco)

</code_context>

<specifics>
## Specific Ideas

- Algoritmo subset sum deve priorizar soma >= demanda dentro de 20%, nao apenas mais proximo absoluto. Exemplo do usuario: demanda 900, opcao 1 (x1+x2+x3+x4+x5=940) vence opcao 2 (x1+x4+x2+x3=1050) por estar mais perto, mesmo tendo mais fardos
- Quando soma exata e possivel, deve ser preferida mesmo que use mais fardos: opcao 1 (x1+x2+x3=900 exato) vence opcao 2 (x1+x2=920) apesar de usar 3 fardos vs 2
- Numero de fardos so e criterio de desempate quando soma de pecas e igual

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-estoque-e-reserva-de-fardos*
*Context gathered: 2026-04-05*
