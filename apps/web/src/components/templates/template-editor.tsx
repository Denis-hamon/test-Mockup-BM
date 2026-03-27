"use client";

import { useReducer, useState, useCallback, useRef, useEffect } from "react";
import { Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import type {
  IntakeTemplate,
  BrandingConfig,
  TemplateQuestion,
} from "@legalconnect/shared";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { IntakePreview } from "./intake-preview";
import { saveTemplate } from "@/server/actions/template.actions";
import { QuestionList } from "./question-list";
import { BrandingEditor } from "./branding-editor";
import { checkSlugAvailability } from "@/server/actions/template.actions";

// ---------------------------------------------------------------------------
// State management via useReducer
// ---------------------------------------------------------------------------

type EditorAction =
  | { type: "SET_QUESTIONS"; stepIndex: number; questions: TemplateQuestion[] }
  | {
      type: "REORDER_QUESTIONS";
      stepIndex: number;
      questions: TemplateQuestion[];
    }
  | {
      type: "ADD_QUESTION";
      stepIndex: number;
      question: TemplateQuestion;
    }
  | { type: "DELETE_QUESTION"; stepIndex: number; questionIndex: number }
  | {
      type: "UPDATE_QUESTION";
      stepIndex: number;
      questionIndex: number;
      question: TemplateQuestion;
    }
  | { type: "SET_STEP_LABEL"; stepIndex: number; label: string }
  | { type: "SET_BRANDING"; branding: BrandingConfig }
  | { type: "MARK_SAVED" };

interface EditorState {
  template: IntakeTemplate;
  branding: BrandingConfig;
  dirty: boolean;
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_QUESTIONS": {
      const steps = [...state.template.steps];
      steps[action.stepIndex] = {
        ...steps[action.stepIndex],
        questions: action.questions,
      };
      return {
        ...state,
        template: { ...state.template, steps },
        dirty: true,
      };
    }
    case "REORDER_QUESTIONS": {
      const steps = [...state.template.steps];
      steps[action.stepIndex] = {
        ...steps[action.stepIndex],
        questions: action.questions,
      };
      return {
        ...state,
        template: { ...state.template, steps },
        dirty: true,
      };
    }
    case "ADD_QUESTION": {
      const steps = [...state.template.steps];
      steps[action.stepIndex] = {
        ...steps[action.stepIndex],
        questions: [...steps[action.stepIndex].questions, action.question],
      };
      return {
        ...state,
        template: { ...state.template, steps },
        dirty: true,
      };
    }
    case "DELETE_QUESTION": {
      const steps = [...state.template.steps];
      steps[action.stepIndex] = {
        ...steps[action.stepIndex],
        questions: steps[action.stepIndex].questions.filter(
          (_, i) => i !== action.questionIndex
        ),
      };
      return {
        ...state,
        template: { ...state.template, steps },
        dirty: true,
      };
    }
    case "UPDATE_QUESTION": {
      const steps = [...state.template.steps];
      const questions = [...steps[action.stepIndex].questions];
      questions[action.questionIndex] = action.question;
      steps[action.stepIndex] = { ...steps[action.stepIndex], questions };
      return {
        ...state,
        template: { ...state.template, steps },
        dirty: true,
      };
    }
    case "SET_STEP_LABEL": {
      const steps = [...state.template.steps];
      steps[action.stepIndex] = {
        ...steps[action.stepIndex],
        label: action.label,
      };
      return {
        ...state,
        template: { ...state.template, steps },
        dirty: true,
      };
    }
    case "SET_BRANDING":
      return { ...state, branding: action.branding, dirty: true };
    case "MARK_SAVED":
      return { ...state, dirty: false };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// TemplateEditor component
// ---------------------------------------------------------------------------

interface TemplateEditorProps {
  initialTemplate: IntakeTemplate;
  initialBranding: BrandingConfig;
  templateId: string;
}

export function TemplateEditor({
  initialTemplate,
  initialBranding,
  templateId,
}: TemplateEditorProps) {
  const [state, dispatch] = useReducer(editorReducer, {
    template: initialTemplate,
    branding: initialBranding,
    dirty: false,
  });

  const [saving, setSaving] = useState(false);
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  // Debounced text update helper
  const debouncedDispatch = useCallback(
    (key: string, action: EditorAction, delayMs = 300) => {
      const existing = debounceTimers.current.get(key);
      if (existing) clearTimeout(existing);
      debounceTimers.current.set(
        key,
        setTimeout(() => {
          dispatch(action);
          debounceTimers.current.delete(key);
        }, delayMs)
      );
    },
    []
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      debounceTimers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveTemplate({
        specialty: state.template.specialty,
        schema: state.template,
        logoUrl: state.branding.logoUrl,
        accentColor: state.branding.accentColor,
        welcomeText: state.branding.welcomeText,
        slug: state.branding.slug,
      });

      if (result.success) {
        dispatch({ type: "MARK_SAVED" });
        toast.success("Template enregistre");
      } else if (result.error === "slug_taken") {
        toast.error("Cette adresse est deja utilisee par un autre avocat");
      } else {
        toast.error("Erreur lors de l'enregistrement");
      }
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  // Current step index (for now, render first step in questions tab)
  // Future: tabs per step
  const currentStepIndex = 0;
  const currentStep = state.template.steps[currentStepIndex];

  return (
    <div className="flex flex-col gap-6">
      {/* Header with save */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold">Personnaliser le template</h1>
          <p className="text-sm text-muted-foreground">
            Modifiez les questions et l&apos;apparence de votre formulaire
            d&apos;intake.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile preview trigger */}
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Eye className="size-4 mr-1" />
                  Voir l&apos;apercu
                </Button>
              }
            />
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Apercu</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto flex-1 p-4">
                <IntakePreview
                  template={state.template}
                  branding={state.branding}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Button
            onClick={handleSave}
            disabled={!state.dirty || saving}
            size="sm"
          >
            {saving && <Loader2 className="size-4 mr-1 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Split view */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left panel: editor */}
        <div className="w-full lg:w-1/2">
          <Tabs defaultValue="questions">
            <TabsList variant="line">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="branding">Apparence</TabsTrigger>
            </TabsList>

            <TabsContent value="questions" className="mt-4">
              {state.template.steps.map((step, stepIdx) => (
                <div key={step.id} className="mb-6">
                  <h3 className="text-sm font-medium mb-3">{step.label}</h3>
                  <QuestionList
                    questions={step.questions}
                    onReorder={(questions) =>
                      dispatch({
                        type: "REORDER_QUESTIONS",
                        stepIndex: stepIdx,
                        questions,
                      })
                    }
                    onUpdate={(questionIndex, question) =>
                      dispatch({
                        type: "UPDATE_QUESTION",
                        stepIndex: stepIdx,
                        questionIndex,
                        question,
                      })
                    }
                    onDelete={(questionIndex) =>
                      dispatch({
                        type: "DELETE_QUESTION",
                        stepIndex: stepIdx,
                        questionIndex,
                      })
                    }
                    onAdd={() =>
                      dispatch({
                        type: "ADD_QUESTION",
                        stepIndex: stepIdx,
                        question: {
                          id: crypto.randomUUID(),
                          label: "Nouvelle question",
                          fieldType: "text",
                          required: false,
                        },
                      })
                    }
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="branding" className="mt-4">
              <BrandingEditor
                branding={state.branding}
                onChange={(branding) =>
                  dispatch({ type: "SET_BRANDING", branding })
                }
                onCheckSlug={checkSlugAvailability}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel: live preview (desktop only) */}
        <div className="hidden lg:block w-full lg:w-1/2 lg:sticky lg:top-4 lg:self-start">
          <IntakePreview
            template={state.template}
            branding={state.branding}
          />
        </div>
      </div>
    </div>
  );
}
