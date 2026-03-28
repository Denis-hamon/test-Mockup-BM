import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// LawyerHero — hero section for /cabinet-[slug] landing page
// ---------------------------------------------------------------------------

interface LawyerHeroProps {
  firmName: string;
  specialties: string[];
  description?: string | null;
  photoUrl?: string | null;
  accentColor?: string | null;
}

export function LawyerHero({
  firmName,
  specialties,
  description,
  photoUrl,
  accentColor,
}: LawyerHeroProps) {
  const defaultDescription =
    "Bienvenue sur notre espace de consultation en ligne. D\u00e9crivez votre situation en toute confidentialit\u00e9.";

  const initials = firmName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="bg-muted px-4 py-12 md:py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        {/* Avatar */}
        {photoUrl ? (
          <Avatar className="size-20">
            <AvatarImage src={photoUrl} alt={`${firmName}, avocat`} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
        ) : (
          <Avatar className="size-20">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
        )}

        {/* Firm name */}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {firmName}
        </h1>

        {/* Specialty badges */}
        {specialties.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {specialties.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="max-w-lg text-muted-foreground">
          {description || defaultDescription}
        </p>

        {/* CTA — anchor link styled as button with smooth scroll */}
        <a
          href="#intake"
          className={cn(buttonVariants({ size: "lg" }), "mt-2 no-underline")}
          style={
            accentColor
              ? {
                  backgroundColor: accentColor,
                  color: "#fafafa",
                }
              : undefined
          }
        >
          Commencer ma demande
        </a>
      </div>
    </section>
  );
}
