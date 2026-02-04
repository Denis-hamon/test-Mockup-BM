import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Zap,
} from "lucide-react";
import api from "@/lib/api";

interface DeepSeekTransformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
  articleTitle: string;
  onComplete: () => void;
}

const phaseConfig = {
  pending: {
    icon: Clock,
    label: "Initializing",
    description: "Preparing DeepSeek AI model...",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  thinking: {
    icon: Brain,
    label: "Thinking",
    description: "DeepSeek is analyzing the content...",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  generating: {
    icon: Sparkles,
    label: "Generating",
    description: "Creating transformed content...",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    description: "Transformation successful!",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    description: "Transformation encountered an error",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
};

export function DeepSeekTransformDialog({
  open,
  onOpenChange,
  taskId,
  articleTitle,
  onComplete,
}: DeepSeekTransformDialogProps) {
  const queryClient = useQueryClient();
  const [elapsedTime, setElapsedTime] = useState(0);

  // Poll for task status
  const { data: taskStatus } = useQuery({
    queryKey: ['transform-task', taskId],
    queryFn: () => api.getTransformTaskStatus(taskId!),
    enabled: !!taskId && open,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') {
        return false;
      }
      return 1000; // Poll every second
    },
  });

  // Elapsed time counter
  useEffect(() => {
    if (!open || !taskId) {
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [open, taskId]);

  // Handle completion
  useEffect(() => {
    if (taskStatus?.status === 'completed') {
      // Wait a moment to show success state, then close
      const timer = setTimeout(() => {
        onComplete();
        queryClient.invalidateQueries({ queryKey: ['article'] });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [taskStatus?.status, onComplete, queryClient]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const status = taskStatus?.status || 'pending';
  const phase = phaseConfig[status];
  const PhaseIcon = phase.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            DeepSeek AI Transform
          </DialogTitle>
          <DialogDescription className="line-clamp-1">
            Re-transforming: {articleTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status indicator */}
          <div className="flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={status}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl ${phase.bgColor}`}
              >
                {status === 'pending' || status === 'thinking' || status === 'generating' ? (
                  <Loader2 className={`h-8 w-8 ${phase.color} animate-spin`} />
                ) : (
                  <PhaseIcon className={`h-8 w-8 ${phase.color}`} />
                )}
                <div>
                  <p className={`font-semibold ${phase.color}`}>{phase.label}</p>
                  <p className="text-sm text-muted-foreground">{phase.description}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{taskStatus?.progress || 0}%</span>
            </div>
            <Progress value={taskStatus?.progress || 0} className="h-2" />
          </div>

          {/* Phase steps */}
          <div className="flex justify-between px-4">
            {['pending', 'thinking', 'generating', 'completed'].map((step, index) => {
              const stepPhase = phaseConfig[step as keyof typeof phaseConfig];
              const StepIcon = stepPhase.icon;
              const isActive = status === step;
              const isPast = ['pending', 'thinking', 'generating', 'completed'].indexOf(status) > index ||
                (status === 'failed' && index < 3);

              return (
                <div key={step} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? stepPhase.bgColor
                        : isPast
                        ? 'bg-green-500/20'
                        : 'bg-muted'
                    }`}
                  >
                    {isPast && !isActive ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <StepIcon
                        className={`h-5 w-5 ${
                          isActive ? stepPhase.color : 'text-muted-foreground'
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs ${
                      isActive ? 'font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {stepPhase.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Thinking content preview (if available) */}
          {taskStatus?.thinkingContent && status === 'thinking' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                DeepSeek Reasoning:
              </p>
              <ScrollArea className="h-24 rounded-lg border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {taskStatus.thinkingContent}
                </p>
              </ScrollArea>
            </div>
          )}

          {/* Error message */}
          {status === 'failed' && taskStatus?.error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{taskStatus.error}</p>
            </div>
          )}

          {/* Elapsed time */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Elapsed time: {formatTime(elapsedTime)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          {status === 'failed' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
          {status === 'completed' && (
            <Button onClick={() => onOpenChange(false)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Done
            </Button>
          )}
          {(status === 'pending' || status === 'thinking' || status === 'generating') && (
            <Button variant="outline" disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
