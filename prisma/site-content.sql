-- =========================================================
-- Supabase migration: public website hero content
-- Aman dijalankan berulang kali menggunakan UPSERT.
-- =========================================================

INSERT INTO public.admin_setting (key, value, description)
VALUES
  ('locationLabel', 'KLATEN, JAWA TENGAH', 'Label lokasi pada hero website'),
  ('heroTitle', 'Klaten International Minisoccer', 'Judul utama website'),
  ('heroSubtitle', 'Satu lapangan premium dengan jadwal per jam, booking mudah, dan suasana lapangan terbaik untuk komunitas futsal dan mini soccer.', 'Deskripsi utama website'),
  ('ctaPrimary', 'Pesan sekarang', 'Teks tombol booking utama'),
  ('ctaSecondary', 'Lihat riwayat booking', 'Teks tombol riwayat booking'),
  ('backgroundImageUrl', 'https://res.cloudinary.com/ljbxjpox/image/upload/v1785465835/utama_cifncb.jpg', 'Background utama hero website')
ON CONFLICT (key) DO NOTHING;

SELECT key, value, description, updated_at
FROM public.admin_setting
WHERE key IN ('locationLabel', 'heroTitle', 'heroSubtitle', 'ctaPrimary', 'ctaSecondary', 'backgroundImageUrl')
ORDER BY key;
