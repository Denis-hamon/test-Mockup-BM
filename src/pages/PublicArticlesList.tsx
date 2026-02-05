import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Calendar,
  Clock,
  Tag,
  Globe,
  Loader2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  Code,
} from "lucide-react";
import { format } from "date-fns";

interface Article {
  id: number;
  title: string;
  excerpt: string;
  language: string;
  rubric: string | null;
  word_count: number;
  thumbnail_url: string | null;
  provider_name: string;
  provider_slug: string;
  created_at: string;
  updated_at: string;
  slug: string;
}

interface ArticlesResponse {
  articles: Article[];
  total: number;
  limit: number;
  offset: number;
}

interface Rubric {
  rubric: string;
  count: string;
}

interface Language {
  language: string;
  count: string;
}

// Fetch functions
async function fetchArticles(params: {
  limit: number;
  offset: number;
  language?: string;
  rubric?: string;
  search?: string;
}): Promise<ArticlesResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('limit', String(params.limit));
  searchParams.set('offset', String(params.offset));
  if (params.language) searchParams.set('language', params.language);
  if (params.rubric) searchParams.set('rubric', params.rubric);
  if (params.search) searchParams.set('search', params.search);

  const response = await fetch(`/api/v1/articles?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch articles');
  return response.json();
}

async function fetchRubrics(): Promise<Rubric[]> {
  const response = await fetch('/api/v1/rubrics');
  if (!response.ok) throw new Error('Failed to fetch rubrics');
  return response.json();
}

async function fetchLanguages(): Promise<Language[]> {
  const response = await fetch('/api/v1/languages');
  if (!response.ok) throw new Error('Failed to fetch languages');
  return response.json();
}

export default function PublicArticlesList() {
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState<string>("all");
  const [rubric, setRubric] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 12;

  const { data: rubrics = [] } = useQuery({
    queryKey: ['public-rubrics'],
    queryFn: fetchRubrics,
  });

  const { data: languages = [] } = useQuery({
    queryKey: ['public-languages'],
    queryFn: fetchLanguages,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['public-articles', page, language, rubric, search],
    queryFn: () => fetchArticles({
      limit: pageSize,
      offset: page * pageSize,
      language: language !== 'all' ? language : undefined,
      rubric: rubric !== 'all' ? rubric : undefined,
      search: search || undefined,
    }),
  });

  const articles = data?.articles || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
              <p className="text-muted-foreground mt-1">
                {total.toLocaleString()} articles publiés
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/api-docs" target="_blank">
                  <Code className="h-4 w-4 mr-2" />
                  API Docs
                </a>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>
            <Select value={language} onValueChange={(v) => { setLanguage(v); setPage(0); }}>
              <SelectTrigger className="w-[150px]">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Langue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes langues</SelectItem>
                {languages.map(lang => (
                  <SelectItem key={lang.language} value={lang.language}>
                    {lang.language.toUpperCase()} ({lang.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={rubric} onValueChange={(v) => { setRubric(v); setPage(0); }}>
              <SelectTrigger className="w-[180px]">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Rubrique" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes rubriques</SelectItem>
                {rubrics.map(r => (
                  <SelectItem key={r.rubric} value={r.rubric}>
                    {r.rubric} ({r.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun article trouvé</h2>
            <p className="text-muted-foreground">
              Essayez de modifier vos filtres de recherche.
            </p>
          </div>
        ) : (
          <>
            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map(article => (
                <Link key={article.id} to={`/p/${article.id}`}>
                  <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden group">
                    {/* Thumbnail */}
                    {article.thumbnail_url && (
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img
                          src={article.thumbnail_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {article.language.toUpperCase()}
                        </Badge>
                        {article.rubric && (
                          <Badge variant="secondary" className="text-xs">
                            {article.rubric}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {article.excerpt?.replace(/\.\.\.$/, '') || 'Pas de résumé disponible.'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(article.updated_at || article.created_at), 'dd MMM')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.ceil((article.word_count || 0) / 200)} min
                          </span>
                        </div>
                        <span className="text-xs">{article.provider_name}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <p>Powered by Content Pipeline OVHcloud</p>
          <a href="/api-docs" className="hover:text-foreground transition-colors">
            API Documentation
          </a>
        </div>
      </footer>
    </div>
  );
}
