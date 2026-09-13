"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import { apiFetch } from "@/lib/apiClient";

type JadwalRow = {
  Konteks: string;
  Status: string;
  Mode: string;
  "Jam Buka"?: string;
  "Jam Tutup"?: string;
};

function JadwalPageContent() {
  const [rows, setRows] = useState<JadwalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/jadwal");
      setRows(data.rows);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function activate(index: number) {
    const rowNumber = index + 2;
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/jadwal", {
        method: "POST",
        body: JSON.stringify({ rowNumber, totalRows: rows.length }),
      });
      setRows((prev) => prev.map((r, i) => ({ ...r, Status: i === index ? "Aktif" : "Nonaktif" })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link href="/" className="text-sm text-stone-500 hover:underline">
        &larr; Kembali
      </Link>
      <h1 className="text-xl font-medium mt-2 mb-1">Jam Operasional</h1>
      <p className="text-sm text-stone-500 mb-6">
        Pilih satu konteks yang sedang aktif. Yang lain otomatis dinonaktifkan.
      </p>

      {loading && <p className="text-sm text-stone-500">Memuat...</p>}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="space-y-3">
        {rows.map((row, i) => {
          const isActive = row.Status === "Aktif";
          return (
            <div
              key={row.Konteks}
              className={`border rounded-lg px-4 py-3 flex items-center justify-between ${
                isActive ? "border-brand-500 bg-brand-50" : "border-stone-200"
              }`}
            >
              <div>
                <div className="font-medium text-sm">{row.Konteks}</div>
                <div className="text-xs text-stone-500">
                  {row.Mode}
                  {row.Mode === "Jam Harian" && row["Jam Buka"] ? ` · ${row["Jam Buka"]}-${row["Jam Tutup"]}` : ""}
                </div>
              </div>
              <button
                onClick={() => activate(i)}
                disabled={isActive || saving}
                className={`text-sm px-4 py-1.5 rounded-md ${
                  isActive
                    ? "bg-brand-500 text-white cursor-default"
                    : "border border-stone-300 hover:border-brand-500"
                }`}
              >
                {isActive ? "Aktif" : "Aktifkan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function JadwalPage() {
  return (
    <AuthGate>
      <JadwalPageContent />
    </AuthGate>
  );
}
