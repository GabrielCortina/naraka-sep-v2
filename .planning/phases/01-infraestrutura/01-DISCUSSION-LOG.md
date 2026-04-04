# Phase 1: Infraestrutura - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 01-infraestrutura
**Areas discussed:** Estrutura de pastas, Schema do banco, Google Sheets API, Deploy e ambientes

---

## Estrutura de pastas

| Option | Description | Selected |
|--------|-------------|----------|
| Feature-based | app/ para rotas, src/features/ agrupa por domínio, cada feature com components/hooks/utils | ✓ |
| Flat por tipo | Separa por tipo (components/, hooks/, utils/) sem agrupar por feature | |
| App Router puro | Tudo dentro de app/ usando route groups e co-location | |

**User's choice:** Feature-based
**Notes:** Escala bem com 10 fases do projeto

| Option | Description | Selected |
|--------|-------------|----------|
| Com src/ | app/ na raiz, src/ para código de aplicação | ✓ |
| Sem src/ | Tudo na raiz sem src/ | |

**User's choice:** Com src/

---

## Schema do banco

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase CLI migrations | SQL versionado no repositório via `supabase migration new` | ✓ |
| SQL direto no Dashboard | Criar tabelas manualmente no painel Supabase | |
| Seed SQL no repo | Arquivo .sql no repo executado manualmente | |

**User's choice:** Supabase CLI migrations

| Option | Description | Selected |
|--------|-------------|----------|
| RLS desde o início | Policies básicas por role desde a criação das tabelas | ✓ |
| RLS depois | Tabelas sem RLS agora, policies na Phase 2 | |
| Você decide | Claude escolhe | |

**User's choice:** RLS desde o início

| Option | Description | Selected |
|--------|-------------|----------|
| supabase gen types | Tipos TypeScript auto-gerados do schema | ✓ |
| Tipos manuais | Interfaces TypeScript definidas manualmente | |
| Você decide | Claude escolhe | |

**User's choice:** supabase gen types

---

## Google Sheets API

| Option | Description | Selected |
|--------|-------------|----------|
| Route Handlers Next.js | API routes em app/api/ chamam Google Sheets no servidor | ✓ |
| Supabase Edge Functions | Funções Deno no Supabase fazem a chamada | |
| Você decide | Claude escolhe | |

**User's choice:** Route Handlers Next.js

| Option | Description | Selected |
|--------|-------------|----------|
| JSON em env var | Serializar JSON da service account em variável de ambiente | ✓ |
| Arquivo .json no .gitignore | Arquivo credentials.json ignorado pelo git | |
| Você decide | Claude escolhe | |

**User's choice:** JSON em env var

---

## Deploy e ambientes

| Option | Description | Selected |
|--------|-------------|----------|
| Um projeto só | Único projeto Supabase para tudo | |
| Dois projetos (dev + prod) | Projeto local/dev separado de produção | ✓ |
| Você decide | Claude escolhe | |

**User's choice:** Dois projetos (dev + prod)

| Option | Description | Selected |
|--------|-------------|----------|
| Conjunto mínimo | Todas as env vars necessárias desde o início com .env.example | ✓ |
| Só Supabase por agora | Apenas variáveis Supabase, Google Sheets na Phase 4 | |
| Você decide | Claude escolhe | |

**User's choice:** Conjunto mínimo

---

## Claude's Discretion

- Configuração exata do Tailwind (theme, plugins)
- Configuração do ESLint e Prettier
- Estrutura interna das migrations SQL
- Configuração do Supabase CLI

## Deferred Ideas

None — discussion stayed within phase scope
