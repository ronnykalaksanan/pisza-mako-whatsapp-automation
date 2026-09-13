"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import { apiFetch } from "@/lib/apiClient";

type MenuItem = {
  Menu: string;
  Deskripsi?: string;
  Harga?: string;
  Aktif?: string;
};

function MenuPageContent() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingRow, setSavingRow] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/menu");
      setItems(data.items);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(index: number, current: string) {
    const rowNumber = index + 2; // baris 1 = header
    const nextValue = current !== "TRUE";
    setSavingRow(rowNumber);
    try {
      await apiFetch("/api/menu", {
        method: "POST",
        body: JSON.stringify({ rowNumber, aktif: nextValue }),
      });
      setItems((prev) =>
        prev.map((it, i) => (i === index ? { ...it, Aktif: nextValue ? "TRUE" : "FALSE" } : it))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingRow(null);
    }
  }

  return (
    <div>
      <Link href="/" className="text-sm text-stone-500 hover:underline">
        &larr; Kembali
      </Link>
      <h1 className="text-xl font-medium mt-2 mb-1">Menu</h1>
      <p className="text-sm text-stone-500 mb-6">
        Centang menu yang lagi ready. Menu yang tidak dicentang tidak akan ditawarkan AI ke pelanggan.
      </p>

      {loading && <p className="text-sm text-stone-500">Memuat...</p>}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="space-y-2">
        {items.map((item, i) => {
          const rowNumber = i + 2;
          const active = item.Aktif === "TRUE";
          return (
            <label
              key={rowNumber}
              className="flex items-center justify-between border border-stone-200 rounded-lg px-4 py-3 cursor-pointer"
            >
              <div>
                <div className="font-medium text-sm">{item.Menu}</div>
                {item.Harga && <div className="text-xs text-stone-500">Rp{item.Harga}</div>}
              </div>
              <input
                type="checkbox"
                checked={active}
                disabled={savingRow === rowNumber}
                onChange={() => toggle(i, item.Aktif || "FALSE")}
                className="w-5 h-5 accent-brand-500"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <AuthGate>
      <MenuPageContent />
    </AuthGate>
  );
}
