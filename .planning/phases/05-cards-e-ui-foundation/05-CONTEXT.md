# Phase 5: Cards e UI Foundation - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Pedidos processados aparecem organizados em cards com progresso, urgencia e design system completo do sistema. Cada card agrupa pedidos por grupo_envio + tipo + importacao_numero. Inclui sistema de urgencia com contagem regressiva, badges coloridos, atribuicao de separadores/fardistas, modal de itens com acoes, impressao PDF e componentes reutilizaveis do design system.

</domain>

<decisions>
## Implementation Decisions

### Layout dos cards (Kanban por metodo de envio)
- **D-01:** Layout kanban horizontal com uma coluna por metodo de envio (ate 6 colunas). NAO e grid de N cards por linha
- **D-02:** Cada coluna tem largura fixa de ~220-260px. Se as 6 colunas nao couberem, scroll horizontal na area de cards
- **D-03:** Header de cada coluna: badge colorido com nome do metodo na cor oficial do marketplace (uppercase, font-weight 700, 0.75rem)
- **D-04:** Colunas ordenadas por prazo (mais urgente primeiro): Shopee SPX (11h), ML Flex (12h), ML Coleta (14h-16h), TikTok Shop (15h-18h), Shein (16h), Shopee Xpress (19h)
- **D-05:** Colunas vazias (sem cards para aquele metodo) nao aparecem — layout ajusta automaticamente
- **D-06:** Cards empilhados verticalmente dentro de cada coluna. Fundo geral cinza claro (#f4f4f5)
- **D-07:** Secao CONCLUIDOS colapsavel no final da lista. Comeca fechada. Cards 100% completos vao para la automaticamente com animacao (fade/slide)

### Card individual (aparencia)
- **D-08:** Fundo branco, borda lateral esquerda colorida por urgencia: vermelho (#dc2626) se atrasado, amarelo (#eab308) se <2h, verde (#16a34a) se >2h, verde opaco se concluido
- **D-09:** Padding interno confortavel, border radius suave, sombra leve
- **D-10:** Conteudo do card (de cima para baixo):
  1. Linha superior: badge do metodo (cor marketplace) + tipo truncado (K./U./C.) + numero importacao (#1, #2...) + botao Atribuir (icone pessoa: cinza se nao atribuido, azul com nome se atribuido)
  2. Linha de urgencia: "ATRASADO" vermelho bold se passou prazo, ou contagem regressiva "2h 45min" na cor de urgencia
  3. Barra de progresso fina (4px): cinza vazio, preenchimento na cor de urgencia
  4. Linha inferior: percentual "33%" + "300/900 pecas" em texto pequeno cinza
- **D-11:** Card NAO mostra contador de pedidos — so pecas

### Responsividade mobile (<768px)
- **D-12:** Colunas viram secoes verticais colapsaveis com header (badge metodo + chevron)
- **D-13:** Cards listados verticalmente dentro de cada secao, 1 card full-width
- **D-14:** Por padrao: metodos com cards atrasados ou urgentes ficam expandidos, demais colapsados
- **D-15:** Toque no card abre modal (UIUX-05)

### Modal de itens do card
- **D-16:** Modal igual para todos os roles (admin, lider, separador, fardista). Todos tem acesso as acoes
- **D-17:** Conteudo: lista de itens com SKU, quantidade necessaria (NAO quantidade do fardo), status (pendente/separado/parcial/nao encontrado)
- **D-18:** NAO mostrar endereco no modal
- **D-19:** SKU agregado por card — sem detalhar por pedido individual
- **D-20:** Apenas 2 botoes de acao por item:
  1. Confirmar quantidade: abre numpad popup, separador digita quantidade. Se igual a necessaria = completo. Se menor = parcial automatico (sem botao separado de Parcial)
  2. "Nao Tem": dispara cascata (busca fardo alternativo ou envia para Transformacao)
- **D-21:** Itens bloqueados (AGUARDAR FARDISTA) exibem badge e botoes desabilitados
- **D-22:** Ordenacao dinamica na lista: itens disponiveis (prateleira + fardos entregues) no TOPO, itens bloqueados (AGUARDAR FARDISTA) no FINAL. Quando fardo entregue, item sobe automaticamente
- **D-23:** Quando SKU tem multiplos fardos reservados, cada fardo aparece como linha separada com quantidade necessaria especifica. Linhas desbloqueiam individualmente
- **D-24:** Linha de prateleira (diferenca entre demanda e fardos) fica sempre desbloqueada desde o inicio

### Numpad dedicado (UIUX-06)
- **D-25:** Numpad simples: digitos 0-9, backspace, botao Confirmar verde. Mostra quantidade necessaria como referencia. Sem botoes +/-

### Atribuicao
- **D-26:** Botao Atribuir no card abre modal de selecao de usuarios (separadores para prateleira, fardistas para fardos)
- **D-27:** Atribuicao de cards (prateleira): um card por vez — lider clica Atribuir individualmente
- **D-28:** Atribuicao de fardos: selecao multipla via checkboxes na tela de Fardos, atribuir todos ao mesmo fardista (feature para Phase 6)
- **D-29:** Separador/fardista so ve cards atribuidos a ele. Cards sem atribuicao so aparecem para lider/admin
- **D-30:** Separador/fardista ve todos os seus cards atribuidos na mesma tela, organizados por urgencia

### Acoes do lider
- **D-31:** Lider so atribui e acompanha. Sem acoes em lote, sem reordenacao manual nesta fase

### Impressao PDF
- **D-32:** Botao "Imprimir" dentro do modal do card (footer do modal)
- **D-33:** PDF com lista de itens para checklist manual: grupo de envio, tipo, importacao, tabela com SKU, quantidade, espaco para check manual

### Realtime
- **D-34:** Atualizacoes em tempo real via Supabase subscription. Barra de progresso e contagem atualizam instantaneamente. Lider ve sem refresh

### Sistema de urgencia
- **D-35:** Contagem regressiva usa prazo fixo do grupo de envio (Shopee SPX = 11h, etc.), NAO prazo individual do pedido
- **D-36:** Ao chegar a zero: contagem some, texto "ATRASADO" vermelho bold aparece. Borda fica vermelha. Card vai para o topo da coluna
- **D-37:** Transicoes de cor (verde -> amarelo -> vermelho) instantaneas com flash/pulso para chamar atencao

### Cores dos marketplaces
- **D-38:** Shopee (SPX e Xpress): #ee4d2d (laranja)
- **D-39:** Mercado Livre (Flex e Coleta): #ffe600 (amarelo) com texto preto
- **D-40:** TikTok Shop: #25F4EE (ciano) com texto preto
- **D-41:** Shein: #000000 (preto) com texto branco

### Cores de urgencia
- **D-42:** Atrasado: borda #dc2626 (vermelho) + texto "ATRASADO" vermelho
- **D-43:** Urgente (<2h): borda #eab308 (amarelo) + contagem amarela
- **D-44:** Ok (>2h): borda #16a34a (verde) + contagem verde
- **D-45:** Concluido (100%): borda verde opaca + sem contagem

### Design system e tokens
- **D-46:** Fonte Inter com pesos: Regular (400) corpo, Semibold (600) contagem/numeros, Bold (700) badges/titulos
- **D-47:** Tokens de cor via CSS variables + Tailwind extend: --shopee, --ml, --tiktok, --shein mapeados como bg-shopee, text-ml, etc.
- **D-48:** Sem dark mode — so tema claro. Design minimalista preto e branco
- **D-49:** Componentes reutilizaveis a criar: OrderCard, UrgencyBadge, ProgressBar, ItemModal — base para Phases 6-9

### Tipografia (referencia)
- **D-50:** Badge do metodo: uppercase, font-weight 700, font-size 0.75rem
- **D-51:** Numero da importacao: font-size 0.75rem, font-weight 600, cor cinza
- **D-52:** Contagem regressiva: font-weight 600
- **D-53:** Pecas: font-size 0.75rem, color muted

### Claude's Discretion
- Animacao exata do card ao mover para CONCLUIDOS (tipo fade/slide, duracao)
- Tamanho e posicao exatos do modal (full-screen mobile, centered desktop)
- Scroll interno do modal quando lista de itens e longa
- Design exato do numpad (tamanho botoes, cores, posicionamento)
- Implementacao interna dos componentes (estado, hooks)
- Design do modal de selecao de usuario para atribuicao
- Tipografia e espacamento nao especificados explicitamente

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — CARD-01 a CARD-09 (cards), UIUX-01 a UIUX-06 (design system)

### Upstream context
- `.planning/phases/04-estoque-e-reserva-de-fardos/04-CONTEXT.md` — D-06 a D-12 (regra fardo vs prateleira, subset sum, reserva vinculada ao SKU)
- `.planning/phases/02-autenticacao/02-CONTEXT.md` — roles e permissoes, AppShell layout

### Existing code
- `src/features/auth/lib/role-config.ts` — ROLE_ROUTES, NAV_ITEMS, ROLE_DEFAULTS
- `src/components/layout/app-shell.tsx` — AppShell com Sidebar + BottomTabs
- `src/components/ui/card.tsx` — Card shadcn/ui base (sera estendido, nao substituido)
- `src/components/ui/badge.tsx` — Badge shadcn/ui
- `src/features/upload/lib/envio-groups.ts` — classificacao de metodos de envio nos 6 grupos
- `src/features/fardos/utils/reservation-engine.ts` — motor de reserva de fardos
- `src/features/fardos/types.ts` — tipos de fardos e reservas
- `app/globals.css` — CSS variables do tema (shadcn/ui defaults)
- `tailwind.config.ts` — configuracao Tailwind com tokens shadcn/ui

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card`, `CardHeader`, `CardContent`, `CardFooter` (shadcn/ui) — base para OrderCard
- `Badge` (shadcn/ui) — base para UrgencyBadge e badges de marketplace
- `AppShell` com sidebar desktop + bottom tabs mobile — layout ja funciona
- `envio-groups.ts` — mapeamento de metodos de envio para 6 grupos com horarios de prazo
- `reservation-engine.ts` — motor de reserva que vincula fardos a SKUs
- `Sonner` para toasts — ja configurado

### Established Patterns
- Feature-based folder structure: `src/features/{domain}/components/`, `src/features/{domain}/lib/`
- Supabase client via `src/lib/supabase/` (browser e server)
- Tailwind + shadcn/ui CSS variables para theming
- Route groups: `app/(authenticated)/` com middleware de auth

### Integration Points
- `app/(authenticated)/fardos/page.tsx` — tela onde cards de fardos serao renderizados
- `app/(authenticated)/prateleira/page.tsx` — tela onde cards de prateleira serao renderizados
- `app/(authenticated)/dashboard/page.tsx` — consumira dados de progresso dos cards
- Supabase tables: `pedidos`, `progresso`, `reservas`, `atribuicoes` — dados que alimentam os cards
- Supabase Realtime subscriptions para updates em tempo real

</code_context>

<specifics>
## Specific Ideas

- Layout kanban estilo board com colunas por metodo de envio — referencia visual detalhada fornecida pelo usuario
- Borda lateral esquerda do card como indicador primario de urgencia (nao fundo ou borda completa)
- Tipo do pedido truncado como abreviacao: "K." (Kit), "U." (Unitario), "C." (Combo)
- Parcial detectado automaticamente pela quantidade digitada ser menor que a necessaria — sem botao separado de "Parcial"
- Quantidade no modal sempre mostra o que o separador PRECISA separar, nunca a quantidade do fardo
- Priorizacao default de fardos por prazo (card com prazo mais proximo recebe primeiro)

</specifics>

<deferred>
## Deferred Ideas

- **Priorizacao manual de fardos por metodo de envio:** Botao para lider reordenar prioridade de distribuicao de fardos por metodo de envio (ex: priorizar Shopee Xpress primeiro). Recomendado para fase apos Phase 7 (Cascata), com execucao pos-importacao via recalculo. Nova capacidade que afeta motor de reserva
- **Atribuicao multipla de fardos com checkboxes:** Feature para Phase 6 (Lista de Fardos) — checkboxes para selecionar multiplos fardos e atribuir ao mesmo fardista de uma vez

</deferred>

---

*Phase: 05-cards-e-ui-foundation*
*Context gathered: 2026-04-05*
