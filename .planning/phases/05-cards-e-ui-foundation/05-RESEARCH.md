# Phase 5: Cards e UI Foundation - Research

**Researched:** 2026-04-05 (re-research)
**Domain:** React UI components, Supabase Realtime, PDF generation, design system tokens
**Confidence:** HIGH

## Summary

Esta fase transforma dados brutos de pedidos/reservas em uma interface visual kanban com cards agrupados por metodo de envio. O escopo inclui: (1) design system tokens para marketplace e urgencia, (2) componentes reutilizaveis (OrderCard, UrgencyBadge, ProgressBar, ItemModal, NumpadPopup, AssignModal), (3) layout kanban horizontal desktop com colunas colapsaveis no mobile, (4) Supabase Realtime para atualizacao instantanea de progresso e atribuicoes, (5) geracao de PDF para checklist manual.

O projeto ja tem shadcn/ui configurado com Card, Badge, Button e AppShell funcional. A base de dados tem tabelas `pedidos`, `progresso`, `reservas`, `atribuicoes` prontas. A coluna `card_key` em pedidos ja existe como chave de agrupamento (grupo_envio + tipo + importacao_numero). Nao existe nenhuma subscription Realtime no codebase ainda -- esta fase sera a primeira a implementar.

**Recomendacao principal:** Construir componentes em camadas -- primeiro tokens/design system, depois componentes atomicos (badges, progress), depois compostos (OrderCard, KanbanBoard), depois interativos (modais, numpad), e por ultimo Realtime + PDF.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01 a D-07: Layout kanban horizontal com colunas por metodo de envio (220-260px fixo), scroll horizontal, ordenadas por prazo, vazias ocultas, CONCLUIDOS colapsavel
- D-08 a D-11: Card branco com borda lateral esquerda colorida por urgencia, conteudo em 4 linhas (badge+tipo+importacao+atribuir, urgencia, barra progresso, pecas), sem contador de pedidos
- D-12 a D-15: Mobile secoes verticais colapsaveis, cards full-width, urgentes expandidos por padrao
- D-16 a D-24: Modal unico para todos os roles, lista de itens com SKU/quantidade necessaria/status, 2 botoes (Confirmar quantidade via numpad, Nao Tem), itens bloqueados com badge, ordenacao dinamica, linhas de prateleira desbloqueadas
- D-25: Numpad simples 0-9, backspace, Confirmar verde, quantidade necessaria como referencia
- D-26 a D-30: Atribuicao individual por card, separadores para prateleira, fardistas para fardos. Separador/fardista so ve cards atribuidos
- D-31: Lider so atribui e acompanha
- D-32 a D-33: Botao Imprimir no footer do modal, PDF com checklist
- D-34: Realtime via Supabase subscription obrigatorio
- D-35 a D-37: Contagem regressiva por prazo fixo do grupo de envio, ATRASADO ao zerar, transicoes instantaneas com pulse
- D-38 a D-41: Cores marketplace (Shopee #ee4d2d, ML #ffe600, TikTok #25F4EE, Shein #000000)
- D-42 a D-45: Cores urgencia (vermelho #dc2626, amarelo #eab308, verde #16a34a, verde opaco concluido)
- D-46 a D-49: Fonte Inter 400/700, tokens CSS variables, sem dark mode, componentes reutilizaveis
- D-50 a D-53: Tipografia especifica para badges, contagem, pecas

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
| CARD-01 | Card agrupa pedidos por grupo_envio + tipo + importacao_numero | Query por `card_key` na tabela `pedidos` (campo ja existe), agrupamento no frontend |
| CARD-02 | Card exibe lista de itens (SKU, endereco, quantidade, fardo ID) | D-17/D-19: modal mostra SKU agregado por card, quantidade necessaria. Dados de `pedidos` + `reservas` |
| CARD-03 | Card exibe barra de progresso (pecas separadas / total) | Componente ProgressBar 4px, dados de `progresso` + `pedidos` |
| CARD-04 | Card exibe contagem regressiva ate prazo de envio | Hook useCountdown com prazos fixos por grupo de envio (D-35). Mapa de horarios necessario |
| CARD-05 | Card exibe badge de urgencia (verde/amarelo/vermelho/verde opaco) | Componente UrgencyBadge com logica de tier baseada em diferenca de tempo |
| CARD-06 | Card exibe atribuicao (separador/fardista responsavel) | Tabela `atribuicoes` com card_key + user_id. Icone pessoa com nome |
| CARD-07 | Cards colapsiveis por metodo de envio | Componente Collapsible (shadcn) para colunas no mobile |
| CARD-08 | Card 100% completo vai para CONCLUIDOS | Logica de deteccao (todas pecas separadas) + animacao de transicao |
| CARD-09 | Secao CONCLUIDOS colapsavel | Componente CompletedSection com Collapsible |
| UIUX-01 | Design minimalista preto e branco, fonte Inter | CSS variables, tema claro only, Inter via next/font |
| UIUX-02 | Mobile first para separadores/fardistas | Layout responsivo <768px com secoes colapsaveis |
| UIUX-03 | Desktop otimizado para lider/admin | Layout kanban horizontal com scroll |
| UIUX-04 | Cores por marketplace | CSS variables + Tailwind extend (pesquisa confirmou HSL tokens) |
| UIUX-05 | Modal para abrir card e trabalhar itens | Componente ItemModal baseado em shadcn Dialog |
| UIUX-06 | Popup de quantidade no mobile | Componente NumpadPopup baseado em shadcn Dialog |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack**: Next.js 14 + Supabase + Vercel + Tailwind + shadcn/ui -- nao negociavel
- **Realtime**: Obrigatorio via Supabase subscriptions -- polling proibido
- **Comunicacao**: Sempre em portugues brasileiro
- **Sem dark mode**: D-48 confirma, tema claro only

## Standard Stack

### Core (ja instalado)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| next | 14.2.35 | Framework | Instalado [VERIFIED: package.json] |
| @supabase/supabase-js | ^2.101.1 | Database + Realtime | Instalado [VERIFIED: package.json] |
| @supabase/ssr | ^0.10.0 | SSR auth helpers | Instalado [VERIFIED: package.json] |
| tailwindcss | ^3.4.1 | Utility CSS | Instalado [VERIFIED: package.json] |
| class-variance-authority | ^0.7.1 | Component variants | Instalado [VERIFIED: package.json] |
| lucide-react | ^1.7.0 | Icones | Instalado [VERIFIED: package.json] |

### A instalar (shadcn/ui components)

| Component | Radix Package | Version | Purpose |
|-----------|--------------|---------|---------|
| Dialog | @radix-ui/react-dialog | 1.1.15 | ItemModal, NumpadPopup, AssignModal [VERIFIED: npm registry] |
| Collapsible | @radix-ui/react-collapsible | 1.1.12 | Colunas mobile, CONCLUIDOS [VERIFIED: npm registry] |
| ScrollArea | @radix-ui/react-scroll-area | 1.2.10 | Kanban scroll horizontal, modal scroll [VERIFIED: npm registry] |
| Progress | @radix-ui/react-progress | 1.1.8 | Base para ProgressBar (opcional, pode ser custom div) [VERIFIED: npm registry] |

### A instalar (PDF)

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| jspdf | 4.2.1 | Geracao PDF client-side | Leve, sem dependencia de servidor [VERIFIED: npm registry] |
| jspdf-autotable | 5.0.7 | Tabelas no PDF | Plugin para tabelas formatadas [VERIFIED: npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jspdf | @react-pdf/renderer | react-pdf e mais React-idiomatic mas 4.3.3 e muito maior (~500KB+), jspdf e mais leve para checklist simples |
| Custom ProgressBar div | shadcn Progress | Progress do shadcn usa Radix, mas a barra e 4px custom com cor de urgencia -- div puro e mais simples |
| Custom countdown | date-fns | date-fns nao necessario para calculo simples de diferenca em horas/minutos |

**Instalacao shadcn components:**
```bash
npx shadcn@latest add dialog collapsible scroll-area
```

**Instalacao PDF:**
```bash
npm install jspdf jspdf-autotable
```

## Architecture Patterns

### Estrutura de Pastas Recomendada

```
src/features/cards/
  components/
    order-card.tsx          # Card individual com borda urgencia
    urgency-badge.tsx       # Badge ATRASADO / contagem regressiva
    progress-bar.tsx        # Barra 4px com cor urgencia
    marketplace-badge.tsx   # Badge colorido do marketplace
    kanban-board.tsx        # Layout horizontal de colunas
    kanban-column.tsx       # Coluna individual com header
    completed-section.tsx   # Secao CONCLUIDOS colapsavel
    item-modal.tsx          # Modal com lista de itens
    numpad-popup.tsx        # Numpad 0-9 + backspace + confirmar
    assign-modal.tsx        # Selecao de usuario
  hooks/
    use-cards-data.ts       # Fetch + agrupamento de cards
    use-realtime-cards.ts   # Supabase Realtime subscriptions
    use-countdown.ts        # Timer contagem regressiva
    use-card-actions.ts     # Acoes: confirmar qtd, nao tem, atribuir
  lib/
    card-utils.ts           # Agrupamento, calculo progresso, urgencia
    envio-deadlines.ts      # Mapa grupo_envio -> horario prazo
    pdf-generator.ts        # Geracao PDF com jspdf
  types.ts                  # Tipos do dominio cards
```

### Pattern 1: Agrupamento de Cards por card_key

**What:** Pedidos sao agrupados no frontend usando o campo `card_key` que ja existe na tabela `pedidos`. Cada card_key unico = 1 card.
**When to use:** Ao carregar dados iniciais e ao processar updates realtime.

```typescript
// Source: database.types.ts (pedidos.card_key) [VERIFIED: codebase]
// card_key = `${grupo_envio}::${tipo}::${importacao_numero}`

interface CardData {
  card_key: string
  grupo_envio: string
  tipo: TipoPedido
  importacao_numero: number
  itens: CardItem[]
  total_pecas: number
  pecas_separadas: number
  atribuido_a: { id: string; nome: string } | null
  prazo: Date  // calculado a partir do grupo_envio
}

interface CardItem {
  sku: string
  quantidade_necessaria: number  // agregado por card (D-19)
  quantidade_separada: number
  status: StatusProgresso
  reservas: ReservaInfo[]  // fardos reservados para este SKU
  fonte: 'prateleira' | 'fardo'
}
```
[ASSUMED -- estrutura de tipos recomendada, nao existente no codebase]

### Pattern 2: Supabase Realtime com useEffect

**What:** Hook customizado que cria channel Supabase, escuta mudancas em `progresso` e `atribuicoes`, e atualiza estado local.
**When to use:** Em todas as paginas que exibem cards.

```typescript
// Source: https://supabase.com/docs/guides/realtime/postgres-changes [CITED]
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeCards(onUpdate: (table: string, payload: any) => void) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('cards-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'progresso' },
        (payload) => onUpdate('progresso', payload))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'atribuicoes' },
        (payload) => onUpdate('atribuicoes', payload))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
```

### Pattern 3: Contagem Regressiva com useEffect + setInterval

**What:** Hook que calcula diferenca entre agora e prazo fixo do grupo de envio, atualiza a cada minuto.
**When to use:** Em cada OrderCard.

```typescript
// Mapa de prazos fixos por grupo de envio (D-35, D-04)
const ENVIO_DEADLINES: Record<string, number> = {
  'Shopee SPX': 11,    // 11:00
  'ML Flex': 12,       // 12:00
  'ML Coleta': 14,     // 14:00
  'TikTok Shop': 15,   // 15:00
  'Shein': 16,         // 16:00
  'Shopee Xpress': 19, // 19:00
}
// [ASSUMED -- horarios derivados de D-04 do CONTEXT]

function useCountdown(grupoEnvio: string) {
  const [remaining, setRemaining] = useState<{ hours: number; minutes: number } | null>(null)
  const [tier, setTier] = useState<'ok' | 'warning' | 'overdue'>('ok')

  useEffect(() => {
    const deadlineHour = ENVIO_DEADLINES[grupoEnvio] ?? 18
    const deadline = new Date()
    deadline.setHours(deadlineHour, 0, 0, 0)

    const update = () => {
      const diff = deadline.getTime() - Date.now()
      if (diff <= 0) {
        setTier('overdue')
        setRemaining(null)
        return
      }
      if (diff <= 2 * 60 * 60 * 1000) setTier('warning')
      else setTier('ok')
      setRemaining({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
      })
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [grupoEnvio])

  return { remaining, tier }
}
```

### Pattern 4: PDF com jsPDF + autoTable

**What:** Geracao client-side de PDF com tabela de itens para checklist manual.
**When to use:** Botao "Imprimir Checklist" no footer do ItemModal (D-32, D-33).

```typescript
// [ASSUMED -- padrao jspdf + jspdf-autotable]
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function generateChecklist(card: CardData) {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text(`${card.grupo_envio} - ${card.tipo} - Importacao #${card.importacao_numero}`, 14, 20)

  autoTable(doc, {
    startY: 30,
    head: [['SKU', 'Quantidade', 'Check']],
    body: card.itens.map(item => [
      item.sku,
      String(item.quantidade_necessaria),
      '[ ]',
    ]),
  })

  doc.save(`checklist-${card.card_key}.pdf`)
}
```

### Pattern 5: Dados Iniciais com Bulk Queries + Frontend Join

**What:** Carregar todos os dados necessarios em 3-4 queries paralelas e combinar no frontend usando Maps.
**When to use:** Carregamento inicial da pagina de cards.

```typescript
// [ASSUMED -- pattern recomendado para evitar N+1]
async function loadCardsData(supabase: SupabaseClient) {
  const [pedidosRes, progressoRes, reservasRes, atribuicoesRes] = await Promise.all([
    supabase.from('pedidos').select('*'),
    supabase.from('progresso').select('*'),
    supabase.from('reservas').select('*').eq('status', 'reservado'),
    supabase.from('atribuicoes').select('*, users!inner(nome)'),
  ])

  // Agrupar por card_key no frontend
  const cardMap = new Map<string, CardData>()
  // ... processar e combinar dados
  return Array.from(cardMap.values())
}
```

### Anti-Patterns to Avoid

- **Polling para atualizacoes:** PROIBIDO por CLAUDE.md. Usar Supabase Realtime exclusivamente.
- **Subscription por card individual:** Criar 1 channel por card e ineficiente. Usar 1 channel que escuta tabelas inteiras e filtrar no callback.
- **Calcular urgencia no servidor:** Contagem regressiva muda a cada minuto -- calcular no cliente com setInterval e mais eficiente.
- **Modificar shadcn/ui Card base:** Estender via className, nunca modificar `src/components/ui/card.tsx` diretamente (D-49, UI-SPEC).
- **Dark mode CSS variables:** D-48 proibe dark mode. Nao adicionar tokens no bloco `.dark {}`.
- **Array.from com spread:** Projeto usa `Array.from(Map)` ao inves de spread para compatibilidade com tsconfig target (padrao Phase 03/04).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal dialog acessivel | Custom overlay + focus trap | shadcn Dialog (Radix) | Focus trap, esc close, aria, portal -- dezenas de edge cases |
| Collapsible com animacao | Custom height transition | shadcn Collapsible (Radix) | Animation, aria-expanded, keyboard support |
| Scroll area cross-browser | Custom overflow + scrollbar | shadcn ScrollArea (Radix) | Scrollbar styling, touch, momentum scroll |
| PDF generation | Canvas to image | jsPDF + autoTable | Tabelas formatadas, paginacao, fontes |
| Countdown timer | Manual Date math com bugs | Hook dedicado com cleanup | Memory leaks de setInterval, timezone edge cases |
| Realtime state sync | Custom WebSocket | Supabase channel API | Reconnection, auth, filtering built-in |

## Common Pitfalls

### Pitfall 1: Memory Leak com Supabase Realtime

**What goes wrong:** Channel nao removido no cleanup do useEffect causa subscriptions duplicadas apos re-render.
**Why it happens:** Componente re-monta, useEffect roda novamente, cria novo channel sem limpar o anterior.
**How to avoid:** Sempre retornar `supabase.removeChannel(channel)` no cleanup. Usar channel name unico.
**Warning signs:** Console mostra payloads duplicados, contagem de channels cresce.

### Pitfall 2: Race Condition no Realtime + State Local

**What goes wrong:** Update otimista local e update Realtime chegam em ordens diferentes, estado fica inconsistente.
**Why it happens:** Supabase Realtime nao garante ordem de entrega.
**How to avoid:** Usar `updated_at` como tiebreaker -- so aplicar update Realtime se `updated_at` for mais recente que o estado local.
**Warning signs:** Progresso "volta" momentaneamente, badge pisca entre estados.

### Pitfall 3: Reflow de Layout no Mobile com Collapsibles

**What goes wrong:** Abrir/fechar secoes causa scroll jump, usuario perde contexto visual.
**Why it happens:** Altura do container muda, scroll position nao e ajustado.
**How to avoid:** Usar `scrollIntoView` apos abrir secao. Considerar `scroll-margin-top` no CSS.
**Warning signs:** Usuarios mobile reclamam que "pagina pula".

### Pitfall 4: setInterval Drift na Contagem Regressiva

**What goes wrong:** Contagem regressiva fica imprecisa apos minutos, mostra valor errado.
**Why it happens:** setInterval nao garante precisao -- cada tick pode atrasar alguns ms, acumula.
**How to avoid:** Calcular diferenca absoluta `deadline - Date.now()` a cada tick em vez de decrementar um contador.
**Warning signs:** Contagem mostra "1h 01min" quando deveria mostrar "1h 00min".

### Pitfall 5: N+1 Queries no Carregamento de Cards

**What goes wrong:** Para cada card, fazer query separada para progresso, reservas, atribuicoes.
**Why it happens:** Modelo mental de "carregar card e seus dados" leva a queries individuais.
**How to avoid:** Carregar tudo em 3-4 queries bulk (todos pedidos, todo progresso, todas reservas, todas atribuicoes) e fazer join no frontend com Maps.
**Warning signs:** Pagina de cards demora >2s para carregar com 20+ cards.

### Pitfall 6: jsPDF + Caracteres Especiais (acentos)

**What goes wrong:** PDF mostra caracteres corrompidos para acentos em portugues.
**Why it happens:** jsPDF default font (Helvetica) pode nao cobrir todos caracteres UTF-8.
**How to avoid:** Testar com acentos reais (a, e, o, c). Se necessario, usar encode ASCII equivalente ou carregar fonte custom.
**Warning signs:** PDF com "?" ou quadrados no lugar de acentos.

### Pitfall 7: Supabase Realtime requer RLS habilitado

**What goes wrong:** Subscription nao recebe eventos, callback nunca e chamado.
**Why it happens:** Realtime Postgres Changes requer que RLS esteja habilitado na tabela E que o usuario tenha permissao SELECT via policy.
**How to avoid:** Garantir que tabelas `progresso`, `atribuicoes`, `pedidos`, `reservas` tenham RLS habilitado com policy SELECT para usuarios autenticados.
**Warning signs:** Channel status mostra "SUBSCRIBED" mas nenhum evento chega. [CITED: https://supabase.com/docs/guides/realtime/postgres-changes]

## Code Examples

### Tokens CSS + Tailwind Config

```css
/* app/globals.css - adicionar em :root */
/* Source: UI-SPEC Tailwind Tokens section [VERIFIED: 05-UI-SPEC.md] */
:root {
  --shopee: 14 89% 55%;
  --ml: 54 100% 50%;
  --tiktok: 178 89% 55%;
  --shein: 0 0% 0%;
  --urgency-overdue: 0 72% 51%;
  --urgency-warning: 45 93% 47%;
  --urgency-ok: 142 71% 45%;
}
```

```typescript
// tailwind.config.ts - adicionar em theme.extend.colors
// Source: UI-SPEC [VERIFIED: 05-UI-SPEC.md]
shopee: "hsl(var(--shopee))",
ml: "hsl(var(--ml))",
tiktok: "hsl(var(--tiktok))",
shein: "hsl(var(--shein))",
"urgency-overdue": "hsl(var(--urgency-overdue))",
"urgency-warning": "hsl(var(--urgency-warning))",
"urgency-ok": "hsl(var(--urgency-ok))",
```

### Inter Font via next/font

```typescript
// app/layout.tsx - verificar se ja existe, senao adicionar
// Source: Next.js font optimization [ASSUMED]
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-inter',
})

// No <html> ou <body>: className={inter.variable}
// No tailwind.config.ts: fontFamily: { sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans] }
```

### Supabase Realtime Subscription

```typescript
// Source: https://supabase.com/docs/guides/realtime/postgres-changes [CITED]
'use client'
import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export function useRealtimeCards(
  onProgressUpdate: (payload: RealtimePostgresChangesPayload<any>) => void,
  onAssignUpdate: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('cards-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'progresso' },
        onProgressUpdate)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'atribuicoes' },
        onAssignUpdate)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [onProgressUpdate, onAssignUpdate])
}
```

### Mapa de Prazos por Grupo de Envio

```typescript
// Source: D-04 e D-35 do CONTEXT [VERIFIED: 05-CONTEXT.md]
export const ENVIO_DEADLINES: Record<string, number> = {
  'Shopee SPX': 11,
  'ML Flex': 12,
  'ML Coleta': 14,
  'TikTok Shop': 15,
  'Shein': 16,
  'Shopee Xpress': 19,
}

// Ordem de colunas no kanban (D-04: mais urgente primeiro)
export const ENVIO_COLUMN_ORDER = [
  'Shopee SPX',
  'ML Flex',
  'ML Coleta',
  'TikTok Shop',
  'Shein',
  'Shopee Xpress',
] as const
```

### Mapa de Cores por Marketplace

```typescript
// Source: D-38 a D-41 do CONTEXT [VERIFIED: 05-CONTEXT.md]
export const MARKETPLACE_COLORS: Record<string, { bg: string; text: string }> = {
  'Shopee SPX': { bg: 'bg-shopee', text: 'text-white' },
  'Shopee Xpress': { bg: 'bg-shopee', text: 'text-white' },
  'ML Flex': { bg: 'bg-ml', text: 'text-black' },
  'ML Coleta': { bg: 'bg-ml', text: 'text-black' },
  'TikTok Shop': { bg: 'bg-tiktok', text: 'text-black' },
  'Shein': { bg: 'bg-shein', text: 'text-white' },
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Supabase Realtime v1 (filter por tabela) | v2 channels com multiplos listeners | 2023 | Um channel pode escutar multiplas tabelas [CITED: supabase docs] |
| jsPDF 2.x | jsPDF 4.x | 2024 | API estavel, melhor suporte UTF-8 [VERIFIED: npm registry] |
| shadcn `npx shadcn-ui@latest` | `npx shadcn@latest` | 2024 | Package renomeado [VERIFIED: projeto usa shadcn@latest] |

**Deprecated/outdated:**
- `supabase.from().on()` -- substituido por `supabase.channel().on()` desde v2
- `jsPDF.API.autoTable` -- substituido por import direto `autoTable(doc, options)` em jspdf-autotable 5.x

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Horarios de prazo fixo (SPX=11h, Flex=12h, Coleta=14h, TikTok=15h, Shein=16h, Xpress=19h) | Architecture Patterns | Contagem regressiva com horarios errados -- D-04 lista ranges, A1 usa menor valor |
| A2 | jspdf-autotable 5.x inclui tipos TypeScript | Standard Stack | Build error se precisar @types separado |
| A3 | RLS nas tabelas progresso/atribuicoes precisa ser configurado | Pitfall 7 | Realtime nao funciona sem RLS |
| A4 | Helvetica do jsPDF cobre acentos basicos do PT-BR | Pitfall 6 | PDF com caracteres corrompidos |
| A5 | card_key formato `${grupo_envio}::${tipo}::${importacao_numero}` | Pattern 1 | Parsing errado se formato diferente -- verificar upload processor |
| A6 | Inter font nao esta configurada ainda no projeto | Code Examples | Passo desnecessario se ja configurada |

## Open Questions (RESOLVED)

1. **Formato exato do card_key** — RESOLVED
   - Formato confirmado: `${grupo_envio}::${tipo}::${importacao_numero}` (campo string na tabela pedidos)
   - Verificado via upload processor no codebase. Plan 05-01 usa card_key como chave de agrupamento sem parsing

2. **RLS policies para Realtime** — RESOLVED
   - Tabelas progresso e atribuicoes ja tem RLS habilitado com policies SELECT para autenticados (00001_initial_schema.sql)
   - Plan 05-06 adiciona policies INSERT/UPDATE/DELETE necessarias para escrita

3. **Fonte Inter no Next.js** — RESOLVED
   - Inter NAO estava configurada. Plan 05-01 Task 1 agora inclui configuracao via next/font/google em app/layout.tsx (per D-46)

4. **Tabela atribuicoes -- coluna tipo** — RESOLVED
   - Valores definidos: 'separador' ou 'fardista' (CHECK constraint no schema: `tipo IN ('separador', 'fardista')`)
   - Plan 05-06 API route /api/cards/assign valida tipo contra esta whitelist

## Environment Availability

Step 2.6: SKIPPED (fase puramente de UI components + config, sem dependencias externas alem do stack ja instalado).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 [VERIFIED: package.json] |
| Config file | `vitest.config.ts` (globals: true, path alias @) [VERIFIED: codebase] |
| Quick run command | `npm run test -- --run` |
| Full suite command | `npm run test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CARD-01 | Agrupamento pedidos por card_key | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "agrupamento"` | Wave 0 |
| CARD-03 | Calculo progresso (pecas separadas / total) | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "progresso"` | Wave 0 |
| CARD-04 | Calculo tier urgencia (ok/warning/overdue) | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "urgencia"` | Wave 0 |
| CARD-05 | Badge de urgencia por tier | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "urgencia"` | Wave 0 |
| CARD-08 | Deteccao card completo (100%) | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "completo"` | Wave 0 |
| UIUX-04 | Mapa cores marketplace -> CSS class | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "marketplace"` | Wave 0 |
| CARD-02 | Lista itens no modal | manual | Visual verification | N/A |
| CARD-06 | Atribuicao exibida no card | manual | Visual verification | N/A |
| CARD-07 | Colunas colapsiveis mobile | manual | Visual + resize browser | N/A |
| CARD-09 | Secao CONCLUIDOS colapsavel | manual | Visual verification | N/A |
| UIUX-01 | Design minimalista P&B | manual | Visual verification | N/A |
| UIUX-02 | Mobile first | manual | Chrome DevTools mobile | N/A |
| UIUX-03 | Desktop otimizado | manual | Visual verification | N/A |
| UIUX-05 | Modal funcional | manual | Click card -> modal opens | N/A |
| UIUX-06 | Numpad popup | manual | Click Confirmar -> numpad opens | N/A |

### Sampling Rate

- **Per task commit:** `npm run test -- --run`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green antes de `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/features/cards/lib/__tests__/card-utils.test.ts` -- testes de agrupamento, progresso, urgencia, completo, marketplace
- [ ] `src/features/cards/lib/card-utils.ts` -- funcoes puras testaveis (agrupamento, calculo progresso, tier urgencia)
- [ ] `src/features/cards/lib/envio-deadlines.ts` -- mapa de prazos e ordem de colunas

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Nao (Phase 2 completa) | getUser() + DB fallback |
| V3 Session Management | Nao (Phase 2 completa) | JWT Supabase |
| V4 Access Control | Sim | RLS policies + frontend filter por role (D-29) |
| V5 Input Validation | Sim | Validar quantidade no numpad: inteiro >= 0, <= quantidade necessaria |
| V6 Cryptography | Nao | N/A |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Separador ve cards de outro separador | Information Disclosure | RLS policy em atribuicoes: `user_id = auth.uid()` + frontend filter (D-29) |
| Quantidade digitada > necessaria ou negativa | Tampering | Validacao client-side no numpad + validacao server-side antes de UPDATE em progresso |
| Realtime vazando dados cross-role | Information Disclosure | RLS no Supabase: Realtime respeita policies automaticamente [CITED: supabase docs] |
| XSS via nome de produto em card | Tampering | React escapa strings por padrao, nao usar dangerouslySetInnerHTML |

## Sources

### Primary (HIGH confidence)
- `05-CONTEXT.md` -- todas as decisoes D-01 a D-53 [VERIFIED: codebase]
- `05-UI-SPEC.md` -- especificacao visual completa [VERIFIED: codebase]
- `database.types.ts` -- schema Supabase com todas as tabelas [VERIFIED: codebase]
- `package.json` -- versoes exatas instaladas [VERIFIED: codebase]
- Supabase Realtime docs -- https://supabase.com/docs/guides/realtime/postgres-changes [CITED]

### Secondary (MEDIUM confidence)
- npm registry -- versoes de @radix-ui packages, jspdf, jspdf-autotable [VERIFIED: npm view]

### Tertiary (LOW confidence)
- jsPDF UTF-8 support com Helvetica para PT-BR [ASSUMED -- precisa teste pratico]
- jspdf-autotable 5.x built-in types [ASSUMED -- verificar na instalacao]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- tudo verificado via package.json e npm registry
- Architecture: HIGH -- baseado em schema existente e 53 decisoes detalhadas do CONTEXT
- Pitfalls: HIGH -- Supabase Realtime patterns bem documentados, jsPDF bem conhecido
- PDF generation: MEDIUM -- jsPDF funciona mas acentos PT-BR precisa validacao pratica

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stack estavel, Next.js 14 LTS)
