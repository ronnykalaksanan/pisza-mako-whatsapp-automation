import { NextRequest, NextResponse } from "next/server";
import { readSheetAsObjects, updateCellByRow, upsertRowByColumn } from "@/lib/googleSheets";
import { isAuthorized } from "@/lib/auth";

const SHEET_NAME = "CRM";

// GET -> daftar nomor dengan Bot Aktif = FALSE
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const rows = await readSheetAsObjects(SHEET_NAME);
    const paused = rows
      .map((r, i) => ({ ...r, rowNumber: i + 2 }))
      .filter((r) => r["Bot Aktif"] === "FALSE");
    return NextResponse.json({ paused });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST -> resume (by rowNumber) ATAU pause manual (by phone)
// body resume: { action: "resume", rowNumber: number }
// body pause:  { action: "pause", phone: string }
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const action = body.action || "resume"; // default resume, biar backward-compatible

    if (action === "pause") {
      const { phone } = body;
      if (!phone) {
        return NextResponse.json({ error: "phone wajib diisi" }, { status: 400 });
      }
      const digits = phone.replace(/[^0-9]/g, "");
      const normalized = digits.startsWith("0") ? "62" + digits.slice(1) : digits.startsWith("62") ? digits : "62" + digits;

      await upsertRowByColumn(SHEET_NAME, "Nomor WA", normalized, {
        "Bot Aktif": "FALSE",
        "Bot Dijeda Sejak": new Date().toISOString(),
        "Alasan Jeda": "Manual (Admin)",
      });
      return NextResponse.json({ success: true });
    }

    // action === "resume"
    const { rowNumber } = body;
    if (!rowNumber) {
      return NextResponse.json({ error: "rowNumber wajib diisi" }, { status: 400 });
    }
    await updateCellByRow(SHEET_NAME, rowNumber, "Bot Aktif", "TRUE");
    await updateCellByRow(SHEET_NAME, rowNumber, "Bot Dijeda Sejak", "");
    await updateCellByRow(SHEET_NAME, rowNumber, "Alasan Jeda", "");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
