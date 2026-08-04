import { z } from "zod";

import {
  DEFAULT_EVENT_CTA,
  EVENT_LOCATION_VISIBILITIES,
  EVENT_TIMEZONES,
  NOTIFICATION_CHANNELS,
  REMINDER_INTERVALS,
} from "../constants";
import { isValidDate } from "../utils/event-date-time";

const nonEmptyTrimmedString = (message: string) =>
  z.string().trim().min(1, message);

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

const clickToActionSchema = z.object({
  text: nonEmptyTrimmedString("Enter action button text."),
  link: z
    .string()
    .trim()
    .min(1, "Enter an action value.")
    .refine((value) => value === DEFAULT_EVENT_CTA.link || value.length > 0, {
      message: "Enter an action value.",
    }),
});

const locationBaseSchema = {
  locationVisibility: z.enum(EVENT_LOCATION_VISIBILITIES),
  clickToAction: clickToActionSchema,
};

const onlineLocationSchema = z
  .object({
    ...locationBaseSchema,
    locationType: z.literal("online"),
    virtualLink: httpUrlSchema,
    virtualPlatform: nonEmptyTrimmedString("Enter a virtual platform."),
  })
  .strict();

const offlineLocationSchema = z
  .object({
    ...locationBaseSchema,
    locationType: z.literal("offline"),
    physicalPlaceName: z.string().trim(),
    physicalAddress: nonEmptyTrimmedString("Enter a physical address."),
  })
  .strict();

const hybridLocationSchema = z
  .object({
    ...locationBaseSchema,
    locationType: z.literal("hybrid"),
    physicalPlaceName: z.string().trim(),
    physicalAddress: nonEmptyTrimmedString("Enter a physical address."),
    virtualLink: httpUrlSchema,
    virtualPlatform: nonEmptyTrimmedString("Enter a virtual platform."),
  })
  .strict();

const dateFieldSchema = z.custom<Date | null>((value) => isValidDate(value), {
  message: "Select a date and time.",
});

export const eventLocationSchema = z.discriminatedUnion("locationType", [
  onlineLocationSchema,
  offlineLocationSchema,
  hybridLocationSchema,
]);

export const eventScheduleSchema = z
  .object({
    startAt: dateFieldSchema,
    endAt: dateFieldSchema,
    timezone: z.enum(EVENT_TIMEZONES),
  })
  .superRefine((values, context) => {
    if (!isValidDate(values.startAt) || !isValidDate(values.endAt)) {
      return;
    }

    if (values.endAt <= values.startAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endAt"],
        message: "End time must be after the start time.",
      });
    }
  });

export const eventRecurrenceSchema = z.object({
  isRecurring: z.boolean(),
});

export const eventNotificationSchema = z
  .object({
    notificationChannels: z.array(z.enum(NOTIFICATION_CHANNELS)),
    reminderConfig: z.object({
      enabled: z.boolean(),
      intervals: z.array(z.enum(REMINDER_INTERVALS)),
    }),
  })
  .superRefine((values, context) => {
    if (
      values.reminderConfig.enabled &&
      values.reminderConfig.intervals.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reminderConfig", "intervals"],
        message: "Select at least one reminder interval.",
      });
    }
  });
