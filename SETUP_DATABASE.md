# 🚀 Setup Database untuk Vercel Deployment

Kalau error "client-side error occurred" masih muncul, ikuti langkah-langkah ini:

## Langkah 1: Initialize Database di Supabase

1. **Login ke Supabase Dashboard**
   - Buka https://supabase.com/dashboard
   - Pilih project Klaten Minisoccer

2. **Jalankan SQL Schema**
   - Click **SQL Editor** (menu kiri)
   - Click **New Query**
   - Copy semua isi dari file `prisma/main table.sql` ke editor
   - Paste dan Click **Run**
   - Tunggu hingga selesai ✅

## Langkah 2: Seed Database (Isi Data Awal)

Ada 2 cara:

### Cara A: Via Node.js (Local)
```bash
npm run prisma:seed
```

### Cara B: Via Supabase SQL Editor
1. Copy isi `prisma/seed.js` 
2. Jalankan di Supabase SQL Editor

## Langkah 3: Verifikasi Environment Variables

Pastikan di Vercel sudah ada:
- `DATABASE_URL` = Connection string Supabase dengan pgbouncer
- `DIRECT_URL` = Direct connection string (optional, untuk migrations)

## Langkah 4: Redeploy

Setelah database ter-initialize:
1. Buka https://vercel.com/dashboard
2. Klik project **minisoccer**
3. Click **Deployments** 
4. Click **Redeploy** pada deployment terbaru
5. Tunggu sampai selesai

## ✅ Testing

Buka https://klaten-international-minisoccer.vercel.app dan refresh jika perlu.

Harus muncul:
- Lapangan-lapangan dari database
- Reviews dari database
- Navigation menu

---

## 🔧 Troubleshooting

### Error: "A client-side error occurred"
**Solusi**: Jalankan SQL schema di Supabase (Langkah 1)

### Error: "Type 'string | undefined' is not assignable"
**Status**: ✅ Sudah fixed di commit terbaru

### Error: "relation "booking" does not exist"
**Solusi**: Database belum punya tabel. Jalankan SQL schema lagi (Langkah 1)

### Error: "DATABASE_URL not found"
**Solusi**: Pastikan variable sudah di-set di Vercel Environment Variables

---

## 📋 Quick Reference

| Hal | File | Lokasi |
|-----|------|--------|
| SQL Schema | `main table.sql` | `prisma/` |
| Seed Data | `seed.js` | `prisma/` |
| Schema ORM | `schema.prisma` | `prisma/` |
| Environment | `.env` | Root |

---

**Butuh bantuan?** Check Vercel logs di:
https://vercel.com → project → Deployments → [latest] → Logs
