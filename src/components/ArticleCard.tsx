import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  RefreshCw,
  Languages,
  Globe,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Article } from "@/lib/api";
import { SEOBadge } from "@/components/SEOBadge";
import { ArticleStatusBadge } from "@/components/ArticleStatusBadge";

interface ArticleCardProps {
  article: Article;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onTransform: () => void;
  onTranslate: () => void;
  onPublish: () => void;
  onDelete: () => void;
}

export function ArticleCard({
  article,
  isSelected,
  onSelect,
  onTransform,
  onTranslate,
  onPublish,
  onDelete,
}: ArticleCardProps) {
  return (
    <Card className={isSelected ? "ring-2 ring-primary" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
            <div className="min-w-0 flex-1">
              <Link
                to={`/article/${article.id}`}
                className="font-medium hover:underline line-clamp-2"
              >
                {article.title}
              </Link>
              <p className="text-xs text-muted-foreground mt-1">
                {article.provider_name}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/article/${article.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Original
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onTransform}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-transform
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTranslate}>
                <Languages className="h-4 w-4 mr-2" />
                Translate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPublish}>
                <Globe className="h-4 w-4 mr-2" />
                Publish
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <ArticleStatusBadge status={article.status} />
          <Badge variant="outline">{article.language.toUpperCase()}</Badge>
          {article.seoScore && <SEOBadge score={article.seoScore} showIcon={false} />}
          <span className="text-xs text-muted-foreground">
            {(article.word_count || 0).toLocaleString()} words
          </span>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>{article.translationsCount} translations</span>
          <span>
            {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
