import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SEOBadgeProps {
  score: number;
  showIcon?: boolean;
  size?: "sm" | "md";
}

export function SEOBadge({ score, showIcon = true, size = "sm" }: SEOBadgeProps) {
  const getScoreConfig = (score: number) => {
    if (score >= 80) {
      return {
        label: "High",
        className: "bg-success/10 text-success border-success/20",
        icon: TrendingUp,
      };
    }
    if (score >= 50) {
      return {
        label: "Medium",
        className: "bg-warning/10 text-warning border-warning/20",
        icon: Minus,
      };
    }
    return {
      label: "Low",
      className: "bg-destructive/10 text-destructive border-destructive/20",
      icon: TrendingDown,
    };
  };

  const config = getScoreConfig(score);
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${size === "sm" ? "text-xs" : "text-sm"}`}
    >
      {showIcon && <Icon className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} mr-1`} />}
      SEO {score}
    </Badge>
  );
}
