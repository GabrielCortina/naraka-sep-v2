# Phase 1: Infraestrutura - Research

**Pesquisado:** 2026-04-04
**Dominio:** Next.js 14 + Supabase + Vercel + Google Sheets API (setup greenfield)
**Confianca:** HIGH

## Resumo

Esta fase estabelece toda a fundacao tecnica do projeto NARAKA SEP v2: projeto Next.js 14 com Tailwind CSS v3 e shadcn/ui, banco Supabase com 8 tabelas e RLS, deploy automatico via Vercel conectado ao GitHub, e integracao Google Sheets API via conta de servico. O projeto e greenfield -- nao ha codigo existente no repositorio.

A stack e 100% definida e nao negociavel (CLAUDE.md). Next.js 14 usa React 18 e App Router. Tailwind deve ser v3 (nao v4) para compatibilidade estavel com Next.js 14 e shadcn/ui. shadcn/ui deve usar versao 2.3.0 para Tailwind v3. Supabase CLI via npx (nao instalado globalmente) gerencia migrations SQL versionadas. Google Sheets API usa `googleapis` com autenticacao JWT de conta de servico.

**Recomendacao principal:** Usar `create-next-app@14` com TypeScript + Tailwind, depois `npx shadcn@2.3.0 init`, configurar Supabase com migrations SQL via CLI, e Google Sheets API via `googleapis` em Route Handlers.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Organizacao feature-based -- app/ para rotas com route groups, src/features/ agrupa por dominio (auth/, upload/, fardos/, prateleira/, baixa/, dashboard/, users/), cada feature com seus components/, hooks/, utils/
- **D-02:** Usar src/ directory -- app/ na raiz para rotas, src/ para todo codigo de aplicacao (features, lib, types, components/ui)
- **D-03:** shadcn/ui em src/components/ui/, codigo compartilhado em src/lib/, tipos globais em src/types/
- **D-04:** Gerenciamento via Supabase CLI migrations -- `supabase migration new` para SQL versionado no repositorio, schema replicavel e auditavel
- **D-05:** Row Level Security (RLS) ativado desde a criacao das tabelas -- policies basicas por role desde o inicio para evitar retrabalho na Phase 2
- **D-06:** Tipos TypeScript auto-gerados via `supabase gen types typescript` -- type-safe desde o inicio, atualizacao automatica com cada migration
- **D-07:** Integracao via Route Handlers do Next.js (app/api/) -- credenciais ficam no servidor, nunca expostas ao cliente
- **D-08:** Credenciais da conta de servico Google serializadas em variavel de ambiente (GOOGLE_SERVICE_ACCOUNT_KEY) -- funciona local e no Vercel sem arquivos extras
- **D-09:** Dois projetos Supabase separados -- um para desenvolvimento/local e outro para producao no Vercel
- **D-10:** Conjunto minimo de env vars desde o inicio: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_SHEET_ID. Template .env.example no repositorio

### Claude's Discretion
- Configuracao exata do Tailwind (theme, plugins)
- Configuracao do ESLint e Prettier
- Estrutura interna das migrations SQL (ordem de criacao das tabelas, constraints)
- Configuracao do Supabase CLI (config.toml)

### Deferred Ideas (OUT OF SCOPE)
Nenhum -- discussao ficou dentro do escopo da fase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Descricao | Suporte na Pesquisa |
|----|-----------|---------------------|
| SETUP-01 | Projeto Next.js 14 criado com Tailwind CSS e shadcn/ui | Standard Stack (Next.js 14.2.35, Tailwind 3.4.19, shadcn@2.3.0), Architecture Patterns (estrutura de pastas), Code Examples (init commands) |
| SETUP-02 | Supabase conectado com todas as tabelas criadas (users, config, pedidos, progresso, reservas, atribuicoes, trafego_fardos, baixados, fardos_nao_encontrados) | Standard Stack (supabase-js, @supabase/ssr), Architecture Patterns (client/server separation), Code Examples (migration SQL, client setup) |
| SETUP-03 | Repositorio GitHub conectado ao Vercel com deploy automatico | Architecture Patterns (Vercel deploy), Common Pitfalls (env vars no Vercel) |
| SETUP-04 | Google Sheets API configurada com conta de servico e credenciais em variaveis de ambiente | Standard Stack (googleapis), Code Examples (JWT auth, Route Handler), Common Pitfalls (JSON serializado em env var) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack**: Next.js 14 + Supabase + Vercel + Google Sheets API + Tailwind + shadcn/ui + SheetJS -- nao negociavel
- **Realtime**: Obrigatorio via Supabase subscriptions -- polling proibido
- **Estoque externo**: Planilha Google Sheets nunca migra para Supabase
- **Hospedagem**: Vercel com deploy automatico via GitHub
- **Comunicacao**: Sempre em portugues brasileiro

## Standard Stack

### Core

| Biblioteca | Versao | Proposito | Por que padrao |
|-----------|--------|-----------|----------------|
| next | 14.2.35 | Framework React full-stack com App Router | Versao definida pelo usuario, ultima da linha 14.x [VERIFIED: npm registry] |
| react / react-dom | 18.x | UI library | Peer dependency do Next.js 14 [VERIFIED: npm registry] |
| typescript | 5.x (bundled) | Tipagem estatica | Incluido no create-next-app [VERIFIED: npm registry] |
| tailwindcss | 3.4.19 | Utility-first CSS | Tailwind v3 e obrigatorio para Next.js 14 + shadcn@2.3.0 -- v4 tem breaking changes [VERIFIED: npm registry + shadcn docs] |
| @supabase/supabase-js | 2.101.1 | Cliente Supabase | Cliente oficial para browser e server [VERIFIED: npm registry] |
| @supabase/ssr | 0.10.0 | SSR helpers para Next.js | Gerencia cookies e auth em server components/route handlers [VERIFIED: npm registry] |
| googleapis | 171.4.0 | Google Sheets API | Biblioteca oficial do Google, suporta JWT service account [VERIFIED: npm registry] |

### Supporting

| Biblioteca | Versao | Proposito | Quando usar |
|-----------|--------|-----------|-------------|
| supabase (CLI) | 2.84.10 | Migrations, type generation | Via npx -- nao precisa instalar globalmente [VERIFIED: npm registry] |
| shadcn/ui | @2.3.0 (CLI) | Componentes UI pre-construidos | Init com `npx shadcn@2.3.0 init`, add componentes sob demanda [VERIFIED: shadcn docs] |
| tailwindcss-animate | latest | Animacoes para shadcn/ui | Instalado automaticamente pelo shadcn init [ASSUMED] |
| class-variance-authority | latest | Variantes de componentes | Dependencia do shadcn/ui [ASSUMED] |
| clsx + tailwind-merge | latest | Merge de classes CSS | Dependencia do shadcn/ui, gera cn() utility [ASSUMED] |
| lucide-react | latest | Icones | Icone library padrao do shadcn/ui [ASSUMED] |
| eslint-config-next | 14.2.35 | Linting | Incluido no create-next-app [VERIFIED: npm registry] |

### Alternativas Consideradas

| Ao inves de | Poderia usar | Tradeoff |
|-------------|-------------|----------|
| googleapis | google-spreadsheet (v5.2.0) | API mais simples, mas googleapis e oficial e cobre mais use cases (read + write colunas F+). Usar googleapis. |
| Tailwind v3 | Tailwind v4 | v4 tem CSS-first config e breaking changes com shadcn/ui e Next.js 14. Nao usar v4. |
| shadcn/ui latest | shadcn/ui latest (Tailwind v4) | Versoes recentes assumem Tailwind v4. Fixar em @2.3.0 para v3. |

**Instalacao:**
```bash
# 1. Criar projeto Next.js 14
npx create-next-app@14 naraka-sep-v2 --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 2. Instalar shadcn/ui (dentro do projeto)
npx shadcn@2.3.0 init

# 3. Instalar dependencias Supabase
npm install @supabase/supabase-js @supabase/ssr

# 4. Instalar googleapis
npm install googleapis

# 5. Inicializar Supabase (local dev)
npx supabase init
```

## Architecture Patterns

### Estrutura de Pastas Recomendada (D-01, D-02, D-03)

```
naraka-sep-v2/
├── app/                          # Next.js App Router (rotas)
│   ├── api/                      # Route Handlers (server-only)
│   │   └── sheets/
│   │       └── route.ts          # Google Sheets API endpoint
│   ├── (auth)/                   # Route group: login
│   │   └── login/
│   │       └── page.tsx
│   ├── (app)/                    # Route group: app autenticada
│   │   ├── dashboard/
│   │   ├── upload/
│   │   ├── fardos/
│   │   ├── prateleira/
│   │   ├── baixa/
│   │   └── users/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Redirect para login ou dashboard
│   └── globals.css               # Tailwind + shadcn CSS vars
├── src/
│   ├── components/
│   │   └── ui/                   # shadcn/ui components
│   ├── features/                 # Feature-based modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   ├── upload/
│   │   ├── fardos/
│   │   ├── prateleira/
│   │   ├── baixa/
│   │   ├── dashboard/
│   │   └── users/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client
│   │   │   ├── server.ts         # Server client (cookies)
│   │   │   └── admin.ts          # Service role client
│   │   ├── google-sheets.ts      # Google Sheets API client
│   │   └── utils.ts              # cn() e helpers
│   └── types/
│       ├── database.types.ts     # Auto-gerado pelo Supabase CLI
│       └── index.ts              # Tipos globais
├── supabase/
│   ├── config.toml               # Configuracao Supabase local
│   ├── migrations/               # SQL migrations versionadas
│   │   └── 00001_initial_schema.sql
│   └── seed.sql                  # Dados iniciais (admin user)
├── .env.local                    # Variaveis de ambiente (nao commitado)
├── .env.example                  # Template de env vars (commitado)
├── middleware.ts                  # Supabase auth middleware
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── components.json               # shadcn/ui config
```

### Pattern 1: Supabase Client Separation

**O que:** Tres clientes Supabase distintos para contextos diferentes.
**Quando usar:** Sempre -- cada contexto tem permissoes diferentes.

```typescript
// src/lib/supabase/client.ts -- Browser (client components)
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// src/lib/supabase/server.ts -- Server Components / Route Handlers
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component: ignore
          }
        },
      },
    }
  )
}
```

```typescript
// src/lib/supabase/admin.ts -- Service role (bypassa RLS)
// Usar APENAS em server-side para operacoes administrativas
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### Pattern 2: Google Sheets via Route Handler (D-07, D-08)

**O que:** Autenticacao JWT com conta de servico, credenciais nunca expostas ao cliente.
**Quando usar:** Para ler estoque externo e escrever na planilha (baixa).

```typescript
// src/lib/google-sheets.ts
// Source: https://medium.com/@kewinf271/next-14-google-sheets-integration-5225f8e9b7c8
import { google } from 'googleapis'

function getAuthClient() {
  const credentials = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY!
  )
  
  return new google.auth.JWT(
    credentials.client_email,
    undefined,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  )
}

export async function getSheetData(range: string) {
  const auth = getAuthClient()
  const sheets = google.sheets({ version: 'v4', auth })
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    range,
  })
  
  return response.data.values
}
```

```typescript
// app/api/sheets/route.ts
import { getSheetData } from '@/lib/google-sheets'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = await getSheetData('Estoque!A:F')
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha ao acessar planilha' },
      { status: 500 }
    )
  }
}
```

### Pattern 3: Middleware para Supabase Auth

**O que:** Refresh de tokens JWT e persistencia de cookies.
**Quando usar:** Obrigatorio para qualquer app Supabase com auth.

```typescript
// middleware.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### Anti-Patterns a Evitar

- **Importar client do Supabase em Server Components:** Usar `createClient` de `server.ts`, nunca de `client.ts`, em server components. O browser client nao tem acesso a cookies.
- **Expor service role key no frontend:** `SUPABASE_SERVICE_ROLE_KEY` nunca deve ter prefixo `NEXT_PUBLIC_`. Usar apenas em `admin.ts` server-side.
- **Guardar JSON da conta de servico como arquivo:** Serializar o JSON inteiro em uma env var (D-08). Funciona local e no Vercel sem arquivos extras.
- **Usar Tailwind v4 com Next.js 14:** Breaking changes na configuracao CSS-first e incompatibilidade com shadcn@2.3.0. Manter v3.
- **Polling para dados real-time:** Supabase subscriptions sao obrigatorias (CLAUDE.md). Nunca usar setInterval/polling.

## Don't Hand-Roll

| Problema | Nao construir | Usar | Por que |
|----------|--------------|------|---------|
| UI components | Botoes, inputs, modais | shadcn/ui via CLI | Acessibilidade, temas, consistencia |
| CSS utilities | Classes custom | Tailwind CSS | Utilitarios padrao, purge automatico |
| Auth token refresh | Logica de refresh manual | @supabase/ssr middleware | Edge cases com cookies, race conditions |
| Google auth | OAuth manual | googleapis JWT | Rotacao de tokens, retry, error handling |
| Tipo do banco | Tipos manuais | `supabase gen types typescript` | Sincroniza com schema real, elimina drift |
| Migration management | SQL scripts avulsos | Supabase CLI migrations | Versionamento, rollback, reproducibilidade |

## Common Pitfalls

### Pitfall 1: GOOGLE_SERVICE_ACCOUNT_KEY com newlines escapados

**O que da errado:** A private_key no JSON da conta de servico contem `\n` literais. Quando serializado em env var, plataformas como Vercel podem interpretar diferente.
**Causa raiz:** JSON.parse pode falhar se a env var nao preservar o JSON exatamente.
**Como evitar:** Testar o parse localmente antes de configurar no Vercel. No Vercel, colar o JSON inteiro como valor da env var (Vercel suporta multiline). Localmente no `.env.local`, envolver em aspas simples.
**Sinais de alerta:** Erro "invalid_grant" ou "Could not deserialize key data" ao chamar Google Sheets API.

### Pitfall 2: shadcn/ui paths com src/ directory

**O que da errado:** shadcn init pergunta o path do globals.css e components. Se responder errado, os componentes nao encontram os CSS variables.
**Causa raiz:** O projeto usa src/ directory (D-02), entao os paths sao diferentes do default.
**Como evitar:** Na init do shadcn, configurar: `tailwind.css` -> `app/globals.css`, components alias -> `@/components`, utils alias -> `@/lib/utils`. Verificar que `tsconfig.json` tem `@/*` apontando para `./src/*`.
**Sinais de alerta:** Componentes shadcn sem estilo, CSS variables nao aplicados.

### Pitfall 3: Supabase RLS bloqueando queries

**O que da errado:** Tabelas com RLS ativado mas sem policies bloqueiam todas as queries via anon key.
**Causa raiz:** RLS ativado = deny by default. Sem policy explicita, nenhuma operacao e permitida.
**Como evitar:** Criar policies basicas junto com cada tabela na migration. Para esta fase, policies simples que permitem leitura autenticada sao suficientes. Usar admin client (service role) para seed data.
**Sinais de alerta:** Queries retornam array vazio sem erro (Supabase nao retorna erro 403, apenas dados vazios).

### Pitfall 4: Env vars faltando no Vercel

**O que da errado:** Deploy funciona mas app retorna erros 500 em todas as chamadas ao banco ou Google Sheets.
**Causa raiz:** Env vars configuradas localmente mas nao adicionadas no dashboard do Vercel.
**Como evitar:** Checklist de env vars (D-10) antes do primeiro deploy. `.env.example` no repositorio documenta todas as vars necessarias.
**Sinais de alerta:** App abre no Vercel mas nenhuma funcionalidade funciona.

### Pitfall 5: create-next-app com src/ e app/ directory

**O que da errado:** `create-next-app` com `--src-dir` coloca app/ dentro de src/. Mas a decisao D-02 quer app/ na raiz e src/ para codigo de aplicacao.
**Causa raiz:** O flag `--src-dir` move app/ para dentro de src/.
**Como evitar:** Usar `--src-dir` no create-next-app (que cria src/app/) e depois mover app/ para a raiz. Ou criar sem `--src-dir` e adicionar src/ manualmente. A segunda opcao e mais limpa.
**Sinais de alerta:** Estrutura de pastas nao corresponde a D-01/D-02.

## Code Examples

### Migration SQL inicial (schema completo)

```sql
-- supabase/migrations/00001_initial_schema.sql
-- Source: .planning/PROJECT.md (schema do banco)

-- Tabela de usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'lider', 'separador', 'fardista')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configuracao global
CREATE TABLE config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pedidos importados do ERP
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido TEXT NOT NULL,
  numero_pedido_plataforma TEXT,
  plataforma TEXT NOT NULL,
  loja TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  variacao TEXT,
  nome_produto TEXT,
  metodo_envio TEXT NOT NULL,
  grupo_envio TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('unitario', 'kit', 'combo')),
  importacao_numero INTEGER NOT NULL,
  importacao_data DATE NOT NULL DEFAULT CURRENT_DATE,
  card_key TEXT NOT NULL,
  prazo_envio TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Progresso de separacao por item
CREATE TABLE progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  quantidade_separada INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'parcial', 'completo', 'nao_encontrado', 'aguardar_fardista', 'transformacao')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reservas de fardos
CREATE TABLE reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  codigo_in TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  endereco TEXT,
  status TEXT NOT NULL DEFAULT 'reservado' CHECK (status IN ('reservado', 'cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Atribuicoes de cards para separadores/fardistas
CREATE TABLE atribuicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_key TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('separador', 'fardista')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(card_key, tipo)
);

-- Fardos em transito (retirados do estoque, aguardando baixa)
CREATE TABLE trafego_fardos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  codigo_in TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  endereco TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'encontrado', 'nao_encontrado')),
  fardista_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fardos com baixa confirmada
CREATE TABLE baixados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trafego_id UUID NOT NULL REFERENCES trafego_fardos(id),
  codigo_in TEXT NOT NULL,
  baixado_por UUID NOT NULL REFERENCES users(id),
  baixado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fardos nao encontrados (historico)
CREATE TABLE fardos_nao_encontrados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trafego_id UUID NOT NULL REFERENCES trafego_fardos(id),
  codigo_in TEXT NOT NULL,
  reportado_por UUID NOT NULL REFERENCES users(id),
  reportado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices para queries frequentes
CREATE INDEX idx_pedidos_card_key ON pedidos(card_key);
CREATE INDEX idx_pedidos_importacao ON pedidos(importacao_data, importacao_numero);
CREATE INDEX idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX idx_progresso_pedido ON progresso(pedido_id);
CREATE INDEX idx_reservas_codigo_in ON reservas(codigo_in);
CREATE INDEX idx_reservas_pedido ON reservas(pedido_id);
CREATE INDEX idx_trafego_codigo_in ON trafego_fardos(codigo_in);
CREATE INDEX idx_atribuicoes_card ON atribuicoes(card_key);

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE atribuicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trafego_fardos ENABLE ROW LEVEL SECURITY;
ALTER TABLE baixados ENABLE ROW LEVEL SECURITY;
ALTER TABLE fardos_nao_encontrados ENABLE ROW LEVEL SECURITY;

-- Policies basicas: leitura autenticada para todas as tabelas
-- (policies mais granulares serao adicionadas na Phase 2 com auth)
CREATE POLICY "Leitura autenticada" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON progresso FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON reservas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON atribuicoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON trafego_fardos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON baixados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON fardos_nao_encontrados FOR SELECT TO authenticated USING (true);
```

### .env.example

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@...iam.gserviceaccount.com",...}'
GOOGLE_SHEET_ID=1tL5as2Q0QEZCj_6Kc4xGGqPqU4T5uduHmaGmntC8W58
```

### Supabase type generation

```bash
# Gerar tipos TypeScript a partir do schema remoto
npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/database.types.ts

# Ou a partir do banco local
npx supabase gen types typescript --local > src/types/database.types.ts
```

## State of the Art

| Abordagem antiga | Abordagem atual | Quando mudou | Impacto |
|-----------------|-----------------|--------------|---------|
| @supabase/auth-helpers-nextjs | @supabase/ssr | 2024 | Pacote unico para SSR em qualquer framework, auth-helpers deprecated [CITED: supabase.com/docs/guides/auth/server-side/creating-a-client] |
| Tailwind config via JS | Tailwind v4 CSS-first config | Jan 2025 | NAO usar v4 com Next.js 14 + shadcn -- manter v3 [VERIFIED: shadcn docs + GitHub issues] |
| shadcn/ui sem versionamento | shadcn@2.3.0 para Tailwind v3 | 2025 | Versoes mais novas assumem Tailwind v4. Fixar @2.3.0 [CITED: ui.shadcn.com/docs/installation/next] |
| googleapis + callback auth | googleapis + JWT (google.auth.JWT) | Estavel | JWT e o padrao para service accounts, sem OAuth flow [VERIFIED: googleapis docs] |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Substituido por `@supabase/ssr`. Nao usar.
- `tailwindcss-animate` com Tailwind v4: Precisa de `tw-animate-css`. Com Tailwind v3 funciona normalmente.

## Assumptions Log

| # | Claim | Secao | Risco se errado |
|---|-------|-------|-----------------|
| A1 | tailwindcss-animate e instalado automaticamente pelo shadcn init | Standard Stack | Baixo -- facil instalar manualmente |
| A2 | class-variance-authority, clsx, tailwind-merge sao deps do shadcn init | Standard Stack | Baixo -- shadcn init instala automaticamente |
| A3 | Schema SQL com 9 tabelas cobre todos os requisitos futuros | Code Examples | Medio -- pode precisar de ajustes em fases futuras, mas migrations permitem evolucao |
| A4 | create-next-app@14 com --src-dir coloca app/ dentro de src/ | Common Pitfalls | Alto se errado -- afeta toda a estrutura D-01/D-02. Verificar durante execucao |

## Open Questions

1. **Estrutura exata de app/ vs src/**
   - O que sabemos: D-02 quer app/ na raiz e src/ para codigo. create-next-app com --src-dir coloca app/ dentro de src/.
   - O que nao esta claro: Melhor abordagem -- criar sem --src-dir e adicionar src/ manualmente, ou criar com --src-dir e mover app/.
   - Recomendacao: Criar SEM --src-dir (app/ fica na raiz), depois criar src/ manualmente e configurar tsconfig paths. Mais limpo e alinhado com D-02.

2. **Supabase local vs remoto para desenvolvimento**
   - O que sabemos: D-09 pede dois projetos Supabase separados. Supabase CLI nao esta instalado globalmente.
   - O que nao esta claro: Se o usuario quer Supabase local (Docker) ou apenas dois projetos remotos (dev + prod).
   - Recomendacao: Usar dois projetos remotos no Supabase (free tier suporta). Supabase local via Docker e opcional e adiciona complexidade. Migrations funcionam igual em ambos os cenarios via `npx supabase`.

## Environment Availability

| Dependencia | Requerido por | Disponivel | Versao | Fallback |
|------------|--------------|------------|--------|----------|
| Node.js | Next.js, npm | Sim | 25.8.2 | -- |
| npm | Instalacao de pacotes | Sim | 11.11.1 | -- |
| git | Versionamento, Vercel deploy | Sim | 2.50.1 | -- |
| Supabase CLI | Migrations, type gen (D-04, D-06) | Nao (global) | -- | Via `npx supabase` (nao precisa instalar) |
| Vercel CLI | Deploy manual | Nao | -- | Deploy automatico via GitHub push (preferido) |
| gh CLI | Operacoes GitHub | Nao | -- | Interface web do GitHub |
| Docker | Supabase local | Nao verificado | -- | Usar projeto Supabase remoto (recomendado) |

**Dependencias faltando sem fallback:** Nenhuma.

**Dependencias faltando com fallback:**
- Supabase CLI: Disponivel via `npx supabase` sem instalacao global
- Vercel CLI: Deploy automatico via GitHub e o metodo preferido (D-09, SETUP-03)
- gh CLI: Operacoes podem ser feitas via interface web

## Validation Architecture

### Test Framework

| Propriedade | Valor |
|-------------|-------|
| Framework | Nenhum detectado -- projeto greenfield |
| Config file | Nenhum -- criar na Wave 0 |
| Quick run command | `npm run test` (a definir) |
| Full suite command | `npm run test` (a definir) |

### Phase Requirements -> Test Map

| Req ID | Comportamento | Tipo de teste | Comando automatizado | Existe? |
|--------|--------------|---------------|---------------------|---------|
| SETUP-01 | Projeto Next.js roda localmente com Tailwind e shadcn | smoke | `npm run build && npm run start` | Nao -- Wave 0 |
| SETUP-02 | Supabase conectado com 8 tabelas acessiveis | integration | Script que lista tabelas via supabase-js | Nao -- Wave 0 |
| SETUP-03 | Push no GitHub dispara deploy Vercel | manual-only | Verificar dashboard Vercel apos push | N/A (manual) |
| SETUP-04 | Google Sheets API responde com dados | integration | `curl localhost:3000/api/sheets` ou test script | Nao -- Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run build` (verifica compilacao sem erros)
- **Per wave merge:** `npm run build` + teste manual das 4 conexoes
- **Phase gate:** Build sem erros + todas as 4 conexoes verificadas

### Wave 0 Gaps

- [ ] Nenhum framework de teste configurado -- para esta fase, `npm run build` e suficiente como smoke test
- [ ] Script de verificacao de conexao Supabase (pode ser adicionado como test futuro)
- [ ] Script de verificacao Google Sheets API (pode ser adicionado como test futuro)

Nota: Para fase de infraestrutura, `npm run build` sem erros e verificacao manual das conexoes e suficiente. Framework de testes completo (Jest/Vitest) pode ser adicionado em fase futura quando houver logica de negocio para testar.

## Security Domain

### Categorias ASVS Aplicaveis

| Categoria ASVS | Aplica | Controle padrao |
|----------------|--------|-----------------|
| V2 Authentication | Parcial (setup) | Supabase Auth + middleware -- implementacao completa na Phase 2 |
| V3 Session Management | Parcial (setup) | @supabase/ssr middleware com cookie refresh |
| V4 Access Control | Sim | RLS policies no Supabase desde a criacao das tabelas (D-05) |
| V5 Input Validation | Nao nesta fase | -- |
| V6 Cryptography | Nao nesta fase | Supabase gerencia JWT e hashing |

### Threat Patterns conhecidos para esta stack

| Pattern | STRIDE | Mitigacao padrao |
|---------|--------|-----------------|
| Service role key exposta no frontend | Information Disclosure | Nunca usar prefixo NEXT_PUBLIC_ para service role key. Usar apenas em server-side (admin.ts) |
| Google credentials no codigo | Information Disclosure | Serializar em env var (D-08), nunca commitar arquivo JSON |
| RLS desabilitado em tabelas | Elevation of Privilege | Habilitar RLS em TODAS as tabelas na migration inicial (D-05) |
| Env vars em repositorio | Information Disclosure | .gitignore inclui .env.local, template em .env.example sem valores reais |

## Sources

### Primary (HIGH confidence)
- [npm registry] -- Versoes verificadas: next@14.2.35, @supabase/supabase-js@2.101.1, @supabase/ssr@0.10.0, googleapis@171.4.0, tailwindcss@3.4.19, supabase CLI@2.84.10
- [Supabase docs - Creating a client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) -- Pattern de client/server separation
- [shadcn/ui docs - Next.js installation](https://ui.shadcn.com/docs/installation/next) -- Setup com Tailwind v3 via @2.3.0
- [shadcn/ui docs - Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) -- Confirmacao que v4 e separado

### Secondary (MEDIUM confidence)
- [Medium - Next 14 Google Sheets Integration](https://medium.com/@kewinf271/next-14-google-sheets-integration-5225f8e9b7c8) -- Pattern de googleapis + JWT em Next.js 14
- [GitHub discussions - tailwindcss/17453](https://github.com/tailwindlabs/tailwindcss/discussions/17453) -- Incompatibilidades Tailwind v4 com shadcn

### Tertiary (LOW confidence)
- Nenhuma claim depende apenas de fontes terciarias

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- todas as versoes verificadas no npm registry
- Architecture: HIGH -- patterns vindos de docs oficiais do Supabase e shadcn
- Pitfalls: HIGH -- problemas bem documentados em issues e forums

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stack estavel, 30 dias)
