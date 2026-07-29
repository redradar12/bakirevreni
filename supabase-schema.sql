-- Bakır Evreni Supabase Şeması
-- Bu SQL'i Supabase SQL Editor'da çalıştırın (Dashboard > SQL Editor)

-- KATEGORİLER TABLOSU
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  group_name text NOT NULL,
  image_url text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kategoriler herkese açık" ON categories;
CREATE POLICY "Kategoriler herkese açık" ON categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Kategorileri admin yönetir" ON categories;
CREATE POLICY "Kategorileri admin yönetir" ON categories
  FOR ALL USING (
    auth.role() = 'authenticated'
  );

-- ÜRÜNLER TABLOSU
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  old_price numeric(10,2),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_url text,
  badge text,
  is_bestseller boolean DEFAULT false,
  is_new boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ürünler herkese açık" ON products;
CREATE POLICY "Ürünler herkese açık" ON products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Ürünleri admin yönetir" ON products;
CREATE POLICY "Ürünleri admin yönetir" ON products
  FOR ALL USING (
    auth.role() = 'authenticated'
  );

-- ÖRNEK VERİ: Kategoriler
INSERT INTO categories (name, slug, group_name, image_url, sort_order) VALUES
  ('Mataralar', 'mataralar', 'İçecek & Kahve', 'assets/matara.png', 1),
  ('Sürahiler', 'surahi̇ler', 'İçecek & Kahve', 'assets/copper-jug.jpg', 2),
  ('Bardaklar', 'bardaklar', 'İçecek & Kahve', 'assets/coffee-set.jpg', 3),
  ('Kahve setleri & fincanlar', 'kahve-setleri', 'İçecek & Kahve', 'assets/coffee-set.jpg', 4),
  ('Cezveler', 'cezveler', 'İçecek & Kahve', 'assets/cezve-sand.jpg', 5),
  ('Irbıklar', 'irbiklar', 'İçecek & Kahve', 'assets/coffee-pot-stove.jpg', 6),
  ('Semaverler', 'semaverler', 'İçecek & Kahve', 'assets/semaver.jpg', 7),
  ('Tencereler', 'tencereler', 'Pişirme & Mutfak', 'assets/tencere.jpg', 8),
  ('Tavalar', 'tavalar', 'Pişirme & Mutfak', 'assets/tava.jpg', 9),
  ('Bakraç (yoğurt satılı)', 'bakrac', 'Pişirme & Mutfak', 'assets/copper-basin.jpg', 10),
  ('Krom mangallık', 'krom-mangallik', 'Pişirme & Mutfak', 'assets/copper-market.jpg', 11),
  ('Sunumluklar', 'sunumluklar', 'Sofra & Sunum', 'assets/copper-tray.jpg', 12),
  ('Tepsiler', 'tepsiler', 'Sofra & Sunum', 'assets/copper-tray.jpg', 13),
  ('Çerezlik & şekerlik', 'cerezlik-sekerlik', 'Sofra & Sunum', 'assets/copper-tray.jpg', 14),
  ('Baharatlık', 'baharatlik', 'Sofra & Sunum', 'assets/copper-tray.jpg', 15),
  ('Vazolar', 'vazolar', 'Dekorasyon & Aydınlatma', 'assets/vazo1.jpg', 16),
  ('Saat ve şamdan setleri', 'saat-samdan', 'Dekorasyon & Aydınlatma', 'assets/candle-holder.jpg', 17),
  ('Fenerler', 'fenerler', 'Dekorasyon & Aydınlatma', 'assets/fener1.jpg', 18),
  ('Şamdanlar', 'samdanlar', 'Dekorasyon & Aydınlatma', 'assets/fener2.jpg', 19),
  ('Aksesuarlar', 'aksesuarlar', 'Aksesuarlar', 'assets/aksesuar-koleksiyon.jpg', 20),
  ('Krom mutfak aksesuarları', 'krom-mutfak', 'Aksesuarlar', 'assets/aksesuar-koleksiyon.jpg', 21),
  ('Özel yapım ürünlerimiz', 'ozel-yapim', 'Özel Koleksiyon', 'assets/copperware.jpg', 22),
  ('Ehlikeyfler', 'ehlikeyfler', 'Özel Koleksiyon', 'assets/ehlikeyf.jpg', 23),
  ('Hamam tasları', 'hamam-taslari', 'Özel Koleksiyon', 'assets/copper-basin.jpg', 24)
ON CONFLICT (slug) DO NOTHING;

-- AYARLAR TABLOSU (iyzico API anahtarları vb.)
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ayarları admin yönetir" ON settings;
CREATE POLICY "Ayarları admin yönetir" ON settings
  FOR ALL USING (
    auth.role() = 'authenticated'
  );

-- STORAGE: Resim yükleme havuzu
INSERT INTO storage.buckets (id, name, public) VALUES ('bakir', 'bakir', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admin resim yükleyebilir" ON storage.objects;
CREATE POLICY "Admin resim yükleyebilir" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bakir');

DROP POLICY IF EXISTS "Herkes resim görebilir" ON storage.objects;
CREATE POLICY "Herkes resim görebilir" ON storage.objects
  FOR SELECT USING (bucket_id = 'bakir');

-- SİPARİŞLER TABLOSU
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  items jsonb NOT NULL,
  total numeric(10,2) NOT NULL,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_address text,
  customer_city text,
  payment_id text,
  payment_status text DEFAULT 'success',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siparişleri admin görür" ON orders;
CREATE POLICY "Siparişleri admin görür" ON orders
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Sipariş ekleme anonim" ON orders;
CREATE POLICY "Sipariş ekleme anonim" ON orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Siparişleri admin siler" ON orders;
CREATE POLICY "Siparişleri admin siler" ON orders
  FOR DELETE USING (
    auth.role() = 'authenticated'
  );

-- Mevcut tabloya eksik kolonları ekle (tablo zaten oluştuysa hata vermez)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_address text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_city text;
