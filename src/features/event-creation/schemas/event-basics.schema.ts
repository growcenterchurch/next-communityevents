import { z } from "zod";

import { EVENT_CATEGORIES, EVENT_STATUSES } from "../constants";

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
    organizer: z.unknown(),
    access: z.unknown(),
    location: z.unknown(),
    schedule: z.unknown(),
    recurrence: z.unknown(),
    notification: z.unknown(),
    sessions: z.array(z.unknown()),
    questions: z.array(z.unknown()),
  })
  .superRefine((values, context) => {
    if (values.category === "announcement" && values.sessions.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sessions"],
        message: "Announcement events cannot contain sessions.",
      });
    }
  });
