import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pisza Mako - Panel Kontrol",
  description: "Panel kontrol internal untuk Pisza Mako",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
