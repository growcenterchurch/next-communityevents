import { Button } from "@/components/ui/button";

type EventWizardNavigationProps = {
  isFirstStep: boolean;
  isLastStep: boolean;
  isProcessing?: boolean;
  onBack: () => void;
  onNext: () => void;
};

export function EventWizardNavigation({
  isFirstStep,
  isLastStep,
  isProcessing = false,
  onBack,
  onNext,
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
      <Button type="button" disabled={isProcessing} onClick={onNext}>
        {isLastStep ? "Submit Event" : "Next"}
      </Button>
    </div>
  );
}
