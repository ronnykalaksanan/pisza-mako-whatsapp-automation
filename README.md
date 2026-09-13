# Pisza Mako — WhatsApp AI Order Automation

Sistem otomasi order berbasis AI untuk bisnis kuliner rumahan, dibangun dengan
**n8n**, **Groq/Gemini LLM**, **Google Sheets** sebagai database ringan, dan
**Next.js** untuk admin panel. Proyek demo end-to-end: dari chat WhatsApp
masuk sampai laporan penjualan harian.

## Arsitektur

```
Pelanggan (WhatsApp)
        │
        ▼
  Fonnte (WA Gateway)
        │
        ▼
┌───────────────────────────────────────────┐
│              n8n (6 workflow)              │
│                                             │
│  PZM-00  Cache Refresh (menu)              │
│  PZM-01  Order & Chat Handler (inti)       │
│  PZM-02  Nightly Report                    │
│  PZM-03  Offline Order Intake              │
│  PZM-04  Auto Resume Bot                   │
│  PZM-05  Testimonial Follow-up H+1         │
└───────────────────────────────────────────┘
        │                           │
        ▼                           ▼
  Google Sheets                Groq API (primer)
  (database)                   + Gemini (fallback)
        ▲
        │
  Next.js Admin Panel (Vercel)
  - Toggle menu & stok
  - Atur jam operasional
  - Input order offline
  - Dashboard penjualan
  - Kelola jeda bot
```

## Fitur Utama

- **AI Agent order-taking** — jawab pertanyaan menu, tangkap detail order
  (nama, item, catatan, metode kirim, metode bayar) lewat percakapan natural,
  minta konfirmasi eksplisit sebelum order dianggap final
- **Fallback model** — otomatis pindah ke Gemini kalau Groq rate-limited/gagal
- **Manajemen stok real-time** — validasi qty vs stok tersisa, auto-decrement
  setelah order sukses, cache di-refresh instan
- **Sistem jeda bot** — otomatis nonaktifkan AI per-nomor saat ada komplain,
  bukti pembayaran masuk, atau pre-order/pertanyaan di luar konteks —
  dengan auto-resume setelah 2 jam dan saklar global on/off
- **Deteksi pre-order & pesanan besar** — eskalasi otomatis ke admin,
  tidak di-auto-confirm oleh AI
- **CRM ringan** — riwayat order, follow-up testimoni otomatis H+1
- **Admin panel custom** — kontrol penuh tanpa perlu buka Google Sheets manual

## Struktur Repo

```
/n8n-workflows/     - Export JSON tiap workflow (import ke n8n Cloud/self-hosted)
/pizza-mako-dashboard/  - Frontend Next.js (admin panel)
```

## Stack

n8n · Groq API (Llama/GPT-OSS) · Google Gemini API · Google Sheets API ·
Fonnte (WhatsApp Gateway) · Next.js 14 · Vercel · TypeScript

## Catatan

Ini proyek **demo/portofolio** — kredensial dan ID yang sensitif (Spreadsheet
ID, nomor WhatsApp, dll) sudah di-sanitize jadi placeholder. Lihat komentar
`_HERE` di tiap file JSON workflow untuk tau bagian mana yang perlu diisi
sendiri kalau mau menjalankan ulang sistem ini.

Dibangun sebagai eksplorasi arsitektur multi-workflow n8n + AI Agent untuk
use case UMKM kuliner skala kecil (1-20 order/hari).
