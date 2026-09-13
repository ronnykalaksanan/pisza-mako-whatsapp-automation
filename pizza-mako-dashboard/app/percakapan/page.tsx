"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import { apiFetch } from "@/lib/apiClient";

type PausedRow = {
  rowNumber: number;
  "Nomor WA": string;
  Nama?: string;
  "Bot Dijeda Sejak"?: string;
  "Alasan Jeda"?: string;
};

function GlobalBotSwitch() {
  const [aktif, setAktif] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/pengaturan")
      .then((d) => setAktif(d.aktif))
      .catch((e) => setError(e.message));
  }, []);

  async function toggle() {
    if (aktif === null) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/pengaturan", {
        method: "POST",
        body: JSON.stringify({ aktif: !aktif }),
      });
      setAktif(!aktif);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`border rounded-xl p-4 mb-6 flex items-center justify-between ${
        aktif === false ? "border-red-300 bg-red-50" : "border-stone-200"
      }`}
    >
      <div>
        <div className="font-medium text-sm">
          Bot Pisza Mako: {aktif === null ? "..." : aktif ? "Aktif" : "NONAKTIF (semua manual)"}
        </div>
        <div className="text-xs text-stone-500">
          Kalau dimatikan, SEMUA chat masuk tidak dibalas otomatis sama sekali - kamu pegang penuh manual dari WhatsApp.
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={aktif === null || saving}
        className={`text-sm px-4 py-1.5 rounded-md whitespace-nowrap ${
          aktif ? "border border-red-300 text-red-600 hover:bg-red-50" : "bg-brand-500 text-white hover:bg-brand-600"
        }`}
      >
        {saving ? "..." : aktif ? "Matikan Bot" : "Nyalakan Bot"}
      </button>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}

function ManualPauseForm({ onPaused }: { onPaused: () => void }) {
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!phone) return;
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/percakapan", {
        method: "POST",
        body: JSON.stringify({ action: "pause", phone }),
      });
      setPhone("");
      onPaused();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-stone-200 rounded-xl p-4 mb-6">
      <div className="text-sm font-medium mb-1">Jeda Bot Manual</div>
      <div className="text-xs text-stone-500 mb-3">
        Buat pegang 1 nomor manual tanpa nunggu ada komplain/bukti bayar dulu.
      </div>
      <div className="flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0812xxxxxxx atau 62812xxxxxxx"
          className="border border-stone-300 rounded-md px-3 py-2 text-sm flex-1"
        />
        <button
          onClick={submit}
          disabled={submitting || !phone}
          className="border border-stone-300 hover:border-brand-500 text-sm px-4 py-2 rounded-md whitespace-nowrap"
        >
          {submitting ? "..." : "Jeda Nomor Ini"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}

function PercakapanPageContent() {
  const [rows, setRows] = useState<PausedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resuming, setResuming] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/percakapan");
      setRows(data.paused);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function resume(rowNumber: number) {
    setResuming(rowNumber);
    try {
      await apiFetch("/api/percakapan", {
        method: "POST",
        body: JSON.stringify({ action: "resume", rowNumber }),
      });
      setRows((prev) => prev.filter((r) => r.rowNumber !== rowNumber));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setResuming(null);
    }
  }

  return (
    <div>
      <Link href="/" className="text-sm text-stone-500 hover:underline">
        &larr; Kembali
      </Link>
      <h1 className="text-xl font-medium mt-2 mb-1">Percakapan Dijeda</h1>

      <GlobalBotSwitch />

      <p className="text-sm text-stone-500 mb-6">
        Nomor di bawah ini bot-nya lagi nonaktif (biasanya karena komplain/eskalasi),
        sehingga tidak dibalas otomatis. Nyalain lagi begitu selesai ditangani manual
        di WhatsApp. Kalau tidak dinyalakan manual, otomatis aktif lagi setelah 2 jam.
      </p>

      <ManualPauseForm onPaused={load} />

      {loading && <p className="text-sm text-stone-500">Memuat...</p>}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      {!loading && rows.length === 0 && (
        <p className="text-sm text-stone-500">Tidak ada percakapan yang sedang dijeda.</p>
      )}

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.rowNumber}
            className="flex items-center justify-between border border-stone-200 rounded-lg px-4 py-3"
          >
            <div>
              <div className="font-medium text-sm">
                {row.Nama || row["Nomor WA"]}
                {row["Alasan Jeda"] && (
                  <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                    {row["Alasan Jeda"]}
                  </span>
                )}
              </div>
              <div className="text-xs text-stone-500">
                {row["Nomor WA"]}
                {row["Bot Dijeda Sejak"] ? ` · dijeda sejak ${row["Bot Dijeda Sejak"]}` : ""}
              </div>
            </div>
            <button
              onClick={() => resume(row.rowNumber)}
              disabled={resuming === row.rowNumber}
              className="bg-brand-500 hover:bg-brand-600 text-white text-sm px-4 py-1.5 rounded-md"
            >
              {resuming === row.rowNumber ? "..." : "Nyalakan Bot"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PercakapanPage() {
  return (
    <AuthGate>
      <PercakapanPageContent />
    </AuthGate>
  );
}
