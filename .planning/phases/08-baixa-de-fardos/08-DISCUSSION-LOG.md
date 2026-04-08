# Phase 8: Baixa de Fardos - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 08-baixa-de-fardos
**Areas discussed:** Input e scanner, Card de confirmacao, Multiplos separadores, Feedback pos-baixa

---

## Input e scanner

| Option | Description | Selected |
|--------|-------------|----------|
| Campo unico com auto-focus | Campo grande centralizado, auto-focus, Enter dispara busca | ✓ |
| Campo + botao buscar | Campo + botao Buscar ao lado | |
| Voce decide | Claude escolhe | |

**User's choice:** Campo unico com auto-focus
**Notes:** —

### Erro quando nao encontrado

| Option | Description | Selected |
|--------|-------------|----------|
| Toast vermelho + campo pisca | Toast + borda vermelha 2s, campo limpa | ✓ |
| Card de erro inline | Card vermelho abaixo do campo, some apos 3s | |
| Voce decide | Claude escolhe | |

**User's choice:** Toast vermelho + campo pisca

### Camera

| Option | Description | Selected |
|--------|-------------|----------|
| Nao, so teclado/scanner BT | Campo simples sem camera | |
| Sim, icone de camera opcional | Icone abre leitor via camera | ✓ |
| Voce decide | Claude avalia | |

**User's choice:** Sim, icone de camera opcional

### Layout responsivo

| Option | Description | Selected |
|--------|-------------|----------|
| Grande e centralizado em ambos | ~80% mobile, ~50% desktop | ✓ |
| Full-width mobile, compacto desktop | 100% mobile, menor no desktop | |
| Voce decide | Claude escolhe | |

**User's choice:** Grande e centralizado em ambos

### Posicao do card apos scan

| Option | Description | Selected |
|--------|-------------|----------|
| Abaixo do campo | Card logo abaixo, scroll se necessario | |
| Substitui o campo | Card toma a tela, campo some | |
| Modal/overlay | Card como modal centralizado | ✓ (Other) |

**User's choice:** Modal/popup centralizado com: codigo IN, SKU, quantidade, endereco, para quem entregar (nome + metodo de envio), botao Confirmar Baixa (verde), botao Cancelar (cinza). Apos confirmar: fecha, limpa, auto-focus.

### Biblioteca de camera

| Option | Description | Selected |
|--------|-------------|----------|
| Voce decide | Claude pesquisa melhor opcao | ✓ |
| html5-qrcode | Biblioteca popular leve | |
| Sem camera por enquanto | So texto, camera na v2 | |

**User's choice:** Voce decide (Claude's Discretion)

---

## Card de confirmacao

### Metodo de envio no modal

| Option | Description | Selected |
|--------|-------------|----------|
| Nome + metodo | Ex: Joao (Shopee SPX) | |
| So nome | Ex: Joao | |
| Nome + card_key completo | Ex: Joao (Shopee SPX|Unitario|Imp 2) | ✓ |

**User's choice:** Nome + card_key completo

### Cores por marketplace

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, borda/header na cor | Borda superior na cor do marketplace | ✓ |
| Nao, modal neutro | Branco/cinza sem cores | |
| Voce decide | Claude escolhe | |

**User's choice:** Sim, borda/header na cor do marketplace

### Fardo duplicado

| Option | Description | Selected |
|--------|-------------|----------|
| Toast de aviso + nao abre modal | Toast amarelo, campo limpa | ✓ |
| Modal de aviso com detalhes | Modal com quando/quem fez a baixa | |
| Voce decide | Claude trata | |

**User's choice:** Toast de aviso + nao abre modal

### Icone pin verde

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, manter consistencia | Mesmo padrao Phase 6 | ✓ |
| Texto simples | Sem icone | |
| Voce decide | Claude mantem | |

**User's choice:** Sim, manter consistencia

### Seguranca do botao

| Option | Description | Selected |
|--------|-------------|----------|
| Clique unico confirma | Modal ja e a confirmacao | ✓ |
| Swipe para confirmar | Deslizante no mobile | |
| Spinner + desabilita | Previne clique duplo | |

**User's choice:** Clique unico confirma (com spinner durante processamento)

### Destaque da quantidade

| Option | Description | Selected |
|--------|-------------|----------|
| Numero grande como na lista | Label CONTEM + bold, padrao Phase 6 | ✓ |
| Inline com outros dados | Texto normal | |
| Voce decide | Claude decide | |

**User's choice:** Numero grande como na lista

---

## Multiplos separadores

### Layout no modal

| Option | Description | Selected |
|--------|-------------|----------|
| Lista vertical de entregas | Cada separador em linha, cor do marketplace | ✓ |
| Chips lado a lado | Badges compactos | |
| Voce decide | Claude escolhe | |

**User's choice:** Lista vertical de entregas

### Logica de busca

| Option | Description | Selected |
|--------|-------------|----------|
| Reservas + atribuicoes | Buscar card_keys via reservas, separadores via atribuicoes | ✓ |
| So reservas | Apenas card_keys sem buscar separador | |
| Voce decide | Claude define | |

**User's choice:** Reservas + atribuicoes

### Card sem separador

| Option | Description | Selected |
|--------|-------------|----------|
| Nao atribuido com card_key | Ex: Nao atribuido (Shopee SPX|...) | ✓ |
| So card_key | Sem mencionar separador | |
| Voce decide | Claude trata | |

**User's choice:** Nao atribuido com card_key

### Scroll para muitos

| Option | Description | Selected |
|--------|-------------|----------|
| Lista completa com scroll | Mostra todos, scroll interno | ✓ |
| Maximo 3 + "e mais X" | Limita visivel | |
| Voce decide | Claude decide | |

**User's choice:** Lista completa com scroll

---

## Feedback pos-baixa

### Feedback visual

| Option | Description | Selected |
|--------|-------------|----------|
| Toast verde + modal fecha + auto-focus | Fluxo continuo | ✓ (Other) |
| Animacao de sucesso 1s | Check verde animado | |
| Voce decide | Claude escolhe | |

**User's choice:** Toast verde + modal fecha + auto-focus + secao BAIXADOS HOJE no final da tela (codigo IN, SKU, quantidade, para quem, horario). Secao comeca colapsada, expande no primeiro fardo, com contador.

### Historico

| Option | Description | Selected |
|--------|-------------|----------|
| Lista abaixo do campo | Ultimas baixas da sessao | ✓ |
| Apenas contador | Badge no header | |
| Nao | So campo de input | |

**User's choice:** Sim, lista abaixo do campo (integrado como secao BAIXADOS HOJE)

### Desfazer

| Option | Description | Selected |
|--------|-------------|----------|
| Nao, sem desfazer | Operacao definitiva | ✓ |
| Sim, 10 segundos | Toast com botao Desfazer | |
| Voce decide | Claude avalia | |

**User's choice:** Nao, sem desfazer

---

## Claude's Discretion

- Biblioteca de leitura de camera (pesquisar melhor opcao leve)
- Animacao do modal abrindo/fechando
- Layout exato da secao BAIXADOS HOJE
- Estrutura interna dos Route Handlers
- Debounce do campo de busca
- Edge case: fardo no trafego sem reserva vinculada

## Deferred Ideas

None — discussion stayed within phase scope
