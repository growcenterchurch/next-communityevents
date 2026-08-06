import { Button } from "@/components/ui/button";

type EventWizardNavigationProps = {
  isFirstStep: boolean;
  isLastStep: boolean;
  isProcessing?: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
};

export function EventWizardNavigation({
  isFirstStep,
  isLastStep,
  isProcessing = false,
  onBack,
  onNext,
  onSubmit,
}: EventWizardNavigationProps) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
      <Button
        type="button"
        variant="outline"
        disabled={isFirstStep || isProcessing}
        onClick={onBack}
        className={isFirstStep ? "invisible" : undefined}
      >
        Back
      </Button>
      <Button
        type="button"
        disabled={isProcessing}
        onClick={isLastStep ? onSubmit : onNext}
        aria-busy={isLastStep && isProcessing}
      >
        {isLastStep
          ? isProcessing
            ? "Creating Event..."
            : "Create Event"
          : "Next"}
      </Button>
    </div>
  );
}
