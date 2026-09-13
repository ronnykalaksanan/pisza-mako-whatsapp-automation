"use client";

import { useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import { apiFetch } from "@/lib/apiClient";

type Line = { menu: string; qty: number; harga: number };

function OrderOfflinePageContent() {
  const [lines, setLines] = useState<Line[]>([{ menu: "", qty: 1, harga: 0 }]);
  const [channel, setChannel] = useState<"Offline" | "GoFood">("Offline");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const total = lines.reduce((a, l) => a + l.qty * l.harga, 0);

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { menu: "", qty: 1, harga: 0 }]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setError("");
    setMessage("");
    const validLines = lines.filter((l) => l.menu && l.qty > 0);
    if (validLines.length === 0) {
      setError("Isi minimal 1 menu");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/order-offline", {
        method: "POST",
        body: JSON.stringify({
          phone,
          channel,
          items: validLines.map((l) => ({ menu: l.menu, qty: l.qty })),
          total,
        }),
      });
      setMessage("Order tersimpan.");
      setLines([{ menu: "", qty: 1, harga: 0 }]);
      setPhone("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link href="/" className="text-sm text-stone-500 hover:underline">
        &larr; Kembali
      </Link>
      <h1 className="text-xl font-medium mt-2 mb-1">Order Offline</h1>
      <p className="text-sm text-stone-500 mb-6">Catat order walk-in atau dari GoFood.</p>

      <div className="mb-4">
        <label className="text-sm font-medium block mb-1">Channel</label>
        <div className="flex gap-2">
          {(["Offline", "GoFood"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`text-sm px-4 py-1.5 rounded-md border ${
                channel === c ? "bg-brand-500 text-white border-brand-500" : "border-stone-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium block mb-1">Nomor WA (opsional)</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0812xxxxxxx"
          className="border border-stone-300 rounded-md px-3 py-2 text-sm w-full"
        />
      </div>

      <div className="mb-2 text-sm font-medium">Item order</div>
      <div className="space-y-2 mb-3">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={line.menu}
              onChange={(e) => updateLine(i, { menu: e.target.value })}
              placeholder="Nama menu"
              className="border border-stone-300 rounded-md px-3 py-2 text-sm flex-1"
            />
            <input
              type="number"
              min={1}
              value={line.qty}
              onChange={(e) => updateLine(i, { qty: Number(e.target.value) })}
              className="border border-stone-300 rounded-md px-3 py-2 text-sm w-16"
            />
            <input
              type="number"
              min={0}
              value={line.harga}
              onChange={(e) => updateLine(i, { harga: Number(e.target.value) })}
              placeholder="Harga"
              className="border border-stone-300 rounded-md px-3 py-2 text-sm w-24"
            />
            <button onClick={() => removeLine(i)} className="text-stone-400 hover:text-red-600 text-sm px-2">
              &times;
            </button>
          </div>
        ))}
      </div>
      <button onClick={addLine} className="text-sm text-brand-600 hover:underline mb-6">
        + Tambah item
      </button>

      <div className="border-t border-stone-200 pt-4 flex items-center justify-between">
        <div className="text-sm text-stone-500">
          Total: <span className="font-medium text-stone-900">Rp{total.toLocaleString("id-ID")}</span>
        </div>
        <button
          onClick={submit}
          disabled={submitting}
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm px-5 py-2 rounded-md"
        >
          {submitting ? "Menyimpan..." : "Simpan Order"}
        </button>
      </div>

      {message && <p className="text-sm text-green-600 mt-3">{message}</p>}
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  );
}

export default function OrderOfflinePage() {
  return (
    <AuthGate>
      <OrderOfflinePageContent />
    </AuthGate>
  );
}
