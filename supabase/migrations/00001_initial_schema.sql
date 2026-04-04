-- 9 tabelas: users, config, pedidos, progresso, reservas, atribuicoes, trafego_fardos, baixados, fardos_nao_encontrados

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'lider', 'separador', 'fardista')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido TEXT NOT NULL,
  numero_pedido_plataforma TEXT,
  plataforma TEXT NOT NULL,
  loja TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  variacao TEXT,
  nome_produto TEXT,
  metodo_envio TEXT NOT NULL,
  grupo_envio TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('unitario', 'kit', 'combo')),
  importacao_numero INTEGER NOT NULL,
  importacao_data DATE NOT NULL DEFAULT CURRENT_DATE,
  card_key TEXT NOT NULL,
  prazo_envio TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  quantidade_separada INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'parcial', 'completo', 'nao_encontrado', 'aguardar_fardista', 'transformacao')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  codigo_in TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  endereco TEXT,
  status TEXT NOT NULL DEFAULT 'reservado' CHECK (status IN ('reservado', 'cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE atribuicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_key TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('separador', 'fardista')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(card_key, tipo)
);

CREATE TABLE trafego_fardos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  codigo_in TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  endereco TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'encontrado', 'nao_encontrado')),
  fardista_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE baixados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trafego_id UUID NOT NULL REFERENCES trafego_fardos(id),
  codigo_in TEXT NOT NULL,
  baixado_por UUID NOT NULL REFERENCES users(id),
  baixado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fardos_nao_encontrados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trafego_id UUID NOT NULL REFERENCES trafego_fardos(id),
  codigo_in TEXT NOT NULL,
  reportado_por UUID NOT NULL REFERENCES users(id),
  reportado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices para queries frequentes
CREATE INDEX idx_pedidos_card_key ON pedidos(card_key);
CREATE INDEX idx_pedidos_importacao ON pedidos(importacao_data, importacao_numero);
CREATE INDEX idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX idx_progresso_pedido ON progresso(pedido_id);
CREATE INDEX idx_reservas_codigo_in ON reservas(codigo_in);
CREATE INDEX idx_reservas_pedido ON reservas(pedido_id);
CREATE INDEX idx_trafego_codigo_in ON trafego_fardos(codigo_in);
CREATE INDEX idx_atribuicoes_card ON atribuicoes(card_key);

-- Habilitar RLS em todas as tabelas (D-05)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE atribuicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trafego_fardos ENABLE ROW LEVEL SECURITY;
ALTER TABLE baixados ENABLE ROW LEVEL SECURITY;
ALTER TABLE fardos_nao_encontrados ENABLE ROW LEVEL SECURITY;

-- Policies basicas: leitura autenticada (D-05)
CREATE POLICY "Leitura autenticada" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON progresso FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON reservas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON atribuicoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON trafego_fardos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON baixados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada" ON fardos_nao_encontrados FOR SELECT TO authenticated USING (true);
