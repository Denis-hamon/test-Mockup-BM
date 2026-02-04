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
      setFormData({
        name: provider.name,
        slug: provider.slug,
        domain: provider.domain || "",
        entryUrl: provider.entryUrl || "",
        crawlDepth: provider.crawlDepth || 2,
        urlPatterns: Array.isArray(provider.urlPatterns)
          ? provider.urlPatterns.join("\n")
          : provider.urlPatterns || "",
        excludePatterns: Array.isArray(provider.excludePatterns)
          ? provider.excludePatterns.join("\n")
          : provider.excludePatterns || "",
        contentSelectors: provider.contentSelectors || "",
        schedule: provider.schedule || "manual",
        autoTransform: provider.autoTransform ?? true,
        autoTranslate: provider.autoTranslate ?? false,
        jsRender: provider.jsRender ?? false,
        scrapingMethod: provider.scrapingMethod || 'firecrawl',
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
              Méthode de collecte
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scrapingMethod">Méthode</Label>
                <Select
                  value={formData.scrapingMethod}
                  onValueChange={(v: 'firecrawl' | 'direct' | 'playwright') =>
                    setFormData((prev) => ({ ...prev, scrapingMethod: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="firecrawl">
                      <span className="flex items-center gap-2">
                        <Zap className="h-3 w-3" />
                        Firecrawl (Recommandé)
                      </span>
                    </SelectItem>
                    <SelectItem value="direct">
                      <span className="flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        HTTP Direct
                      </span>
                    </SelectItem>
                    <SelectItem value="playwright">
                      <span className="flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        Playwright (Anti-bot)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    id="jsRender"
                    checked={formData.jsRender}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, jsRender: checked }))
                    }
                  />
                  <Label htmlFor="jsRender" className="text-sm">JavaScript Rendering</Label>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Activez JavaScript Rendering pour les sites dynamiques (React, Vue, etc.) ou protégés par Cloudflare.
            </p>
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
