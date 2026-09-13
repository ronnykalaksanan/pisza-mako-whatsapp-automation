import { NextRequest, NextResponse } from "next/server";
import { appendRow } from "@/lib/googleSheets";
import { isAuthorized } from "@/lib/auth";

// body: { phone?: string, items: {menu: string, qty: number}[], total: number, channel: "Offline" | "GoFood" }
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { phone, items, total, channel } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0 || !total || !channel) {
      return NextResponse.json({ error: "items, total, dan channel wajib diisi" }, { status: 400 });
    }

    const webhookUrl = process.env.N8N_ORDER_WEBHOOK_URL;

    if (webhookUrl) {
      // Opsi B: lempar ke n8n (workflow PZM-03) supaya Auto-Order + CRM
      // sama-sama ke-update lewat logic yang sudah ada, konsisten dengan order WA.
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone || "", items, total, channel }),
      });
      if (!res.ok) {
        throw new Error(`n8n webhook gagal: ${res.status}`);
      }
      return NextResponse.json({ success: true, via: "n8n-webhook" });
    }

    // Opsi A (fallback): tulis langsung ke Auto-Order kalau webhook belum di-setup.
    // Catatan: dengan jalur ini, CRM TIDAK otomatis ke-upsert untuk order offline.
    await appendRow("Auto-Order", {
      Timestamp: new Date().toISOString(),
      "Nomor WA": phone || "",
      "Detail Item": JSON.stringify(items),
      Jumlah: items.reduce((a: number, i: { qty: number }) => a + (i.qty || 1), 0),
      Total: total,
      Channel: channel,
    });

    return NextResponse.json({ success: true, via: "direct-sheets" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
