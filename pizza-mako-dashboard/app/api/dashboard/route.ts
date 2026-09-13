import { NextRequest, NextResponse } from "next/server";
import { readSheetAsObjects } from "@/lib/googleSheets";
import { isAuthorized } from "@/lib/auth";

// GET -> ringkasan hari ini (dihitung real-time dari Auto-Order) +
// tren harian (dibaca dari tab Rekap Harian yang diisi PZM-02 tiap malam)
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [orders, dailyHistory] = await Promise.all([
      readSheetAsObjects("Auto-Order"),
      readSheetAsObjects("Rekap Harian"),
    ]);

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter((o) => (o.Timestamp || "").startsWith(todayStr));

    let totalOmsetHariIni = 0;
    const menuCount: Record<string, number> = {};
    const channelCount: Record<string, number> = {};

    for (const o of todayOrders) {
      totalOmsetHariIni += Number(o.Total) || 0;
      channelCount[o.Channel || "Tidak diketahui"] =
        (channelCount[o.Channel || "Tidak diketahui"] || 0) + 1;

      let items: { menu: string; qty: number }[] = [];
      try {
        items = JSON.parse(o["Detail Item"] || "[]");
      } catch {
        items = [];
      }
      for (const it of items) {
        menuCount[it.menu] = (menuCount[it.menu] || 0) + (it.qty || 1);
      }
    }

    const topMenu = Object.entries(menuCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([menu, qty]) => ({ menu, qty }));

    // Tren 30 hari terakhir dari Rekap Harian (kalau sudah ada datanya)
    const trend = dailyHistory
      .slice(-30)
      .map((r) => ({
        tanggal: r.Tanggal,
        totalOmset: Number(r["Total Omset"]) || 0,
        jumlahOrder: Number(r["Jumlah Order"]) || 0,
      }));

    return NextResponse.json({
      hariIni: {
        totalOmset: totalOmsetHariIni,
        jumlahOrder: todayOrders.length,
        topMenu,
        perChannel: channelCount,
      },
      trend,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
