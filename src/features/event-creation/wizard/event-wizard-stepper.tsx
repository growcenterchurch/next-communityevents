import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import type { VisibleWizardStep, WizardStepId } from "./event-wizard.config";

type EventWizardStepperProps = {
  steps: readonly VisibleWizardStep[];
  currentStepId: WizardStepId;
  reachedStepIds: ReadonlySet<WizardStepId>;
  onStepSelect: (stepId: WizardStepId) => void;
};

export function EventWizardStepper({
  steps,
  currentStepId,
  reachedStepIds,
  onStepSelect,
}: EventWizardStepperProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStepId);

  return (
    <nav aria-label="Event creation progress" className="w-full">
      <ol className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-6 md:overflow-visible md:pb-0">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          const isCompleted = currentStepIndex > index;
          const isReachable = reachedStepIds.has(step.id);
          const statusLabel = isCurrent
            ? "Current step"
            : isCompleted
              ? "Completed"
              : isReachable
                ? "Available"
                : "Upcoming";

          return (
            <li key={step.id} className="min-w-52 flex-1 md:min-w-0">
              <button
                type="button"
                aria-current={isCurrent ? "step" : undefined}
                aria-disabled={!isReachable}
                disabled={!isReachable}
                onClick={() => onStepSelect(step.id)}
                className={cn(
                  "flex h-full w-full items-start gap-3 rounded-lg border bg-background p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isCurrent && "border-primary bg-primary/5",
                  isCompleted && "border-primary/40",
                  !isReachable && "cursor-not-allowed opacity-60"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    !isCurrent && !isCompleted && "border-muted-foreground/30"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="space-y-1">
                  <span className="block text-sm font-medium leading-tight">
                    {step.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {statusLabel}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
