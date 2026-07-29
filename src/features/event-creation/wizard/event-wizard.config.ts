import type { FieldPath } from "react-hook-form";

import type { CreateEventFormValues } from "../types";

export type EventWizardStepConfig = {
  id: string;
  label: string;
  description?: string;
  fields: readonly FieldPath<CreateEventFormValues>[];
  isVisible?: (values: CreateEventFormValues) => boolean;
};

export const EVENT_WIZARD_STEPS = [
  {
    id: "basics",
    label: "Event Basics",
    description: "Configure the foundation for the event.",
    fields: [
      "title",
      "slug",
      "category",
      "status",
      "preDescription",
      "postDescription",
      "termsAndConditions",
      "images",
    ],
  },
  {
    id: "organizer-access",
    label: "Organizer & Access",
    description: "Set organizers, contacts, and access rules.",
    fields: ["organizer", "access"],
  },
  {
    id: "location-schedule",
    label: "Location & Schedule",
    description: "Set location, timing, recurrence, and notifications.",
    fields: ["location", "schedule", "recurrence", "notification"],
  },
  {
    id: "sessions",
    label: "Sessions",
    description: "Configure services, classes, tracks, and workshops.",
    fields: ["sessions"],
    isVisible: (values) => values.category !== "announcement",
  },
  {
    id: "dynamic-forms",
    label: "Dynamic Forms",
    description: "Build event and session registration questions.",
    fields: ["questions", "sessions"],
  },
  {
    id: "review",
    label: "Review & Submit",
    description: "Review the full event before submission.",
    fields: [],
  },
] as const satisfies readonly EventWizardStepConfig[];

export type WizardStepId = (typeof EVENT_WIZARD_STEPS)[number]["id"];

export type VisibleWizardStep = (typeof EVENT_WIZARD_STEPS)[number];

export function getVisibleEventWizardSteps(values: CreateEventFormValues) {
  return EVENT_WIZARD_STEPS.filter(
    (step) => !("isVisible" in step) || step.isVisible(values)
  );
}
