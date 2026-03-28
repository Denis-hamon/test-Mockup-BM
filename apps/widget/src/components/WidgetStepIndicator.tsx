/**
 * WidgetStepIndicator -- Horizontal dots showing current step position.
 * Not clickable (linear flow per UI-SPEC).
 */

interface WidgetStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function WidgetStepIndicator({
  currentStep,
  totalSteps,
}: WidgetStepIndicatorProps) {
  return (
    <div className="lc-step-indicator">
      <span className="lc-step-label">
        Etape {currentStep + 1}/{totalSteps}
      </span>
      <div className="lc-step-dots" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
        {Array.from({ length: totalSteps }, (_, i) => {
          let dotClass = "lc-step-dot";
          if (i < currentStep) {
            dotClass += " lc-step-dot--filled";
          } else if (i === currentStep) {
            dotClass += " lc-step-dot--current";
          }
          return <span key={i} className={dotClass} />;
        })}
      </div>
    </div>
  );
}
