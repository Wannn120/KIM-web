-- =========================================================
-- Supabase migration: venue_gallery
-- Aman dijalankan berulang kali tanpa menghapus data existing.
-- =========================================================

CREATE TABLE IF NOT EXISTS public.venue_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(150) NOT NULL,
  image_url TEXT NOT NULL,
  image_public_id VARCHAR(255),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.venue_gallery
  ADD COLUMN IF NOT EXISTS title VARCHAR(150),
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_public_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_venue_gallery_active_order
  ON public.venue_gallery(is_active, sort_order);

INSERT INTO public.venue_gallery (title, image_url, image_public_id, sort_order, is_active)
SELECT * FROM (VALUES
  ('Lapangan premium', 'https://res.cloudinary.com/ljbxjpox/image/upload/v1785465834/lapangan_premium_aqejyy.jpg', 'lapangan_premium_aqejyy', 0, true),
  ('Lampu malam', 'https://res.cloudinary.com/ljbxjpox/image/upload/v1785465837/lampu_malam_xntenr.jpg', 'lampu_malam_xntenr', 1, true),
  ('Fasilitas sewa', 'https://res.cloudinary.com/ljbxjpox/image/upload/v1785465837/fasilitas_sewa_o0uptk.jpg', 'fasilitas_sewa_o0uptk', 2, true),
  ('Citarasa komunitas', 'https://res.cloudinary.com/ljbxjpox/image/upload/v1785465837/citarasa_komunitas_ey2pmm.jpg', 'citarasa_komunitas_ey2pmm', 3, true)
) AS initial_gallery(title, image_url, image_public_id, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.venue_gallery);

SELECT id, title, image_url, image_public_id, sort_order, is_active
FROM public.venue_gallery
ORDER BY sort_order ASC, created_at ASC;
