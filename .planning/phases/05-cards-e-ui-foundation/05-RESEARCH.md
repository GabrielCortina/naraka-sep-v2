# Phase 5: Cards e UI Foundation - Research

**Researched:** 2026-04-05
**Domain:** React UI Components, Design System, Supabase Realtime, PDF Generation
**Confidence:** HIGH

## Summary

Esta fase constroi a camada de apresentacao do sistema: cards de pedidos organizados em kanban por metodo de envio, com sistema de urgencia (contagem regressiva), barras de progresso, modais de interacao e design system com tokens de cor por marketplace. A base de dados ja existe (pedidos, progresso, reservas, atribuicoes) e os dados sao alimentados pelas phases 3 e 4. O trabalho e primariamente frontend com 10 componentes novos, extensao do Tailwind config com tokens de cor customizados, e subscriptions Supabase para realtime.

A stack ja esta definida e instalada: Next.js 14, Tailwind, shadcn/ui, Supabase, Lucide React, Inter font. Faltam instalar 4 componentes shadcn (Dialog, Collapsible, ScrollArea, Progress) e 1 biblioteca nova (jsPDF + jspdf-autotable para impressao PDF). Todos os padroes de codigo (feature-based folders, Supabase client/server, AppShell layout) estao estabelecidos nas phases anteriores.

**Recomendacao principal:** Construir de baixo para cima -- tokens/design system primeiro, depois componentes atomicos (ProgressBar, UrgencyBadge, MarketplaceBadge), depois compostos (OrderCard, KanbanColumn, KanbanBoard), depois modais (ItemModal, NumpadPopup, AssignModal), e por ultimo realtime + PDF.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01 a D-07: Layout kanban horizontal com colunas por metodo de envio (~220-260px fixas), scroll horizontal, ordenadas por prazo, colunas vazias ocultas, secao CONCLUIDOS colapsavel
- D-08 a D-11: Card com fundo branco, borda lateral esquerda colorida por urgencia, conteudo em 4 linhas (header, urgencia, progresso, pecas), sem contador de pedidos
- D-12 a D-15: Mobile (<768px) colunas viram secoes colapsaveis verticais, cards full-width, auto-expand urgentes
- D-16 a D-24: Modal igual para todos os roles, lista de itens por SKU agregado, 2 botoes (Confirmar + Nao Tem), itens bloqueados com badge, ordenacao dinamica, multiplos fardos como linhas separadas
- D-25: Numpad simples 0-9 + backspace + Confirmar verde, sem +/-
- D-26 a D-31: Atribuicao individual por card, separador/fardista so ve cards atribuidos, sem atribuicao em lote nesta fase
- D-32 a D-33: Impressao PDF com checklist manual no footer do modal
- D-34 a D-37: Realtime via Supabase subscription, contagem regressiva por prazo fixo do grupo, transicoes instantaneas com pulse
- D-38 a D-45: Cores de marketplace e urgencia definidas com valores exatos
- D-46 a D-53: Design system Inter 400/700, tokens CSS variables, sem dark mode, componentes reutilizaveis

### Claude's Discretion
- Animacao exata do card ao mover para CONCLUIDOS (tipo fade/slide, duracao)
- Tamanho e posicao exatos do modal (full-screen mobile, centered desktop)
- Scroll interno do modal quando lista de itens e longa
- Design exato do numpad (tamanho botoes, cores, posicionamento)
- Implementacao interna dos componentes (estado, hooks)
- Design do modal de selecao de usuario para atribuicao
- Tipografia e espacamento nao especificados explicitamente

### Deferred Ideas (OUT OF SCOPE)
- Priorizacao manual de fardos por metodo de envio (pos-Phase 7)
- Atribuicao multipla de fardos com checkboxes (Phase 6)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CARD-01 | Cada card agrupa pedidos por grupo_envio + tipo + importacao_numero | Query Supabase por card_key (ja existe na tabela pedidos), componente OrderCard |
| CARD-02 | Card exibe lista de itens (SKU, endereco, quantidade, fardo ID se aplicavel) | ItemModal com dados de pedidos + reservas joinados |
| CARD-03 | Card exibe barra de progresso (pecas separadas / total) | ProgressBar componente com dados de progresso table |
| CARD-04 | Card exibe contagem regressiva ate o prazo de envio | Hook useCountdown com prazo fixo por grupo de envio |
| CARD-05 | Card exibe badge de urgencia (verde >2h, amarelo <2h, vermelho atrasado, verde opaco concluido) | UrgencyBadge componente com logica de tier |
| CARD-06 | Card exibe atribuicao (separador/fardista responsavel) | Join atribuicoes + users tables |
| CARD-07 | Cards sao colapsiveis por metodo de envio | KanbanColumn com Collapsible (mobile), colunas fixas (desktop) |
| CARD-08 | Card 100% completo vai automaticamente para secao CONCLUIDOS | Logica de filtragem reativa, animacao CSS |
| CARD-09 | Secao CONCLUIDOS e colapsavel no final da lista | CompletedSection com Collapsible |
| UIUX-01 | Design minimalista preto e branco, fonte Inter | Tokens CSS, Inter ja configurada, tema claro fixo |
| UIUX-02 | Mobile first para separadores/fardistas | Layout responsivo <768px com secoes colapsaveis |
| UIUX-03 | Desktop otimizado para lider/admin | Kanban horizontal com colunas fixas |
| UIUX-04 | Cores por marketplace: Shopee #ee4d2d, ML #ffe600, TikTok #25F4EE, Shein #000000 | CSS variables + Tailwind extend |
| UIUX-05 | Modal para abrir card e trabalhar itens | ItemModal baseado em shadcn Dialog |
| UIUX-06 | Popup de quantidade no mobile | NumpadPopup baseado em shadcn Dialog |
</phase_requirements>

## Standard Stack

### Core (ja instalado)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.35 | Framework | Stack definido no projeto [VERIFIED: package.json] |
| @supabase/supabase-js | 2.101.1 | Database + Realtime | Stack definido, realtime via subscriptions [VERIFIED: package.json] |
| Tailwind CSS | 3.4.x | Styling | Stack definido [VERIFIED: package.json] |
| shadcn/ui | default preset | Component base | Stack definido, Card/Badge/Button ja instalados [VERIFIED: components.json] |
| Lucide React | 1.7.0 | Icons | Padrao shadcn, ja usado no projeto [VERIFIED: package.json] |
| class-variance-authority | 0.7.1 | Variant styling | Padrao shadcn, usado em Badge [VERIFIED: package.json] |

### A Instalar
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| jspdf | 4.2.1 | Geracao PDF client-side | Leve, sem servidor, API imperativa para tabelas simples [VERIFIED: npm registry] |
| jspdf-autotable | 5.0.7 | Tabelas em PDF | Plugin jsPDF para tabelas formatadas automaticamente [VERIFIED: npm registry] |

### Componentes shadcn a adicionar (via CLI)
| Component | Radix Package | Purpose |
|-----------|---------------|---------|
| Dialog | @radix-ui/react-dialog | Base para ItemModal, NumpadPopup, AssignModal |
| Collapsible | @radix-ui/react-collapsible | Secoes colapsaveis mobile + CONCLUIDOS |
| ScrollArea | @radix-ui/react-scroll-area | Scroll horizontal kanban + scroll interno modal |
| Progress | @radix-ui/react-progress | Base opcional para ProgressBar (ou custom 4px div) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jspdf | @react-pdf/renderer | Mais pesado (~500KB), API declarativa JSX -- overkill para checklist simples |
| jspdf | window.print() | Zero dependencias, mas sem controle de layout PDF e UX ruim no mobile |
| Custom ProgressBar | shadcn Progress | shadcn Progress usa Radix com height default maior; custom div de 4px e mais simples e exato |

**Installation:**
```bash
npm install jspdf jspdf-autotable
npx shadcn@latest add dialog collapsible scroll-area progress
```

## Architecture Patterns

### Estrutura de Pastas (feature-based, padrao do projeto)
```
src/features/cards/
  components/
    order-card.tsx          # Card individual com urgencia/progresso
    urgency-badge.tsx       # Badge/contagem regressiva
    progress-bar.tsx        # Barra 4px com cor urgencia
    marketplace-badge.tsx   # Badge colorido do metodo de envio
    kanban-board.tsx        # Layout kanban completo
    kanban-column.tsx       # Coluna individual
    completed-section.tsx   # Secao CONCLUIDOS colapsavel
    item-modal.tsx          # Modal de itens do card
    numpad-popup.tsx        # Numpad para confirmar quantidade
    assign-modal.tsx        # Modal de atribuicao
  hooks/
    use-countdown.ts        # Contagem regressiva por prazo do grupo
    use-cards-realtime.ts   # Subscription Supabase para cards
    use-card-data.ts        # Query e agrupamento de dados
  lib/
    card-utils.ts           # Funcoes utilitarias (agrupamento, urgency tier)
    deadline-config.ts      # Prazos por grupo de envio (constantes)
    pdf-generator.ts        # Geracao de PDF com jsPDF
  types.ts                  # Tipos do dominio cards
```

### Pattern 1: Card Key como Chave de Agrupamento
**O que:** A coluna `card_key` na tabela `pedidos` ja agrupa por `grupo_envio + tipo + importacao_numero`. Usar como chave primaria de agrupamento. [VERIFIED: database.types.ts]
**Quando usar:** Sempre que precisar agrupar pedidos em cards.
**Exemplo:**
```typescript
// Query pedidos agrupados por card_key
const { data: pedidos } = await supabase
  .from('pedidos')
  .select('*, progresso(*)')
  .order('card_key')

// Agrupar em Map
const cardMap = new Map<string, Pedido[]>()
for (const p of pedidos) {
  const list = cardMap.get(p.card_key) ?? []
  list.push(p)
  cardMap.set(p.card_key, list)
}
```

### Pattern 2: Supabase Realtime Subscription com useEffect
**O que:** Subscription para postgres_changes em tabelas relevantes. [CITED: supabase.com/docs/guides/realtime/postgres-changes]
**Quando usar:** Para updates em tempo real de progresso, atribuicoes.
**Exemplo:**
```typescript
// Source: Supabase Realtime docs
useEffect(() => {
  const channel = supabase
    .channel('cards-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'progresso' },
      (payload) => {
        // Update local state
        handleProgressUpdate(payload)
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'atribuicoes' },
      (payload) => {
        handleAssignmentUpdate(payload)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [supabase])
```

### Pattern 3: Contagem Regressiva com requestAnimationFrame
**O que:** Hook que calcula tempo restante ate prazo fixo do grupo de envio.
**Quando usar:** Cada card exibe countdown atualizado a cada minuto.
**Exemplo:**
```typescript
// Prazos fixos por grupo de envio (D-35)
const DEADLINES: Record<string, number> = {
  'Shopee SPX': 11,    // 11h
  'ML Flex': 12,       // 12h
  'ML Coleta': 14,     // 14h (range 14-16, usar mais cedo)
  'TikTok Shop': 15,   // 15h (range 15-18)
  'Shein': 16,         // 16h
  'Shopee Xpress': 19, // 19h
}

function getUrgencyTier(grupoEnvio: string): 'overdue' | 'warning' | 'ok' | 'done' {
  const deadlineHour = DEADLINES[grupoEnvio]
  if (!deadlineHour) return 'ok'
  const now = new Date()
  const deadline = new Date()
  deadline.setHours(deadlineHour, 0, 0, 0)
  const diffMs = deadline.getTime() - now.getTime()
  if (diffMs <= 0) return 'overdue'
  if (diffMs <= 2 * 60 * 60 * 1000) return 'warning' // <2h
  return 'ok'
}
```

### Pattern 4: Visibilidade por Role (D-29, D-30)
**O que:** Separador/fardista so ve cards atribuidos a ele. Lider/admin ve tudo.
**Quando usar:** Na query de cards, filtrar por atribuicao conforme role.
**Exemplo:**
```typescript
// Para separador/fardista: filtrar por cards atribuidos
if (userRole === 'separador' || userRole === 'fardista') {
  const { data: atribuicoes } = await supabase
    .from('atribuicoes')
    .select('card_key')
    .eq('user_id', userId)
  const cardKeys = atribuicoes?.map(a => a.card_key) ?? []
  // Filtrar pedidos por card_keys atribuidos
}
// Para admin/lider: sem filtro
```

### Anti-Patterns to Avoid
- **Polling para realtime:** CLAUDE.md proibe polling -- usar Supabase subscriptions obrigatoriamente
- **Modificar componentes shadcn/ui base:** Estender via className, nunca editar card.tsx ou badge.tsx originais (D-49, UI-SPEC)
- **Calcular urgencia no servidor:** Contagem regressiva depende de `new Date()` do cliente -- calcular no browser
- **Dark mode:** D-48 explicita sem dark mode, nao incluir .dark CSS variables para tokens novos

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dialog/Modal | Custom overlay + portal | shadcn Dialog (Radix) | Acessibilidade, focus trap, ESC close, overlay click |
| Collapse animation | CSS max-height hack | shadcn Collapsible (Radix) | Animacao suave, acessibilidade, state management |
| Horizontal scroll area | overflow-x-auto div | shadcn ScrollArea (Radix) | Scrollbar styling consistente, mobile touch |
| PDF com tabelas | Template string manual | jspdf-autotable | Paginacao automatica, quebra de linha, alinhamento |
| Countdown timer | setInterval manual | Hook com useEffect + intervalo de 1min | Limpeza automatica, re-render controlado |

**Insight chave:** Radix UI (via shadcn) resolve acessibilidade e edge cases de interacao que levariam dias para implementar manualmente. A prioridade e usar os primitivos e compor.

## Common Pitfalls

### Pitfall 1: Supabase Realtime nao recebe eventos
**O que da errado:** Subscription conecta mas nao recebe postgres_changes.
**Por que acontece:** Supabase Realtime precisa de `supabase_realtime` publication habilitada na tabela.
**Como evitar:** Verificar que as tabelas `progresso`, `atribuicoes`, `reservas` estao adicionadas a publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE progresso;
ALTER PUBLICATION supabase_realtime ADD TABLE atribuicoes;
```
**Sinais de alerta:** Subscription retorna SUBSCRIBED mas callback nunca executa.

### Pitfall 2: Memory leak em subscriptions
**O que da errado:** Multiplas subscriptions abertas ao navegar entre paginas.
**Por que acontece:** useEffect cleanup nao remove channel corretamente.
**Como evitar:** Sempre chamar `supabase.removeChannel(channel)` no cleanup do useEffect. Usar um unico channel com multiplos `.on()` ao inves de multiplos channels.
**Sinais de alerta:** Performance degradada ao longo do tempo, logs duplicados.

### Pitfall 3: Contagem regressiva nao atualiza visualmente
**O que da errado:** Timer mostra valor estale ou nao transiciona de cor.
**Por que acontece:** setInterval com closure stale sobre state.
**Como evitar:** Usar useRef para armazenar deadline timestamp, setInterval de 60s para forcar re-render, ou requestAnimationFrame com check de minuto mudou.
**Sinais de alerta:** Countdown mostra mesmo valor por varios minutos.

### Pitfall 4: Kanban horizontal nao faz scroll no mobile
**O que da errado:** Scroll horizontal nao funciona ou conflita com scroll vertical.
**Por que acontece:** CSS overflow conflitante entre container pai e scroll area.
**Como evitar:** No mobile (<768px) usar layout vertical colapsavel (D-12), NAO kanban horizontal. So usar scroll horizontal no desktop.
**Sinais de alerta:** Conteudo cortado ou impossivel de acessar no celular.

### Pitfall 5: PDF gerado em branco ou corrompido
**O que da errado:** jsPDF gera arquivo vazio ou com encoding errado.
**Por que acontece:** Caracteres especiais PT-BR (acentos, cedilha) sem font embeddida.
**Como evitar:** Usar fonte default do jsPDF (Helvetica) que suporta caracteres latinos basicos. Para acentos, jsPDF 4.x suporta UTF-8 nativamente. Testar com dados reais contendo acentos.
**Sinais de alerta:** Caracteres aparecem como "?" ou quadrados no PDF.

### Pitfall 6: Radix Dialog interfere com BottomTabs no mobile
**O que da errado:** Modal aberto nao cobre bottom tabs ou z-index conflita.
**Por que acontece:** shadcn Dialog usa portal para document.body, mas bottom tabs pode ter z-index alto.
**Como evitar:** Garantir que Dialog overlay tem z-index maior que BottomTabs (z-50 vs z-40).
**Sinais de alerta:** Bottom tabs visiveis atraves do overlay do modal.

## Code Examples

### Tokens CSS customizados (D-47, UI-SPEC)
```css
/* Source: 05-UI-SPEC.md, D-38 a D-45 */
:root {
  /* Marketplace colors */
  --shopee: 14 89% 55%;
  --ml: 54 100% 50%;
  --tiktok: 178 89% 55%;
  --shein: 0 0% 0%;
  /* Urgency colors */
  --urgency-overdue: 0 72% 51%;
  --urgency-warning: 45 93% 47%;
  --urgency-ok: 142 71% 45%;
  --urgency-done: 142 71% 45%;
}
```

### Tailwind extend (D-47)
```typescript
// Source: 05-UI-SPEC.md
// Em tailwind.config.ts, dentro de theme.extend.colors:
shopee: "hsl(var(--shopee))",
ml: "hsl(var(--ml))",
tiktok: "hsl(var(--tiktok))",
shein: "hsl(var(--shein))",
"urgency-overdue": "hsl(var(--urgency-overdue))",
"urgency-warning": "hsl(var(--urgency-warning))",
"urgency-ok": "hsl(var(--urgency-ok))",
```

### OrderCard estrutura (D-08 a D-11)
```typescript
// Estrutura visual do card conforme CONTEXT.md D-10
<Card className={cn(
  "border-l-4 bg-white",
  urgencyTier === 'overdue' && "border-l-urgency-overdue",
  urgencyTier === 'warning' && "border-l-urgency-warning",
  urgencyTier === 'ok' && "border-l-urgency-ok",
  urgencyTier === 'done' && "border-l-urgency-ok/40",
)}>
  {/* Linha 1: badge metodo + tipo + importacao + atribuir */}
  {/* Linha 2: "ATRASADO" ou contagem regressiva */}
  {/* Linha 3: barra progresso 4px */}
  {/* Linha 4: "33%" + "300/900 pecas" */}
</Card>
```

### PDF checklist (D-32, D-33)
```typescript
// Source: jspdf + jspdf-autotable docs
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function generateChecklist(cardData: CardData) {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text(`${cardData.grupo_envio} - ${cardData.tipo} - Importacao #${cardData.importacao_numero}`, 14, 20)

  autoTable(doc, {
    startY: 30,
    head: [['SKU', 'Qtd', 'Check']],
    body: cardData.items.map(item => [
      item.sku,
      String(item.quantidade),
      '[ ]'  // Espaco para check manual
    ]),
  })

  doc.save(`checklist-${cardData.card_key}.pdf`)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| polling para updates | Supabase Realtime postgres_changes | Supabase v2 (2023) | Obrigatorio no projeto (CLAUDE.md) |
| react-beautiful-dnd para kanban | CSS grid/flex + scroll nativo | 2024 (rbd deprecated) | Nao precisamos de drag-drop, so layout |
| jsPDF 2.x manual tables | jspdf-autotable 5.x | 2024 | Tabelas automaticas com paginacao |
| Custom modal | Radix Dialog (via shadcn) | Padrao shadcn | Focus trap, acessibilidade built-in |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Prazos fixos do envio-groups (11h SPX, 12h Flex, etc.) sao corretos para contagem regressiva | Architecture Patterns - Pattern 3 | Contagem regressiva incorreta, urgencia errada |
| A2 | `card_key` na tabela pedidos ja segue formato `grupo_envio::tipo::importacao_numero` | Architecture Patterns - Pattern 1 | Agrupamento precisa de logica adicional |
| A3 | jsPDF 4.2.1 suporta UTF-8 nativo para caracteres PT-BR sem font customizada | Common Pitfalls - Pitfall 5 | Acentos quebrados no PDF |
| A4 | Tabelas progresso e atribuicoes ja tem Realtime publication habilitada | Common Pitfalls - Pitfall 1 | Realtime nao funciona sem migration SQL |
| A5 | ML Coleta usa 14h como prazo (range 14-16h no CONTEXT) | Code Examples | Urgencia pode ser calculada com hora errada |

## Open Questions

1. **Formato exato do card_key**
   - O que sabemos: coluna `card_key` existe na tabela `pedidos` (tipo string)
   - O que falta: confirmar formato exato (separador, ordem dos campos)
   - Recomendacao: verificar dados existentes ou codigo do Phase 3 que gera o card_key

2. **Realtime publication nas tabelas**
   - O que sabemos: Supabase Realtime precisa de publication habilitada por tabela
   - O que falta: confirmar se `progresso` e `atribuicoes` ja estao na publication
   - Recomendacao: incluir migration SQL no plano para garantir

3. **Prazo exato de ML Coleta e TikTok Shop**
   - O que sabemos: CONTEXT.md menciona ranges (14-16h e 15-18h)
   - O que falta: qual hora exata usar para contagem regressiva
   - Recomendacao: usar hora mais cedo do range (14h e 15h) como prazo conservador, conforme D-04

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` (ja existe, globals: true, alias @/) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CARD-01 | Agrupamento por card_key | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "agrupamento"` | Wave 0 |
| CARD-03 | Calculo progresso pecas | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "progresso"` | Wave 0 |
| CARD-04 | Contagem regressiva e tier | unit | `npx vitest run src/features/cards/hooks/__tests__/use-countdown.test.ts` | Wave 0 |
| CARD-05 | Badge urgencia por tier | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "urgency"` | Wave 0 |
| CARD-08 | Card 100% vai para CONCLUIDOS | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "completed"` | Wave 0 |
| UIUX-04 | Cores marketplace corretas | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "marketplace"` | Wave 0 |
| CARD-02 | Modal itens renderiza | manual-only | Requer browser, componente React | - |
| CARD-06 | Atribuicao exibida | manual-only | Requer Supabase + UI | - |
| CARD-07 | Collapsible funciona | manual-only | Interacao UI | - |
| CARD-09 | Secao CONCLUIDOS colapsavel | manual-only | Interacao UI | - |
| UIUX-01 | Design minimalista | manual-only | Visual review | - |
| UIUX-02 | Mobile first | manual-only | Responsive testing | - |
| UIUX-03 | Desktop otimizado | manual-only | Visual review | - |
| UIUX-05 | Modal abre card | manual-only | Interacao UI | - |
| UIUX-06 | Numpad mobile | manual-only | Touch testing | - |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green + manual visual review

### Wave 0 Gaps
- [ ] `src/features/cards/lib/__tests__/card-utils.test.ts` -- cobre CARD-01, CARD-03, CARD-05, CARD-08, UIUX-04
- [ ] `src/features/cards/hooks/__tests__/use-countdown.test.ts` -- cobre CARD-04
- [ ] `src/features/cards/lib/__tests__/pdf-generator.test.ts` -- cobre D-32/D-33

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | nao | Ja implementado Phase 2 |
| V3 Session Management | nao | Ja implementado Phase 2 |
| V4 Access Control | sim | Filtro por role no server component + RLS Supabase |
| V5 Input Validation | sim | Validacao quantidade no numpad (>= 0, <= necessaria) |
| V6 Cryptography | nao | Sem dados sensiveis nesta fase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Separador ve cards de outro usuario | Information Disclosure | RLS no Supabase + filtro server-side por user_id |
| Quantidade negativa ou absurda no numpad | Tampering | Validacao client + server: 0 <= qty <= quantidade_necessaria |
| Atribuicao por usuario nao-lider | Elevation of Privilege | Verificar role antes de INSERT em atribuicoes (RLS policy) |

## Project Constraints (from CLAUDE.md)

- **Tech stack nao negociavel:** Next.js 14 + Supabase + Vercel + Tailwind + shadcn/ui
- **Realtime obrigatorio via Supabase subscriptions** -- polling proibido
- **Margem fardos 20%** -- percentual, nao fixo
- **Comunicacao em portugues brasileiro**
- **Estoque externo em Google Sheets** -- nunca migra
- **Hospedagem Vercel** com deploy automatico via GitHub

## Sources

### Primary (HIGH confidence)
- `package.json` -- versoes exatas de todas as dependencias instaladas
- `src/types/database.types.ts` -- schema completo do Supabase (tabelas, colunas, tipos)
- `05-CONTEXT.md` -- 53 decisoes do usuario (D-01 a D-53)
- `05-UI-SPEC.md` -- contrato visual completo (tokens, layout, interacao)
- `components.json` -- configuracao shadcn/ui do projeto
- `tailwind.config.ts` -- configuracao atual do Tailwind

### Secondary (MEDIUM confidence)
- [Supabase Realtime Postgres Changes docs](https://supabase.com/docs/guides/realtime/postgres-changes) -- pattern de subscription
- [npm registry jspdf 4.2.1](https://www.npmjs.com/package/jspdf) -- versao atual verificada
- [npm registry jspdf-autotable 5.0.7](https://www.npmjs.com/package/jspdf-autotable) -- versao atual verificada

### Tertiary (LOW confidence)
- Suporte UTF-8 nativo no jsPDF 4.x para PT-BR (baseado em training data, nao verificado em docs oficiais)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- tudo verificado em package.json e npm registry
- Architecture: HIGH -- baseado em codigo existente do projeto e CONTEXT.md detalhado
- Pitfalls: MEDIUM -- baseado em experiencia com Supabase Realtime e jsPDF, parcialmente verificado
- Design system: HIGH -- UI-SPEC completo com tokens exatos

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stack estavel, decisoes locked)
