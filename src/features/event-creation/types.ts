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
} from "./constants";

export type CommunityOption = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type EventImagesFormValue = {
  imageLinks: string[];
  bannerLink: string;
};

export type EventOrganizerFormValue = {
  organizers: CommunityOption[];
  contacts: CommunityOption[];
};

export type PublicEventAccessFormValue = {
  accessLevel: Extract<EventAccessLevel, "public">;
};

export type PrivateEventAccessFormValue = {
  accessLevel: Extract<EventAccessLevel, "private">;
  allowedUserTypes: string[];
  allowedRoles: string[];
  allowedCampuses: string[];
  allowedCommunities: CommunityOption[];
};

export type EventAccessFormValue =
  | PublicEventAccessFormValue
  | PrivateEventAccessFormValue;

export type EventClickToActionFormValue = {
  text: string;
  link: string;
};

type EventLocationBaseFormValue = {
  locationVisibility: EventLocationVisibility;
  clickToAction: EventClickToActionFormValue;
};

export type OnlineEventLocationFormValue = EventLocationBaseFormValue & {
  locationType: Extract<EventLocationType, "online">;
  virtualLink: string;
  virtualPlatform: string;
};

export type OfflineEventLocationFormValue = EventLocationBaseFormValue & {
  locationType: Extract<EventLocationType, "offline">;
  physicalPlaceName: string;
  physicalAddress: string;
};

export type HybridEventLocationFormValue = EventLocationBaseFormValue & {
  locationType: Extract<EventLocationType, "hybrid">;
  virtualLink: string;
  virtualPlatform: string;
  physicalPlaceName: string;
  physicalAddress: string;
};

export type EventLocationFormValue =
  | OnlineEventLocationFormValue
  | OfflineEventLocationFormValue
  | HybridEventLocationFormValue;

export type EventScheduleFormValue = {
  startAt: Date | null;
  endAt: Date | null;
  timezone: string;
};

export type EventRecurrenceFormValue = {
  isRecurring: boolean;
};

export type EventNotificationFormValue = {
  notificationChannels: NotificationChannel[];
  reminderConfig: {
    enabled: boolean;
    intervals: string[];
  };
};

export type EventSessionCapacityFormValue = {
  capacity: number | null;
  waitlistEnabled: boolean;
  waitlistCapacity: number;
};

export type EventSessionRulesFormValue = {
  requireApproval: boolean;
  registrationMethods: SessionRegistrationMethod[];
  registrationMode: SessionRegistrationMode;
  maxRegistrationsPerUser: number;
  oneSessionPerEvent: boolean;
};

export type EventQuestionFormValue = {
  clientId: string;
  text: string;
  type: QuestionType;
  requiredFor: QuestionAudience[];
  visibleFor: QuestionAudience[];
  choices: string[];
  minValue?: number;
  maxValue?: number;
};

export type EventSessionFormValue = {
  clientId: string;
  title: string;
  description: string;
  sessionType: SessionType;
  status: EventStatus;
  useEventLocation: boolean;
  location?: EventLocationFormValue;
  schedule: EventScheduleFormValue;
  sessionCapacity: EventSessionCapacityFormValue;
  sessionRules: EventSessionRulesFormValue;
  questions: EventQuestionFormValue[];
};

export type CreateEventFormValues = {
  title: string;
  slug: string;
  category: EventCategory;
  status: EventStatus;
  preDescription: string;
  postDescription: {
    message: string;
  };
  termsAndConditions: string;
  images: EventImagesFormValue;
  organizer: EventOrganizerFormValue;
  access: EventAccessFormValue;
  location: EventLocationFormValue;
  schedule: EventScheduleFormValue;
  recurrence: EventRecurrenceFormValue;
  notification: EventNotificationFormValue;
  sessions: EventSessionFormValue[];
  questions: EventQuestionFormValue[];
};
