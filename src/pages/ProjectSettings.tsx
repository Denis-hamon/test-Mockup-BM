import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Save,
  Loader2,
  Palette,
  Zap,
  Trash2,
  AlertTriangle,
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
} from "lucide-react";
import { toast } from "sonner";
import { api, type AIGuidelines } from "@/lib/api";

const COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
];

const ALL_LANGUAGES = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl'];

// OVHcloud Target Audiences
const OVHCLOUD_AUDIENCES = [
  { id: 'developers', label: 'Developers', description: 'Software developers, DevOps, SRE' },
  { id: 'sysadmins', label: 'System Administrators', description: 'IT admins, infrastructure managers' },
  { id: 'startups', label: 'Startups & Entrepreneurs', description: 'Tech startups, founders, CTOs' },
  { id: 'smb', label: 'SMB / PME', description: 'Small & medium businesses' },
  { id: 'enterprise', label: 'Enterprise', description: 'Large companies, corporations' },
  { id: 'agencies', label: 'Web Agencies', description: 'Digital agencies, web developers' },
  { id: 'ecommerce', label: 'E-commerce', description: 'Online stores, merchants' },
  { id: 'gamers', label: 'Gamers', description: 'Game servers, gaming communities' },
  { id: 'data-scientists', label: 'Data Scientists', description: 'ML/AI engineers, data analysts' },
  { id: 'students', label: 'Students & Learners', description: 'Tech students, self-learners' },
  { id: 'hobbyists', label: 'Hobbyists', description: 'Personal projects, home labs' },
  { id: 'resellers', label: 'Resellers & Partners', description: 'Hosting resellers, MSPs' },
];

const DEFAULT_AI_GUIDELINES: AIGuidelines = {
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
    promptTemplate: 'A professional hero image for a blog article about {title}. Modern, clean design with subtle tech elements.',
    negativePrompt: 'text, watermark, logo, low quality, blurry, distorted',
    autoGenerate: false,
  },
};

// Tag Input Component
function TagInput({
  value = [],
  onChange,
  placeholder
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const tag = inputValue.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
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
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projectId = parseInt(id || "0");

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    autoTransform: true,
    autoTranslate: false,
  });

  const [aiGuidelines, setAiGuidelines] = useState<AIGuidelines>(DEFAULT_AI_GUIDELINES);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.getProject(projectId),
    enabled: !!projectId,
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        color: project.color || '#3B82F6',
        autoTransform: (project as any).auto_transform ?? true,
        autoTranslate: (project as any).auto_translate ?? false,
      });
      if ((project as any).ai_guidelines) {
        setAiGuidelines({ ...DEFAULT_AI_GUIDELINES, ...(project as any).ai_guidelines });
      }
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: (data: { formData: typeof formData; aiGuidelines: AIGuidelines }) =>
      api.updateProject(projectId, {
        name: data.formData.name,
        description: data.formData.description,
        color: data.formData.color,
        target_languages: ALL_LANGUAGES,
        auto_transform: data.formData.autoTransform,
        auto_translate: data.formData.autoTranslate,
        ai_guidelines: data.aiGuidelines,
      } as any),
    onSuccess: () => {
      toast.success('Project settings saved');
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteProject(projectId, true),
    onSuccess: () => {
      toast.success('Project deleted');
      navigate('/projects');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ formData, aiGuidelines });
  };

  const updateGuidelines = (updates: Partial<AIGuidelines>) => {
    setAiGuidelines(prev => ({ ...prev, ...updates }));
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Project Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your project preferences and AI behavior
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              General
            </CardTitle>
            <CardDescription>
              Basic project information and appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Project"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      className={`h-8 w-8 rounded-lg transition-transform ${
                        formData.color === color.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your project..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Guidelines
            </CardTitle>
            <CardDescription>
              Configure how AI transforms and generates content for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={["tone", "brand"]} className="w-full">
              {/* Tone & Voice */}
              <AccordionItem value="tone">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Mic2 className="h-4 w-4 text-muted-foreground" />
                    <span>Tone & Voice</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tone</Label>
                      <Select
                        value={aiGuidelines.tone}
                        onValueChange={(v) => updateGuidelines({ tone: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
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
                      <Select
                        value={aiGuidelines.writingStyle}
                        onValueChange={(v) => updateGuidelines({ writingStyle: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="concise">Concise</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                          <SelectItem value="conversational">Conversational</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label>Target Audiences (select all that apply)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {OVHCLOUD_AUDIENCES.map(({ id, label, description }) => (
                        <div key={id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`audience-${id}`}
                            checked={(aiGuidelines.targetAudiences || []).includes(id)}
                            onCheckedChange={(checked) => {
                              const current = aiGuidelines.targetAudiences || [];
                              if (checked) {
                                updateGuidelines({ targetAudiences: [...current, id] });
                              } else {
                                updateGuidelines({ targetAudiences: current.filter(a => a !== id) });
                              }
                            }}
                          />
                          <div className="grid gap-0.5 leading-none">
                            <label
                              htmlFor={`audience-${id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {label}
                            </label>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Brand Identity */}
              <AccordionItem value="brand">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>Brand Identity</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Brand Name</Label>
                      <Input
                        value={aiGuidelines.brandName || ''}
                        onChange={(e) => updateGuidelines({ brandName: e.target.value })}
                        placeholder="e.g., OVHcloud, Kimsufi"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Brand Voice Description</Label>
                    <Textarea
                      value={aiGuidelines.brandVoice || ''}
                      onChange={(e) => updateGuidelines({ brandVoice: e.target.value })}
                      placeholder="Describe your brand's personality and tone of voice..."
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Terms to Use</Label>
                      <TagInput
                        value={aiGuidelines.termsToUse || []}
                        onChange={(tags) => updateGuidelines({ termsToUse: tags })}
                        placeholder="Add preferred term..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Terms to Avoid</Label>
                      <TagInput
                        value={aiGuidelines.termsToAvoid || []}
                        onChange={(tags) => updateGuidelines({ termsToAvoid: tags })}
                        placeholder="Add forbidden term..."
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Content Structure */}
              <AccordionItem value="structure">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <LayoutList className="h-4 w-4 text-muted-foreground" />
                    <span>Content Structure</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-3">
                    <Label>Required Sections</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'includeIntroduction', label: 'Introduction' },
                        { key: 'includeConclusion', label: 'Conclusion' },
                        { key: 'includeTldr', label: 'TL;DR Summary' },
                        { key: 'includeFaq', label: 'FAQ Section' },
                        { key: 'includeCta', label: 'Call-to-Action' },
                        { key: 'useBulletPoints', label: 'Bullet Points' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={(aiGuidelines as any)[key] || false}
                            onCheckedChange={(checked) =>
                              updateGuidelines({ [key]: checked })
                            }
                          />
                          <label
                            htmlFor={key}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Heading Style</Label>
                      <Select
                        value={aiGuidelines.headingStyle}
                        onValueChange={(v) => updateGuidelines({ headingStyle: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="questions">Questions (How to...?)</SelectItem>
                          <SelectItem value="statements">Statements (The Benefits of...)</SelectItem>
                          <SelectItem value="action-oriented">Action-Oriented (Get Started with...)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Sentences per Paragraph</Label>
                      <Select
                        value={String(aiGuidelines.maxParagraphLength || 4)}
                        onValueChange={(v) => updateGuidelines({ maxParagraphLength: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 sentences (very short)</SelectItem>
                          <SelectItem value="3">3 sentences (short)</SelectItem>
                          <SelectItem value="4">4 sentences (medium)</SelectItem>
                          <SelectItem value="5">5 sentences (long)</SelectItem>
                          <SelectItem value="6">6 sentences (very long)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* SEO Instructions */}
              <AccordionItem value="seo">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span>SEO Instructions</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Primary Keywords</Label>
                      <TagInput
                        value={aiGuidelines.primaryKeywords || []}
                        onChange={(tags) => updateGuidelines({ primaryKeywords: tags })}
                        placeholder="Add primary keyword..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Keywords</Label>
                      <TagInput
                        value={aiGuidelines.secondaryKeywords || []}
                        onChange={(tags) => updateGuidelines({ secondaryKeywords: tags })}
                        placeholder="Add secondary keyword..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Internal Links (URLs to include when relevant)</Label>
                    <TagInput
                      value={aiGuidelines.internalLinks || []}
                      onChange={(tags) => updateGuidelines({ internalLinks: tags })}
                      placeholder="Add URL..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Description Style</Label>
                    <Select
                      value={aiGuidelines.metaDescriptionStyle}
                      onValueChange={(v) => updateGuidelines({ metaDescriptionStyle: v as any })}
                    >
                      <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (under 120 chars)</SelectItem>
                        <SelectItem value="descriptive">Descriptive (120-155 chars)</SelectItem>
                        <SelectItem value="cta">Call-to-Action focused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Content Rules */}
              <AccordionItem value="rules">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span>Content Rules</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Mandatory Disclaimer</Label>
                    <Textarea
                      value={aiGuidelines.mandatoryDisclaimer || ''}
                      onChange={(e) => updateGuidelines({ mandatoryDisclaimer: e.target.value })}
                      placeholder="Add a legal disclaimer to include at the end of articles..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Products/Services to Mention</Label>
                    <TagInput
                      value={aiGuidelines.productsToMention || []}
                      onChange={(tags) => updateGuidelines({ productsToMention: tags })}
                      placeholder="Add product name..."
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Competitors Policy</Label>
                      <Select
                        value={aiGuidelines.competitorsPolicy}
                        onValueChange={(v) => updateGuidelines({ competitorsPolicy: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never-mention">Never mention competitors</SelectItem>
                          <SelectItem value="mention-objectively">Mention objectively</SelectItem>
                          <SelectItem value="compare">Compare with our products</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Technical Accuracy Level</Label>
                      <Select
                        value={aiGuidelines.technicalAccuracy}
                        onValueChange={(v) => updateGuidelines({ technicalAccuracy: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simplified">Simplified (for beginners)</SelectItem>
                          <SelectItem value="balanced">Balanced (general audience)</SelectItem>
                          <SelectItem value="highly-technical">Highly Technical (experts)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Custom Instructions */}
              <AccordionItem value="custom">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span>Custom Instructions</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Custom Instructions for AI</Label>
                    <Textarea
                      value={aiGuidelines.customInstructions || ''}
                      onChange={(e) => updateGuidelines({ customInstructions: e.target.value })}
                      placeholder="Write any specific instructions for the AI that aren't covered by the options above...

Example:
- Always mention that our support team is available 24/7
- Include a comparison table when discussing different plans
- End each article with a question to encourage engagement"
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-green-600">Good Content Examples</Label>
                      <Textarea
                        value={aiGuidelines.goodExamples || ''}
                        onChange={(e) => updateGuidelines({ goodExamples: e.target.value })}
                        placeholder="Paste examples of well-written content that the AI should emulate..."
                        rows={4}
                        className="border-green-200 focus:border-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-red-600">Bad Content Examples</Label>
                      <Textarea
                        value={aiGuidelines.badExamples || ''}
                        onChange={(e) => updateGuidelines({ badExamples: e.target.value })}
                        placeholder="Paste examples of content style the AI should avoid..."
                        rows={4}
                        className="border-red-200 focus:border-red-500"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Image Generation */}
              <AccordionItem value="image">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Image Generation</span>
                    <Badge variant="outline" className="ml-2 text-xs">Stable Diffusion XL</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <Label>Enable Image Generation</Label>
                      <p className="text-sm text-muted-foreground">
                        Generate hero images for articles using AI
                      </p>
                    </div>
                    <Switch
                      checked={aiGuidelines.imageGeneration?.enabled || false}
                      onCheckedChange={(checked) =>
                        updateGuidelines({
                          imageGeneration: { ...aiGuidelines.imageGeneration, enabled: checked }
                        })
                      }
                    />
                  </div>

                  {aiGuidelines.imageGeneration?.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Visual Style</Label>
                        <Select
                          value={aiGuidelines.imageGeneration?.style || 'photorealistic'}
                          onValueChange={(v) =>
                            updateGuidelines({
                              imageGeneration: { ...aiGuidelines.imageGeneration, style: v as any }
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="photorealistic">Photorealistic</SelectItem>
                            <SelectItem value="illustration">Illustration</SelectItem>
                            <SelectItem value="abstract">Abstract</SelectItem>
                            <SelectItem value="minimal">Minimal / Clean</SelectItem>
                            <SelectItem value="tech">Tech / Digital</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Prompt Template</Label>
                        <Textarea
                          value={aiGuidelines.imageGeneration?.promptTemplate || ''}
                          onChange={(e) =>
                            updateGuidelines({
                              imageGeneration: { ...aiGuidelines.imageGeneration, promptTemplate: e.target.value }
                            })
                          }
                          placeholder="A professional hero image for a blog article about {title}..."
                          rows={3}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Use {'{title}'} to insert the article title dynamically
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Negative Prompt (what to avoid)</Label>
                        <Textarea
                          value={aiGuidelines.imageGeneration?.negativePrompt || ''}
                          onChange={(e) =>
                            updateGuidelines({
                              imageGeneration: { ...aiGuidelines.imageGeneration, negativePrompt: e.target.value }
                            })
                          }
                          placeholder="text, watermark, logo, low quality, blurry..."
                          rows={2}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Auto-Generate</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically generate thumbnails after transformation
                          </p>
                        </div>
                        <Switch
                          checked={aiGuidelines.imageGeneration?.autoGenerate || false}
                          onCheckedChange={(checked) =>
                            updateGuidelines({
                              imageGeneration: { ...aiGuidelines.imageGeneration, autoGenerate: checked }
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Automation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Automation
            </CardTitle>
            <CardDescription>
              Configure automatic processing options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Transform</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically transform articles after collection
                </p>
              </div>
              <Switch
                checked={formData.autoTransform}
                onCheckedChange={(checked) => setFormData({ ...formData, autoTransform: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Translate</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically translate articles after transformation
                </p>
              </div>
              <Switch
                checked={formData.autoTranslate}
                onCheckedChange={(checked) => setFormData({ ...formData, autoTranslate: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </form>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Delete Project</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete this project and all associated data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the project
                    "{project?.name}" and remove all associated providers and articles from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Project
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
