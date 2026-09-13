import { NextRequest, NextResponse } from "next/server";
import { readSheetAsObjects, updateCellByRow } from "@/lib/googleSheets";
import { isAuthorized } from "@/lib/auth";

const SHEET_NAME = "Pengaturan";

// GET -> status bot global sekarang (TRUE/FALSE)
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const rows = await readSheetAsObjects(SHEET_NAME);
    const aktif = rows[0]?.["Bot Global Aktif"] !== "FALSE";
    return NextResponse.json({ aktif });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST -> ubah status bot global
// body: { aktif: boolean }
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { aktif } = await req.json();
    if (typeof aktif !== "boolean") {
      return NextResponse.json({ error: "aktif wajib diisi (boolean)" }, { status: 400 });
    }
    // Baris 2 (baris data pertama setelah header) - tab ini sengaja cuma 1 baris
    await updateCellByRow(SHEET_NAME, 2, "Bot Global Aktif", aktif ? "TRUE" : "FALSE");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
