import { DEFAULT_EVENT_CTA, DEFAULT_EVENT_TIMEZONE } from "./constants";
import type {
  CreateEventFormValues,
  EventQuestionFormValue,
  EventScheduleFormValue,
  EventSessionFormValue,
} from "./types";

const createClientId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `client-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const createDefaultSchedule = (): EventScheduleFormValue => ({
  startAt: null,
  endAt: null,
  timezone: DEFAULT_EVENT_TIMEZONE,
});

const createDefaultClickToAction = () => ({
  text: DEFAULT_EVENT_CTA.text,
  link: DEFAULT_EVENT_CTA.link,
});

export const createDefaultQuestion = (): EventQuestionFormValue => ({
  clientId: createClientId(),
  text: "",
  type: "short_text",
  requiredFor: [],
  visibleFor: ["parent"],
  choices: [],
  minValue: undefined,
  maxValue: undefined,
});

export const createDefaultSession = (): EventSessionFormValue => ({
  clientId: createClientId(),
  title: "",
  description: "",
  sessionType: "service",
  status: "draft",
  useEventLocation: true,
  schedule: createDefaultSchedule(),
  sessionCapacity: {
    capacity: null,
    waitlistEnabled: false,
    waitlistCapacity: 0,
  },
  sessionRules: {
    requireApproval: false,
    registrationMethods: ["registration-qr"],
    registrationMode: "self_and_others",
    maxRegistrationsPerUser: 5,
    oneSessionPerEvent: false,
  },
  questions: [],
});

export const createDefaultEventFormValues = (): CreateEventFormValues => ({
  title: "",
  slug: "",
  category: "registration",
  status: "draft",
  preDescription: "",
  postDescription: {
    message: "",
  },
  termsAndConditions: "",
  images: {
    imageLinks: [],
    bannerLink: "",
  },
  organizer: {
    organizers: [],
    contacts: [],
  },
  access: {
    accessLevel: "public",
  },
  location: {
    locationType: "offline",
    locationVisibility: "all",
    physicalPlaceName: "",
    physicalAddress: "",
    clickToAction: createDefaultClickToAction(),
  },
  schedule: createDefaultSchedule(),
  recurrence: {
    isRecurring: false,
  },
  notification: {
    notificationChannels: [],
    reminderConfig: {
      enabled: false,
      intervals: [],
    },
  },
  sessions: [],
  questions: [],
});

// Components that need resettable fresh form state should call createDefaultEventFormValues() instead of mutating or reusing this constant.
export const createEventDefaultValues = createDefaultEventFormValues();
