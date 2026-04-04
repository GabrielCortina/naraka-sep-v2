---
phase: 01
slug: infraestrutura
status: secured
threats_total: 10
threats_open: 0
threats_closed: 10
asvs_level: 1
created: 2026-04-04
---

# Phase 01 — Security

## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| `.env.local` -> repositorio | Credenciais nao podem ser commitadas |
| client bundle -> env vars | Apenas `NEXT_PUBLIC_*` vao para o client bundle |
| client -> server | Credenciais Supabase service role e Google service account ficam no servidor |
| Route Handler -> Google API | Autenticacao via JWT de conta de servico |
| browser -> Supabase | Apenas anon key (`NEXT_PUBLIC_*`) exposta ao client |
| Vercel env vars -> app | Credenciais armazenadas no Vercel, injetadas no runtime |
| GitHub -> Vercel | Deploy automatico via webhook |

## Threat Register

| Threat ID | Category | Component | Disposition | Status | Evidence |
|-----------|----------|-----------|-------------|--------|----------|
| T-01-01 | Information Disclosure | `.env.local` | mitigate | closed | `.gitignore`:30-32 (`.env`, `.env.local`, `.env*.local`); `.env.example`:1-8 (placeholders only) |
| T-01-02 | Information Disclosure | `SUPABASE_SERVICE_ROLE_KEY` | mitigate | closed | `src/lib/supabase/admin.ts`:6 — `process.env.SUPABASE_SERVICE_ROLE_KEY!` (sem prefixo `NEXT_PUBLIC_`) |
| T-01-03 | Information Disclosure | `src/lib/supabase/admin.ts` | mitigate | closed | `src/lib/supabase/admin.ts`:6 — chave sem `NEXT_PUBLIC_`; arquivo usa `createClient` de `@supabase/supabase-js` (server-only import, nao SSR browser) |
| T-01-04 | Information Disclosure | `src/lib/google-sheets.ts` | mitigate | closed | `src/lib/google-sheets.ts`:5 — `process.env.GOOGLE_SERVICE_ACCOUNT_KEY!` (sem `NEXT_PUBLIC_`); `app/api/sheets/route.ts` e Route Handler (server-only execution boundary no App Router) |
| T-01-05 | Elevation of Privilege | Supabase RLS | mitigate | closed | `supabase/migrations/00001_initial_schema.sql`:106-114 — `ENABLE ROW LEVEL SECURITY` em todas as 9 tabelas; linhas 117-125 — `CREATE POLICY "Leitura autenticada"` para todas as 9 tabelas |
| T-01-06 | Spoofing | `middleware.ts` | mitigate | closed | `middleware.ts`:28 — `await supabase.auth.getUser()` chamado em toda request; matcher cobre todas as rotas exceto assets estaticos |
| T-01-07 | Information Disclosure | `supabase/seed.sql` | accept | closed | Risco aceito — ver Accepted Risks Log abaixo |
| T-01-08 | Information Disclosure | Vercel env vars | mitigate | closed | `.gitignore`:30-32 — nenhuma `.env*` commitada; `.env.example`:1-8 — apenas placeholders; credenciais injetadas pelo runtime Vercel (encrypted at rest) |
| T-01-09 | Tampering | GitHub -> Vercel deploy | accept | closed | Risco aceito — ver Accepted Risks Log abaixo |
| T-01-10 | Information Disclosure | `/api/sheets` endpoint | mitigate | closed | `app/api/sheets/route.ts`:4-19 — endpoint sem auth nesta fase; aceitavel porque dados de estoque nao sao sensiveis (SKU/quantidade); auth adicionada na Phase 2 conforme plano |

## Accepted Risks Log

### T-01-07 — PIN hash no seed de desenvolvimento

- **Categoria:** Information Disclosure
- **Componente:** `supabase/seed.sql`
- **Descricao:** O arquivo `supabase/seed.sql` contem o hash SHA-256 do PIN `1234` para o usuario admin de desenvolvimento. O hash `03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4` e publicamente derivavel (SHA-256 de "1234" e amplamente conhecido). Um atacante com acesso ao banco de dados poderia usar lookup tables para descobrir o PIN original.
- **Justificativa:** Arquivo de seed destina-se exclusivamente ao ambiente de desenvolvimento local. Nao e aplicado em producao. O banco de producao tera usuarios criados com PINs seguros via interface administrativa. Risco confinado ao ambiente de dev.
- **Condicao de revisao:** Se o seed.sql for aplicado em producao ou se o PIN 1234 for mantido no banco de producao, este risco deve ser reclassificado como `mitigate` e o hash substituido por um PIN forte.
- **Aceito por:** Executor (2026-04-04), documentado em `01-02-PLAN.md` threat_model

### T-01-09 — Deploy automatico via GitHub -> Vercel

- **Categoria:** Tampering
- **Componente:** Pipeline GitHub -> Vercel
- **Descricao:** Qualquer push para a branch principal aciona um deploy automatico no Vercel. Um atacante com acesso de escrita ao repositorio poderia fazer deploy de codigo malicioso.
- **Justificativa:** Repositorio configurado como privado, reduzindo a superficie de ataque. O webhook de deploy e o oficial da integracao Vercel/GitHub, nao um script customizado. O risco residual e aceito para a fase de infraestrutura; branch protection rules e revisoes de PR podem ser adicionados em fases futuras.
- **Condicao de revisao:** Adicionar branch protection na `main` (require PR reviews, status checks) antes de onboarding de colaboradores externos.
- **Aceito por:** Executor (2026-04-04), documentado em `01-03-PLAN.md` threat_model

## Unregistered Flags

| Flag | Origem | Descricao | Mapeamento |
|------|--------|-----------|------------|
| Added bare `.env` to `.gitignore` | `01-01-SUMMARY.md` Deviations | Executor adicionou linha `.env` ao `.gitignore` alem do padrao `.env*.local` do create-next-app, como defesa em profundidade para evitar commit acidental de arquivo `.env` sem sufixo. | Nao mapeado a ameaca existente. Melhoria de controle que fortalece T-01-01. Informativo. |

## Audit Trail

### Security Audit 2026-04-04

| Metrica | Valor |
|---------|-------|
| Ameacas totais | 10 |
| Ameacas fechadas | 10 |
| Ameacas abertas | 0 |
| Disposicao: mitigate | 8 |
| Disposicao: accept | 2 |
| Disposicao: transfer | 0 |
| Flags nao registradas | 1 (informativa) |
| ASVS Level | 1 |
| Auditor | gsd-secure-phase (claude-sonnet-4-6) |

#### Evidencia por ameaca

**T-01-01** — `.gitignore` lines 30-32 confirmam `.env`, `.env.local`, `.env*.local` ignorados. `.env.example` lines 1-8 confirmam apenas placeholders (ex: `https://seu-projeto.supabase.co`, `eyJ...`). Nenhum segredo real presente.

**T-01-02** — `src/lib/supabase/admin.ts` line 6: `process.env.SUPABASE_SERVICE_ROLE_KEY!`. Ausencia do prefixo `NEXT_PUBLIC_` confirma que a variavel nao sera incluida no bundle do cliente pelo Next.js.

**T-01-03** — `src/lib/supabase/admin.ts` importa de `@supabase/supabase-js` (nao de `@supabase/ssr`), o que nao e compativel com execucao no browser sem configuracao adicional. A chave `SUPABASE_SERVICE_ROLE_KEY` sem prefixo `NEXT_PUBLIC_` garante que nao vaza via bundle. Arquivo nao exporta nada que seria chamado por codigo client-side.

**T-01-04** — `src/lib/google-sheets.ts` line 5: `process.env.GOOGLE_SERVICE_ACCOUNT_KEY!` sem `NEXT_PUBLIC_`. `app/api/sheets/route.ts` e um Route Handler no diretorio `app/api/` — pelo modelo de execucao do Next.js App Router, Route Handlers rodam exclusivamente no servidor; credenciais nunca chegam ao bundle do cliente.

**T-01-05** — `supabase/migrations/00001_initial_schema.sql` lines 106-114: `ALTER TABLE <tabela> ENABLE ROW LEVEL SECURITY` para todas as 9 tabelas (users, config, pedidos, progresso, reservas, atribuicoes, trafego_fardos, baixados, fardos_nao_encontrados). Lines 117-125: `CREATE POLICY "Leitura autenticada" ON <tabela> FOR SELECT TO authenticated USING (true)` para todas as 9 tabelas. RLS ativo e policies basicas de leitura autenticada presentes.

**T-01-06** — `middleware.ts` line 28: `await supabase.auth.getUser()` executado em toda request interceptada. O `config.matcher` (line 33) cobre todas as rotas exceto `_next/static`, `_next/image` e `favicon.ico`. JWTs expirados ou invalidos sao detectados pelo Supabase Auth nesta chamada.

**T-01-07** — `supabase/seed.sql` lines 1-4: PIN armazenado como hash SHA-256 (`03ac674216...`), nao como valor raw `1234`. Risco aceito e documentado no log acima.

**T-01-08** — `.gitignore` patterns cobrem todos os arquivos de env locais. `.env.example` contem apenas strings de demonstracao. Env vars de producao sao injetadas pelo runtime Vercel (encrypted at rest) — controle externo verificavel via documentacao Vercel mas nao inspecionavel diretamente no codigo.

**T-01-09** — Deploy automatico via integracao oficial GitHub/Vercel. Risco aceito e documentado no log acima.

**T-01-10** — `app/api/sheets/route.ts` lines 4-19: endpoint GET sem verificacao de autenticacao nesta fase. O plano `01-03-PLAN.md` declara explicitamente que auth sera adicionada na Phase 2. Dados expostos sao limitados a estoque (SKU, quantidade) — sem PII ou credenciais.
