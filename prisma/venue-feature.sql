-- =========================================================
-- Klaten International Minisoccer
-- Supabase migration: venue_feature
-- Aman dijalankan berulang kali (tidak menghapus data existing)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.venue_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_public_id VARCHAR(255),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Menambahkan kolom jika tabel sudah pernah dibuat dengan struktur lama.
ALTER TABLE public.venue_feature
  ADD COLUMN IF NOT EXISTS name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_public_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Pastikan default dan constraint penting tetap aktif.
ALTER TABLE public.venue_feature
  ALTER COLUMN sort_order SET DEFAULT 0,
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_venue_feature_active_order
  ON public.venue_feature (is_active, sort_order);

-- Data awal hanya dimasukkan jika tabel masih kosong.
INSERT INTO public.venue_feature
  (name, description, image_url, sort_order, is_active)
SELECT *
FROM (
  VALUES
    (
      'Lapangan premium',
      'Surface terbaik untuk 5v5 dan mini soccer.',
      'https://res.cloudinary.com/ljbxjpox/image/upload/v1785465834/lapangan_premium_aqejyy.jpg',
      0,
      true
    ),
    (
      'Lampu malam',
      'Jadwal per jam hingga malam hari.',
      'https://res.cloudinary.com/ljbxjpox/image/upload/v1785465837/lampu_malam_xntenr.jpg',
      1,
      true
    ),
    (
      'Fasilitas sewa',
      'Loker, sepatu, bola, dan ruang ganti yang tertata rapi.',
      'https://res.cloudinary.com/ljbxjpox/image/upload/v1785465837/fasilitas_sewa_o0uptk.jpg',
      2,
      true
    ),
    (
      'Citarasa komunitas',
      'Tempat berkumpul dan pertandingan seru.',
      'https://res.cloudinary.com/ljbxjpox/image/upload/v1785465837/citarasa_komunitas_ey2pmm.jpg',
      3,
      true
    )
) AS initial_features(name, description, image_url, sort_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.venue_feature
);

-- Sinkronisasi gambar berdasarkan nama fasilitas jika data lama sudah ada.
UPDATE public.venue_feature SET
  image_url = 'https://res.cloudinary.com/ljbxjpox/image/upload/v1785465834/lapangan_premium_aqejyy.jpg',
  image_public_id = 'lapangan_premium_aqejyy'
WHERE LOWER(name) = 'lapangan premium';

UPDATE public.venue_feature SET
  image_url = 'https://res.cloudinary.com/ljbxjpox/image/upload/v1785465837/lampu_malam_xntenr.jpg',
  image_public_id = 'lampu_malam_xntenr'
WHERE LOWER(name) = 'lampu malam';

UPDATE public.venue_feature SET
  description = 'Loker, sepatu, bola, dan ruang ganti yang tertata rapi.',
  image_url = 'https://res.cloudinary.com/ljbxjpox/image/upload/v1785465837/fasilitas_sewa_o0uptk.jpg',
  image_public_id = 'fasilitas_sewa_o0uptk'
WHERE LOWER(name) = 'fasilitas sewa';

UPDATE public.venue_feature SET
  image_url = 'https://res.cloudinary.com/ljbxjpox/image/upload/v1785465837/citarasa_komunitas_ey2pmm.jpg',
  image_public_id = 'citarasa_komunitas_ey2pmm'
WHERE LOWER(name) = 'citarasa komunitas';

-- Verifikasi hasil migrasi.
SELECT
  id,
  name,
  description,
  image_url,
  image_public_id,
  sort_order,
  is_active,
  created_at,
  updated_at
FROM public.venue_feature
ORDER BY sort_order ASC, created_at ASC;
