import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Target, AlertTriangle, Check, X, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RelevanceScoreBadgeProps {
  score?: number | null;
  reason?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function RelevanceScoreBadge({
  score,
  reason,
  size = "md",
  showLabel = false,
  className,
}: RelevanceScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground",
                size === "sm" && "text-xs px-1.5",
                size === "lg" && "text-base px-3 py-1",
                className
              )}
            >
              <HelpCircle className={cn("h-3 w-3", size === "lg" && "h-4 w-4")} />
              {showLabel && <span>Non évalué</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Score de pertinence non calculé</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const getScoreConfig = (score: number) => {
    if (score >= 80) {
      return {
        color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        icon: Check,
        label: "Très pertinent",
        recommendation: "keep",
      };
    }
    if (score >= 60) {
      return {
        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        icon: Target,
        label: "Pertinent",
        recommendation: "keep",
      };
    }
    if (score >= 40) {
      return {
        color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
        icon: AlertTriangle,
        label: "À revoir",
        recommendation: "review",
      };
    }
    return {
      color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      icon: X,
      label: "Peu pertinent",
      recommendation: "delete",
    };
  };

  const config = getScoreConfig(score);
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-medium",
              config.color,
              size === "sm" && "text-xs px-1.5",
              size === "lg" && "text-base px-3 py-1",
              className
            )}
          >
            <Icon className={cn("h-3 w-3", size === "lg" && "h-4 w-4")} />
            <span>{score}%</span>
            {showLabel && <span className="text-xs opacity-75">{config.label}</span>}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{config.label} ({score}%)</p>
            {reason && (
              <p className="text-xs text-muted-foreground">{reason}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Circular progress variant
interface RelevanceScoreCircleProps {
  score?: number | null;
  size?: number;
  className?: string;
}

export function RelevanceScoreCircle({
  score,
  size = 40,
  className,
}: RelevanceScoreCircleProps) {
  if (score === null || score === undefined) {
    return (
      <div
        className={cn("flex items-center justify-center rounded-full bg-muted", className)}
        style={{ width: size, height: size }}
      >
        <HelpCircle className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  const getColor = (score: number) => {
    if (score >= 80) return "#22c55e"; // green
    if (score >= 60) return "#3b82f6"; // blue
    if (score >= 40) return "#eab308"; // yellow
    return "#ef4444"; // red
  };

  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={getColor(score)}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <span className="absolute text-xs font-bold">{score}</span>
    </div>
  );
}
