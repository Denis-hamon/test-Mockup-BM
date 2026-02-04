import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Loader2,
  Brain,
  Mic2,
  Building2,
  LayoutList,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  Plus,
  ImageIcon,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import api, { type AIGuidelines } from "@/lib/api";

const OVHCLOUD_AUDIENCES = [
  { id: 'developers', label: 'Developers', description: 'Software developers, DevOps, SRE' },
  { id: 'sysadmins', label: 'System Administrators', description: 'IT admins, infrastructure managers' },
  { id: 'startups', label: 'Startups & Entrepreneurs', description: 'Tech startups, founders, CTOs' },
  { id: 'smb', label: 'SMB', description: 'Small & medium businesses' },
  { id: 'enterprise', label: 'Enterprise', description: 'Large companies, corporations' },
  { id: 'agencies', label: 'Web Agencies', description: 'Digital agencies, web developers' },
  { id: 'ecommerce', label: 'E-commerce', description: 'Online stores, merchants' },
  { id: 'gamers', label: 'Gamers', description: 'Game servers, gaming communities' },
  { id: 'data-scientists', label: 'Data Scientists', description: 'ML/AI engineers, data analysts' },
  { id: 'students', label: 'Students & Learners', description: 'Tech students, self-learners' },
  { id: 'hobbyists', label: 'Hobbyists', description: 'Personal projects, home labs' },
  { id: 'resellers', label: 'Resellers & Partners', description: 'Hosting resellers, MSPs' },
];

const DEFAULT_GUIDELINES: AIGuidelines = {
  tone: 'professional',
  targetAudiences: ['developers'],
  writingStyle: 'detailed',
  brandName: '',
  brandVoice: '',
  termsToUse: [],
  termsToAvoid: [],
  includeIntroduction: true,
  includeConclusion: true,
  includeTldr: false,
  includeFaq: false,
  includeCta: true,
  headingStyle: 'statements',
  maxParagraphLength: 4,
  useBulletPoints: true,
  primaryKeywords: [],
  secondaryKeywords: [],
  internalLinks: [],
  metaDescriptionStyle: 'descriptive',
  mandatoryDisclaimer: '',
  productsToMention: [],
  competitorsPolicy: 'never-mention',
  technicalAccuracy: 'balanced',
  customInstructions: '',
  goodExamples: '',
  badExamples: '',
  imageGeneration: {
    enabled: false,
    style: 'photorealistic',
    promptTemplate: '',
    negativePrompt: '',
    autoGenerate: false,
  },
};

function TagInput({ value = [], onChange, placeholder }: { value: string[]; onChange: (tags: string[]) => void; placeholder: string }) {
  const [inputValue, setInputValue] = useState('');
  
  const addTag = () => {
    const tag = inputValue.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
      setInputValue('');
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
        />
        <Button type="button" variant="outline" size="icon" onClick={addTag}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button type="button" onClick={() => onChange(value.filter(t => t !== tag))} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AIGuidelinesPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const projectId = parseInt(id || "0");
  const initializedRef = useRef(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.getProject(projectId),
    enabled: !!projectId,
  });

  const [guidelines, setGuidelines] = useState<AIGuidelines>(DEFAULT_GUIDELINES);

  useEffect(() => {
    if (project && !initializedRef.current) {
      initializedRef.current = true;
      const saved = (project as any).ai_guidelines;
      if (saved) {
        setGuidelines({
          ...DEFAULT_GUIDELINES,
          ...saved,
          imageGeneration: { ...DEFAULT_GUIDELINES.imageGeneration, ...(saved.imageGeneration || {}) },
        });
      }
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: (data: AIGuidelines) => api.updateProject(projectId, { ai_guidelines: data } as any),
    onSuccess: () => toast.success('Guidelines saved'),
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSave = () => updateMutation.mutate(guidelines);
  
  const update = useCallback((changes: Partial<AIGuidelines>) => {
    setGuidelines(prev => ({ ...prev, ...changes }));
  }, []);

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            AI Guidelines
          </h1>
          <p className="text-muted-foreground mt-1">Configure how AI transforms content for {project?.name}</p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg flex gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-300">These guidelines direct the AI when transforming and translating articles. The more precise you are, the better the results.</p>
      </div>

      <Tabs defaultValue="tone" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="tone"><Mic2 className="h-4 w-4 mr-2" />Tone</TabsTrigger>
          <TabsTrigger value="brand"><Building2 className="h-4 w-4 mr-2" />Brand</TabsTrigger>
          <TabsTrigger value="structure"><LayoutList className="h-4 w-4 mr-2" />Structure</TabsTrigger>
          <TabsTrigger value="seo"><Search className="h-4 w-4 mr-2" />SEO</TabsTrigger>
          <TabsTrigger value="rules"><ShieldCheck className="h-4 w-4 mr-2" />Rules</TabsTrigger>
          <TabsTrigger value="advanced"><Sparkles className="h-4 w-4 mr-2" />Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="tone">
          <Card>
            <CardHeader>
              <CardTitle>Tone & Style</CardTitle>
              <CardDescription>Define the personality of your content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>General Tone</Label>
                  <Select value={guidelines.tone || 'professional'} onValueChange={(v) => update({ tone: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Writing Style</Label>
                  <Select value={guidelines.writingStyle || 'detailed'} onValueChange={(v) => update({ writingStyle: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Target Audiences</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {OVHCLOUD_AUDIENCES.map(({ id, label }) => {
                    const selected = (guidelines.targetAudiences || []).includes(id);
                    return (
                      <Button
                        key={id}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const current = guidelines.targetAudiences || [];
                          update({ targetAudiences: selected ? current.filter(a => a !== id) : [...current, id] });
                        }}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand">
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Brand Name</Label>
                <Input value={guidelines.brandName || ''} onChange={(e) => update({ brandName: e.target.value })} placeholder="OVHcloud, Kimsufi..." />
              </div>
              <div className="space-y-2">
                <Label>Brand Voice</Label>
                <Textarea value={guidelines.brandVoice || ''} onChange={(e) => update({ brandVoice: e.target.value })} rows={4} placeholder="Describe your brand personality..." />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-green-600">Preferred Terms</Label>
                  <TagInput value={guidelines.termsToUse || []} onChange={(tags) => update({ termsToUse: tags })} placeholder="Add term..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-red-600">Terms to Avoid</Label>
                  <TagInput value={guidelines.termsToAvoid || []} onChange={(tags) => update({ termsToAvoid: tags })} placeholder="Add term..." />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure">
          <Card>
            <CardHeader><CardTitle>Content Structure</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Heading Style</Label>
                  <Select value={guidelines.headingStyle || 'statements'} onValueChange={(v) => update({ headingStyle: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="questions">Questions</SelectItem>
                      <SelectItem value="statements">Statements</SelectItem>
                      <SelectItem value="action-oriented">Action-Oriented</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Paragraph Length</Label>
                  <Select value={String(guidelines.maxParagraphLength || 4)} onValueChange={(v) => update({ maxParagraphLength: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 sentences</SelectItem>
                      <SelectItem value="3">3 sentences</SelectItem>
                      <SelectItem value="4">4 sentences</SelectItem>
                      <SelectItem value="5">5 sentences</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'includeIntroduction', label: 'Introduction' },
                  { key: 'includeConclusion', label: 'Conclusion' },
                  { key: 'includeTldr', label: 'TL;DR' },
                  { key: 'includeFaq', label: 'FAQ' },
                  { key: 'includeCta', label: 'CTA' },
                  { key: 'useBulletPoints', label: 'Lists' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Switch
                      checked={Boolean((guidelines as any)[key])}
                      onCheckedChange={(checked) => update({ [key]: checked })}
                    />
                    <Label>{label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Primary Keywords</Label>
                  <TagInput value={guidelines.primaryKeywords || []} onChange={(tags) => update({ primaryKeywords: tags })} placeholder="Add keyword..." />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Keywords</Label>
                  <TagInput value={guidelines.secondaryKeywords || []} onChange={(tags) => update({ secondaryKeywords: tags })} placeholder="Add keyword..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Internal Links</Label>
                <TagInput value={guidelines.internalLinks || []} onChange={(tags) => update({ internalLinks: tags })} placeholder="URL..." />
              </div>
              <div className="space-y-2">
                <Label>Meta Description Style</Label>
                <Select value={guidelines.metaDescriptionStyle || 'descriptive'} onValueChange={(v) => update({ metaDescriptionStyle: v as any })}>
                  <SelectTrigger className="w-[300px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="descriptive">Descriptive</SelectItem>
                    <SelectItem value="cta">Action-Oriented</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader><CardTitle>Content Rules</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mandatory Disclaimer</Label>
                <Textarea value={guidelines.mandatoryDisclaimer || ''} onChange={(e) => update({ mandatoryDisclaimer: e.target.value })} rows={3} placeholder="Legal text to add at the end of each article..." />
              </div>
              <div className="space-y-2">
                <Label>Products to Mention</Label>
                <TagInput value={guidelines.productsToMention || []} onChange={(tags) => update({ productsToMention: tags })} placeholder="Product..." />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Competitors Policy</Label>
                  <Select value={guidelines.competitorsPolicy || 'never-mention'} onValueChange={(v) => update({ competitorsPolicy: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never-mention">Never mention</SelectItem>
                      <SelectItem value="mention-objectively">Mention objectively</SelectItem>
                      <SelectItem value="compare">Compare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Technical Level</Label>
                  <Select value={guidelines.technicalAccuracy || 'balanced'} onValueChange={(v) => update({ technicalAccuracy: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simplified">Simplified</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="highly-technical">Highly Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader><CardTitle>Custom Instructions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>AI Instructions</Label>
                <Textarea value={guidelines.customInstructions || ''} onChange={(e) => update({ customInstructions: e.target.value })} rows={6} className="font-mono text-sm" placeholder="Write specific instructions for the AI..." />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-green-600">Good Examples</Label>
                  <Textarea value={guidelines.goodExamples || ''} onChange={(e) => update({ goodExamples: e.target.value })} rows={4} placeholder="Paste examples of well-written content..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-red-600">Bad Examples</Label>
                  <Textarea value={guidelines.badExamples || ''} onChange={(e) => update({ badExamples: e.target.value })} rows={4} placeholder="Paste examples of styles to avoid..." />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Image Generation
                <Badge variant="outline">SDXL</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable</Label>
                <Switch
                  checked={guidelines.imageGeneration?.enabled || false}
                  onCheckedChange={(checked) => update({ imageGeneration: { ...guidelines.imageGeneration, enabled: checked } })}
                />
              </div>
              {guidelines.imageGeneration?.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Style</Label>
                    <Select
                      value={guidelines.imageGeneration?.style || 'photorealistic'}
                      onValueChange={(v) => update({ imageGeneration: { ...guidelines.imageGeneration, style: v as any } })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photorealistic">Photorealistic</SelectItem>
                        <SelectItem value="illustration">Illustration</SelectItem>
                        <SelectItem value="abstract">Abstract</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="tech">Tech</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prompt Template</Label>
                    <Textarea
                      value={guidelines.imageGeneration?.promptTemplate || ''}
                      onChange={(e) => update({ imageGeneration: { ...guidelines.imageGeneration, promptTemplate: e.target.value } })}
                      rows={2}
                      placeholder="A professional hero image for a blog article about {title}..."
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto-generate</Label>
                    <Switch
                      checked={guidelines.imageGeneration?.autoGenerate || false}
                      onCheckedChange={(checked) => update({ imageGeneration: { ...guidelines.imageGeneration, autoGenerate: checked } })}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-6 flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={updateMutation.isPending} className="shadow-lg">
          {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Guidelines
        </Button>
      </div>
    </div>
  );
}
