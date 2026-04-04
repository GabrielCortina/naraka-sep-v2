# Phase 2: Autenticacao - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Usuarios conseguem acessar o sistema com PIN e ver apenas as abas permitidas para seu role. Login por nome + PIN, sessao JWT via Supabase Auth, redirecionamento automatico por role, protecao de rotas por middleware. Gestao de usuarios (CRUD) e uma fase separada (Phase 10).

</domain>

<decisions>
## Implementation Decisions

### Estrategia de autenticacao
- **D-01:** Supabase Auth com custom claims — criar usuario no Supabase Auth com email ficticio, armazenar role como custom claim no JWT via database function
- **D-02:** Email ficticio no formato `nome@naraka.local` — slug do nome do usuario + dominio fixo (ex: 'Joao Silva' -> 'joao-silva@naraka.local')
- **D-03:** PIN e a senha do Supabase Auth (bcrypt interno) — validacao via signInWithPassword. Campo pin_hash na tabela users fica como referencia/auditoria, validacao real e pelo Supabase Auth

### Tela de login
- **D-04:** Dois campos: nome (texto) e PIN (numerico 4-6 digitos) — usuario digita ambos
- **D-05:** Layout centralizado minimalista — logo NARAKA no topo, card branco centralizado, fundo escuro/neutro, design preto e branco do projeto
- **D-06:** Mensagem de erro generica 'Nome ou PIN incorreto' — nao revela se nome existe ou nao (seguranca contra enumeracao)

### Navegacao por role
- **D-07:** Bottom tabs no mobile (barra fixa no rodape com icones), sidebar lateral no desktop — cada role ve so suas abas permitidas
- **D-08:** Redirect apos login por role: Admin -> Dashboard, Lider -> Dashboard, Separador -> Prateleira, Fardista -> Fardos
- **D-09:** Paginas placeholder para todas as telas (Dashboard, Upload, Fardos, Prateleira, Baixa) — titulo + indicacao que sera implementada em fase futura. Navegacao funcional desde agora

### Protecao de rotas
- **D-10:** Middleware le JWT, extrai role do custom claim, verifica permissao para a rota. Se nao autorizado, redireciona para tela default do role
- **D-11:** Usuario nao autenticado e redirecionado silenciosamente para /login. Apos login, volta para a rota que tentou acessar (ou default do role)

### Claude's Discretion
- Implementacao exata da database function para custom claims
- Escolha de icones para as abas de navegacao
- Design exato do input de PIN (mascara, teclado numerico)
- Animacoes/transicoes de loading durante login
- Estrutura interna dos componentes de layout (sidebar, bottom tabs)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Autenticacao
- `.planning/REQUIREMENTS.md` §Authentication — AUTH-01 a AUTH-06 com criterios de aceitacao
- `.planning/PROJECT.md` §Key Decisions — Login por PIN (nao email/senha), celulares compartilhados no armazem

### Infraestrutura existente
- `middleware.ts` — Middleware Next.js existente com refresh de sessao Supabase (precisa ser estendido com verificacao de role)
- `src/lib/supabase/server.ts` — Client server-side com cookies
- `src/lib/supabase/client.ts` — Client browser-side
- `src/lib/supabase/admin.ts` — Client admin com service role key
- `src/types/index.ts` — Tipo UserRole ja definido: 'admin' | 'lider' | 'separador' | 'fardista'
- `src/types/database.types.ts` — Tipos gerados do Supabase, tabela users com id/nome/pin_hash/role/ativo

### Permissoes por role
- `.planning/REQUIREMENTS.md` §Authentication AUTH-05 — Admin: todas; Lider: Dashboard/Upload/Fardos/Prateleira; Separador: Prateleira; Fardista: Fardos/Baixa

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase/server.ts`: Client server-side pronto para usar em Route Handlers e Server Components
- `src/lib/supabase/client.ts`: Client browser-side pronto para signInWithPassword
- `src/lib/supabase/admin.ts`: Client admin para operacoes privilegiadas (criar usuario no Supabase Auth)
- `src/types/index.ts`: UserRole type ja definido
- shadcn/ui: componentes Button, Input, Card disponiveis para a tela de login

### Established Patterns
- Feature-based organization: `src/features/auth/` ja criado (vazio), seguir padrao de components/, hooks/, utils/ dentro
- Supabase SSR: `@supabase/ssr` com createServerClient/createBrowserClient
- Route Handlers em `app/api/` para logica server-side

### Integration Points
- `middleware.ts`: Precisa ser estendido para verificar role no JWT e proteger rotas
- `app/layout.tsx`: Precisa integrar o layout de navegacao (sidebar/bottom tabs)
- Supabase Auth: Precisa de database function para injetar custom claims no JWT
- Tabela `users`: Precisa sincronizar com Supabase Auth users (trigger on insert)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Stack e padroes ja definidos na Phase 1.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-autenticacao*
*Context gathered: 2026-04-04*
