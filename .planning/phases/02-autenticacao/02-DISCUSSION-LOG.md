# Phase 2: Autenticacao - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 02-autenticacao
**Areas discussed:** Estrategia de auth, Tela de login, Navegacao por role, Protecao de rotas

---

## Estrategia de auth

### Como fazer login por PIN funcionar com Supabase?

| Option | Description | Selected |
|--------|-------------|----------|
| PIN via Supabase Auth | Usar signInWithPassword, nome vira email ficticio, PIN vira senha. Hash SHA-256 transparente pelo Supabase. | |
| Auth custom com JWT manual | API Route valida PIN manualmente, gera JWT proprio. Mais controle, gerenciamento manual de sessao. | |
| Supabase Auth + custom claims | Cria usuario no Supabase Auth com email ficticio, armazena role como custom claim no JWT via database function. | ✓ |

**User's choice:** Supabase Auth + custom claims
**Notes:** Combina facilidade do Supabase Auth com role disponivel no token JWT para verificacao no middleware.

### Como gerar o email ficticio?

| Option | Description | Selected |
|--------|-------------|----------|
| nome@naraka.local | Slug do nome + dominio fixo. Legivel no dashboard Supabase. | ✓ |
| UUID@naraka.local | Usa ID como email. Evita colisao, mas ilegivel. | |
| Voce decide | Claude escolhe. | |

**User's choice:** nome@naraka.local
**Notes:** Simples e legivel.

### Onde validar o PIN?

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase Auth como fonte | PIN e a senha do Supabase Auth (bcrypt). pin_hash na tabela users como referencia. | ✓ |
| Dupla validacao | Supabase Auth + SHA-256 na tabela. Redundancia para auditoria. | |
| SHA-256 manual apenas | Valida PIN manualmente contra pin_hash. Perde beneficios do Supabase Auth. | |

**User's choice:** Supabase Auth como fonte
**Notes:** Mais seguro que SHA-256 puro, Supabase Auth usa bcrypt internamente.

---

## Tela de login

### Como o usuario se identifica?

| Option | Description | Selected |
|--------|-------------|----------|
| Digitar nome + PIN | Dois campos: nome (texto) e PIN (numerico). Mobile-friendly. | ✓ |
| Selecionar nome + digitar PIN | Dropdown com nomes, depois PIN. Mais rapido, mas expoe lista. | |
| Apenas PIN | So PIN, sistema identifica. PIN precisa ser unico. | |

**User's choice:** Digitar nome + PIN
**Notes:** Simples e direto.

### Visual da tela de login?

| Option | Description | Selected |
|--------|-------------|----------|
| Centralizado minimalista | Logo no topo, card branco centralizado, fundo escuro. | ✓ |
| Fullscreen com sidebar | Metade imagem, metade formulario. Menos mobile-friendly. | |
| Voce decide | Claude escolhe mantendo mobile-first. | |

**User's choice:** Centralizado minimalista
**Notes:** Segue design preto e branco do projeto.

### Como mostrar erros de login?

| Option | Description | Selected |
|--------|-------------|----------|
| Mensagem generica | 'Nome ou PIN incorreto' — nao revela se nome existe. | ✓ |
| Mensagens especificas | Mensagens diferentes por tipo de erro. Revela informacao. | |
| Voce decide | Claude escolhe. | |

**User's choice:** Mensagem generica
**Notes:** Seguranca contra enumeracao de usuarios.

---

## Navegacao por role

### Estrutura de navegacao?

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom tabs mobile + sidebar desktop | Barra fixa no rodape (mobile), sidebar lateral (desktop). Cada role ve so suas abas. | ✓ |
| Sidebar sempre | Menu lateral colapsavel em todas resolucoes. | |
| Top navbar com dropdown | Barra superior com menu. Menos acessivel no mobile. | |

**User's choice:** Bottom tabs no mobile + sidebar no desktop
**Notes:** Mobile-first para separadores/fardistas.

### Redirect apos login?

| Option | Description | Selected |
|--------|-------------|----------|
| Tela principal do role | Admin/Lider -> Dashboard, Separador -> Prateleira, Fardista -> Fardos. | ✓ |
| Dashboard para todos | Todos comecam no Dashboard. | |
| Voce decide | Claude define. | |

**User's choice:** Tela principal do role
**Notes:** Cada um cai direto na tela que mais usa.

### Rotas das telas futuras?

| Option | Description | Selected |
|--------|-------------|----------|
| Paginas placeholder | Paginas vazias com titulo para navegacao funcionar. | ✓ |
| So login + redirect | Navegacao entre abas fica para Phase 5. | |
| Layout completo + placeholders | Estrutura de navegacao completa ja nesta fase. | |

**User's choice:** Paginas placeholder
**Notes:** Cada fase futura substitui pelo conteudo real.

---

## Protecao de rotas

### Como proteger rotas por role?

| Option | Description | Selected |
|--------|-------------|----------|
| Middleware + custom claims | Middleware le JWT, extrai role, verifica permissao. Server-side. | ✓ |
| Middleware + lookup no banco | Busca role na tabela a cada request. Mais atualizado. | |
| Client-side apenas | Wrapper no cliente verifica role. Flash de conteudo nao autorizado. | |

**User's choice:** Middleware + custom claims
**Notes:** Tudo server-side, rapido, sem flash.

### Usuario nao autenticado?

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect para /login | Redireciona silenciosamente. Apos login, volta para rota tentada. | ✓ |
| Redirect + mensagem | Redirect com toast 'Faca login para continuar'. | |
| Pagina 403 | Pagina de acesso negado com botao para login. | |

**User's choice:** Redirect para /login
**Notes:** Silencioso, com retorno para rota original apos login.

---

## Claude's Discretion

- Implementacao da database function para custom claims
- Icones para abas de navegacao
- Design do input de PIN (mascara, teclado numerico)
- Animacoes de loading durante login
- Estrutura interna dos componentes de layout

## Deferred Ideas

None — discussion stayed within phase scope.
