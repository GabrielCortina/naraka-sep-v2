# Phase 10: Gestao de Usuarios - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin pode criar, editar e desativar usuarios do sistema. Tela CRUD acessivel apenas pelo role admin. Inclui criacao no Supabase Auth (email ficticio + PIN) e tabela public.users sincronizada. Nao inclui self-service (usuario editando proprio perfil) nem auditoria de acoes.

</domain>

<decisions>
## Implementation Decisions

### Layout da tela
- **D-01:** Tabela simples com colunas Nome, Role, Status (ativo/inativo), Acoes (editar, toggle ativo)
- **D-02:** Botao "+ Novo Usuario" no topo da pagina
- **D-03:** No mobile, tabela adapta para formato responsivo (cards ou tabela compacta — Claude's discretion)

### Fluxo de criacao
- **D-04:** Formulario em modal/dialog (shadcn/ui Dialog) com 3 campos: nome (texto), PIN (numerico 4-6 digitos com confirmacao 2x), role (select com 4 opcoes: admin, lider, separador, fardista)
- **D-05:** Ao criar, sistema cria usuario no Supabase Auth via `admin.createUser` (email ficticio `nome@naraka.local` + PIN como senha) e upsert na tabela public.users — mesmo padrao do seed script
- **D-06:** Feedback: modal fecha, toast verde "Usuario criado com sucesso", tabela atualiza. Se erro, toast vermelho com mensagem

### Edicao e desativacao
- **D-07:** Admin pode editar nome, role e PIN de qualquer usuario. PIN aparece como campo opcional no modal de edicao (so preenche se quiser resetar)
- **D-08:** Edicao atualiza Supabase Auth (updateUserById para email/senha se mudou nome/PIN) e tabela public.users
- **D-09:** Desativacao via toggle ativo/inativo na tabela com dialog de confirmacao antes de desativar ("Tem certeza? Usuario nao conseguira mais logar"). Reativar nao pede confirmacao
- **D-10:** Desativar seta `ativo = false` na tabela users. Login deve verificar campo `ativo` antes de permitir acesso

### Seguranca e permissoes
- **D-11:** Qualquer admin pode editar/desativar qualquer usuario, incluindo outros admins, sem restricoes
- **D-12:** Protecao via middleware (rota /usuarios so acessivel por admin) + role check na API route (mesmo padrao existente: getUser() -> dbUser.role check)
- **D-13:** Operacoes de escrita via supabaseAdmin (service role key), nao pelo client do usuario

### Claude's Discretion
- Adaptacao mobile da tabela (responsive table vs card list)
- Design exato do modal (spacing, labels, validacao visual)
- Icones para acoes na tabela (editar, desativar/ativar)
- Loading states e skeleton durante fetch de usuarios
- Ordem de exibicao dos usuarios na tabela (por nome, por role, por data criacao)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos
- `.planning/REQUIREMENTS.md` §Users — USER-01, USER-02, USER-03 (criar, editar, desativar)
- `.planning/PROJECT.md` §Key Decisions — Login por PIN, celulares compartilhados

### Autenticacao existente (Phase 2)
- `src/features/auth/lib/role-config.ts` — ROLE_ROUTES, ROLE_DEFAULTS, NAV_ITEMS (precisa adicionar /usuarios para admin)
- `scripts/seed-auth-users.ts` — Referencia para fluxo de criacao: admin.createUser + upsert public.users + nomeToEmail slug
- `.planning/phases/02-autenticacao/02-CONTEXT.md` — Decisoes D-01 a D-03 sobre Supabase Auth + email ficticio + PIN como senha

### Padrao de API routes
- `app/api/cards/assign/route.ts` — Padrao de referencia: createClient + getUser + role check + supabaseAdmin write

### Schema do banco
- `supabase/migrations/00001_initial_schema.sql` — Tabela users: id, nome, pin_hash, role (CHECK constraint), ativo, created_at

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase/admin.ts`: Client admin com service role key — para createUser, updateUserById, operacoes privilegiadas
- `src/lib/supabase/server.ts`: Client server-side para auth check nas API routes
- `scripts/seed-auth-users.ts`: Funcao `nomeToEmail` (slug inline) — reutilizar ou extrair para lib compartilhada
- shadcn/ui: Dialog, Table, Input, Select, Button, Toast — todos disponiveis
- `src/components/layout/app-shell.tsx`: AppShell filtra NAV_ITEMS por role — adicionar item /usuarios para admin

### Established Patterns
- Feature-based organization: `src/features/users/` (diretorio existe mas vazio) — components/, hooks/, lib/
- API route auth: createClient() -> getUser() -> role check via supabaseAdmin -> write via supabaseAdmin
- Toast para feedback de acoes (padrao usado em outras telas)
- Modal/Dialog para formularios (AssignModal, TransformacaoModal, etc.)

### Integration Points
- `src/features/auth/lib/role-config.ts`: Adicionar NAV_ITEMS entry e ROLE_ROUTES entry para /usuarios (admin only)
- `middleware.ts`: Ja protege rotas por role — /usuarios sera bloqueada automaticamente se estiver em ROLE_ROUTES apenas para admin
- `app/(authenticated)/`: Criar rota /usuarios dentro do layout autenticado
- Supabase Auth: admin.createUser, admin.updateUserById, admin.deleteUser (ou soft delete via ativo)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Fluxo segue padrao do seed script ja existente.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-gestao-de-usuarios*
*Context gathered: 2026-04-09*
