import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Settings2, Zap, Globe, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { Provider } from "@/lib/api";

interface ProviderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: Provider | null;
  onSubmit: (data: ProviderFormData) => void;
  isLoading?: boolean;
  projectId?: number;
}

export interface ProviderFormData {
  name: string;
  slug: string;
  domain: string;
  entryUrl: string;
  crawlDepth: number;
  urlPatterns: string;
  excludePatterns: string;
  contentSelectors: string;
  schedule: string;
  autoTransform: boolean;
  autoTranslate: boolean;
  jsRender: boolean;
  scrapingMethod: 'firecrawl' | 'direct' | 'playwright';
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProviderModal({
  open,
  onOpenChange,
  provider,
  onSubmit,
  isLoading = false,
}: ProviderModalProps) {
  const isEditing = !!provider;

  const [formData, setFormData] = useState<ProviderFormData>({
    name: "",
    slug: "",
    domain: "",
    entryUrl: "",
    crawlDepth: 2,
    urlPatterns: "",
    excludePatterns: "",
    contentSelectors: "",
    schedule: "manual",
    autoTransform: true,
    autoTranslate: false,
    jsRender: false,
    scrapingMethod: 'firecrawl',
  });

  useEffect(() => {
    if (provider) {
      // Map snake_case from API to camelCase for form
      const p = provider as any;

      // Try to extract domain and entryUrl from base_urls if not set directly
      let domain = p.domain || "";
      let entryUrl = p.entry_url || p.entryUrl || "";

      if ((!domain || !entryUrl) && p.base_urls) {
        const baseUrls = typeof p.base_urls === 'string' ? JSON.parse(p.base_urls) : p.base_urls;
        const firstUrl = Object.values(baseUrls)[0] as string;
        if (firstUrl) {
          try {
            const url = new URL(firstUrl);
            if (!domain) domain = `${url.protocol}//${url.host}`;
            if (!entryUrl) entryUrl = firstUrl;
          } catch (e) {
            // Invalid URL, ignore
          }
        }
      }

      setFormData({
        name: p.name,
        slug: p.slug,
        domain: domain,
        entryUrl: entryUrl,
        crawlDepth: p.crawl_depth || p.crawlDepth || 2,
        urlPatterns: Array.isArray(p.url_patterns || p.urlPatterns)
          ? (p.url_patterns || p.urlPatterns).join("\n")
          : (p.url_patterns || p.urlPatterns || ""),
        excludePatterns: Array.isArray(p.exclude_patterns || p.excludePatterns)
          ? (p.exclude_patterns || p.excludePatterns).join("\n")
          : (p.exclude_patterns || p.excludePatterns || ""),
        contentSelectors: p.content_selectors || p.contentSelectors || "",
        schedule: p.schedule || "manual",
        autoTransform: (p.auto_transform ?? p.autoTransform) ?? true,
        autoTranslate: (p.auto_translate ?? p.autoTranslate) ?? false,
        jsRender: (p.js_render ?? p.jsRender) ?? false,
        scrapingMethod: p.scraping_method || p.scrapingMethod || 'firecrawl',
      });
    } else {
      setFormData({
        name: "",
        slug: "",
        domain: "",
        entryUrl: "",
        crawlDepth: 2,
        urlPatterns: "",
        excludePatterns: "",
        contentSelectors: "",
        schedule: "manual",
        autoTransform: true,
        autoTranslate: false,
        jsRender: false,
        scrapingMethod: 'firecrawl',
      });
    }
  }, [provider, open]);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Collection Point" : "Add Collection Point"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the configuration for this collection source."
              : "Configure a new content collection source."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Hostinger Blog"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="hostinger-blog"
                required
                disabled={isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={formData.domain}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, domain: e.target.value }))
              }
              placeholder="https://www.hostinger.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entryUrl">Entry URL</Label>
            <Input
              id="entryUrl"
              value={formData.entryUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, entryUrl: e.target.value }))
              }
              placeholder="https://www.hostinger.com/tutorials"
              required
            />
            <p className="text-xs text-muted-foreground">
              Starting point for content discovery
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="crawlDepth">Crawl Depth</Label>
              <Select
                value={String(formData.crawlDepth)}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, crawlDepth: Number(v) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 level</SelectItem>
                  <SelectItem value="2">2 levels</SelectItem>
                  <SelectItem value="3">3 levels</SelectItem>
                  <SelectItem value="4">4 levels</SelectItem>
                  <SelectItem value="5">5 levels</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Select
                value={formData.schedule}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, schedule: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="urlPatterns">URL Patterns (one per line)</Label>
            <Textarea
              id="urlPatterns"
              value={formData.urlPatterns}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, urlPatterns: e.target.value }))
              }
              placeholder="/tutorials/*&#10;/blog/*"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Only URLs matching these patterns will be collected
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excludePatterns">
              Exclude Patterns (one per line)
            </Label>
            <Textarea
              id="excludePatterns"
              value={formData.excludePatterns}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  excludePatterns: e.target.value,
                }))
              }
              placeholder="/author/*&#10;/tag/*"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentSelectors">Content Selectors (CSS)</Label>
            <Input
              id="contentSelectors"
              value={formData.contentSelectors}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contentSelectors: e.target.value,
                }))
              }
              placeholder="article, .post-content, main"
            />
          </div>

          {/* Scraping Method Section */}
          <Separator className="my-4" />
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Settings2 className="h-4 w-4" />
              Methode de collecte actuelle
            </div>

            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3 mb-3">
                {formData.scrapingMethod === 'firecrawl' && (
                  <>
                    <div className="p-2 rounded-full bg-green-500/10">
                      <Zap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Firecrawl</p>
                      <p className="text-xs text-muted-foreground">Service cloud rapide</p>
                    </div>
                  </>
                )}
                {formData.scrapingMethod === 'direct' && (
                  <>
                    <div className="p-2 rounded-full bg-blue-500/10">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">HTTP Direct</p>
                      <p className="text-xs text-muted-foreground">Requetes simples</p>
                    </div>
                  </>
                )}
                {formData.scrapingMethod === 'playwright' && (
                  <>
                    <div className="p-2 rounded-full bg-orange-500/10">
                      <Shield className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">Playwright</p>
                      <p className="text-xs text-muted-foreground">Navigateur headless (anti-bot)</p>
                    </div>
                  </>
                )}
                {formData.jsRender && (
                  <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    JS active
                  </span>
                )}
              </div>

              <div className="text-xs text-muted-foreground border-t pt-3 mt-2">
                <p className="mb-2">
                  <strong>Gestion automatique</strong> - Aucune intervention requise.
                </p>
                <p>
                  Si la collecte echoue (protection anti-bot, timeout), le systeme
                  bascule automatiquement vers une methode plus robuste et met a jour ce champ.
                </p>
              </div>
            </div>
          </div>
          <Separator className="my-4" />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="autoTransform"
                checked={formData.autoTransform}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, autoTransform: checked }))
                }
              />
              <Label htmlFor="autoTransform">Auto-transform after collection</Label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="autoTranslate"
                checked={formData.autoTranslate}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, autoTranslate: checked }))
                }
              />
              <Label htmlFor="autoTranslate">Auto-translate after transform</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Provider"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
