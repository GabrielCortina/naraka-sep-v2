# Requirements: NARAKA | SEP v2

**Defined:** 2026-04-04
**Core Value:** Separadores e fardistas conseguem processar todos os pedidos do dia dentro dos prazos de envio de cada marketplace, com visibilidade em tempo real para o líder.

## v1 Requirements

### Setup

- [x] **SETUP-01**: Projeto Next.js 14 criado com Tailwind CSS e shadcn/ui
- [x] **SETUP-02**: Supabase conectado com todas as tabelas criadas (users, config, pedidos, progresso, reservas, atribuicoes, trafego_fardos, baixados, fardos_nao_encontrados)
- [ ] **SETUP-03**: Repositório GitHub conectado ao Vercel com deploy automático
- [x] **SETUP-04**: Google Sheets API configurada com conta de serviço e credenciais em variáveis de ambiente

### Authentication

- [x] **AUTH-01**: Usuário pode fazer login com nome + PIN numérico (4-6 dígitos)
- [x] **AUTH-02**: PIN armazenado como hash SHA-256 no banco
- [x] **AUTH-03**: Sessão mantida via JWT do Supabase
- [x] **AUTH-04**: Redirecionamento automático por role após login
- [x] **AUTH-05**: Cada role vê apenas as abas permitidas (Admin: todas; Líder: Dashboard/Upload/Fardos/Prateleira; Separador: Prateleira; Fardista: Fardos/Baixa)
- [x] **AUTH-06**: Usuário pode fazer logout de qualquer tela

### Upload

- [x] **UPLD-01**: Líder/Admin pode importar arquivo .xlsx do ERP UpSeller
- [x] **UPLD-02**: Sistema lê .xlsx no frontend com SheetJS e mapeia as 13 colunas do ERP
- [x] **UPLD-03**: Sistema filtra apenas pedidos com status "Em processo"
- [x] **UPLD-04**: Sistema ignora pedidos com método de envio contendo "Full" ou "Fulfillment"
- [x] **UPLD-05**: Sistema classifica pedidos automaticamente: Unitário (1 SKU, qtd=1), Kit (1 SKU, qtd>1), Combo (2+ SKUs diferentes)
- [x] **UPLD-06**: Deduplicação entre importações — Nº de Pedido que já existe no banco é ignorado na nova importação
- [x] **UPLD-07**: Linhas com mesmo Nº de Pedido dentro da mesma planilha são agrupadas normalmente (Combos/Kits)
- [x] **UPLD-08**: Virada de dia (data diferente da última importação) limpa o banco automaticamente antes de processar
- [x] **UPLD-09**: Cada importação recebe número sequencial (Importação 1, 2, 3...)
- [x] **UPLD-10**: Sistema classifica método de envio nos 6 grupos por correspondência parcial case-insensitive (TikTok verificado antes de Shopee Xpress)

### Stock Integration

- [x] **STOK-01**: Sistema lê planilha externa de estoque via Google Sheets API no momento do upload
- [x] **STOK-02**: Sistema identifica fardos disponíveis (código IN, SKU, quantidade, endereço)
- [x] **STOK-03**: SKU com >= 50 peças no dia vai para lista de fardos
- [x] **STOK-04**: SKU com < 50 peças no dia vai para lista de prateleira
- [x] **STOK-05**: Reserva de fardos usa algoritmo subset sum para encontrar combinação ótima com margem máxima de 20%
- [x] **STOK-06**: Cada fardo físico (código IN) só pode ser reservado uma vez globalmente
- [x] **STOK-07**: Se não cobrir dentro de 20%, reserva o máximo disponível

### Cards

- [x] **CARD-01**: Cada card agrupa pedidos por grupo_envio + tipo + importacao_numero
- [x] **CARD-02**: Card exibe lista de itens (SKU, endereço, quantidade, fardo ID se aplicável)
- [x] **CARD-03**: Card exibe barra de progresso (peças separadas / total)
- [x] **CARD-04**: Card exibe contagem regressiva até o prazo de envio
- [x] **CARD-05**: Card exibe badge de urgência (verde >2h, amarelo <2h, vermelho atrasado, verde opaco concluído)
- [x] **CARD-06**: Card exibe atribuição (separador/fardista responsável)
- [x] **CARD-07**: Cards são colapsáveis por método de envio
- [x] **CARD-08**: Card 100% completo vai automaticamente para seção CONCLUÍDOS
- [x] **CARD-09**: Seção CONCLUÍDOS é colapsável no final da lista

### Bales (Fardos)

- [x] **FARD-01**: Fardista vê lista de fardos agrupados por card com info: endereço, código IN, SKU, quantidade
- [ ] **FARD-02**: Fardista pode marcar fardo como OK (encontrado, entra no tráfego)
- [ ] **FARD-03**: Fardista pode marcar fardo como N/E (não encontrado) — sistema busca alternativo; se não achar, libera linha na prateleira
- [x] **FARD-04**: Lista de fardos atualiza em tempo real via Supabase subscription
- [ ] **FARD-05**: Líder pode atribuir fardistas a cards de fardos
- [ ] **FARD-06**: Botão "Imprimir Fardos" gera PDF com código IN, SKU, endereço, quantidade, para quem entregar

### Shelf (Prateleira)

- [ ] **PRAT-01**: Separador vê lista de itens agrupados por card (grupo + tipo + importação) com SKU, endereço, quantidade
- [ ] **PRAT-02**: Separador pode confirmar quantidade separada (Confirmar)
- [ ] **PRAT-03**: Separador pode marcar como Parcial — dispara cascata
- [ ] **PRAT-04**: Separador pode marcar como N/E (não encontrado) — dispara cascata
- [ ] **PRAT-05**: Cascata: sistema busca fardo alternativo no estoque externo; se achar, cria linha bloqueada "AGUARDAR FARDISTA" e adiciona na lista de fardos; se não, envia para Transformação
- [ ] **PRAT-06**: Lista de prateleira atualiza em tempo real via Supabase subscription
- [ ] **PRAT-07**: Líder pode atribuir separadores a cards
- [ ] **PRAT-08**: Botão "Imprimir Lista" por card e para todos os cards — gera PDF com grupo, tipo, importação, itens, espaço para checklist manual

### Discharge (Baixa)

- [ ] **BAIX-01**: Fardista pode digitar ou escanear código IN do fardo
- [ ] **BAIX-02**: Enter aciona busca automática no tráfego
- [ ] **BAIX-03**: Card de confirmação exibe SKU, quantidade, endereço
- [ ] **BAIX-04**: Card mostra "para quem entregar" — nome do separador responsável pelo card que usa aquele fardo
- [ ] **BAIX-05**: Se fardo atende múltiplos cards/separadores, mostra todos os nomes
- [ ] **BAIX-06**: Confirmar Baixa remove fardo do tráfego, libera prateleira, apaga colunas F+ na planilha de estoque externa

### Dashboard

- [ ] **DASH-01**: Bloco Resumo Geral — total de peças separadas no dia, listas pendentes, concluídas, em atraso
- [ ] **DASH-02**: Bloco Progressão por Método de Envio — barra de progresso, status urgência, contagem regressiva por grupo
- [ ] **DASH-03**: Bloco Top Separadores — ranking por peças separadas e cards concluídos no dia
- [ ] **DASH-04**: Bloco Top Fardistas — ranking por fardos confirmados no dia
- [ ] **DASH-05**: Bloco Status de Fardos — pendentes, encontrados (aguardando baixa), entregues
- [ ] **DASH-06**: Bloco Por Separador — barra de progresso dos cards atribuídos a cada separador
- [ ] **DASH-07**: Todos os blocos atualizam em tempo real via Supabase subscriptions

### Users

- [ ] **USER-01**: Admin pode criar novos usuários (nome, PIN, role)
- [ ] **USER-02**: Admin pode editar usuários existentes
- [ ] **USER-03**: Admin pode desativar usuários

### UI/UX

- [x] **UIUX-01**: Design minimalista preto e branco, fonte Inter
- [x] **UIUX-02**: Mobile first para separadores/fardistas
- [x] **UIUX-03**: Desktop otimizado para líder/admin
- [x] **UIUX-04**: Cores por marketplace: Shopee #ee4d2d, ML #ffe600, TikTok #25F4EE, Shein #000000
- [x] **UIUX-05**: Modal para abrir card e trabalhar itens
- [x] **UIUX-06**: Popup de quantidade no mobile

## v2 Requirements

### Analytics

- **ANLT-01**: Histórico de produtividade por separador/fardista ao longo do tempo
- **ANLT-02**: Relatórios de pedidos atrasados com causa raiz

### Notifications

- **NOTF-01**: Alerta sonoro quando card está próximo do prazo
- **NOTF-02**: Push notification para fardista quando fardo é necessário via cascata

### Integration

- **INTG-01**: Importação automática do ERP via API (sem upload manual)
- **INTG-02**: Leitura de etiquetas para impressão direta

## Out of Scope

| Feature | Reason |
|---------|--------|
| Migrar planilha de estoque para Supabase | Alimentada por automação externa que não pode ser alterada |
| App mobile nativo | Web responsivo atende separadores e fardistas no celular |
| Integração direta com APIs dos marketplaces | Dados vêm do ERP UpSeller via .xlsx |
| Multi-armazém | Sistema opera um único armazém |
| Histórico entre dias | Virada de dia limpa banco — operação é diária |
| Lógica do Apps Script anterior | Reconstrução do zero com regras novas |
| OAuth/login por email | PIN é mais rápido para operação de armazém com celulares compartilhados |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 1 | Complete |
| SETUP-02 | Phase 1 | Complete |
| SETUP-03 | Phase 1 | Pending |
| SETUP-04 | Phase 1 | Complete |
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 2 | Complete |
| AUTH-06 | Phase 2 | Complete |
| UPLD-01 | Phase 3 | Complete |
| UPLD-02 | Phase 3 | Complete |
| UPLD-03 | Phase 3 | Complete |
| UPLD-04 | Phase 3 | Complete |
| UPLD-05 | Phase 3 | Complete |
| UPLD-06 | Phase 3 | Complete |
| UPLD-07 | Phase 3 | Complete |
| UPLD-08 | Phase 3 | Complete |
| UPLD-09 | Phase 3 | Complete |
| UPLD-10 | Phase 3 | Complete |
| STOK-01 | Phase 4 | Complete |
| STOK-02 | Phase 4 | Complete |
| STOK-03 | Phase 4 | Complete |
| STOK-04 | Phase 4 | Complete |
| STOK-05 | Phase 4 | Complete |
| STOK-06 | Phase 4 | Complete |
| STOK-07 | Phase 4 | Complete |
| CARD-01 | Phase 5 | Complete |
| CARD-02 | Phase 5 | Complete |
| CARD-03 | Phase 5 | Complete |
| CARD-04 | Phase 5 | Complete |
| CARD-05 | Phase 5 | Complete |
| CARD-06 | Phase 5 | Complete |
| CARD-07 | Phase 5 | Complete |
| CARD-08 | Phase 5 | Complete |
| CARD-09 | Phase 5 | Complete |
| FARD-01 | Phase 6 | Complete |
| FARD-02 | Phase 6 | Pending |
| FARD-03 | Phase 6 | Pending |
| FARD-04 | Phase 6 | Complete |
| FARD-05 | Phase 6 | Pending |
| FARD-06 | Phase 6 | Pending |
| PRAT-01 | Phase 7 | Pending |
| PRAT-02 | Phase 7 | Pending |
| PRAT-03 | Phase 7 | Pending |
| PRAT-04 | Phase 7 | Pending |
| PRAT-05 | Phase 7 | Pending |
| PRAT-06 | Phase 7 | Pending |
| PRAT-07 | Phase 7 | Pending |
| PRAT-08 | Phase 7 | Pending |
| BAIX-01 | Phase 8 | Pending |
| BAIX-02 | Phase 8 | Pending |
| BAIX-03 | Phase 8 | Pending |
| BAIX-04 | Phase 8 | Pending |
| BAIX-05 | Phase 8 | Pending |
| BAIX-06 | Phase 8 | Pending |
| DASH-01 | Phase 9 | Pending |
| DASH-02 | Phase 9 | Pending |
| DASH-03 | Phase 9 | Pending |
| DASH-04 | Phase 9 | Pending |
| DASH-05 | Phase 9 | Pending |
| DASH-06 | Phase 9 | Pending |
| DASH-07 | Phase 9 | Pending |
| USER-01 | Phase 10 | Pending |
| USER-02 | Phase 10 | Pending |
| USER-03 | Phase 10 | Pending |
| UIUX-01 | Phase 5 | Complete |
| UIUX-02 | Phase 5 | Complete |
| UIUX-03 | Phase 5 | Complete |
| UIUX-04 | Phase 5 | Complete |
| UIUX-05 | Phase 5 | Complete |
| UIUX-06 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 60 total
- Mapped to phases: 60
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-04 after initial definition*
