import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const ALL_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
];

interface Translation {
  id: number;
  language: string;
  status: string;
  transformed_title?: string;
}

interface TranslationsPanelProps {
  articleId: number;
  translations: Translation[];
  sourceLanguage: string;
}

function TranslationCard({ translation, articleId }: {
  translation: Translation;
  articleId: number;
}) {
  const queryClient = useQueryClient();

  const retranslateMutation = useMutation({
    mutationFn: () => api.batchTranslate([articleId], [translation.language]),
    onSuccess: () => {
      toast.success(`Re-translation to ${translation.language.toUpperCase()} started`);
      queryClient.invalidateQueries({ queryKey: ['article', String(articleId)] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const langInfo = ALL_LANGUAGES.find(l => l.code === translation.language);
  const statusConfig = {
    completed: { icon: CheckCircle, className: "text-success", label: "Completed" },
    pending: { icon: Clock, className: "text-warning", label: "Pending" },
    failed: { icon: AlertCircle, className: "text-destructive", label: "Failed" },
  };

  const status = statusConfig[translation.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted`}>
              <StatusIcon className={`h-4 w-4 ${status.className}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{langInfo?.name || translation.language.toUpperCase()}</span>
                <Badge variant="outline" className="text-xs">
                  {translation.language.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {translation.transformed_title
                  ? translation.transformed_title.substring(0, 50) + (translation.transformed_title.length > 50 ? '...' : '')
                  : status.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {translation.status === 'completed' && (
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/article/${translation.id}`}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => retranslateMutation.mutate()}
              disabled={retranslateMutation.isPending}
              title="Re-translate"
            >
              {retranslateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TranslationsPanel({ articleId, translations, sourceLanguage }: TranslationsPanelProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const queryClient = useQueryClient();

  const translateMutation = useMutation({
    mutationFn: (lang: string) => api.batchTranslate([articleId], [lang]),
    onSuccess: (_, lang) => {
      toast.success(`Translation to ${lang.toUpperCase()} started`);
      setSelectedLanguage("");
      queryClient.invalidateQueries({ queryKey: ['article', String(articleId)] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const translateAllMutation = useMutation({
    mutationFn: () => {
      const missingLanguages = ALL_LANGUAGES
        .filter(l => l.code !== sourceLanguage && !translations.some(t => t.language === l.code))
        .map(l => l.code);
      return api.batchTranslate([articleId], missingLanguages);
    },
    onSuccess: () => {
      toast.success("Translation to all languages started");
      queryClient.invalidateQueries({ queryKey: ['article', String(articleId)] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const translatedLanguages = new Set(translations.map(t => t.language));
  const availableLanguages = ALL_LANGUAGES.filter(
    l => l.code !== sourceLanguage && !translatedLanguages.has(l.code)
  );

  return (
    <div className="space-y-4">
      {/* Add Translation */}
      <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {availableLanguages.map(lang => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => selectedLanguage && translateMutation.mutate(selectedLanguage)}
          disabled={!selectedLanguage || translateMutation.isPending}
        >
          {translateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add Translation
        </Button>
        {availableLanguages.length > 0 && (
          <Button
            variant="outline"
            onClick={() => translateAllMutation.mutate()}
            disabled={translateAllMutation.isPending}
          >
            {translateAllMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Translate All ({availableLanguages.length})
          </Button>
        )}
      </div>

      {/* Translations List */}
      {translations.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {translations.map(translation => (
            <TranslationCard
              key={translation.id}
              translation={translation}
              articleId={articleId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No translations yet</p>
          <p className="text-sm mt-1">Select a language above to start translating</p>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 text-sm">
        <span className="text-muted-foreground">
          {translations.length} of {ALL_LANGUAGES.length - 1} translations completed
        </span>
        <div className="flex gap-2">
          {ALL_LANGUAGES.filter(l => l.code !== sourceLanguage).map(lang => {
            const hasTranslation = translatedLanguages.has(lang.code);
            return (
              <Badge
                key={lang.code}
                variant={hasTranslation ? "default" : "outline"}
                className={`text-xs ${hasTranslation ? "bg-success" : "opacity-50"}`}
              >
                {lang.code.toUpperCase()}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}
