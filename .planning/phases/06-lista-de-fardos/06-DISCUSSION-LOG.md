# Phase 6: Lista de Fardos - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 06-lista-de-fardos
**Areas discussed:** Visualizacao dos fardos, Fluxo OK/N/E, Atribuicao em lote, Impressao PDF, Header/filtros, Realtime/feedback visual, Migracao do banco, Ordenacao da lista

---

## Visualizacao dos fardos

| Option | Description | Selected |
|--------|-------------|----------|
| Lista no proprio card | Card expandido mostra fardos com botoes OK/N/E inline | |
| Modal dedicado de fardos | Card mostra resumo, toque abre modal | |

**User's choice:** Nenhuma das opcoes acima — usuario descreveu layout completamente diferente: lista plana dedicada na pagina, sem KanbanBoard, sem modal, sem agrupamento por metodo de envio ou card. Cada fardo e uma linha independente com layout especifico baseado em print de referencia.

**Notes:** Layout detalhado: card branco com borda azul, SKU bold, ID em cinza, endereco com pin verde, "CONTEM" + quantidade, botoes OK/N/E. Lider ve checkboxes, fardista ve apenas seus fardos atribuidos.

| Option | Description | Selected |
|--------|-------------|----------|
| Agrupado por SKU | Header SKU + fardos embaixo | |
| Lista plana | Todos os fardos sem agrupamento | ✓ |

**User's choice:** Lista plana

---

## Fluxo OK (fardo encontrado)

| Option | Description | Selected |
|--------|-------------|----------|
| Direto sem confirmacao | Toque = processa imediatamente | ✓ |
| Com confirmacao | Popup antes de registrar | |

**User's choice:** Direto sem confirmacao. Usuario detalhou fluxo completo de 3 passos: (1) buscar na planilha por CODIGO UPSELLER exato, (2) copiar linha completa para trafego_fardos com 14+ campos, (3) apagar colunas F+ da planilha preservando A-E. Dupla verificacao obrigatoria.

---

## Fluxo N/E (nao encontrado)

| Option | Description | Selected |
|--------|-------------|----------|
| Libera na prateleira automaticamente | Quantidade vai para prateleira como item livre | ✓ (parcial) |
| Marca como Transformacao | Item vai para fila manual | |

**User's choice:** Busca alternativo PRIMEIRO. Regra diferente por origem: importacao normal = 20% margem, cascata = qualquer fardo. Se encontrou = substitui automaticamente. Se NAO encontrou = registra em fardos_nao_encontrados, cancela reserva, libera prateleira.

| Option | Description | Selected |
|--------|-------------|----------|
| Aparece automaticamente | Novo fardo via realtime | ✓ |
| Precisa atribuicao do lider | Lider atribui manualmente | |

**User's choice:** Aparece automaticamente

---

## Atribuicao em lote

| Option | Description | Selected |
|--------|-------------|----------|
| Barra flutuante no rodape | Aparece com checkboxes selecionados | ✓ |
| Botao fixo no topo | Sempre visivel, desabilitado quando nada selecionado | |

**User's choice:** Barra flutuante no rodape

| Option | Description | Selected |
|--------|-------------|----------|
| Modal com lista de fardistas | Reutiliza AssignModal da Phase 5 | ✓ |
| Dropdown inline | Dropdown na barra flutuante | |

**User's choice:** Modal com lista de fardistas (AssignModal reutilizado)

---

## Impressao PDF

| Option | Description | Selected |
|--------|-------------|----------|
| Fardos selecionados via checkbox | Se nenhum selecionado, imprime todos | ✓ |
| Todos os fardos do fardista | Por fardista | |
| Todos os fardos do dia | Lista completa | |

**User's choice:** Fardos selecionados via checkbox

| Option | Description | Selected |
|--------|-------------|----------|
| Campo vazio / traco | "---" se sem separador | ✓ |
| Nao incluir campo | Omitir | |
| Bloquear impressao | Nao permitir sem atribuicao | |

**User's choice:** Campo vazio / traco

---

## Header / filtros da pagina

**User's choice (multiSelect):** Busca por codigo IN, Filtro por status, Contadores no header, Botao Selecionar Todos

**Notes adicionais do usuario:** Filtro de atribuicao (Todos/Atribuidos/Nao Atribuidos), Ordenacao (SKU A-Z, Endereco A-Z, Padrao), Botao "Sincronizar Estoque" para lider/admin (reutiliza executeReservation forceRefresh da Phase 4)

---

## Realtime / feedback visual

| Option | Description | Selected |
|--------|-------------|----------|
| Animacao + toast | Transicao suave + toast breve | ✓ |
| Apenas mudanca de cor | Sem animacao, sem toast | |

| Option | Description | Selected |
|--------|-------------|----------|
| Spinner no botao clicado | Botao mostra spinner, outros desabilitados | ✓ |
| Overlay na linha inteira | Linha com overlay semi-transparente | |

---

## Migracao do banco

| Option | Description | Selected |
|--------|-------------|----------|
| Todos os campos | 14+ campos da planilha + fardista_nome + clicked_at | ✓ |
| Campos essenciais | Apenas codigo_in, sku, quantidade, endereco, fardista_id | |

---

## Ordenacao da lista

| Option | Description | Selected |
|--------|-------------|----------|
| Por endereco | Otimiza rota do fardista no armazem | ✓ |
| Por ordem de importacao | Simples, nao otimiza rota | |
| Por SKU | Agrupa mesmo SKU | |

---

## Claude's Discretion

- Implementacao exata dos filtros (tabs vs chips vs dropdown)
- Animacao especifica da transicao de status
- Layout exato do PDF
- Estrutura interna dos componentes e Route Handlers
- Debounce/throttle do campo de busca
- Design da barra flutuante de selecao

## Deferred Ideas

- Phase 8 escopo reduzido: limpeza de colunas F+ agora e no OK da Phase 6
- Phase 7 efeito visual do N/E: desbloqueio de "AGUARDAR FARDISTA" no modal do separador
