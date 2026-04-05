# Phase 6: Lista de Fardos - Research

**Researched:** 2026-04-05
**Domain:** UI de lista de fardos + integracao Google Sheets + Supabase realtime + PDF
**Confidence:** HIGH

## Summary

Esta fase transforma a tela de fardos de um KanbanBoard (atual) para uma lista plana dedicada com acoes OK e N/E. O escopo envolve: (1) migration do banco para adicionar campos na tabela `trafego_fardos` e reestruturar `fardos_nao_encontrados`, (2) 3-4 API routes novas (OK, N/E, atribuicao em lote, sincronizar estoque), (3) substituicao completa do `fardos-client.tsx` com lista plana, filtros, contadores e selecao multipla, (4) geracao de PDF adaptada para fardos.

O codigo existente ja possui todos os building blocks necessarios: `fetchStock` para leitura da planilha, `clearSheetRange` para apagar colunas, `findOptimalCombination` para busca de alternativo, `AssignModal` para atribuicao, `useCardsRealtime` para subscriptions, e `jsPDF + autoTable` para PDF. A complexidade principal esta nos fluxos transacionais OK e N/E que envolvem operacoes multi-sistema (Supabase + Google Sheets) com tratamento de erros robusto.

**Recomendacao principal:** Dividir em 4-5 planos sequenciais: migration DB primeiro, depois API routes (OK + N/E separados por complexidade), UI da lista, e PDF/atribuicao em lote por ultimo.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Tela de fardos e uma LISTA PLANA dedicada — NAO usa KanbanBoard, NAO agrupa por card
- **D-02:** Cada fardo e uma linha/card branco com borda lateral esquerda azul, fundo geral cinza claro
- **D-03:** Layout horizontal compacto: checkbox (lider), SKU bold, ID codigo IN, endereco com pin verde, badge status, quantidade "CONTEM", botoes OK/N/E
- **D-04/D-05:** Visao lider/admin ve todos os fardos com checkboxes; fardista ve apenas seus fardos sem checkboxes
- **D-06 a D-12:** Header com busca por codigo IN, filtros por status (tabs/chips), filtro por atribuicao, contadores, selecionar todos, ordenacao, botao sincronizar estoque
- **D-13:** Ordem padrao por endereco (A-Z) para otimizar rota do fardista
- **D-14 a D-19:** Fluxo OK direto sem confirmacao: buscar na planilha, copiar para trafego_fardos, apagar colunas F+ da planilha, dupla verificacao obrigatoria
- **D-20 a D-22:** Fluxo N/E: buscar alternativo (20% margem para normal, qualquer qtd para cascata), se nao achar registrar em fardos_nao_encontrados, cancelar reserva, liberar prateleira
- **D-23 a D-25:** Atribuicao em lote via barra flutuante + AssignModal com filterRole='fardista'
- **D-26 a D-28:** PDF com fardos selecionados ou todos, conteudo: codigo IN, SKU, endereco, qtd, nome do separador
- **D-29 a D-30:** Animacao suave, toast, spinner no botao, prevencao de clique duplo
- **D-31:** Migration para adicionar campos da planilha na tabela trafego_fardos

### Claude's Discretion
- Implementacao exata dos filtros (tabs vs chips vs dropdown)
- Animacao especifica da transicao de status
- Layout exato do PDF (fontes, espacamento, margens)
- Estrutura interna dos componentes e Route Handlers
- Debounce/throttle do campo de busca
- Design exato da barra flutuante de selecao

### Deferred Ideas (OUT OF SCOPE)
- Phase 8 (Baixa) foca em scanner de codigo IN + remover do trafego + liberar prateleira (limpeza de planilha ja acontece no OK desta phase)
- Phase 7 (Prateleira) trata o efeito visual de "AGUARDAR FARDISTA" desbloqueando — a logica backend (cancelar reserva + update progresso) e implementada aqui
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FARD-01 | Fardista ve lista de fardos agrupados por card com info: endereco, codigo IN, SKU, quantidade | Lista plana com dados de `reservas` JOIN `trafego_fardos`, componente FardoListItem |
| FARD-02 | Fardista pode marcar fardo como OK (encontrado, entra no trafego) | API route `/api/fardos/ok` — busca planilha, insere trafego_fardos, apaga colunas F+ |
| FARD-03 | Fardista pode marcar fardo como N/E — sistema busca alternativo; se nao achar, libera prateleira | API route `/api/fardos/ne` — reutiliza findOptimalCombination, cancela reserva, atualiza progresso |
| FARD-04 | Lista de fardos atualiza em tempo real via Supabase subscription | useCardsRealtime ja escuta trafego_fardos e reservas — reutilizar ou criar hook dedicado |
| FARD-05 | Lider pode atribuir fardistas a cards de fardos | Atribuicao em lote via barra flutuante + AssignModal existente, API route para atribuicao multipla |
| FARD-06 | Botao "Imprimir Fardos" gera PDF com codigo IN, SKU, endereco, quantidade, para quem entregar | jsPDF + autoTable ja instalados, adaptar pdf-generator.ts para formato de lista de fardos |
</phase_requirements>

## Standard Stack

### Core (ja instalado)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 14.2.35 | Framework + Route Handlers para API | Stack do projeto [VERIFIED: package.json] |
| @supabase/supabase-js | 2.101.1 | DB operations + realtime subscriptions | Stack do projeto [VERIFIED: package.json] |
| googleapis | 171.4.0 | Google Sheets API leitura/escrita | Stack do projeto [VERIFIED: package.json] |
| jspdf | 4.2.1 | Geracao de PDF client-side | Ja usado na Phase 5 [VERIFIED: package.json + npm registry] |
| jspdf-autotable | 5.0.7 | Tabelas no PDF | Ja usado na Phase 5 [VERIFIED: package.json + npm registry] |
| sonner | 2.0.7 | Toast notifications | Stack do projeto [VERIFIED: package.json] |
| lucide-react | 1.7.0 | Icones (MapPin, Check, X, Printer) | Stack do projeto [VERIFIED: package.json] |

### Nao precisa instalar nada novo
Todas as dependencias necessarias ja estao no projeto. Nao ha pacotes adicionais a instalar.

## Architecture Patterns

### Estrutura de arquivos proposta
```
src/features/fardos/
  types.ts                    # Adicionar FardoListItem, FardoStatus, etc.
  utils/
    stock-parser.ts           # EXISTENTE — reutilizar fetchStock
    subset-sum.ts             # EXISTENTE — reutilizar findOptimalCombination
    reservation-engine.ts     # EXISTENTE — reutilizar executeReservation
    stock-cache.ts            # EXISTENTE
  components/
    fardo-list.tsx            # NOVO — lista principal com filtros
    fardo-item.tsx            # NOVO — card individual do fardo
    fardo-filters.tsx         # NOVO — busca, filtros status/atribuicao
    fardo-counters.tsx        # NOVO — contadores no header
    selection-bar.tsx         # NOVO — barra flutuante de selecao
  hooks/
    use-fardos-data.ts        # NOVO — fetch de reservas + trafego para lista plana
  lib/
    fardo-pdf-generator.ts    # NOVO — PDF adaptado para fardos

app/api/fardos/
  ok/route.ts                 # NOVO — fluxo OK (planilha -> trafego -> limpar)
  ne/route.ts                 # NOVO — fluxo N/E (alternativo ou liberar)
  assign/route.ts             # NOVO — atribuicao em lote de fardista
  sync/route.ts               # NOVO — sincronizar estoque (reutiliza executeReservation)

app/(authenticated)/fardos/
  page.tsx                    # EXISTENTE — manter server component
  fardos-client.tsx           # EXISTENTE — SUBSTITUIR completamente

supabase/migrations/
  00005_trafego_fardos_campos.sql  # NOVO — migration
```

### Pattern 1: Lista Plana de Fardos (nao Kanban)
**O que:** Fardos exibidos como lista vertical plana, cada fardo e uma linha independente. Dados vem de `reservas` com status='reservado', enriquecidos com `trafego_fardos` e `atribuicoes`.
**Quando usar:** Sempre — decisao D-01 e irrevogavel.
**Fonte de dados:**
```typescript
// Buscar reservas ativas + trafego + atribuicoes
const { data: reservas } = await supabase
  .from('reservas')
  .select('*, trafego_fardos(*)')
  .eq('status', 'reservado')

// Enriquecer com atribuicoes de fardista
const { data: atribuicoes } = await supabase
  .from('atribuicoes')
  .select('card_key, user_id, users(nome)')
  .eq('tipo', 'fardista')
```

### Pattern 2: Operacao Transacional Multi-Sistema (OK)
**O que:** Fluxo OK envolve 3 sistemas: Google Sheets (leitura), Supabase (escrita), Google Sheets (escrita). Deve ser tratado como transacao com rollback parcial.
**Regra critica (D-18):** Se falhar ao inserir no trafego_fardos, NAO apagar da planilha. Se falhar ao apagar da planilha, manter registro no trafego_fardos (logar erro).
**Exemplo:**
```typescript
// [VERIFIED: google-sheets.ts existente]
// Passo 1: Buscar fardo na planilha
const rows = await getSheetData('Estoque')
const headerRow = rows[0]
// Normalizar headers com NFD (padrao stock-parser.ts)
const headers = headerRow.map(h => h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
const codigoCol = headers.indexOf('codigo upseller') // coluna H (index 7)

// Encontrar linha com match exato
const targetRow = rows.findIndex((row, i) =>
  i > 0 && row[codigoCol]?.toString().trim().toLowerCase() === codigo_in.trim().toLowerCase()
)
if (targetRow === -1) return { error: 'Fardo nao encontrado na planilha', status: 404 }

// Passo 2: Inserir no trafego_fardos (Supabase)
const { error: insertError } = await supabaseAdmin.from('trafego_fardos').insert({...})
if (insertError) return { error: 'Erro ao registrar fardo', status: 500 }

// Passo 3: Dupla verificacao + apagar colunas F+ (index 5 em diante)
// Re-ler a linha para confirmar que ainda bate
const recheck = await getSheetData(`Estoque!A${targetRow + 1}:N${targetRow + 1}`)
if (recheck[0][codigoCol] !== rows[targetRow][codigoCol]) {
  // Linha mudou — NAO apagar, logar erro
  console.error('[fardo-ok] Linha mudou entre leitura e escrita')
  return { error: 'Conflito na planilha', status: 409 }
}

// Limpar colunas F ate o final (preservar A-E)
await clearSheetRange(`Estoque!F${targetRow + 1}:N${targetRow + 1}`)
```

### Pattern 3: Busca de Alternativo no N/E
**O que:** Reutilizar `fetchStock` + `findOptimalCombination` para buscar fardo alternativo.
**Regra D-20:** Importacao normal usa margem 20% (subset sum padrao). Cascata aceita qualquer fardo do SKU.
**Exemplo:**
```typescript
// [VERIFIED: subset-sum.ts + stock-parser.ts existentes]
const stock = await fetchStock(true) // forceRefresh
const disponiveis = stock.filter(item =>
  item.sku === sku && !fardosJaReservados.has(item.codigo_in)
)

if (tipo === 'cascata') {
  // Qualquer fardo disponivel serve
  const alternativo = disponiveis[0]
  // ...reservar alternativo
} else {
  // Importacao normal — usar subset sum com 20%
  const resultado = findOptimalCombination(disponiveis, quantidade)
  // ...reservar se encontrou
}
```

### Anti-Patterns a Evitar
- **NAO usar KanbanBoard:** Decisao D-01 explicita. A tela e lista plana
- **NAO mostrar popup de confirmacao no OK:** Decisao D-14. Toque direto processa imediatamente
- **NAO apagar planilha antes de inserir no Supabase:** Decisao D-18. Transacao "segura" (inserir primeiro, apagar depois)
- **NAO usar polling:** Constraint do projeto. Apenas Supabase subscriptions
- **NAO criar novo canal de realtime:** useCardsRealtime ja escuta trafego_fardos e reservas. Reutilizar ou criar hook similar com o mesmo padrao (canal unico, multiplos handlers)

## Don't Hand-Roll

| Problem | Nao Construir | Usar Ao Inves | Por que |
|---------|---------------|---------------|---------|
| PDF | Template HTML + window.print | jsPDF + autoTable | Ja instalado, padrao Phase 5, consistencia |
| Subset sum | Loop simples | findOptimalCombination | DP otimizado com margem 20%, ja testado |
| Leitura planilha | fetch direto ao Sheets API | fetchStock + getSheetData | Cache, retry, normalizacao NFD |
| Realtime | SSE/polling customizado | Supabase subscriptions | Constraint do projeto |
| Toast | Alert/modal customizado | Sonner toast | Stack do projeto |
| Modal de atribuicao | Modal customizado | AssignModal existente | Ja implementado com filterRole |

## Common Pitfalls

### Pitfall 1: Race Condition na Planilha de Estoque
**O que da errado:** Dois fardistas clicam OK no mesmo fardo simultaneamente. Ambos leem a planilha, ambos veem o fardo, ambos tentam apagar.
**Por que acontece:** Google Sheets nao tem locking.
**Como evitar:** (1) Verificar no Supabase ANTES de tocar na planilha — se trafego_fardos ja tem um registro com este codigo_in + status='encontrado', rejeitar. (2) Dupla verificacao antes de apagar (D-17). (3) Spinner + desabilitar botao (D-30).
**Sinais de alerta:** Dois toasts de sucesso para o mesmo fardo.

### Pitfall 2: Headers da Planilha com Acentos
**O que da errado:** Busca por "CODIGO UPSELLER" nao encontra porque header real tem ou nao tem acento.
**Por que acontece:** Headers reais da planilha variam ("POSICAO" vs "POSICAO", "TRANFERENCIA" vs "TRANSFERENCIA").
**Como evitar:** Usar normalizacao NFD em AMBOS os lados da comparacao (padrao stock-parser.ts). [VERIFIED: stock-parser.ts usa normalizeHeader]
**Sinais de alerta:** 404 "Fardo nao encontrado" quando o fardo claramente existe.

### Pitfall 3: Apagar Colunas Erradas na Planilha
**O que da errado:** Apagar A-E (endereco fisico) ao inves de F-N (dados do fardo).
**Por que acontece:** Indexacao errada de colunas. Planilha tem: A=prioridade, B=prateleira, C=posicao, D=altura, E=endereco, F=SKU, G=quantidade, H=codigo upseller, I-N=campos diversos.
**Como evitar:** (1) Range explicito `Estoque!F{row}:N{row}` no clearSheetRange. (2) D-17 exige dupla verificacao antes de apagar. (3) PRESERVAR colunas A-E sempre. [VERIFIED: CONTEXT.md D-17]
**Sinais de alerta:** Enderecos desaparecem da planilha de estoque.

### Pitfall 4: API Routes de Cards Nao Existem
**O que da errado:** fardos-client.tsx atual faz fetch para `/api/cards/progress` e `/api/cards/assign` que NAO existem como route files.
**Por que acontece:** Foram referenciados no codigo da Phase 5 mas os route handlers nao foram criados como arquivos separados.
**Como evitar:** (1) Esta phase SUBSTITUI o fardos-client.tsx completamente, entao nao depende dessas rotas. (2) Criar rotas novas em `/api/fardos/` para a logica desta phase. [VERIFIED: Glob nao encontrou app/api/cards/]
**Sinais de alerta:** 404 em chamadas de API.

### Pitfall 5: Tabela fardos_nao_encontrados com Schema Insuficiente
**O que da errado:** D-22 exige registrar sku, quantidade, endereco, fardista_nome, fardista_id, timestamp — mas a tabela atual so tem codigo_in, trafego_id, reportado_por, reportado_em.
**Por que acontece:** Schema original foi desenhado antes das decisoes detalhadas da Phase 6.
**Como evitar:** Migration precisa adicionar colunas OU a logica pode buscar esses dados via JOIN com reservas/trafego_fardos. Recomendacao: usar dados do trafego_fardos via FK existente (trafego_id) para evitar duplicacao.
**Sinais de alerta:** Dados incompletos no registro de fardos nao encontrados.

### Pitfall 6: Fardista Sem Fardos Atribuidos Ve Tela Vazia
**O que da errado:** Fardista novo ou sem atribuicao ve tela completamente vazia sem explicacao.
**Por que acontece:** D-05 filtra apenas fardos atribuidos ao fardista.
**Como evitar:** Mostrar empty state claro: "Nenhum fardo atribuido. Aguarde o lider atribuir fardos para voce."

## Code Examples

### Migration SQL para trafego_fardos (D-31)
```sql
-- [VERIFIED: database.types.ts mostra campos atuais de trafego_fardos]
-- Campos existentes: id, reserva_id, codigo_in, sku, quantidade, endereco, status, fardista_id, created_at
-- Campos novos baseados em D-16 (colunas da planilha):

ALTER TABLE trafego_fardos
  ADD COLUMN IF NOT EXISTS prioridade TEXT,
  ADD COLUMN IF NOT EXISTS prateleira TEXT,
  ADD COLUMN IF NOT EXISTS posicao TEXT,
  ADD COLUMN IF NOT EXISTS altura TEXT,
  ADD COLUMN IF NOT EXISTS data_entrada TEXT,
  ADD COLUMN IF NOT EXISTS hora_entrada TEXT,
  ADD COLUMN IF NOT EXISTS operador TEXT,
  ADD COLUMN IF NOT EXISTS transferencia TEXT,
  ADD COLUMN IF NOT EXISTS data_transferencia TEXT,
  ADD COLUMN IF NOT EXISTS operador_transferencia TEXT,
  ADD COLUMN IF NOT EXISTS fardista_nome TEXT,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;

-- Publicacao realtime ja existe (20260405_realtime_publication.sql)
-- RLS de leitura ja existe (00001_initial_schema.sql)
-- Adicionar policy de escrita para trafego_fardos (via supabaseAdmin, nao precisa RLS write)
```

### Busca na Planilha com Match Exato (D-15)
```typescript
// [VERIFIED: stock-parser.ts usa mesma normalizacao NFD]
function findBaleInSheet(
  rows: string[][],
  headers: string[],
  codigoIn: string
): { rowIndex: number; rowData: string[] } | null {
  const codigoCol = headers.indexOf('codigo upseller')
  if (codigoCol === -1) return null

  const normalizedTarget = codigoIn.trim().toLowerCase()

  for (let i = 1; i < rows.length; i++) {
    const cellValue = rows[i][codigoCol]?.toString().trim().toLowerCase()
    if (cellValue === normalizedTarget) {
      return { rowIndex: i, rowData: rows[i] }
    }
  }
  return null
}
```

### Hook useFardosData (novo)
```typescript
// Padrao baseado em use-card-data.ts [VERIFIED: existente]
export function useFardosData(userId: string, userRole: string) {
  const [fardos, setFardos] = useState<FardoItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFardos = useCallback(async () => {
    const supabase = createClient()

    // Buscar reservas ativas com dados de trafego
    const [reservasRes, atribRes, trafegoRes] = await Promise.all([
      supabase.from('reservas').select('*').eq('status', 'reservado'),
      supabase.from('atribuicoes').select('card_key, user_id, users(nome)').eq('tipo', 'fardista'),
      supabase.from('trafego_fardos').select('*'),
    ])

    // Montar lista plana de fardos
    // Filtrar por role: fardista ve so seus, lider/admin ve todos
    // ...
  }, [userId, userRole])

  useCardsRealtime(fetchFardos) // Reutilizar hook existente
  return { fardos, loading }
}
```

### Geracao de PDF para Fardos (D-26/D-27)
```typescript
// Adaptar padrao de pdf-generator.ts [VERIFIED: existente com jsPDF + autoTable]
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generateFardosPdf(fardos: FardoItem[]): void {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text('Lista de Fardos', 14, 20)

  autoTable(doc, {
    startY: 30,
    head: [['Codigo IN', 'SKU', 'Endereco', 'Qtd', 'Entregar para']],
    body: fardos.map(f => [
      f.codigo_in,
      f.sku,
      f.endereco ?? '',
      String(f.quantidade),
      f.separador_nome ?? '---', // D-27: nome do separador do card
    ]),
    styles: { fontSize: 10 },
  })

  doc.save('fardos.pdf')
}
```

## State of the Art

| Abordagem Antiga | Abordagem Atual | Quando Mudou | Impacto |
|-------------------|-----------------|--------------|---------|
| KanbanBoard para fardos | Lista plana dedicada | Phase 6 (D-01) | Substituir fardos-client.tsx completamente |
| Limpeza planilha na Baixa (Phase 8) | Limpeza no OK (Phase 6) | Decisao CONTEXT.md deferred | Phase 8 fica mais simples |
| fardos_nao_encontrados sem detalhes | Registro completo com FK para trafego | Phase 6 (D-22) | Rastreabilidade de fardos nao encontrados |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | API routes de fardos devem estar em `/api/fardos/` (nao `/api/cards/`) | Architecture Patterns | Baixo — convencao de nomenclatura, facil ajustar |
| A2 | `clearSheetRange` funciona com range `Estoque!F{n}:N{n}` para limpar colunas F-N de uma linha | Code Examples | Medio — se range syntax errada, pode apagar dados errados. Validar com teste manual |
| A3 | Dados de fardos_nao_encontrados podem ser derivados via JOIN com trafego_fardos ao inves de duplicar colunas | Pitfall 5 | Baixo — FK ja existe, JOIN e seguro |
| A4 | O campo `reserva_id` em trafego_fardos permite correlacionar fardo com card (via reservas -> pedidos -> card_key) | Architecture Patterns | Medio — se a cadeia de FK quebrar, "entregar para" no PDF fica sem dado |

## Open Questions

1. **Como determinar se fardo e de "importacao normal" vs "cascata" no fluxo N/E?**
   - O que sabemos: D-20 diz regras diferentes para cada tipo. Pedidos tem campo `tipo` (unitario/kit/combo).
   - O que nao esta claro: "Cascata" nao e um tipo de pedido — e um tipo de reserva que surge quando separador marca parcial/N/E na prateleira. Na Phase 6, fardos N/E deveriam SEMPRE usar a regra de 20% (importacao normal) porque nao vem de cascata. Cascata so surge na Phase 7.
   - Recomendacao: Implementar apenas a busca com 20% margem (normal) na Phase 6. Quando Phase 7 criar reservas de cascata, adicionar flag `is_cascata` na reserva.

2. **Como vincular fardo ao separador do card para o PDF ("para quem entregar")?**
   - O que sabemos: Reservas tem `sku` e `importacao_numero`. Pedidos tem `card_key`. Atribuicoes tem `card_key` + `user_id`.
   - Chain: reserva.sku + reserva.importacao_numero -> pedidos.card_key -> atribuicoes.user_id -> users.nome
   - Recomendacao: Fazer JOIN no hook de dados para popular campo `separador_nome` em cada fardo.

3. **Fardos atribuidos vs nao atribuidos — como funciona a atribuicao?**
   - O que sabemos: D-23/D-24 descrevem atribuicao em lote via checkbox + AssignModal. Atribuicoes usam `card_key` + tipo='fardista'.
   - O que nao esta claro: Fardos sao atribuidos individualmente ou por card_key? CONTEXT.md diz "atribuir fardistas a cards de fardos" (FARD-05) — portanto atribuicao e por card_key, nao por fardo individual. Mas a lista e plana sem agrupamento por card.
   - Recomendacao: Selecao por checkbox seleciona fardos individuais (reservas), mas a atribuicao grupa pelo card_key. Ao atribuir fardista, todos os fardos do mesmo card_key ficam atribuidos.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.2 |
| Config file | vitest.config.ts |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FARD-01 | Lista de fardos monta dados corretos de reservas | unit | `npx vitest run src/features/fardos/utils/__tests__/fardo-list.test.ts -x` | Wave 0 |
| FARD-02 | Fluxo OK busca planilha, insere trafego, limpa colunas | unit | `npx vitest run src/features/fardos/utils/__tests__/fardo-ok.test.ts -x` | Wave 0 |
| FARD-03 | Fluxo N/E busca alternativo ou libera prateleira | unit | `npx vitest run src/features/fardos/utils/__tests__/fardo-ne.test.ts -x` | Wave 0 |
| FARD-04 | Realtime atualiza lista | manual-only | Requer Supabase rodando — verificar via UI | N/A |
| FARD-05 | Atribuicao em lote funciona | unit | `npx vitest run src/features/fardos/utils/__tests__/fardo-assign.test.ts -x` | Wave 0 |
| FARD-06 | PDF gera com campos corretos | unit | `npx vitest run src/features/fardos/__tests__/fardo-pdf.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green antes de `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/features/fardos/utils/__tests__/fardo-ok.test.ts` — logica do fluxo OK
- [ ] `src/features/fardos/utils/__tests__/fardo-ne.test.ts` — logica do fluxo N/E
- [ ] `src/features/fardos/__tests__/fardo-pdf.test.ts` — geracao de PDF (mock jsPDF como Phase 5)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | sim | getUser() + DB lookup de role (padrao Phase 2) |
| V3 Session Management | sim | JWT Supabase (padrao existente) |
| V4 Access Control | sim | Role check: fardista so ve seus fardos, lider/admin ve todos; API routes validam role |
| V5 Input Validation | sim | Validar codigo_in antes de buscar na planilha (trim, sanitize) |
| V6 Cryptography | nao | N/A nesta phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Fardista tenta OK em fardo de outro | Elevation | API verifica se fardo esta atribuido ao usuario (ou se admin/lider) |
| Manipulacao de codigo_in no request | Tampering | Validar codigo_in contra reservas existentes no Supabase antes de tocar planilha |
| Escrita nao autorizada na planilha | Tampering | API routes usam supabaseAdmin (service role), client nunca acessa planilha diretamente |
| Clique duplo no OK gerando duplicata | Tampering | Verificar se trafego_fardos ja tem registro com este codigo_in + status='encontrado' |

## Sources

### Primary (HIGH confidence)
- `src/features/fardos/utils/stock-parser.ts` — normalizacao NFD, fetchStock, cache
- `src/features/fardos/utils/subset-sum.ts` — findOptimalCombination com margem 20%
- `src/features/fardos/utils/reservation-engine.ts` — executeReservation com forceRefresh
- `src/lib/google-sheets.ts` — getSheetData, updateSheetData, clearSheetRange
- `src/features/cards/components/assign-modal.tsx` — AssignModal reutilizavel
- `src/features/cards/hooks/use-cards-realtime.ts` — hook de realtime
- `src/features/cards/lib/pdf-generator.ts` — padrao jsPDF + autoTable
- `supabase/migrations/00001_initial_schema.sql` — schema atual completo
- `supabase/migrations/00003_alter_reservas_schema.sql` — reservas por SKU
- `supabase/migrations/20260405_realtime_publication.sql` — publicacao realtime
- `src/types/database.types.ts` — tipos gerados do Supabase
- `package.json` — todas as dependencias verificadas

### Secondary (MEDIUM confidence)
- `.planning/phases/06-lista-de-fardos/06-CONTEXT.md` — 31 decisoes detalhadas do usuario

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — todas as libs ja estao instaladas e verificadas no package.json
- Architecture: HIGH — patterns existentes (hooks, API routes, realtime) bem documentados no codigo
- Pitfalls: HIGH — baseados em analise direta do codigo existente e schema do banco
- Fluxo OK transacional: MEDIUM — dupla verificacao + clearSheetRange precisa validacao manual do range syntax
- Fluxo N/E cascata: MEDIUM — pergunta aberta sobre quando cascata se aplica (provavelmente so Phase 7)

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stack estavel, nenhuma dependencia fast-moving)
