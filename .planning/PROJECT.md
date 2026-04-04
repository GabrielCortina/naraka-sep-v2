# NARAKA | SEP v2

## What This Is

Sistema web de separação e gestão de pedidos para armazém/fulfillment. Substitui completamente o sistema anterior baseado em Google Apps Script + Google Sheets, reconstruído do zero com stack moderno (Next.js 14 + Supabase + Vercel). Quatro perfis de usuário (Admin, Líder, Separador, Fardista) operam o fluxo completo: upload de planilha ERP, classificação de pedidos, reserva de fardos, separação por prateleira, baixa de fardos e acompanhamento em tempo real via dashboard.

## Core Value

Separadores e fardistas conseguem processar todos os pedidos do dia dentro dos prazos de envio de cada marketplace, com visibilidade em tempo real para o líder.

## Requirements

### Validated

- [x] Integração Google Sheets API para leitura do estoque externo — Validated in Phase 1: Infraestrutura
- [x] Realtime obrigatório via Supabase subscriptions (zero polling) — Infrastructure ready (Phase 1), subscriptions to be wired in later phases

### Active

- [ ] Login por nome + PIN (4-6 dígitos) com hash SHA-256 e sessão JWT
- [ ] 4 roles (admin, lider, separador, fardista) com permissões por aba
- [ ] Upload de arquivo .xlsx do ERP UpSeller com filtro automático (só "Em processo", ignorar Full/Fulfillment)
- [ ] Classificação automática de pedidos: Unitário, Kit, Combo
- [ ] Deduplicação entre importações (por Nº de Pedido vs banco) — dentro da mesma planilha é agrupamento normal
- [ ] Virada de dia limpa o banco automaticamente
- [ ] Numeração de importações (Importação 1, 2, 3...)
- [ ] Integração Google Sheets API para leitura do estoque externo (nunca migrar para Supabase)
- [ ] Reserva de fardos com algoritmo subset sum + margem 20%
- [ ] Regra SKU >= 50 peças → fardos; < 50 → prateleira
- [ ] Classificação de métodos de envio em 6 grupos com prazos
- [ ] Sistema de cards: grupo_envio + tipo + importacao_numero
- [ ] Lista de fardos com ações OK e N/E
- [ ] Lista de prateleira com ações Confirmar, Parcial, N/E
- [ ] Cascata: N/E ou Parcial busca fardo alternativo ou envia para Transformação
- [ ] Linha bloqueada "AGUARDAR FARDISTA" na prateleira
- [ ] Tela de baixa com scanner de código IN
- [ ] Baixa apaga colunas F+ na planilha de estoque externa
- [ ] Card mostra "para quem entregar" (nome do separador responsável)
- [ ] Dashboard em tempo real com 6 blocos (resumo, progressão, top separadores, top fardistas, status fardos, por separador)
- [ ] Atribuição de cards para separadores e fardistas pelo líder
- [ ] Realtime obrigatório via Supabase subscriptions (zero polling)
- [ ] Contagem regressiva até prazo com badges de urgência (verde/amarelo/vermelho)
- [ ] Barras de progresso em cards e dashboard
- [ ] Cards colapsáveis por método de envio
- [ ] Seção CONCLUÍDOS colapsável
- [ ] Botão imprimir lista/fardos → PDF
- [ ] CRUD de usuários (admin only)
- [ ] Mobile first para separadores/fardistas, desktop para líder/admin
- [ ] Design minimalista preto e branco com cores por marketplace e urgência

### Out of Scope

- Migração da planilha de estoque para Supabase — alimentada por automação externa que não pode ser alterada
- Lógica do Google Apps Script anterior — reconstrução do zero
- App mobile nativo — web responsivo é suficiente
- Integração direta com APIs dos marketplaces — dados vêm do ERP UpSeller
- Multi-armazém — sistema opera um único armazém
- Histórico entre dias — virada de dia limpa tudo

## Context

**Operação:** Armazém de fulfillment que atende 4 marketplaces (Mercado Livre, TikTok Shop, Shopee, Shein) com 9 lojas cadastradas (ELIS MELI, ELIS SHEIN, ELIS SHOPEE, JOY SHEIN, JOY SHOPEE, NARAKA MELI, NARAKA TIKTOK, OXEAN MELI, OXEAN SHOPEE).

**Fluxo físico:** Upload da planilha ERP → líder atribui cards → fardista retira fardos do estoque → separador separa itens da prateleira → fardista faz baixa dos fardos → pedido concluído.

**Planilha de estoque externa:** Google Sheets ID `1tL5as2Q0QEZCj_6Kc4xGGqPqU4T5uduHmaGmntC8W58`, aba "Estoque", colunas SKU, QUANTIDADE, CÓDIGO UPSELLER (código IN / fardo ID), ENDEREÇO. Sistema lê para saber fardos disponíveis e escreve para apagar colunas F+ na baixa.

**Usuário:** Não é programador — instruções devem ser passo a passo com comandos exatos. Comunicação em português brasileiro.

**Grupos de envio (6):**
- Shopee SPX (até 11h)
- ML Flex (até 12h)
- TikTok (15h-18h)
- ML Coleta (14h-16h)
- Shein (até 16h)
- Shopee Xpress (até 19h)

**Cores por marketplace:** Shopee #ee4d2d, Mercado Livre #ffe600, TikTok #25F4EE, Shein #000000

**Cores por urgência:** Verde (>2h), Amarelo (<2h), Vermelho (atrasado), Verde opaco (concluído)

**Schema do banco:** 8 tabelas — users, config, pedidos, progresso, reservas, atribuicoes, trafego_fardos, baixados, fardos_nao_encontrados

**Mapeamento ERP:** Colunas do .xlsx — Nº de Pedido da Plataforma, Nº de Pedido, Plataformas, Nome da Loja no UpSeller, Estado do Pedido, Prazo de Envio, SKU (Armazém), Quantidade de Produtos, Quantidade Mapeada, Variação, Nome do Produto, Método de Envio, Etiqueta

## Constraints

- **Tech stack**: Next.js 14 + Supabase + Vercel + Google Sheets API + Tailwind + shadcn/ui + SheetJS — stack definido e não negociável
- **Realtime**: Obrigatório via Supabase subscriptions — polling proibido
- **Estoque externo**: Planilha Google Sheets nunca migra para Supabase — outra automação a alimenta
- **Margem fardos**: Sempre 20% percentual — nunca número fixo
- **Deduplicação**: Entre planilhas diferentes, nunca dentro da mesma planilha
- **Hospedagem**: Vercel com deploy automático via GitHub
- **Comunicação**: Sempre em português brasileiro

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Reconstruir do zero (não migrar Apps Script) | Stack anterior limitado, código legado difícil de manter | — Pending |
| Login por PIN (não email/senha) | Separadores e fardistas usam celular compartilhado no armazém, PIN é mais rápido | — Pending |
| Estoque permanece no Google Sheets | Alimentado por automação externa que não pode ser alterada | — Pending |
| Subset sum para reserva de fardos | Minimiza desperdício ao selecionar combinação ótima de fardos | — Pending |
| card_key = "grupo\|tipo\|importacao_numero" | Permite múltiplas importações no mesmo dia sem conflito | — Pending |
| Virada de dia limpa o banco | Operação é diária, histórico entre dias não é necessário | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-04 after Phase 1: Infraestrutura complete — Next.js 14 + Supabase + Google Sheets + Vercel deploy*
