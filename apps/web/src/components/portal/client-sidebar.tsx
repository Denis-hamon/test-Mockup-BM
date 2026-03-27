"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  FolderOpen,
  MessageSquare,
  CalendarDays,
  FileText,
  Settings,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface ClientSidebarProps {
  activeCases?: number;
  unreadMessages?: number;
  pendingAppointments?: number;
}

function NavItems({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/portail" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  "ml-auto h-5 min-w-[20px] justify-center px-1.5 text-xs",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-[hsl(220_70%_50%/0.15)] text-[hsl(220_70%_40%)]"
                )}
                aria-label={
                  item.badge === 1
                    ? `${item.badge} element`
                    : `${item.badge} elements`
                }
              >
                {item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function ClientSidebar({
  activeCases = 0,
  unreadMessages = 0,
  pendingAppointments = 0,
}: ClientSidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: "/portail", label: "Accueil", icon: Home },
    {
      href: "/portail/dossiers",
      label: "Mes dossiers",
      icon: FolderOpen,
      badge: activeCases || undefined,
    },
    {
      href: "/portail/messages",
      label: "Messages",
      icon: MessageSquare,
      badge: unreadMessages || undefined,
    },
    {
      href: "/portail/rendez-vous",
      label: "Rendez-vous",
      icon: CalendarDays,
      badge: pendingAppointments || undefined,
    },
    { href: "/portail/documents", label: "Documents", icon: FileText },
    { href: "/portail/parametres", label: "Parametres", icon: Settings },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden border-r bg-card lg:block lg:w-60">
        <div className="flex h-full flex-col gap-6 p-6">
          <div className="text-lg font-semibold">LegalConnect</div>
          <NavItems items={navItems} pathname={pathname} />
        </div>
      </aside>

      {/* Mobile hamburger + sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              aria-label="Menu de navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0" aria-label="Menu de navigation">
            <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
            <div className="flex h-full flex-col gap-6 p-6">
              <div className="text-lg font-semibold">LegalConnect</div>
              <NavItems items={navItems} pathname={pathname} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
