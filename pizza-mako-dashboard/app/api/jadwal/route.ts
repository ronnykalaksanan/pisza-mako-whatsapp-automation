import { NextRequest, NextResponse } from "next/server";
import { readSheetAsObjects, updateCellByRow } from "@/lib/googleSheets";
import { isAuthorized } from "@/lib/auth";

const SHEET_NAME = "Jadwal Operasional";

// GET -> semua baris (Rumah, Gerai, Event) beserta Status/Mode/jam-nya
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const rows = await readSheetAsObjects(SHEET_NAME);
    return NextResponse.json({ rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST -> aktifkan satu konteks (Rumah/Gerai/Event), otomatis nonaktifkan yang lain
// body: { rowNumber: number, totalRows: number }
// Catatan: logic n8n (CheckOperatingHours) mengasumsikan cuma SATU baris Aktif
// di satu waktu - route ini menjaga aturan itu dari sisi frontend.
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { rowNumber, totalRows } = await req.json();
    if (!rowNumber || !totalRows) {
      return NextResponse.json({ error: "rowNumber dan totalRows wajib diisi" }, { status: 400 });
    }

    // Nonaktifkan semua baris dulu, baru aktifkan yang dipilih.
    // Dijalankan berurutan (bukan Promise.all) supaya tidak ada 2 baris
    // Aktif=TRUE secara bersamaan kalau salah satu request gagal di tengah.
    for (let r = 2; r <= totalRows + 1; r++) {
      await updateCellByRow(SHEET_NAME, r, "Status", r === rowNumber ? "Aktif" : "Nonaktif");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
