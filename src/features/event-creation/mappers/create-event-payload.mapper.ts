import { TZDate } from "@date-fns/tz";

import type {
  EventAccessLevel,
  EventCategory,
  EventLocationType,
  EventLocationVisibility,
  EventStatus,
  NotificationChannel,
  QuestionAudience,
  QuestionType,
  SessionRegistrationMethod,
  SessionRegistrationMode,
  SessionType,
} from "../constants";
import type {
  CreateEventFormValues,
  EventLocationFormValue,
  EventQuestionFormValue,
  EventScheduleFormValue,
  EventSessionFormValue,
} from "../types";

type EventClickToActionPayload = {
  text: string;
  link: string;
};

export type EventAccessPayload =
  | {
      accessLevel: Extract<EventAccessLevel, "public">;
    }
  | {
      accessLevel: Extract<EventAccessLevel, "private">;
      allowedUserTypes: string[];
      allowedRoles: string[];
      allowedCampuses: string[];
      allowedCommunityIds: string[];
    };

export type EventLocationPayload =
  | {
      locationType: Extract<EventLocationType, "online">;
      locationVisibility: EventLocationVisibility;
      virtualLink: string;
      virtualPlatform: string;
      clickToAction: EventClickToActionPayload;
    }
  | {
      locationType: Extract<EventLocationType, "offline">;
      locationVisibility: EventLocationVisibility;
      physicalPlaceName?: string;
      physicalAddress: string;
      clickToAction: EventClickToActionPayload;
    }
  | {
      locationType: Extract<EventLocationType, "hybrid">;
      locationVisibility: EventLocationVisibility;
      physicalPlaceName?: string;
      physicalAddress: string;
      virtualLink: string;
      virtualPlatform: string;
      clickToAction: EventClickToActionPayload;
    };

export type EventSchedulePayload = {
  startAt: string;
  endAt: string;
  timezone: string;
};

export type FormQuestionPayload = {
  text: string;
  type: QuestionType;
  requiredFor: QuestionAudience[];
  visibleFor: QuestionAudience[];
  displayOrder: number;
  options?: {
    choices: string[];
  };
  rules?: {
    minValue?: number;
    maxValue?: number;
  };
};

export type CreateEventSessionPayload = {
  title: string;
  description?: string;
  sessionType: SessionType;
  status: EventStatus;
  schedule: EventSchedulePayload;
  location?: EventLocationPayload;
  sessionCapacity: {
    capacity: number | null;
    waitlistEnabled: boolean;
    waitlistCapacity: number;
  };
  sessionRules: {
    requireApproval: boolean;
    registrationMethods: SessionRegistrationMethod[];
    registrationMode: SessionRegistrationMode;
    maxRegistrationsPerUser: number;
    oneSessionPerEvent: boolean;
  };
  questions?: FormQuestionPayload[];
};

export type CreateEventPayload = {
  title: string;
  slug?: string;
  preDescription?: string;
  postDescription?: {
    message: string;
  };
  termsAndConditions?: string;
  category: EventCategory;
  status: EventStatus;
  images?: {
    imageLinks: string[];
    bannerLink?: string;
  };
  organizer: {
    organizerCommunityIds: string[];
    contactCommunityIds: string[];
  };
  access: EventAccessPayload;
  location: EventLocationPayload;
  schedule: EventSchedulePayload;
  recurrence: {
    isRecurring: boolean;
  };
  notification: {
    notificationChannels: NotificationChannel[];
    reminderConfig?: {
      enabled: boolean;
      intervals: string[];
    };
  };
  sessions?: CreateEventSessionPayload[];
  questions?: FormQuestionPayload[];
};

function optionalTrimmed(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue || undefined;
}

function mapClickToAction(location: EventLocationFormValue) {
  return {
    text: location.clickToAction.text.trim(),
    link: location.clickToAction.link.trim(),
  };
}

export function serializeScheduleDate(date: Date, timezone: string) {
  // React DatePicker stores the chosen wall-clock fields in a Date using the
  // browser timezone. Rebuilding those fields as a TZDate preserves the
  // operator's selected local time in the event timezone before UTC transport.
  return new TZDate(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
    timezone
  ).toISOString();
}

function mapSchedule(schedule: EventScheduleFormValue): EventSchedulePayload {
  if (!schedule.startAt || !schedule.endAt) {
    throw new Error("Schedule dates must be valid before creating payload.");
  }

  return {
    startAt: serializeScheduleDate(schedule.startAt, schedule.timezone),
    endAt: serializeScheduleDate(schedule.endAt, schedule.timezone),
    timezone: schedule.timezone,
  };
}

function mapLocation(location: EventLocationFormValue): EventLocationPayload {
  const commonValues = {
    locationVisibility: location.locationVisibility,
    clickToAction: mapClickToAction(location),
  };

  if (location.locationType === "online") {
    return {
      ...commonValues,
      locationType: "online",
      virtualLink: location.virtualLink.trim(),
      virtualPlatform: location.virtualPlatform.trim(),
    };
  }

  if (location.locationType === "offline") {
    return {
      ...commonValues,
      locationType: "offline",
      physicalPlaceName: optionalTrimmed(location.physicalPlaceName),
      physicalAddress: location.physicalAddress.trim(),
    };
  }

  return {
    ...commonValues,
    locationType: "hybrid",
    physicalPlaceName: optionalTrimmed(location.physicalPlaceName),
    physicalAddress: location.physicalAddress.trim(),
    virtualLink: location.virtualLink.trim(),
    virtualPlatform: location.virtualPlatform.trim(),
  };
}

function mapAccess(values: CreateEventFormValues): EventAccessPayload {
  if (values.access.accessLevel === "public") {
    return { accessLevel: "public" };
  }

  return {
    accessLevel: "private",
    allowedUserTypes: [...values.access.allowedUserTypes],
    allowedRoles: [...values.access.allowedRoles],
    allowedCampuses: [...values.access.allowedCampuses],
    allowedCommunityIds: values.access.allowedCommunities.map(
      (community) => community.id
    ),
  };
}

function isChoiceQuestion(type: QuestionType) {
  return type === "single_choice" || type === "multiple_choice";
}

export function mapQuestions(
  questions: EventQuestionFormValue[]
): FormQuestionPayload[] {
  return questions.map((question, index) => {
    const payload: FormQuestionPayload = {
      text: question.text.trim(),
      type: question.type,
      requiredFor: [...question.requiredFor],
      visibleFor: [...question.visibleFor],
      displayOrder: index + 1,
    };

    if (isChoiceQuestion(question.type)) {
      payload.options = {
        choices: question.choices.map((choice) => choice.trim()).filter(Boolean),
      };
    }

    if (question.type === "number") {
      const rules: FormQuestionPayload["rules"] = {};

      if (question.minValue !== undefined) {
        rules.minValue = question.minValue;
      }

      if (question.maxValue !== undefined) {
        rules.maxValue = question.maxValue;
      }

      if (Object.keys(rules).length > 0) {
        payload.rules = rules;
      }
    }

    return payload;
  });
}

function mapSession(session: EventSessionFormValue): CreateEventSessionPayload {
  const questions = mapQuestions(session.questions);

  return {
    title: session.title.trim(),
    description: optionalTrimmed(session.description),
    sessionType: session.sessionType,
    status: session.status,
    schedule: mapSchedule(session.schedule),
    location:
      session.useEventLocation || !session.location
        ? undefined
        : mapLocation(session.location),
    sessionCapacity: {
      capacity: session.sessionCapacity.capacity,
      waitlistEnabled: session.sessionCapacity.waitlistEnabled,
      waitlistCapacity: session.sessionCapacity.waitlistEnabled
        ? session.sessionCapacity.waitlistCapacity
        : 0,
    },
    sessionRules: {
      requireApproval: session.sessionRules.requireApproval,
      registrationMethods: [...session.sessionRules.registrationMethods],
      registrationMode: session.sessionRules.registrationMode,
      maxRegistrationsPerUser: session.sessionRules.maxRegistrationsPerUser,
      oneSessionPerEvent: session.sessionRules.oneSessionPerEvent,
    },
    questions: questions.length > 0 ? questions : undefined,
  };
}

export function toCreateEventPayload(
  values: CreateEventFormValues
): CreateEventPayload {
  const imageLinks = values.images.imageLinks
    .map((value) => value.trim())
    .filter(Boolean);
  const bannerLink = optionalTrimmed(values.images.bannerLink);
  const questions = mapQuestions(values.questions);
  const sessions = values.sessions.map(mapSession);

  return {
    title: values.title.trim(),
    slug: optionalTrimmed(values.slug),
    preDescription: optionalTrimmed(values.preDescription),
    postDescription: optionalTrimmed(values.postDescription.message)
      ? { message: values.postDescription.message.trim() }
      : undefined,
    termsAndConditions: optionalTrimmed(values.termsAndConditions),
    category: values.category,
    status: values.status,
    images:
      imageLinks.length > 0 || bannerLink
        ? {
            imageLinks,
            bannerLink,
          }
        : undefined,
    organizer: {
      organizerCommunityIds: values.organizer.organizers.map(
        (organizer) => organizer.id
      ),
      contactCommunityIds: values.organizer.contacts.map((contact) => contact.id),
    },
    access: mapAccess(values),
    location: mapLocation(values.location),
    schedule: mapSchedule(values.schedule),
    recurrence: {
      isRecurring: values.recurrence.isRecurring,
    },
    notification: values.notification.reminderConfig.enabled
      ? {
          notificationChannels: [...values.notification.notificationChannels],
          reminderConfig: {
            enabled: true,
            intervals: [...values.notification.reminderConfig.intervals],
          },
        }
      : {
          notificationChannels: [...values.notification.notificationChannels],
        },
    sessions: sessions.length > 0 ? sessions : undefined,
    questions: questions.length > 0 ? questions : undefined,
  };
}
