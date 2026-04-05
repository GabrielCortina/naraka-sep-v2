# Phase 5: Cards e UI Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 05-cards-e-ui-foundation
**Areas discussed:** Layout dos cards, Conteudo e interacao do card, Sistema de urgencia e cores, Design system e tokens

---

## Layout dos cards

| Option | Description | Selected |
|--------|-------------|----------|
| Por metodo de envio | Secoes colapsiveis por grupo de envio, cards ordenados por urgencia | |
| Lista plana por urgencia | Todos os cards juntos sem agrupamento | |
| Tabs por metodo de envio | Uma aba por grupo de envio | |

**User's choice:** Layout kanban com colunas horizontais por metodo de envio (especificacao visual detalhada fornecida — nem grid nem tabs, mas colunas lado a lado estilo board)
**Notes:** Usuario forneceu referencia visual completa cobrindo: estrutura de colunas, card individual, cores, responsividade mobile, tipografia. Layout de colunas fixas ~220-260px com scroll horizontal. Mobile: secoes colapsiveis. Numero da importacao (#1, #2...) adicionado na linha superior do card. Ordem das colunas por prazo mais urgente.

### Grid desktop

**User's choice:** Colunas por metodo de envio (nao grid de N cards)
**Notes:** Uma coluna fixa por metodo, nao e grade. Colunas vazias nao aparecem.

### Secao CONCLUIDOS

| Option | Description | Selected |
|--------|-------------|----------|
| No final, colapsavel | Secao unica no final, comeca fechada | ✓ |
| Dentro de cada grupo | Sub-secao por grupo | |
| Pagina separada | Concluidos em pagina separada | |

### Mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Lista vertical full-width | 1 card por linha, toque abre modal | ✓ |
| Cards compactos empilhados | Cards menores com resumo | |
| Swipeable por grupo | Swipe lateral entre grupos | |

---

## Conteudo e interacao do card

### Modal de itens

| Option | Description | Selected |
|--------|-------------|----------|
| Lista de itens com acoes | SKU, quantidade necessaria, status, botoes de acao | ✓ |
| Lista somente leitura | Sem acoes, acoes nas fases 6/7 | |
| Voce decide | Claude define | |

**User's choice:** Lista com acoes. Especificacoes: so SKU + quantidade necessaria + status. NAO mostrar endereco. Apenas 2 botoes: Confirmar quantidade (abre numpad) e "Nao Tem" (cascata). Parcial detectado automaticamente pela quantidade menor.

### Popup de quantidade

| Option | Description | Selected |
|--------|-------------|----------|
| Numpad dedicado | Numpad grande e tatil, +/-, confirmar verde | |
| Input numerico nativo | Teclado nativo do celular | |
| Adiado | So nas fases 6/7 | |

**User's choice:** Numpad simples: digitos 0-9, backspace, Confirmar verde. Sem +/-.

### Atribuicao

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown com usuarios | Dropdown filtrado por role | |
| Modal de selecao | Modal com lista de usuarios e status | ✓ |
| Voce decide | Claude escolhe | |

### Modal por role

| Option | Description | Selected |
|--------|-------------|----------|
| Mesmo modal, acoes por role | Mesma lista, botoes por role | |
| Modal diferente por role | Contextos diferentes | |
| Adiado para Phase 6/7 | Modal somente leitura nesta fase | |

**User's choice:** Mesmo modal para todos os roles. Todos tem acesso as acoes (incluindo lider).

### Card 100% completo

| Option | Description | Selected |
|--------|-------------|----------|
| Animacao + move para CONCLUIDOS | Fade/slide e move automaticamente | ✓ |
| Move silenciosamente | Sem animacao | |
| Voce decide | Claude decide | |

### Cards sem atribuicao

| Option | Description | Selected |
|--------|-------------|----------|
| Nao — so atribuidos | So ve cards atribuidos a ele | ✓ |
| Sim — qualquer card | Qualquer card do role | |
| Misto | Todos visiveis, atribuidos destacados | |

### Filtragem do separador

| Option | Description | Selected |
|--------|-------------|----------|
| So atribuidos a ele | Tela limpa e focada | ✓ |
| Todos com destaque | Ve todos, atribuidos destacados | |
| Filtro por atribuicao + metodo | Botoes de filtro | |

### Agrupamento no modal

**User's choice:** Lista unica sem separacao em secoes. Ordenacao dinamica: disponiveis no topo, bloqueados (AGUARDAR FARDISTA) no final. Desbloqueio sobe item automaticamente.

### Info no card

| Option | Description | Selected |
|--------|-------------|----------|
| Sim — contador de pedidos | "12 pedidos" no card | |
| Nao — so pecas | So total de pecas | ✓ |
| Voce decide | Claude decide | |

### Acoes do lider

| Option | Description | Selected |
|--------|-------------|----------|
| Nao — so atribuir e ver | Sem acoes extras | ✓ |
| Sim — reordenar prioridade | Arrastar para reordenar | |
| Sim — filtros avancados | Filtrar por tipo/importacao/status | |

### Impressao

**Botao:** Dentro do modal do card (footer)
**PDF:** Lista de itens para checklist manual (grupo, tipo, importacao, tabela SKU + quantidade + espaco para check)

### Realtime

**User's choice:** Sim — Supabase subscription. Atualizacao instantanea.

### Multiplos fardos por SKU

**User's notes:** Cada fardo = linha separada. Linhas desbloqueiam individualmente. Quantidade sempre a necessaria para o pedido, nunca do fardo. Priorizacao default por prazo. Linha de prateleira sempre desbloqueada.

---

## Sistema de urgencia e cores

### Prazo base

| Option | Description | Selected |
|--------|-------------|----------|
| Prazo fixo do grupo de envio | Horario limite do grupo | ✓ |
| Prazo individual do pedido | Coluna Prazo de Envio | |
| O mais urgente do card | Prazo mais proximo do card | |

### Ao chegar a zero

| Option | Description | Selected |
|--------|-------------|----------|
| ATRASADO fixo | Contagem some, texto vermelho, card no topo | ✓ |
| Contagem negativa | -0h 15min em vermelho | |
| Voce decide | Claude decide | |

### Transicoes de cor

| Option | Description | Selected |
|--------|-------------|----------|
| Instantanea com flash | Breve flash/pulso ao mudar | ✓ |
| Instantanea sem animacao | Cor simplesmente muda | |
| Voce decide | Claude decide | |

---

## Design system e tokens

### Fonte Inter

| Option | Description | Selected |
|--------|-------------|----------|
| Regular + Semibold + Bold | 400, 600, 700 | ✓ |
| Voce decide | Claude seleciona | |
| Customizado | Pesos diferentes | |

### Tokens de cor

| Option | Description | Selected |
|--------|-------------|----------|
| CSS variables + Tailwind extend | --shopee, --ml, etc. bg-shopee, text-ml | ✓ |
| Classes utilitarias diretas | bg-[#ee4d2d] inline | |
| Voce decide | Claude decide | |

### Modo escuro

| Option | Description | Selected |
|--------|-------------|----------|
| Nao — so tema claro | Minimalista P&B | ✓ |
| Sim — futuro | Preparar tokens | |
| Sim — nesta fase | Dark mode completo | |

### Componentes

| Option | Description | Selected |
|--------|-------------|----------|
| Card + Badge + Progress + Modal | OrderCard, UrgencyBadge, ProgressBar, ItemModal | ✓ |
| So o necessario | Minimo para esta fase | |
| Voce decide | Claude decide | |

---

## Claude's Discretion

- Animacao exata do card ao mover para CONCLUIDOS
- Tamanho e posicao do modal
- Scroll interno do modal
- Design do numpad
- Implementacao interna dos componentes
- Design do modal de selecao de usuario
- Tipografia e espacamento nao especificados

## Deferred Ideas

- Priorizacao manual de fardos por metodo de envio — fase futura apos Phase 7
- Atribuicao multipla de fardos com checkboxes — Phase 6
