# Phase 10: Gestao de Usuarios - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 10-gestao-de-usuarios
**Areas discussed:** Layout da tela, Fluxo de criacao, Edicao e desativacao, Seguranca e permissoes

---

## Layout da tela

| Option | Description | Selected |
|--------|-------------|----------|
| Tabela simples | Tabela com colunas Nome, Role, Status, Acoes. Desktop-friendly, no mobile vira cards. | ✓ |
| Cards em grid | Cards individuais por usuario com avatar/inicial, nome, role badge, toggle ativo. | |
| Voce decide | Claude escolhe o layout mais adequado | |

**User's choice:** Tabela simples
**Notes:** —

### Formulario

| Option | Description | Selected |
|--------|-------------|----------|
| Modal/Dialog | Dialog shadcn/ui abre por cima da tabela. Consistente com outros modais. | ✓ |
| Pagina separada | Navega para /usuarios/novo ou /usuarios/[id]/editar | |
| Inline na tabela | Linha da tabela vira editavel ao clicar | |

**User's choice:** Modal/Dialog
**Notes:** —

---

## Fluxo de criacao

### Campos

| Option | Description | Selected |
|--------|-------------|----------|
| Nome + PIN + Role | 3 campos minimo necessario. PIN confirma digitando 2x. | ✓ |
| Nome + PIN + Role + Ativo | 4 campos, permite criar usuario ja desativado. | |
| Voce decide | Claude decide campos baseado na estrutura do banco | |

**User's choice:** Nome + PIN + Role
**Notes:** —

### Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Toast de sucesso | Modal fecha, toast verde, tabela atualiza. Se erro, toast vermelho. | ✓ |
| Ficar no modal com status | Modal mostra loading, depois mensagem de sucesso. | |
| Voce decide | Claude decide o feedback | |

**User's choice:** Toast de sucesso
**Notes:** —

---

## Edicao e desativacao

### Campos editaveis

| Option | Description | Selected |
|--------|-------------|----------|
| Nome, Role e PIN | Todos editaveis. PIN opcional (so preenche se quiser resetar). | ✓ |
| Apenas Nome e Role | PIN so na criacao. Para resetar, desativa e cria de novo. | |
| Voce decide | Claude decide | |

**User's choice:** Nome, Role e PIN
**Notes:** —

### Desativacao

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle com confirmacao | Alterna ativo/inativo. Dialog de confirmacao antes de desativar. Reativar sem confirmacao. | ✓ |
| Botao com PIN do admin | Pede PIN do admin como confirmacao extra. | |
| Voce decide | Claude decide | |

**User's choice:** Toggle com confirmacao
**Notes:** —

---

## Seguranca e permissoes

### Admin-admin

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, sem restricoes | Qualquer admin edita/desativa qualquer usuario incluindo admins. | ✓ |
| Nao pode desativar a si mesmo | Admin pode editar outros admins, mas nao o proprio. | |
| Admin nao edita outro admin | Admins so editam lider/separador/fardista. | |

**User's choice:** Sim, sem restricoes
**Notes:** —

### Protecao

| Option | Description | Selected |
|--------|-------------|----------|
| Middleware + role check na API | Padrao existente. Middleware bloqueia rota, API verifica role=admin. | ✓ |
| RLS policy no Supabase | Camada extra com RLS INSERT/UPDATE/DELETE apenas admin. | |
| Voce decide | Claude decide nivel de protecao | |

**User's choice:** Middleware + role check na API
**Notes:** —

---

## Claude's Discretion

- Adaptacao mobile da tabela
- Design exato do modal
- Icones para acoes
- Loading states e skeleton
- Ordem de exibicao dos usuarios

## Deferred Ideas

None — discussion stayed within phase scope
