import { z } from "zod";

import {
  EVENT_STATUSES,
  SESSION_REGISTRATION_METHODS,
  SESSION_REGISTRATION_MODES,
  SESSION_TYPES,
} from "../constants";
import { eventLocationSchema, eventScheduleSchema } from "./location-schedule.schema";
import { eventQuestionSchema } from "./question.schema";

const positiveIntegerSchema = z.coerce
  .number()
  .int("Enter a whole number.")
  .positive("Enter a positive number.");

const nonNegativeIntegerSchema = z.coerce
  .number()
  .int("Enter a whole number.")
  .min(0, "Enter zero or a positive number.");

export const eventSessionSchema = z
  .object({
    clientId: z.string().min(1),
    title: z.string().trim().min(1, "Enter a session title."),
    description: z.string().trim(),
    sessionType: z.enum(SESSION_TYPES),
    status: z.enum(EVENT_STATUSES),
    useEventLocation: z.boolean(),
    location: eventLocationSchema.optional(),
    schedule: eventScheduleSchema,
    sessionCapacity: z.object({
      capacity: z.union([positiveIntegerSchema, z.null()]),
      waitlistEnabled: z.boolean(),
      waitlistCapacity: nonNegativeIntegerSchema,
    }),
    sessionRules: z.object({
      requireApproval: z.boolean(),
      registrationMethods: z
        .array(z.enum(SESSION_REGISTRATION_METHODS))
        .min(1, "Select at least one registration method."),
      registrationMode: z.enum(SESSION_REGISTRATION_MODES),
      maxRegistrationsPerUser: positiveIntegerSchema,
      oneSessionPerEvent: z.boolean(),
    }),
    questions: z.array(eventQuestionSchema),
  })
  .superRefine((values, context) => {
    if (!values.useEventLocation && !values.location) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location"],
        message: "Configure a session location or use the event location.",
      });
    }

    if (values.sessionCapacity.capacity === null) {
      if (values.sessionCapacity.waitlistEnabled) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sessionCapacity", "waitlistEnabled"],
          message: "Waitlist requires a limited capacity.",
        });
      }

      if (values.sessionCapacity.waitlistCapacity !== 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sessionCapacity", "waitlistCapacity"],
          message: "Clear waitlist capacity when capacity is unlimited.",
        });
      }
    }

    if (
      !values.sessionCapacity.waitlistEnabled &&
      values.sessionCapacity.waitlistCapacity !== 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sessionCapacity", "waitlistCapacity"],
        message: "Clear waitlist capacity when waitlist is disabled.",
      });
    }

    if (
      values.sessionCapacity.waitlistEnabled &&
      values.sessionCapacity.waitlistCapacity <= 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sessionCapacity", "waitlistCapacity"],
        message: "Enter a positive waitlist capacity.",
      });
    }

    if (
      values.sessionCapacity.waitlistEnabled &&
      values.sessionRules.registrationMethods.includes("personal-qr")
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sessionRules", "registrationMethods"],
        message: "Personal QR registration cannot use waitlists.",
      });
    }

    if (
      values.sessionRules.registrationMode === "self_only" &&
      values.sessionRules.maxRegistrationsPerUser !== 1
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sessionRules", "maxRegistrationsPerUser"],
        message: "Self only registration allows one registration per user.",
      });
    }
  });
