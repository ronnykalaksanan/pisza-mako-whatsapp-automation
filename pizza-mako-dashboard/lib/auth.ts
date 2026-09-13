import { NextRequest } from "next/server";

/**
 * Proteksi sederhana pakai 1 password bersama (bukan login user-per-user).
 * Cocok untuk dipakai internal cuma oleh istri/suami. Kalau nanti butuh lebih
 * dari 1 akun atau role, ganti ke NextAuth - tapi untuk skala ini sengaja
 * dibikin simpel dulu.
 *
 * Cara pakai di client: simpan password di localStorage setelah login,
 * lalu kirim sebagai header "x-dashboard-key" di tiap fetch ke /api/*.
 */
export function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.DASHBOARD_ACCESS_PASSWORD;
  if (!expected) {
    // Kalau env var belum di-set, jangan diam-diam buka akses -
    // anggap semua request tidak sah supaya developer sadar untuk set env dulu.
    return false;
  }
  const provided = req.headers.get("x-dashboard-key");
  return provided === expected;
}
