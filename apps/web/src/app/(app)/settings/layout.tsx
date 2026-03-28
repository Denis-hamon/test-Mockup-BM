import Link from "next/link";

const settingsNav = [
  { href: "/settings/cabinet", label: "Cabinet" },
  { href: "/settings/cabinet/integration", label: "Intégration" },
  { href: "/settings/privacy", label: "Confidentialité" },
  { href: "/settings/export", label: "Exporter mes données" },
  { href: "/settings/delete", label: "Supprimer mon compte" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-8">
      {/* Sidebar */}
      <nav className="w-56 shrink-0">
        <h2 className="mb-4 text-lg font-semibold">Paramètres</h2>
        <ul className="flex flex-col gap-1">
          {settingsNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
