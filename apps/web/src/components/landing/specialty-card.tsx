import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Heart,
  Briefcase,
  Scale,
  Home,
  Building,
  Gavel,
  Shield,
  FileText,
  Users,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// SpecialtyCard — single specialty display for landing page
// ---------------------------------------------------------------------------

const SPECIALTY_ICONS: Record<string, LucideIcon> = {
  famille: Heart,
  travail: Briefcase,
  penal: Scale,
  immobilier: Home,
  commercial: Building,
  affaires: Building,
  "droit des societes": FileText,
  "droit social": Users,
  "droit public": Shield,
};

function getIcon(name: string): LucideIcon {
  const normalized = name.toLowerCase().trim();
  for (const [key, icon] of Object.entries(SPECIALTY_ICONS)) {
    if (normalized.includes(key)) return icon;
  }
  return Gavel;
}

interface SpecialtyCardProps {
  name: string;
}

export function SpecialtyCard({ name }: SpecialtyCardProps) {
  const Icon = getIcon(name);

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium">{name}</span>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// SpecialtyGrid — grid layout for multiple specialty cards
// ---------------------------------------------------------------------------

interface SpecialtyGridProps {
  specialties: string[];
}

export function SpecialtyGrid({ specialties }: SpecialtyGridProps) {
  if (specialties.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-12">
      <h2 className="mb-6 text-xl font-semibold">
        Nos domaines d&apos;expertise
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {specialties.map((s) => (
          <SpecialtyCard key={s} name={s} />
        ))}
      </div>
    </section>
  );
}
