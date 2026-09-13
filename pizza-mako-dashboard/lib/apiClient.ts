"use client";

const STORAGE_KEY = "pizza-mako-dashboard-key";

export function getStoredKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) || "";
}

export function setStoredKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key);
}

export function clearStoredKey() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const key = getStoredKey();
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "x-dashboard-key": key,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (res.status === 401) {
    // Password salah/belum di-set - bersihkan biar user diminta login ulang
    clearStoredKey();
    throw new Error("Password salah atau belum login. Silakan masuk lagi.");
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Terjadi kesalahan");
  }
  return data;
}
