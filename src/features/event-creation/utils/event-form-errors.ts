import type { FieldErrors, FieldPath } from "react-hook-form";

import type { CreateEventFormValues } from "../types";
import type { WizardStepId } from "../wizard/event-wizard.config";

export function getWizardStepForFieldPath(path: string): WizardStepId {
  if (path.startsWith("sessions.") && path.includes(".questions")) {
    return "dynamic-forms";
  }

  if (path === "questions" || path.startsWith("questions.")) {
    return "dynamic-forms";
  }

  if (path === "sessions" || path.startsWith("sessions.")) {
    return "sessions";
  }

  if (
    path === "location" ||
    path.startsWith("location.") ||
    path === "schedule" ||
    path.startsWith("schedule.") ||
    path === "recurrence" ||
    path.startsWith("recurrence.") ||
    path === "notification" ||
    path.startsWith("notification.")
  ) {
    return "location-schedule";
  }

  if (
    path === "organizer" ||
    path.startsWith("organizer.") ||
    path === "access" ||
    path.startsWith("access.")
  ) {
    return "organizer-access";
  }

  return "basics";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function getFirstErrorPath(
  errors: FieldErrors<CreateEventFormValues>
): FieldPath<CreateEventFormValues> | null {
  function visit(value: unknown, segments: string[]): string | null {
    if (!isObject(value)) {
      return null;
    }

    if (typeof value.message === "string") {
      return segments.join(".");
    }

    for (const [key, child] of Object.entries(value)) {
      if (key === "ref" || key === "type" || key === "message") {
        continue;
      }

      const childPath = visit(child, [...segments, key]);

      if (childPath) {
        return childPath;
      }
    }

    return null;
  }

  return visit(errors, []) as FieldPath<CreateEventFormValues> | null;
}
