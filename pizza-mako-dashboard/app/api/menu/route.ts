import { NextRequest, NextResponse } from "next/server";
import { readSheetAsObjects, updateCellByRow } from "@/lib/googleSheets";
import { isAuthorized } from "@/lib/auth";

const SHEET_NAME = "Katalog Menu";

// GET -> daftar semua menu + status Aktif-nya
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const items = await readSheetAsObjects(SHEET_NAME);
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST -> toggle satu menu jadi Aktif/Nonaktif
// body: { rowNumber: number, aktif: boolean }
// rowNumber dihitung dari GET (index array + 2, karena baris 1 = header)
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { rowNumber, aktif } = await req.json();
    if (!rowNumber || typeof aktif !== "boolean") {
      return NextResponse.json({ error: "rowNumber dan aktif wajib diisi" }, { status: 400 });
    }
    await updateCellByRow(SHEET_NAME, rowNumber, "Aktif", aktif ? "TRUE" : "FALSE");

    // Trigger refresh cache n8n segera, jangan nunggu jadwal cron 1 jam -
    // penting terutama buat kasus "menu habis" supaya AI Agent nggak
    // terus nawarin menu yang barusan dinonaktifkan. Kalau gagal, tetap
    // aman karena PZM-00 punya jadwal 1 jam sebagai fallback.
    const refreshWebhook = process.env.N8N_CACHE_REFRESH_WEBHOOK_URL;
    if (refreshWebhook) {
      fetch(refreshWebhook, { method: "POST" }).catch(() => {
        // sengaja diabaikan - lihat komentar di atas
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
