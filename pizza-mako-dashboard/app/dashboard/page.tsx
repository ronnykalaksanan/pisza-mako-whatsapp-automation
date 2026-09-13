"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import { apiFetch } from "@/lib/apiClient";

type DashboardData = {
  hariIni: {
    totalOmset: number;
    jumlahOrder: number;
    topMenu: { menu: string; qty: number }[];
    perChannel: Record<string, number>;
  };
  trend: { tanggal: string; totalOmset: number; jumlahOrder: number }[];
};

function formatRupiah(n: number) {
  return "Rp" + n.toLocaleString("id-ID");
}

function DashboardPageContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/dashboard")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Link href="/" className="text-sm text-stone-500 hover:underline">
        &larr; Kembali
      </Link>
      <h1 className="text-xl font-medium mt-2 mb-1">Dashboard Penjualan</h1>
      <p className="text-sm text-stone-500 mb-6">Ringkasan hari ini + tren dari rekap harian.</p>

      {loading && <p className="text-sm text-stone-500">Memuat...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-stone-200 rounded-xl p-4">
              <div className="text-xs text-stone-500 mb-1">Omset hari ini</div>
              <div className="text-lg font-medium">{formatRupiah(data.hariIni.totalOmset)}</div>
            </div>
            <div className="border border-stone-200 rounded-xl p-4">
              <div className="text-xs text-stone-500 mb-1">Jumlah order hari ini</div>
              <div className="text-lg font-medium">{data.hariIni.jumlahOrder}</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm font-medium mb-2">Menu terlaris hari ini</div>
            {data.hariIni.topMenu.length === 0 && (
              <p className="text-sm text-stone-500">Belum ada order hari ini.</p>
            )}
            <div className="space-y-1">
              {data.hariIni.topMenu.map((m) => (
                <div key={m.menu} className="flex justify-between text-sm border-b border-stone-100 py-1.5">
                  <span>{m.menu}</span>
                  <span className="text-stone-500">{m.qty}x</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm font-medium mb-2">Order per channel (hari ini)</div>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(data.hariIni.perChannel).map(([ch, count]) => (
                <div key={ch} className="border border-stone-200 rounded-lg px-3 py-2 text-sm">
                  <span className="text-stone-500">{ch}: </span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Tren 30 hari terakhir</div>
            {data.trend.length === 0 && (
              <p className="text-sm text-stone-500">
                Belum ada data di tab &quot;Rekap Harian&quot; — akan mulai terisi setelah PZM-02 jalan malam ini.
              </p>
            )}
            <div className="space-y-1">
              {data.trend.map((d) => (
                <div key={d.tanggal} className="flex justify-between text-sm border-b border-stone-100 py-1.5">
                  <span className="text-stone-500">{d.tanggal}</span>
                  <span>{formatRupiah(d.totalOmset)}</span>
                  <span className="text-stone-500">{d.jumlahOrder} order</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardPageContent />
    </AuthGate>
  );
}
