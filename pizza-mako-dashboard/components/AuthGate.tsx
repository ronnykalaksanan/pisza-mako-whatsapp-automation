"use client";

import { useEffect, useState } from "react";
import { getStoredKey, setStoredKey } from "@/lib/apiClient";

// Bungkus tiap page dengan komponen ini supaya minta password sekali,
// lalu tersimpan di localStorage untuk request-request berikutnya.
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (getStoredKey()) setUnlocked(true);
  }, []);

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-lg font-medium">Panel Kontrol Pisza Mako</h1>
      <p className="text-sm text-stone-500">Masukkan password untuk lanjut</p>
      <div className="flex gap-2">
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input) {
              setStoredKey(input);
              setUnlocked(true);
            }
          }}
          className="border border-stone-300 rounded-md px-3 py-2 text-sm"
          placeholder="Password"
        />
        <button
          onClick={() => {
            if (input) {
              setStoredKey(input);
              setUnlocked(true);
            }
          }}
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm px-4 py-2 rounded-md"
        >
          Masuk
        </button>
      </div>
    </div>
  );
}
