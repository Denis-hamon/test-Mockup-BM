import { Badge } from "@/components/ui/badge";
import { getStatusConfig, type ArticleStatus } from "@/lib/constants";

interface ArticleStatusBadgeProps {
  status: ArticleStatus | string;
  className?: string;
}

export function ArticleStatusBadge({ status, className = "" }: ArticleStatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <Badge variant="secondary" className={`${config.color} ${className}`}>
      {config.label}
    </Badge>
  );
}

export default ArticleStatusBadge;
