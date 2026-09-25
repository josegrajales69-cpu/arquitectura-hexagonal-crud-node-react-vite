CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  category VARCHAR(60) NOT NULL,
  description TEXT NOT NULL,
  price_mxn NUMERIC(12,2) NOT NULL CHECK (price_mxn >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT NOT NULL,
  source_url TEXT,
  source_checked_at DATE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS source_checked_at DATE;
CREATE UNIQUE INDEX IF NOT EXISTS products_source_url_unique_idx ON products(source_url) WHERE source_url IS NOT NULL;

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
  total_mxn NUMERIC(12,2) NOT NULL CHECK (total_mxn >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(180) NOT NULL,
  unit_price_mxn NUMERIC(12,2) NOT NULL CHECK (unit_price_mxn >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total_mxn NUMERIC(12,2) NOT NULL CHECK (line_total_mxn >= 0)
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
