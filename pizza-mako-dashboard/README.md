# Pisza Mako - Panel Kontrol

Frontend Next.js (App Router) untuk kontrol manual Pisza Mako, terhubung
langsung ke Google Sheets yang sama dipakai n8n. Deploy ke Vercel.

4 halaman:
- `/menu` — toggle menu ready/tidak
- `/jadwal-operasional` — pilih konteks aktif (Rumah/Gerai/Event)
- `/order-offline` — catat order walk-in/GoFood
- `/dashboard` — omset, jumlah order, menu terlaris

## 1. Setup Google Service Account

1. Buka [Google Cloud Console](https://console.cloud.google.com) → buat/pilih project.
2. Aktifkan **Google Sheets API**.
3. Buat **Service Account** (IAM & Admin → Service Accounts → Create).
4. Buat **key JSON** untuk service account itu, download.
5. Buka Google Sheet Pisza Mako → klik **Share** → tambahkan email service account
   (format `xxx@xxx.iam.gserviceaccount.com`) dengan akses **Editor**.

## 2. Siapkan struktur sheet tambahan

- Tab **Katalog Menu**: tambah 1 kolom baru `Aktif` (isi TRUE/FALSE per baris).
- Tab **Rekap Harian** (baru): kolom `Tanggal`, `Total Omset`, `Jumlah Order`,
  `Menu Terlaris`, `Qty Menu Terlaris` — diisi otomatis oleh PZM-02 tiap malam.

## 3. Environment variables

Copy `.env.example` ke `.env.local`, isi:

```
GOOGLE_SHEET_ID=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
N8N_ORDER_WEBHOOK_URL=            # opsional, lihat bagian 4 di bawah
DASHBOARD_ACCESS_PASSWORD=...     # password bebas, dipakai semua yang akses panel ini
```

`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` diambil dari field `private_key` di file JSON
yang tadi di-download — copy apa adanya termasuk `\n`-nya.

## 4. Order offline & webhook n8n (opsional tapi disarankan)

Kalau `N8N_ORDER_WEBHOOK_URL` diisi, form order offline akan memanggil workflow
**PZM-03** (file terpisah, sudah disiapkan) yang menyimpan ke Auto-Order **dan**
meng-upsert CRM sekaligus — jadi konsisten dengan order yang masuk lewat WA.

Kalau env var ini dikosongkan, order offline tetap tersimpan (langsung dari
frontend ke Sheets), tapi CRM tidak ikut ke-update untuk channel ini.

Untuk pakai PZM-03: import filenya ke n8n Cloud, isi placeholder
`SPREADSHEET_ID_HERE` dan credential Google Sheets, aktifkan workflow-nya,
lalu copy Webhook URL-nya ke `N8N_ORDER_WEBHOOK_URL`.

## 5. Jalankan lokal

```
npm install
npm run dev
```

Buka `http://localhost:3000`.

## 6. Deploy ke Vercel

```
npm install -g vercel
vercel
```

Atau lewat dashboard Vercel: import repo/folder ini, isi environment variables
yang sama seperti `.env.local` di project settings Vercel, deploy.

## Autentikasi

Panel ini pakai 1 password bersama (`DASHBOARD_ACCESS_PASSWORD`), bukan
login per akun — cukup untuk dipakai berdua (istri & suami). Password
disimpan di localStorage browser setelah login pertama kali. Kalau nanti
butuh lebih dari itu (misal role terpisah admin/kasir), ganti ke solusi
auth yang lebih lengkap seperti NextAuth.

## Catatan keamanan

- Private key service account **hanya** dipakai di server (API routes),
  tidak pernah dikirim ke browser.
- Semua request dari frontend ke `/api/*` wajib membawa header
  `x-dashboard-key` yang cocok dengan `DASHBOARD_ACCESS_PASSWORD` — tanpa
  ini API akan menolak (401).
