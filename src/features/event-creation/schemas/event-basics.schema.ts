import { z } from "zod";

import { EVENT_CATEGORIES, EVENT_STATUSES } from "../constants";
import {
  eventLocationSchema,
  eventNotificationSchema,
  eventRecurrenceSchema,
  eventScheduleSchema,
} from "./location-schedule.schema";
import { eventAccessSchema, organizerSchema } from "./organizer-access.schema";
import { eventQuestionSchema } from "./question.schema";
import { eventSessionSchema } from "./session.schema";

const slugSchema = z
  .string()
  .trim()
  .min(1, "Enter a slug.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Use lowercase letters, numbers, and single hyphens only.",
  });

const httpUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      try {
        const url = new URL(value);

        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Enter a valid HTTP or HTTPS URL." }
  );

const optionalHttpUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (!value) {
        return true;
      }

      try {
        const url = new URL(value);

        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Enter a valid HTTP or HTTPS URL." }
  );

export const eventBasicsSchema = z.object({
  title: z.string().trim().min(1, "Enter an event title."),
  slug: slugSchema,
  category: z.enum(EVENT_CATEGORIES),
  status: z.enum(EVENT_STATUSES),
  preDescription: z.string().trim(),
  postDescription: z.object({
    message: z.string().trim(),
  }),
  termsAndConditions: z.string().trim(),
  images: z.object({
    imageLinks: z.array(httpUrlSchema),
    bannerLink: optionalHttpUrlSchema,
  }),
});

export const createEventFormSchema = eventBasicsSchema
  .extend({
    organizer: organizerSchema,
    access: eventAccessSchema,
    location: eventLocationSchema,
    schedule: eventScheduleSchema,
    recurrence: eventRecurrenceSchema,
    notification: eventNotificationSchema,
    sessions: z.array(eventSessionSchema),
    questions: z.array(eventQuestionSchema),
  })
  .superRefine((values, context) => {
    if (values.category === "announcement" && values.sessions.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sessions"],
        message: "Announcement events cannot contain sessions.",
      });
    }

    if (values.status === "draft") {
      values.sessions.forEach((session, sessionIndex) => {
        if (session.status !== "active") {
          return;
        }

        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sessions", sessionIndex, "status"],
          message: "Sessions cannot be active while the event is still a draft.",
        });
      });
    }
  });
