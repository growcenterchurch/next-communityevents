"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";

import { DynamicFormsStep } from "../steps/dynamic-forms-step";
import { EventBasicsStep } from "../steps/event-basics-step";
import { LocationScheduleStep } from "../steps/location-schedule-step";
import { OrganizerAccessStep } from "../steps/organizer-access-step";
import { ReviewStep } from "../steps/review-step";
import { SessionsStep } from "../steps/sessions-step";
import { createDefaultEventFormValues } from "../defaults";
import { createEventFormSchema } from "../schemas/event-basics.schema";
import type { CreateEventFormValues } from "../types";
import { EventWizardNavigation } from "./event-wizard-navigation";
import { EventWizardStepper } from "./event-wizard-stepper";
import {
  EVENT_WIZARD_STEPS,
  getVisibleEventWizardSteps,
  type WizardStepId,
} from "./event-wizard.config";

const STEP_COMPONENTS = {
  basics: EventBasicsStep,
  "organizer-access": OrganizerAccessStep,
  "location-schedule": LocationScheduleStep,
  sessions: SessionsStep,
  "dynamic-forms": DynamicFormsStep,
  review: ReviewStep,
} satisfies Record<WizardStepId, ComponentType>;

const FIRST_STEP_ID = EVENT_WIZARD_STEPS[0].id;

export function EventCreationWizard() {
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
  const ActiveStep = currentStep ? STEP_COMPONENTS[currentStep.id] : null;

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

    if (isLastStep) {
      if (process.env.NODE_ENV === "development") {
        console.info("Event creation submit placeholder", methods.getValues());
      }
      return;
    }

    const nextStep = visibleSteps[currentStepIndex + 1];

    setCurrentStepId(nextStep.id);
    setReachedStepIds((previous) => new Set(previous).add(nextStep.id));
  }

  function goToStep(stepId: WizardStepId) {
    const isVisible = visibleSteps.some((step) => step.id === stepId);

    if (!isVisible || !reachedStepIds.has(stepId)) {
      return;
    }

    setCurrentStepId(stepId);
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={(event) => event.preventDefault()}
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8"
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
          onStepSelect={goToStep}
        />

        <section aria-live="polite">{ActiveStep ? <ActiveStep /> : null}</section>

        <EventWizardNavigation
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          onBack={goBack}
          onNext={goNext}
        />
      </form>
    </FormProvider>
  );
}
