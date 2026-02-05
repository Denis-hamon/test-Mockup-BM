import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  Tag,
  BookOpen,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

// Fetch article from public API
async function fetchPublicArticle(id: string) {
  const response = await fetch(`/api/v1/articles/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Article not found');
    }
    throw new Error('Failed to fetch article');
  }
  return response.json();
}

export default function PublicArticle() {
  const { id } = useParams<{ id: string }>();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['public-article', id],
    queryFn: () => fetchPublicArticle(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Article non trouvé</h1>
        <p className="text-muted-foreground mb-6">
          Cet article n'existe pas ou n'est pas encore publié.
        </p>
        <Button asChild>
          <Link to="/p">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux articles
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/p" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Tous les articles</span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{article.language?.toUpperCase()}</Badge>
            {article.rubric && (
              <Badge variant="secondary">
                <Tag className="h-3 w-3 mr-1" />
                {article.rubric}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 py-12">
        {/* Thumbnail */}
        {article.thumbnail_url && (
          <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
            <img
              src={article.thumbnail_url}
              alt={article.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
          {article.title}
        </h1>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              {article.updated_at
                ? format(new Date(article.updated_at), 'dd MMM yyyy')
                : format(new Date(article.created_at), 'dd MMM yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{Math.ceil((article.word_count || 0) / 200)} min de lecture</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{(article.word_count || 0).toLocaleString()} mots</span>
          </div>
          {article.provider_name && (
            <div className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              <span>{article.provider_name}</span>
            </div>
          )}
        </div>

        <Separator className="mb-8" />

        {/* Article Body */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
            prose-p:leading-relaxed prose-p:text-foreground/90
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg
            prose-img:rounded-lg prose-img:shadow-md
            prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:not-italic"
          dangerouslySetInnerHTML={{ __html: article.content || '' }}
        />

        {/* Footer */}
        <Separator className="my-12" />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Source: <span className="font-medium">{article.provider_name}</span>
          </div>
          {article.source_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={article.source_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Article original
              </a>
            </Button>
          )}
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Powered by Content Pipeline OVHcloud</p>
        </div>
      </footer>
    </div>
  );
}
