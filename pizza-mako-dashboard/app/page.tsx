import Link from "next/link";

const menuItems = [
  {
    href: "/menu",
    title: "Menu",
    desc: "Toggle menu mana yang lagi ready dijual",
  },
  {
    href: "/jadwal-operasional",
    title: "Jam Operasional",
    desc: "Atur konteks aktif: Rumah, Gerai, atau Event",
  },
  {
    href: "/order-offline",
    title: "Order Offline",
    desc: "Catat order walk-in atau dari GoFood",
  },
  {
    href: "/dashboard",
    title: "Dashboard Penjualan",
    desc: "Omset, jumlah order, dan menu terlaris",
  },
  {
    href: "/percakapan",
    title: "Percakapan Dijeda",
    desc: "Nomor yang bot-nya nonaktif sementara (eskalasi/komplain)",
  },
];

export default function HomePage() {
  return (
    <div>
      <h1 className="text-xl font-medium mb-1">Panel Kontrol Pisza Mako</h1>
      <p className="text-sm text-stone-500 mb-6">Pilih menu di bawah</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block border border-stone-200 rounded-xl p-5 hover:border-brand-500 hover:shadow-sm transition"
          >
            <div className="font-medium mb-1">{item.title}</div>
            <div className="text-sm text-stone-500">{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
