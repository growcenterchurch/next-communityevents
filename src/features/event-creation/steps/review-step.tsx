"use client";

import { format, intervalToDuration } from "date-fns";
import { Edit } from "lucide-react";
import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type {
  CreateEventFormValues,
  EventLocationFormValue,
  EventQuestionFormValue,
  EventScheduleFormValue,
  EventSessionFormValue,
} from "../types";
import { formatEventSchedulePreview, isValidDate } from "../utils/event-date-time";
import type { WizardStepId } from "../wizard/event-wizard.config";

type ReviewStepProps = {
  onEditStep: (stepId: WizardStepId) => void;
};

const EMPTY = "Not configured";

const LABELS = new Map<string, string>([
  ["registration", "Registration"],
  ["internal-attendance", "Internal Attendance"],
  ["announcement", "Announcement"],
  ["external-attendance", "External Attendance"],
  ["draft", "Draft"],
  ["active", "Active"],
  ["inactive", "Inactive"],
  ["public", "Public"],
  ["private", "Private"],
  ["online", "Online"],
  ["offline", "Offline"],
  ["hybrid", "Hybrid"],
  ["pre-registration", "Before Registration"],
  ["post-registration", "After Registration"],
  ["all", "Always Visible"],
  ["service", "Service"],
  ["class", "Class"],
  ["track", "Track"],
  ["breakout", "Breakout"],
  ["workshop", "Workshop"],
  ["kids", "Kids"],
  ["youth", "Youth"],
  ["teen", "Teen"],
  ["adult", "Adult"],
  ["personal-qr", "Personal QR"],
  ["session-qr", "Session QR"],
  ["registration-qr", "Registration QR"],
  ["self_only", "Self Only"],
  ["self_and_registered", "Self and Registered Members"],
  ["self_and_others", "Self and Others"],
  ["short_text", "Short Text"],
  ["long_text", "Long Text"],
  ["single_choice", "Single Choice"],
  ["multiple_choice", "Multiple Choice"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["number", "Number"],
  ["parent", "Parent"],
  ["child", "Child"],
  ["whatsapp", "WhatsApp"],
  ["24h", "24 hours before"],
  ["1h", "1 hour before"],
  ["NORMAL_FLOW", "Standard Registration Flow"],
]);

function label(value: string) {
  return LABELS.get(value) ?? value;
}

function text(value: string | undefined | null) {
  return value?.trim() || EMPTY;
}

function list(values: readonly string[], emptyLabel = "None selected") {
  if (values.length === 0) {
    return <span className="text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value} variant="secondary">
          {label(value)}
        </Badge>
      ))}
    </div>
  );
}

function names(
  values: readonly { id: string; name: string }[],
  emptyLabel = "None selected"
) {
  if (values.length === 0) {
    return <span className="text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value.id} variant="secondary">
          {value.name} ({value.id})
        </Badge>
      ))}
    </div>
  );
}

function ReviewSection({
  title,
  description,
  editLabel,
  children,
  onEdit,
}: {
  title: string;
  description?: string;
  editLabel: string;
  children: ReactNode;
  onEdit: () => void;
}) {
  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          {editLabel}
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ReviewField({
  label: fieldLabel,
  children,
  preserveLines = false,
}: {
  label: string;
  children: ReactNode;
  preserveLines?: boolean;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-muted-foreground">{fieldLabel}</dt>
      <dd
        className={
          preserveLines
            ? "whitespace-pre-wrap break-words text-sm"
            : "break-words text-sm"
        }
      >
        {children}
      </dd>
    </div>
  );
}

function FieldGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-5 md:grid-cols-2">{children}</dl>;
}

function scheduleText(schedule: EventScheduleFormValue) {
  return formatEventSchedulePreview(
    schedule.startAt,
    schedule.endAt,
    schedule.timezone
  )?.replace("\n", ", ") ?? EMPTY;
}

function durationText(schedule: EventScheduleFormValue) {
  if (!isValidDate(schedule.startAt) || !isValidDate(schedule.endAt)) {
    return EMPTY;
  }

  const duration = intervalToDuration({
    start: schedule.startAt,
    end: schedule.endAt,
  });
  const parts = [
    duration.days ? `${duration.days} day${duration.days === 1 ? "" : "s"}` : "",
    duration.hours
      ? `${duration.hours} hour${duration.hours === 1 ? "" : "s"}`
      : "",
    duration.minutes
      ? `${duration.minutes} minute${duration.minutes === 1 ? "" : "s"}`
      : "",
  ].filter(Boolean);

  return parts.join(" ") || "0 minutes";
}

function numberRangeText(question: EventQuestionFormValue) {
  if (question.minValue === undefined && question.maxValue === undefined) {
    return EMPTY;
  }

  return `${question.minValue ?? "No minimum"}-${
    question.maxValue ?? "No maximum"
  }`;
}

function LocationFields({ location }: { location: EventLocationFormValue }) {
  const isPhysical =
    location.locationType === "offline" || location.locationType === "hybrid";
  const isVirtual =
    location.locationType === "online" || location.locationType === "hybrid";

  return (
    <FieldGrid>
      <ReviewField label="Location Type">{label(location.locationType)}</ReviewField>
      <ReviewField label="Location Visibility">
        {label(location.locationVisibility)}
      </ReviewField>
      {isPhysical && "physicalPlaceName" in location ? (
        <ReviewField label="Place Name">
          {text(location.physicalPlaceName)}
        </ReviewField>
      ) : null}
      {isPhysical && "physicalAddress" in location ? (
        <ReviewField label="Address" preserveLines>
          {text(location.physicalAddress)}
        </ReviewField>
      ) : null}
      {isVirtual && "virtualPlatform" in location ? (
        <ReviewField label="Virtual Platform">
          {text(location.virtualPlatform)}
        </ReviewField>
      ) : null}
      {isVirtual && "virtualLink" in location ? (
        <ReviewField label="Virtual Link">
          {location.virtualLink ? (
            <a
              className="break-all text-primary underline-offset-4 hover:underline"
              href={location.virtualLink}
              target="_blank"
              rel="noreferrer"
            >
              {location.virtualLink}
            </a>
          ) : (
            EMPTY
          )}
        </ReviewField>
      ) : null}
      <ReviewField label="CTA Text">{text(location.clickToAction.text)}</ReviewField>
      <ReviewField label="CTA Action">
        {label(text(location.clickToAction.link))}
      </ReviewField>
    </FieldGrid>
  );
}

function QuestionList({ questions }: { questions: EventQuestionFormValue[] }) {
  if (questions.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        No questions
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <div key={question.clientId} className="rounded-lg border p-4">
          <h4 className="font-medium">
            {index + 1}. {text(question.text)}
          </h4>
          <FieldGrid>
            <ReviewField label="Type">{label(question.type)}</ReviewField>
            <ReviewField label="Visible For">
              {list(question.visibleFor, "None selected")}
            </ReviewField>
            <ReviewField label="Required For">
              {list(question.requiredFor, "None selected")}
            </ReviewField>
            {question.type === "single_choice" ||
            question.type === "multiple_choice" ? (
              <ReviewField label="Choices">
                {list(
                  question.choices.map((choice) => choice.trim()).filter(Boolean),
                  "No choices"
                )}
              </ReviewField>
            ) : null}
            {question.type === "number" ? (
              <ReviewField label="Allowed Range">
                {numberRangeText(question)}
              </ReviewField>
            ) : null}
          </FieldGrid>
        </div>
      ))}
    </div>
  );
}

function SessionReviewCard({
  session,
  index,
}: {
  session: EventSessionFormValue;
  index: number;
}) {
  return (
    <Card className="border-muted">
      <CardHeader>
        <CardDescription>Session {index + 1}</CardDescription>
        <CardTitle>{text(session.title)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <FieldGrid>
          <ReviewField label="Description" preserveLines>
            {text(session.description)}
          </ReviewField>
          <ReviewField label="Type">{label(session.sessionType)}</ReviewField>
          <ReviewField label="Status">{label(session.status)}</ReviewField>
          <ReviewField label="Schedule">{scheduleText(session.schedule)}</ReviewField>
          <ReviewField label="Timezone">{session.schedule.timezone}</ReviewField>
          <ReviewField label="Location">
            {session.useEventLocation ? "Uses event location" : "Session location"}
          </ReviewField>
          <ReviewField label="Capacity">
            {session.sessionCapacity.capacity === null
              ? "Unlimited"
              : session.sessionCapacity.capacity}
          </ReviewField>
          <ReviewField label="Waitlist">
            {session.sessionCapacity.waitlistEnabled
              ? `${session.sessionCapacity.waitlistCapacity} spots`
              : "Disabled"}
          </ReviewField>
          <ReviewField label="Approval Required">
            {session.sessionRules.requireApproval ? "Yes" : "No"}
          </ReviewField>
          <ReviewField label="Registration Methods">
            {list(session.sessionRules.registrationMethods)}
          </ReviewField>
          <ReviewField label="Registration Mode">
            {label(session.sessionRules.registrationMode)}
          </ReviewField>
          <ReviewField label="Maximum Registrations per User">
            {session.sessionRules.maxRegistrationsPerUser}
          </ReviewField>
          <ReviewField label="One Session per Event">
            {session.sessionRules.oneSessionPerEvent ? "Yes" : "No"}
          </ReviewField>
          <ReviewField label="Questions">{session.questions.length}</ReviewField>
        </FieldGrid>
        {!session.useEventLocation && session.location ? (
          <div className="space-y-3">
            <Separator />
            <h4 className="font-medium">Session Location</h4>
            <LocationFields location={session.location} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ReviewStep({ onEditStep }: ReviewStepProps) {
  const form = useFormContext<CreateEventFormValues>();
  useWatch({ control: form.control });
  const values = form.getValues();
  const isAnnouncement = values.category === "announcement";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Event</CardTitle>
          <CardDescription>
            Review the event, sessions, and registration forms before creating it.
          </CardDescription>
        </CardHeader>
      </Card>

      <ReviewSection
        title="Event Basics"
        description="Title, category, descriptions, terms, and images."
        editLabel="Edit Event Basics"
        onEdit={() => onEditStep("basics")}
      >
        <FieldGrid>
          <ReviewField label="Title">{text(values.title)}</ReviewField>
          <ReviewField label="Slug">{text(values.slug)}</ReviewField>
          <ReviewField label="Category">{label(values.category)}</ReviewField>
          <ReviewField label="Status">{label(values.status)}</ReviewField>
          <ReviewField label="Event Description" preserveLines>
            {text(values.preDescription)}
          </ReviewField>
          <ReviewField label="Post-registration Message" preserveLines>
            {text(values.postDescription.message)}
          </ReviewField>
          <ReviewField label="Terms and Conditions" preserveLines>
            {text(values.termsAndConditions)}
          </ReviewField>
          <ReviewField label="Event Image Count">
            {values.images.imageLinks.filter((value) => value.trim()).length}
          </ReviewField>
          <ReviewField label="Banner Image">
            {values.images.bannerLink ? "Configured" : "Not configured"}
          </ReviewField>
        </FieldGrid>
      </ReviewSection>

      <ReviewSection
        title="Organizer & Access"
        description="Organizers, contacts, and audience restrictions."
        editLabel="Edit Organizer and Access"
        onEdit={() => onEditStep("organizer-access")}
      >
        <FieldGrid>
          <ReviewField label="Organizers">
            {names(values.organizer.organizers, "None selected")}
          </ReviewField>
          <ReviewField label="Contacts">
            {names(values.organizer.contacts, "None selected")}
          </ReviewField>
          <ReviewField label="Access Level">{label(values.access.accessLevel)}</ReviewField>
          {values.access.accessLevel === "public" ? (
            <ReviewField label="Restrictions">
              No role, campus, user-type, or community restrictions.
            </ReviewField>
          ) : (
            <>
              <ReviewField label="Allowed User Types">
                {list(values.access.allowedUserTypes)}
              </ReviewField>
              <ReviewField label="Allowed Roles">
                {list(values.access.allowedRoles)}
              </ReviewField>
              <ReviewField label="Allowed Campuses">
                {list(values.access.allowedCampuses)}
              </ReviewField>
              <ReviewField label="Allowed Communities">
                {names(values.access.allowedCommunities)}
              </ReviewField>
            </>
          )}
        </FieldGrid>
      </ReviewSection>

      <ReviewSection
        title="Location & Schedule"
        description="Location, local schedule, recurrence, and notifications."
        editLabel="Edit Location and Schedule"
        onEdit={() => onEditStep("location-schedule")}
      >
        <div className="space-y-6">
          <LocationFields location={values.location} />
          <Separator />
          <FieldGrid>
            <ReviewField label="Start Date and Time">
              {isValidDate(values.schedule.startAt)
                ? format(values.schedule.startAt, "EEEE, d MMMM yyyy, HH:mm")
                : EMPTY}
            </ReviewField>
            <ReviewField label="End Date and Time">
              {isValidDate(values.schedule.endAt)
                ? format(values.schedule.endAt, "EEEE, d MMMM yyyy, HH:mm")
                : EMPTY}
            </ReviewField>
            <ReviewField label="Timezone">{values.schedule.timezone}</ReviewField>
            <ReviewField label="Duration">{durationText(values.schedule)}</ReviewField>
            <ReviewField label="Recurring Event">
              {values.recurrence.isRecurring ? "Yes" : "No"}
            </ReviewField>
            {values.recurrence.isRecurring ? (
              <ReviewField label="Recurrence Details">
                Detailed recurrence rules are not configured in this form.
              </ReviewField>
            ) : null}
            <ReviewField label="Notification Channels">
              {list(values.notification.notificationChannels)}
            </ReviewField>
            <ReviewField label="Reminders">
              {values.notification.reminderConfig.enabled
                ? list(values.notification.reminderConfig.intervals, "No reminders")
                : "Disabled"}
            </ReviewField>
          </FieldGrid>
        </div>
      </ReviewSection>

      {isAnnouncement ? (
        <Card>
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>
              Sessions are not available for announcement events.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ReviewSection
          title="Sessions"
          description="Configured sessions in their current order."
          editLabel="Edit Sessions"
          onEdit={() => onEditStep("sessions")}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Total sessions: {values.sessions.length}
            </p>
            {values.sessions.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No sessions
              </p>
            ) : (
              values.sessions.map((session, index) => (
                <SessionReviewCard
                  key={session.clientId}
                  session={session}
                  index={index}
                />
              ))
            )}
          </div>
        </ReviewSection>
      )}

      <ReviewSection
        title="Event Registration Form"
        description="Event-level questions shown in display order."
        editLabel="Edit Event Registration Form"
        onEdit={() => onEditStep("dynamic-forms")}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Total questions: {values.questions.length}
          </p>
          <QuestionList questions={values.questions} />
        </div>
      </ReviewSection>

      {!isAnnouncement ? (
        <ReviewSection
          title="Session Registration Forms"
          description="Session-level questions grouped under their owning session."
          editLabel="Edit Session Registration Forms"
          onEdit={() => onEditStep("dynamic-forms")}
        >
          <div className="space-y-6">
            {values.sessions.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No sessions
              </p>
            ) : (
              values.sessions.map((session) => (
                <div key={session.clientId} className="space-y-3">
                  <h3 className="font-medium">{text(session.title) || "Untitled Session"}</h3>
                  <QuestionList questions={session.questions} />
                </div>
              ))
            )}
          </div>
        </ReviewSection>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Submission Notice</CardTitle>
          <CardDescription>
            Submitting will create the event, sessions, and registration forms
            together.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If the create request fails, review the highlighted fields and submit
            again. The form values will remain intact.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
