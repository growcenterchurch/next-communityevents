export const EVENT_CATEGORIES = [
  "registration",
  "internal-attendance",
  "announcement",
  "external-attendance",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_STATUSES = ["draft", "active", "inactive"] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_ACCESS_LEVELS = ["public", "private"] as const;

export type EventAccessLevel = (typeof EVENT_ACCESS_LEVELS)[number];

export const EVENT_LOCATION_TYPES = ["online", "offline", "hybrid"] as const;

export type EventLocationType = (typeof EVENT_LOCATION_TYPES)[number];

export const EVENT_LOCATION_VISIBILITIES = [
  "pre-registration",
  "post-registration",
  "all",
] as const;

export type EventLocationVisibility =
  (typeof EVENT_LOCATION_VISIBILITIES)[number];

export const SESSION_TYPES = [
  "service",
  "class",
  "track",
  "breakout",
  "workshop",
  "kids",
  "youth",
  "teen",
  "adult",
] as const;

export type SessionType = (typeof SESSION_TYPES)[number];

export const SESSION_REGISTRATION_MODES = [
  "self_only",
  "self_and_registered",
  "self_and_others",
] as const;

export type SessionRegistrationMode =
  (typeof SESSION_REGISTRATION_MODES)[number];

// TODO: Confirm API contract before adding event-qr; another backend validation note references it.
export const SESSION_REGISTRATION_METHODS = [
  "personal-qr",
  "session-qr",
  "registration-qr",
] as const;

export type SessionRegistrationMethod =
  (typeof SESSION_REGISTRATION_METHODS)[number];

export const QUESTION_TYPES = [
  "short_text",
  "long_text",
  "single_choice",
  "multiple_choice",
  "email",
  "phone",
  "number",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_AUDIENCES = ["parent", "child"] as const;

export type QuestionAudience = (typeof QUESTION_AUDIENCES)[number];

export const NOTIFICATION_CHANNELS = ["email", "whatsapp"] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const DEFAULT_EVENT_TIMEZONE = "Asia/Jakarta";

export const EVENT_TIMEZONES = [DEFAULT_EVENT_TIMEZONE] as const;

export type EventTimezone = (typeof EVENT_TIMEZONES)[number];

export const REMINDER_INTERVALS = ["24h", "1h"] as const;

export type ReminderInterval = (typeof REMINDER_INTERVALS)[number];

export const DEFAULT_EVENT_CTA = {
  text: "Register Here!",
  link: "NORMAL_FLOW",
} as const;
