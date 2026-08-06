"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { Resolver } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { mutate as globalMutate } from "swr";
import useSWRMutation from "swr/mutation";

import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/use-toast";

import {
  CREATE_EVENT_ENDPOINT,
  CreateEventApiError,
  createEvent,
  getCreatedEventCode,
} from "../api/create-event";
import { DynamicFormsStep } from "../steps/dynamic-forms-step";
import { EventBasicsStep } from "../steps/event-basics-step";
import { LocationScheduleStep } from "../steps/location-schedule-step";
import { OrganizerAccessStep } from "../steps/organizer-access-step";
import { ReviewStep } from "../steps/review-step";
import { SessionsStep } from "../steps/sessions-step";
import { createDefaultEventFormValues } from "../defaults";
import { toCreateEventPayload } from "../mappers/create-event-payload.mapper";
import { createEventFormSchema } from "../schemas/event-basics.schema";
import type { CreateEventFormValues } from "../types";
import {
  getFirstErrorPath,
  getWizardStepForFieldPath,
} from "../utils/event-form-errors";
import { EventWizardNavigation } from "./event-wizard-navigation";
import { EventWizardStepper } from "./event-wizard-stepper";
import {
  EVENT_WIZARD_STEPS,
  getVisibleEventWizardSteps,
  type WizardStepId,
} from "./event-wizard.config";

const FIRST_STEP_ID = EVENT_WIZARD_STEPS[0].id;

function normalizeServerFieldPath(path: string) {
  return path.replace(/\[(\d+)\]/g, ".$1") as keyof CreateEventFormValues &
    string;
}

export function EventCreationWizard() {
  const router = useRouter();
  const { getValidAccessToken, handleExpiredToken } = useAuth();
  const { toast } = useToast();
  const methods = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventFormSchema) as Resolver<CreateEventFormValues>,
    defaultValues: createDefaultEventFormValues(),
    mode: "onBlur",
    shouldUnregister: false,
  });
  const category = methods.watch("category");
  const [currentStepId, setCurrentStepId] =
    useState<WizardStepId>(FIRST_STEP_ID);
  const [reachedStepIds, setReachedStepIds] = useState<Set<WizardStepId>>(
    () => new Set([FIRST_STEP_ID])
  );

  const visibleSteps = useMemo(
    () => getVisibleEventWizardSteps({ ...methods.getValues(), category }),
    [category, methods]
  );
  const currentStepIndex = visibleSteps.findIndex(
    (step) => step.id === currentStepId
  );
  const currentStep = visibleSteps[currentStepIndex];
  const isFirstStep = currentStepIndex <= 0;
  const isLastStep = currentStepIndex === visibleSteps.length - 1;
  const { trigger: createEventRequest, isMutating } = useSWRMutation(
    CREATE_EVENT_ENDPOINT,
    createEvent
  );

  useEffect(() => {
    if (visibleSteps.some((step) => step.id === currentStepId)) {
      return;
    }

    const dynamicFormsStep = visibleSteps.find(
      (step) => step.id === "dynamic-forms"
    );
    const hiddenStepIndex = EVENT_WIZARD_STEPS.findIndex(
      (step) => step.id === currentStepId
    );
    const previousVisibleStep = [...visibleSteps]
      .reverse()
      .find(
        (step) =>
          EVENT_WIZARD_STEPS.findIndex((wizardStep) => wizardStep.id === step.id) <
          hiddenStepIndex
      );
    const fallbackStep = dynamicFormsStep ?? previousVisibleStep ?? visibleSteps[0];

    if (!fallbackStep) {
      return;
    }

    setCurrentStepId(fallbackStep.id);
    setReachedStepIds((previous) => new Set(previous).add(fallbackStep.id));
  }, [currentStepId, visibleSteps]);

  function goBack() {
    if (currentStepIndex <= 0) {
      return;
    }

    setCurrentStepId(visibleSteps[currentStepIndex - 1].id);
  }

  async function goNext() {
    if (!currentStep) {
      return;
    }

    const isCurrentStepValid = await methods.trigger(currentStep.fields, {
      shouldFocus: true,
    });

    if (!isCurrentStepValid) {
      return;
    }

    const nextStep = visibleSteps[currentStepIndex + 1];

    setCurrentStepId(nextStep.id);
    setReachedStepIds((previous) => new Set(previous).add(nextStep.id));
  }

  function goToStep(stepId: WizardStepId, requireReached = true) {
    const isVisible = visibleSteps.some((step) => step.id === stepId);

    if (!isVisible || (requireReached && !reachedStepIds.has(stepId))) {
      return;
    }

    setCurrentStepId(stepId);
    setReachedStepIds((previous) => new Set(previous).add(stepId));
  }

  function navigateToFieldError(path: string) {
    const stepId = getWizardStepForFieldPath(path);
    goToStep(stepId, false);
    window.setTimeout(() => {
      methods.setFocus(path as Parameters<typeof methods.setFocus>[0]);
    }, 0);
  }

  function handleInvalidSubmit() {
    const firstErrorPath = getFirstErrorPath(methods.formState.errors);

    if (firstErrorPath) {
      navigateToFieldError(firstErrorPath);
    }

    toast({
      variant: "destructive",
      title: "Review required fields",
      description: "The event could not be created. Review the highlighted fields and try again.",
    });
  }

  async function handleValidSubmit(values: CreateEventFormValues) {
    if (isMutating) {
      return;
    }

    const accessToken = await getValidAccessToken();

    if (!accessToken) {
      handleExpiredToken();
      return;
    }

    try {
      const response = await createEventRequest({
        accessToken,
        payload: toCreateEventPayload(values),
      });
      const eventCode = getCreatedEventCode(response);

      await globalMutate(
        (key) =>
          typeof key === "string" &&
          (key.includes("/api/v2/internal/events") ||
            key.includes("/api/v2/events")),
        undefined,
        { revalidate: true }
      );

      toast({
        className: "bg-green-500 text-white border-green-500 hover:bg-green-600",
        title: "Event created successfully.",
      });

      router.push(eventCode ? `/events/${eventCode}` : "/dashboard");
    } catch (error) {
      if (error instanceof CreateEventApiError) {
        if (error.status === 401 || error.status === 403) {
          handleExpiredToken();
          return;
        }

        const fieldErrors =
          error.status === 409 && error.fieldErrors.length === 0
            ? [{ path: "slug", message: error.message || "This event slug is already in use." }]
            : error.fieldErrors;

        fieldErrors.forEach((fieldError) => {
          const path = normalizeServerFieldPath(fieldError.path);
          methods.setError(path as Parameters<typeof methods.setError>[0], {
            type: "server",
            message: fieldError.message,
          });
        });

        const firstFieldError = fieldErrors[0];

        if (firstFieldError) {
          navigateToFieldError(normalizeServerFieldPath(firstFieldError.path));
        }

        toast({
          variant: "destructive",
          title: "Unable to create the event",
          description:
            fieldErrors.length > 0
              ? "Review the highlighted fields and try again."
              : error.message,
        });
        return;
      }

      toast({
        variant: "destructive",
        title: "Unable to create the event",
        description: "Unexpected server error. Please try again.",
      });
    }
  }

  function submitCurrentEvent() {
    void methods.handleSubmit(handleValidSubmit, handleInvalidSubmit)();
  }

  function renderCurrentStep() {
    if (!currentStep) {
      return null;
    }

    if (currentStep.id === "review") {
      return <ReviewStep onEditStep={(stepId) => goToStep(stepId, false)} />;
    }

    if (currentStep.id === "basics") {
      return <EventBasicsStep />;
    }

    if (currentStep.id === "organizer-access") {
      return <OrganizerAccessStep />;
    }

    if (currentStep.id === "location-schedule") {
      return <LocationScheduleStep />;
    }

    if (currentStep.id === "sessions") {
      return <SessionsStep />;
    }

    return <DynamicFormsStep />;
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={(event) => event.preventDefault()}
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8"
        aria-busy={isMutating}
      >
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">Event Creation</p>
          <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
          <p className="max-w-3xl text-muted-foreground">
            Configure the event, sessions, registration forms, and access
            settings.
          </p>
        </header>

        <EventWizardStepper
          steps={visibleSteps}
          currentStepId={currentStepId}
          reachedStepIds={reachedStepIds}
          onStepSelect={(stepId) => goToStep(stepId)}
        />

        <section aria-live="polite">{renderCurrentStep()}</section>

        <EventWizardNavigation
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          isProcessing={isMutating}
          onBack={goBack}
          onNext={goNext}
          onSubmit={submitCurrentEvent}
        />
      </form>
    </FormProvider>
  );
}
