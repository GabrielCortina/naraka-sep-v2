# Roadmap: NARAKA | SEP v2

## Overview

Sistema de separacao e gestao de pedidos para armazem, reconstruido do zero com Next.js 14 + Supabase + Vercel. O roadmap segue a cadeia natural de dependencias do fluxo operacional: infraestrutura, autenticacao, upload de planilhas, integracao de estoque e reserva de fardos, sistema de cards e UI, lista de fardos, lista de prateleira com cascata, baixa de fardos, dashboard em tempo real, e gestao de usuarios. Cada fase entrega uma capacidade completa e verificavel.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Infraestrutura** - Projeto Next.js 14 com Supabase, Vercel e Google Sheets API configurados (completed 2026-04-04)
- [ ] **Phase 2: Autenticacao** - Login por PIN com roles e permissoes por aba
- [ ] **Phase 3: Upload e Processamento** - Importacao de planilha ERP com classificacao, deduplicacao e virada de dia
- [ ] **Phase 4: Estoque e Reserva de Fardos** - Integracao Google Sheets para leitura de estoque e reserva via subset sum
- [ ] **Phase 5: Cards e UI Foundation** - Sistema de cards com agrupamento, progresso, urgencia e design system
- [ ] **Phase 6: Lista de Fardos** - Tela do fardista com acoes OK/NE, atribuicao e impressao
- [ ] **Phase 7: Lista de Prateleira e Cascata** - Tela do separador com acoes Confirmar/Parcial/NE e cascata automatica
- [ ] **Phase 8: Baixa de Fardos** - Tela de baixa com scanner, confirmacao e escrita na planilha de estoque
- [ ] **Phase 9: Dashboard** - Painel em tempo real com 6 blocos de metricas e acompanhamento
- [ ] **Phase 10: Gestao de Usuarios** - CRUD de usuarios pelo admin

## Phase Details

### Phase 1: Infraestrutura
**Goal**: Toda a fundacao tecnica esta pronta para desenvolvimento — projeto roda localmente, banco existe, deploy automatico funciona, API do Google Sheets responde
**Depends on**: Nothing (first phase)
**Requirements**: SETUP-01, SETUP-02, SETUP-03, SETUP-04
**Success Criteria** (what must be TRUE):
  1. Projeto Next.js 14 roda localmente com Tailwind e shadcn/ui funcionando
  2. Supabase conectado com todas as 9 tabelas criadas e acessiveis
  3. Push no GitHub dispara deploy automatico no Vercel e o site abre
  4. Google Sheets API responde com dados da planilha de estoque via conta de servico
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Criar projeto Next.js 14 com Tailwind, shadcn/ui e estrutura de pastas
- [x] 01-02-PLAN.md — Configurar Supabase (schema, clientes, middleware) e Google Sheets API
- [x] 01-03-PLAN.md — Git, schema push, GitHub, deploy Vercel e verificacao end-to-end

### Phase 2: Autenticacao
**Goal**: Usuarios conseguem acessar o sistema com PIN e ver apenas as abas permitidas para seu role
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. Usuario faz login digitando nome e PIN numerico e acessa o sistema
  2. Apos login, usuario e redirecionado automaticamente para a tela principal do seu role
  3. Cada role ve apenas as abas permitidas (Admin: todas; Lider: Dashboard/Upload/Fardos/Prateleira; Separador: Prateleira; Fardista: Fardos/Baixa)
  4. Usuario pode fazer logout de qualquer tela e volta para a tela de login
**Plans**: 3 plans
**UI hint**: yes

Plans:
- [x] 02-01-PLAN.md — Infraestrutura de auth: migration Custom Access Token Hook, role config, slugify e seed de usuarios
- [x] 02-02-PLAN.md — Tela de login (nome + PIN) e middleware JWT com protecao de rotas por role
- [x] 02-03-PLAN.md — AppShell responsivo (sidebar + bottom tabs), logout e paginas placeholder

### Phase 3: Upload e Processamento
**Goal**: Lider pode importar planilha do ERP e o sistema processa, classifica e persiste todos os pedidos corretamente
**Depends on**: Phase 2
**Requirements**: UPLD-01, UPLD-02, UPLD-03, UPLD-04, UPLD-05, UPLD-06, UPLD-07, UPLD-08, UPLD-09, UPLD-10
**Success Criteria** (what must be TRUE):
  1. Lider faz upload de arquivo .xlsx e o sistema importa apenas pedidos "Em processo", ignorando Full/Fulfillment
  2. Pedidos sao classificados automaticamente como Unitario, Kit ou Combo com base em SKU e quantidade
  3. Pedidos com Numero de Pedido ja existente no banco sao ignorados na nova importacao; linhas com mesmo numero dentro da planilha sao agrupadas
  4. Cada importacao recebe numero sequencial e metodo de envio e classificado nos 6 grupos corretos
  5. Upload em dia diferente da ultima importacao limpa o banco antes de processar
**Plans**: 4 plans
**UI hint**: yes

Plans:
- [x] 03-01-PLAN.md — Instalar dependencias, configurar vitest e implementar logica pura (parse, classify, envio-groups) com testes
- [x] 03-02-PLAN.md — Route Handlers POST /api/upload e DELETE /api/upload/undo com classificacao, deduplicacao e virada de dia
- [x] 03-03-PLAN.md — Componentes UI (DropZone, ImportPreview, ImportList) e hook useUpload
- [x] 03-04-PLAN.md — Pagina /upload conectando todos os componentes + checkpoint de verificacao

### Phase 4: Estoque e Reserva de Fardos
**Goal**: Sistema le estoque externo do Google Sheets e reserva fardos automaticamente usando subset sum com margem de 20%
**Depends on**: Phase 3
**Requirements**: STOK-01, STOK-02, STOK-03, STOK-04, STOK-05, STOK-06, STOK-07
**Success Criteria** (what must be TRUE):
  1. Apos upload, sistema le planilha de estoque e identifica fardos disponiveis com codigo IN, SKU, quantidade e endereco
  2. SKUs com fardo disponivel no estoque externo vao para lista de fardos; SKUs sem fardo vao para lista de prateleira (regra corrigida por D-06)
  3. Reserva de fardos seleciona combinacao otima via subset sum sem exceder 20% de margem; cada fardo fisico e reservado apenas uma vez
  4. Se nao cobrir dentro de 20%, sistema reserva o maximo disponivel sem travar
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Migration SQL, tipos do dominio fardos e algoritmo subset sum com TDD
- [x] 04-02-PLAN.md — Cache, stock-parser com retry, e reservation engine com testes
- [x] 04-03-PLAN.md — Integracao no upload route, endpoint re-reserva, feedback UI e schema push

### Phase 5: Cards e UI Foundation
**Goal**: Pedidos processados aparecem organizados em cards com progresso, urgencia e design system completo do sistema
**Depends on**: Phase 4
**Requirements**: CARD-01, CARD-02, CARD-03, CARD-04, CARD-05, CARD-06, CARD-07, CARD-08, CARD-09, UIUX-01, UIUX-02, UIUX-03, UIUX-04, UIUX-05, UIUX-06
**Success Criteria** (what must be TRUE):
  1. Pedidos aparecem agrupados em cards por grupo_envio + tipo + importacao_numero, com lista de itens, barra de progresso e atribuicao
  2. Cada card exibe contagem regressiva ate o prazo com badge de urgencia colorido (verde >2h, amarelo <2h, vermelho atrasado)
  3. Cards sao colapsiveis por metodo de envio e cards 100% completos vao para secao CONCLUIDOS colapsavel
  4. Design minimalista preto e branco com cores por marketplace; mobile first para separadores/fardistas, desktop para lider/admin
  5. Modal abre card para trabalhar itens; popup de quantidade funciona no mobile
**Plans**: 6 plans
**UI hint**: yes

Plans:
- [ ] 05-01-PLAN.md — Design system tokens, tipos do dominio cards e logica pura card-utils com TDD
- [ ] 05-02-PLAN.md — Instalar deps shadcn/jspdf e componentes atomicos (ProgressBar, UrgencyBadge, MarketplaceBadge, OrderCard)
- [ ] 05-03-PLAN.md — KanbanBoard, KanbanColumn e CompletedSection com layout responsivo desktop/mobile
- [ ] 05-04-PLAN.md — Modais (ItemModal, NumpadPopup, AssignModal) e PDF generator
- [ ] 05-05-PLAN.md — Hooks de dados (realtime, countdown, card-data), migration SQL e wiring nas paginas /prateleira e /fardos
- [ ] 05-06-PLAN.md — RLS write policies e API route handlers para progresso e atribuicao

### Phase 6: Lista de Fardos
**Goal**: Fardista pode ver, trabalhar e imprimir sua lista de fardos com acoes OK e N/E em tempo real
**Depends on**: Phase 5
**Requirements**: FARD-01, FARD-02, FARD-03, FARD-04, FARD-05, FARD-06
**Success Criteria** (what must be TRUE):
  1. Fardista ve lista de fardos agrupados por card com endereco, codigo IN, SKU e quantidade
  2. Fardista marca fardo como OK (entra no trafego) ou N/E (sistema busca alternativo; se nao achar, libera na prateleira)
  3. Lider pode atribuir fardistas a cards de fardos e a lista atualiza em tempo real
  4. Botao Imprimir Fardos gera PDF com codigo IN, SKU, endereco, quantidade e para quem entregar
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 06-01: TBD

### Phase 7: Lista de Prateleira e Cascata
**Goal**: Separador pode trabalhar itens da prateleira com acoes Confirmar/Parcial/NE e cascata automatica para fardos ou Transformacao
**Depends on**: Phase 6
**Requirements**: PRAT-01, PRAT-02, PRAT-03, PRAT-04, PRAT-05, PRAT-06, PRAT-07, PRAT-08
**Success Criteria** (what must be TRUE):
  1. Separador ve lista de itens agrupados por card com SKU, endereco e quantidade
  2. Separador pode Confirmar quantidade, marcar Parcial ou N/E — Parcial e N/E disparam cascata automatica
  3. Cascata busca fardo alternativo no estoque externo; se achar, cria linha "AGUARDAR FARDISTA" e adiciona na lista de fardos; se nao, envia para Transformacao
  4. Lider pode atribuir separadores a cards; lista atualiza em tempo real; botao Imprimir Lista gera PDF
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 07-01: TBD

### Phase 8: Baixa de Fardos
**Goal**: Fardista pode escanear ou digitar codigo IN para dar baixa no fardo, removendo do trafego e atualizando a planilha de estoque
**Depends on**: Phase 7
**Requirements**: BAIX-01, BAIX-02, BAIX-03, BAIX-04, BAIX-05, BAIX-06
**Success Criteria** (what must be TRUE):
  1. Fardista digita ou escaneia codigo IN e Enter aciona busca automatica no trafego
  2. Card de confirmacao exibe SKU, quantidade, endereco e "para quem entregar" (nome do separador; se multiplos, mostra todos)
  3. Confirmar Baixa remove fardo do trafego, libera prateleira e apaga colunas F+ na planilha de estoque externa via Google Sheets API
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 08-01: TBD

### Phase 9: Dashboard
**Goal**: Lider e admin acompanham operacao em tempo real com metricas de progressao, rankings e status de fardos
**Depends on**: Phase 8
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07
**Success Criteria** (what must be TRUE):
  1. Dashboard exibe Resumo Geral (pecas separadas, listas pendentes/concluidas/em atraso) e Progressao por Metodo de Envio com barra e contagem regressiva
  2. Dashboard exibe Top Separadores (ranking por pecas e cards) e Top Fardistas (ranking por fardos confirmados)
  3. Dashboard exibe Status de Fardos (pendentes/encontrados/entregues) e progresso Por Separador
  4. Todos os 6 blocos atualizam em tempo real via Supabase subscriptions sem polling
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 09-01: TBD

### Phase 10: Gestao de Usuarios
**Goal**: Admin pode criar, editar e desativar usuarios do sistema
**Depends on**: Phase 2
**Requirements**: USER-01, USER-02, USER-03
**Success Criteria** (what must be TRUE):
  1. Admin pode criar novo usuario com nome, PIN e role
  2. Admin pode editar dados de usuarios existentes e desativar usuarios
  3. Apenas o role Admin ve e acessa a tela de gestao de usuarios
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 10-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infraestrutura | 3/3 | Complete   | 2026-04-04 |
| 2. Autenticacao | 0/3 | Not started | - |
| 3. Upload e Processamento | 0/4 | Not started | - |
| 4. Estoque e Reserva de Fardos | 1/3 | In Progress|  |
| 5. Cards e UI Foundation | 0/6 | Not started | - |
| 6. Lista de Fardos | 0/? | Not started | - |
| 7. Lista de Prateleira e Cascata | 0/? | Not started | - |
| 8. Baixa de Fardos | 0/? | Not started | - |
| 9. Dashboard | 0/? | Not started | - |
| 10. Gestao de Usuarios | 0/? | Not started | - |
