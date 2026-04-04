# Phase 1: Infraestrutura - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Toda a fundação técnica está pronta para desenvolvimento — projeto Next.js 14 roda localmente com Tailwind e shadcn/ui, Supabase conectado com todas as 8 tabelas criadas e acessíveis, push no GitHub dispara deploy automático no Vercel e o site abre, Google Sheets API responde com dados da planilha de estoque via conta de serviço.

</domain>

<decisions>
## Implementation Decisions

### Estrutura de pastas
- **D-01:** Organização feature-based — app/ para rotas com route groups, src/features/ agrupa por domínio (auth/, upload/, fardos/, prateleira/, baixa/, dashboard/, users/), cada feature com seus components/, hooks/, utils/
- **D-02:** Usar src/ directory — app/ na raiz para rotas, src/ para todo código de aplicação (features, lib, types, components/ui)
- **D-03:** shadcn/ui em src/components/ui/, código compartilhado em src/lib/, tipos globais em src/types/

### Schema do banco
- **D-04:** Gerenciamento via Supabase CLI migrations — `supabase migration new` para SQL versionado no repositório, schema replicável e auditável
- **D-05:** Row Level Security (RLS) ativado desde a criação das tabelas — policies básicas por role desde o início para evitar retrabalho na Phase 2
- **D-06:** Tipos TypeScript auto-gerados via `supabase gen types typescript` — type-safe desde o início, atualização automática com cada migration

### Google Sheets API
- **D-07:** Integração via Route Handlers do Next.js (app/api/) — credenciais ficam no servidor, nunca expostas ao cliente
- **D-08:** Credenciais da conta de serviço Google serializadas em variável de ambiente (GOOGLE_SERVICE_ACCOUNT_KEY) — funciona local e no Vercel sem arquivos extras

### Deploy e ambientes
- **D-09:** Dois projetos Supabase separados — um para desenvolvimento/local e outro para produção no Vercel
- **D-10:** Conjunto mínimo de env vars desde o início: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_SHEET_ID. Template .env.example no repositório

### Claude's Discretion
- Configuração exata do Tailwind (theme, plugins)
- Configuração do ESLint e Prettier
- Estrutura interna das migrations SQL (ordem de criação das tabelas, constraints)
- Configuração do Supabase CLI (config.toml)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and in REQUIREMENTS.md (SETUP-01 through SETUP-04).

### Project context
- `.planning/PROJECT.md` — Schema do banco (8 tabelas), Google Sheet ID, mapeamento ERP, grupos de envio
- `.planning/REQUIREMENTS.md` §Setup — SETUP-01 a SETUP-04 com critérios de aceitação

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Nenhum — projeto greenfield, repositório vazio

### Established Patterns
- Nenhum — esta fase estabelece os padrões iniciais que todas as fases seguintes seguirão

### Integration Points
- Supabase: client-side (anon key) e server-side (service role key) — dois clientes distintos
- Google Sheets API: server-side only via Route Handlers
- Vercel: deploy automático via GitHub push

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Stack é fixa e bem definida.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-infraestrutura*
*Context gathered: 2026-04-04*
