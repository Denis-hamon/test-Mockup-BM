import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Target, Sparkles } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface ProjectIntentionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  currentIntention?: string;
}

export function ProjectIntentionModal({
  open,
  onOpenChange,
  projectId,
  currentIntention,
}: ProjectIntentionModalProps) {
  const [intention, setIntention] = useState(currentIntention || "");
  const queryClient = useQueryClient();

  const updateIntentionMutation = useMutation({
    mutationFn: () => api.updateProjectIntention(projectId, intention),
    onSuccess: () => {
      toast.success("Intention du projet mise à jour");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["relevance-stats", projectId] });
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleSubmit = () => {
    if (intention.trim().length < 10) {
      toast.error("L'intention doit contenir au moins 10 caractères");
      return;
    }
    updateIntentionMutation.mutate();
  };

  const exampleIntentions = [
    "Articles sur le cloud computing, l'infrastructure IT et les solutions OVHcloud pour les entreprises. Focus sur les cas d'usage techniques et les tutoriels pratiques.",
    "Contenu marketing sur les solutions d'hébergement web, serveurs dédiés et VPS. Ciblé pour les développeurs et les PME.",
    "Veille technologique sur l'IA, le machine learning et les API. Articles techniques pour les data scientists et ingénieurs.",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Définir l'intention du projet
          </DialogTitle>
          <DialogDescription>
            Décrivez l'objectif et les critères de pertinence pour ce projet.
            Cette intention sera utilisée par l'IA pour évaluer la pertinence des articles collectés.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="intention">Intention du projet</Label>
            <Textarea
              id="intention"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="Décrivez le type de contenu recherché, les thématiques pertinentes, le public cible..."
              className="min-h-[150px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {intention.length} caractères (minimum 10)
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Exemples d'intentions :</Label>
            <div className="space-y-2">
              {exampleIntentions.map((example, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIntention(example)}
                  className="w-full text-left p-3 text-sm rounded-lg border border-dashed hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Sparkles className="h-3 w-3 inline mr-2 text-primary" />
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateIntentionMutation.isPending || intention.trim().length < 10}
          >
            {updateIntentionMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Target className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
