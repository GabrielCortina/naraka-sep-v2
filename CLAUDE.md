<!-- GSD:project-start source:PROJECT.md -->
## Project

**NARAKA | SEP v2**

Sistema web de separação e gestão de pedidos para armazém/fulfillment. Substitui completamente o sistema anterior baseado em Google Apps Script + Google Sheets, reconstruído do zero com stack moderno (Next.js 14 + Supabase + Vercel). Quatro perfis de usuário (Admin, Líder, Separador, Fardista) operam o fluxo completo: upload de planilha ERP, classificação de pedidos, reserva de fardos, separação por prateleira, baixa de fardos e acompanhamento em tempo real via dashboard.

**Core Value:** Separadores e fardistas conseguem processar todos os pedidos do dia dentro dos prazos de envio de cada marketplace, com visibilidade em tempo real para o líder.

### Constraints

- **Tech stack**: Next.js 14 + Supabase + Vercel + Google Sheets API + Tailwind + shadcn/ui + SheetJS — stack definido e não negociável
- **Realtime**: Obrigatório via Supabase subscriptions — polling proibido
- **Estoque externo**: Planilha Google Sheets nunca migra para Supabase — outra automação a alimenta
- **Margem fardos**: Sempre 20% percentual — nunca número fixo
- **Deduplicação**: Entre planilhas diferentes, nunca dentro da mesma planilha
- **Hospedagem**: Vercel com deploy automático via GitHub
- **Comunicação**: Sempre em português brasileiro
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
