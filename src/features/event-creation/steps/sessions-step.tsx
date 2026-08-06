"use client";

import { useEffect, useState } from "react";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation, useSortable } from "@dnd-kit/react/sortable";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useFieldArray,
  useFormContext,
  useWatch,
  type FieldErrors,
} from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

import { EventDateTimeField } from "../components/event-date-time-field";
import { TimezoneSelect } from "../components/timezone-select";
import {
  EVENT_LOCATION_TYPES,
  EVENT_LOCATION_VISIBILITIES,
  EVENT_STATUSES,
  SESSION_REGISTRATION_METHODS,
  SESSION_REGISTRATION_MODES,
  SESSION_TYPES,
  type EventLocationType,
  type EventStatus,
  type SessionRegistrationMethod,
  type SessionRegistrationMode,
  type SessionType,
} from "../constants";
import { createDefaultSession } from "../defaults";
import type {
  CreateEventFormValues,
  EventLocationFormValue,
  EventQuestionFormValue,
  EventScheduleFormValue,
  EventSessionFormValue,
} from "../types";
import { formatEventSchedulePreview, isValidDate } from "../utils/event-date-time";

const SESSION_TYPE_OPTIONS = SESSION_TYPES.map((value) => ({
  value,
  label: toTitleLabel(value),
})) satisfies { value: SessionType; label: string }[];

const STATUS_OPTIONS = EVENT_STATUSES.map((value) => ({
  value,
  label: toTitleLabel(value),
})) satisfies { value: EventStatus; label: string }[];

const REGISTRATION_METHOD_OPTIONS = [
  {
    value: SESSION_REGISTRATION_METHODS[0],
    label: "Personal QR",
    description: "Each attendee uses their personal QR code.",
  },
  {
    value: SESSION_REGISTRATION_METHODS[1],
    label: "Session QR",
    description: "Attendees scan a QR code associated with this session.",
  },
  {
    value: SESSION_REGISTRATION_METHODS[2],
    label: "Registration QR",
    description: "Attendees use the QR code generated for their registration.",
  },
] satisfies {
  value: SessionRegistrationMethod;
  label: string;
  description: string;
}[];

const REGISTRATION_MODE_OPTIONS = [
  {
    value: SESSION_REGISTRATION_MODES[0],
    label: "Self Only",
    description: "The user can register only themselves.",
  },
  {
    value: SESSION_REGISTRATION_MODES[1],
    label: "Self and Registered Members",
    description: "The user can include people already registered in the system.",
  },
  {
    value: SESSION_REGISTRATION_MODES[2],
    label: "Self and Others",
    description: "The user can register themselves and additional attendees.",
  },
] satisfies {
  value: SessionRegistrationMode;
  label: string;
  description: string;
}[];

const LOCATION_TYPE_OPTIONS = [
  { value: EVENT_LOCATION_TYPES[0], label: "Online" },
  { value: EVENT_LOCATION_TYPES[1], label: "Offline" },
  { value: EVENT_LOCATION_TYPES[2], label: "Hybrid" },
] satisfies { value: EventLocationType; label: string }[];

const LOCATION_VISIBILITY_OPTIONS = [
  { value: EVENT_LOCATION_VISIBILITIES[0], label: "Before Registration" },
  { value: EVENT_LOCATION_VISIBILITIES[1], label: "After Registration" },
  { value: EVENT_LOCATION_VISIBILITIES[2], label: "Always Visible" },
] as const;

function toTitleLabel(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function createClientId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `client-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function cloneDate(value: Date | null) {
  return value ? new Date(value.getTime()) : null;
}

function cloneSchedule(schedule: EventScheduleFormValue): EventScheduleFormValue {
  return {
    startAt: cloneDate(schedule.startAt),
    endAt: cloneDate(schedule.endAt),
    timezone: schedule.timezone,
  };
}

function cloneLocation(location: EventLocationFormValue): EventLocationFormValue {
  const commonValues = {
    locationVisibility: location.locationVisibility,
    clickToAction: { ...location.clickToAction },
  };

  if (location.locationType === "online") {
    return {
      ...commonValues,
      locationType: "online",
      virtualLink: location.virtualLink,
      virtualPlatform: location.virtualPlatform,
    };
  }

  if (location.locationType === "offline") {
    return {
      ...commonValues,
      locationType: "offline",
      physicalPlaceName: location.physicalPlaceName,
      physicalAddress: location.physicalAddress,
    };
  }

  return {
    ...commonValues,
    locationType: "hybrid",
    physicalPlaceName: location.physicalPlaceName,
    physicalAddress: location.physicalAddress,
    virtualLink: location.virtualLink,
    virtualPlatform: location.virtualPlatform,
  };
}

function createLocationForType(
  nextLocationType: EventLocationType,
  currentLocation: EventLocationFormValue
): EventLocationFormValue {
  const commonValues = {
    locationVisibility: currentLocation.locationVisibility,
    clickToAction: { ...currentLocation.clickToAction },
  };

  if (nextLocationType === "online") {
    return {
      ...commonValues,
      locationType: "online",
      virtualLink:
        "virtualLink" in currentLocation ? currentLocation.virtualLink : "",
      virtualPlatform:
        "virtualPlatform" in currentLocation ? currentLocation.virtualPlatform : "",
    };
  }

  if (nextLocationType === "offline") {
    return {
      ...commonValues,
      locationType: "offline",
      physicalPlaceName:
        "physicalPlaceName" in currentLocation
          ? currentLocation.physicalPlaceName
          : "",
      physicalAddress:
        "physicalAddress" in currentLocation ? currentLocation.physicalAddress : "",
    };
  }

  return {
    ...commonValues,
    locationType: "hybrid",
    physicalPlaceName:
      "physicalPlaceName" in currentLocation
        ? currentLocation.physicalPlaceName
        : "",
    physicalAddress:
      "physicalAddress" in currentLocation ? currentLocation.physicalAddress : "",
    virtualLink:
      "virtualLink" in currentLocation ? currentLocation.virtualLink : "",
    virtualPlatform:
      "virtualPlatform" in currentLocation ? currentLocation.virtualPlatform : "",
  };
}

function cloneQuestion(question: EventQuestionFormValue): EventQuestionFormValue {
  return {
    ...question,
    clientId: createClientId(),
    requiredFor: [...question.requiredFor],
    visibleFor: [...question.visibleFor],
    choices: [...question.choices],
  };
}

function duplicateSession(source: EventSessionFormValue): EventSessionFormValue {
  return {
    clientId: createClientId(),
    title: source.title.trim() ? `${source.title.trim()} Copy` : source.title,
    description: source.description,
    sessionType: source.sessionType,
    status: source.status,
    useEventLocation: source.useEventLocation,
    location: source.location ? cloneLocation(source.location) : undefined,
    schedule: cloneSchedule(source.schedule),
    sessionCapacity: { ...source.sessionCapacity },
    sessionRules: {
      ...source.sessionRules,
      registrationMethods: [...source.sessionRules.registrationMethods],
    },
    questions: source.questions.map(cloneQuestion),
  };
}

function createSessionFromEventSchedule(
  eventSchedule: EventScheduleFormValue
): EventSessionFormValue {
  const session = createDefaultSession();

  session.schedule = cloneSchedule(eventSchedule);

  return session;
}

function formatSessionSchedule(schedule: EventScheduleFormValue) {
  return formatEventSchedulePreview(
    schedule.startAt,
    schedule.endAt,
    schedule.timezone
  )?.replace("\n", ", ");
}

function formatLocationSummary(location: EventLocationFormValue) {
  if (location.locationType === "online") {
    return location.virtualPlatform || "Online location";
  }

  if (location.locationType === "offline") {
    return location.physicalPlaceName || location.physicalAddress || "Offline location";
  }

  return (
    location.physicalPlaceName ||
    location.virtualPlatform ||
    location.physicalAddress ||
    "Hybrid location"
  );
}

function countErrors(value: unknown): number {
  if (!value || typeof value !== "object") {
    return 0;
  }

  if ("message" in value && typeof value.message === "string") {
    return 1;
  }

  return Object.values(value as Record<string, unknown>).reduce<number>(
    (total, child) => total + countErrors(child),
    0
  );
}

type SessionCardProps = {
  id: string;
  index: number;
  totalSessions: number;
  isExpanded: boolean;
  sessionError: FieldErrors<EventSessionFormValue> | undefined;
  onToggleExpanded: (id: string) => void;
  onDuplicate: (index: number) => void;
  onRemove: (index: number, id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
};

function SortableSessionCard(props: SessionCardProps) {
  const { handleRef, ref, isDragging } = useSortable({
    id: props.id,
    index: props.index,
    type: "event-session",
  });

  return (
    <div ref={ref} className={cn(isDragging && "opacity-60")}>
      <SessionCard {...props} dragHandleRef={handleRef} />
    </div>
  );
}

function SessionCard({
  id,
  index,
  totalSessions,
  isExpanded,
  sessionError,
  onToggleExpanded,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
  dragHandleRef,
}: SessionCardProps & { dragHandleRef: (element: Element | null) => void }) {
  const form = useFormContext<CreateEventFormValues>();
  const { control, getValues, setValue } = form;
  const { toast } = useToast();
  const session = useWatch({ control, name: `sessions.${index}` });
  const eventStatus = useWatch({ control, name: "status" });
  const eventLocation = useWatch({ control, name: "location" });
  const eventSchedule = useWatch({ control, name: "schedule" });
  const sessionLocationType = useWatch({
    control,
    name: `sessions.${index}.location.locationType`,
  });
  const capacity = useWatch({
    control,
    name: `sessions.${index}.sessionCapacity.capacity`,
  });
  const waitlistEnabled = useWatch({
    control,
    name: `sessions.${index}.sessionCapacity.waitlistEnabled`,
  });
  const registrationMode = useWatch({
    control,
    name: `sessions.${index}.sessionRules.registrationMode`,
  });
  const registrationMethods = useWatch({
    control,
    name: `sessions.${index}.sessionRules.registrationMethods`,
  });
  const errorCount = countErrors(sessionError);
  const title = session?.title.trim() || "Untitled Session";
  const scheduleSummary = session
    ? formatSessionSchedule(session.schedule)
    : undefined;
  const capacitySummary =
    capacity === null || capacity === undefined
      ? "Unlimited capacity"
      : `Capacity ${capacity}`;
  const usesPhysicalLocation =
    sessionLocationType === "offline" || sessionLocationType === "hybrid";
  const usesVirtualLocation =
    sessionLocationType === "online" || sessionLocationType === "hybrid";

  function setUseEventLocation(useEventLocation: boolean) {
    setValue(`sessions.${index}.useEventLocation`, useEventLocation, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (useEventLocation) {
      setValue(`sessions.${index}.location`, undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    setValue(`sessions.${index}.location`, cloneLocation(getValues("location")), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function setSessionLocationType(nextLocationType: EventLocationType) {
    const currentLocation =
      getValues(`sessions.${index}.location`) ?? getValues("location");

    setValue(
      `sessions.${index}.location`,
      createLocationForType(nextLocationType, currentLocation),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  }

  function copyEventSchedule() {
    setValue(`sessions.${index}.schedule`, cloneSchedule(getValues("schedule")), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function setCapacityValue(value: string) {
    const nextCapacity = value === "" ? null : Number(value);

    setValue(`sessions.${index}.sessionCapacity.capacity`, nextCapacity, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (nextCapacity === null) {
      setValue(`sessions.${index}.sessionCapacity.waitlistEnabled`, false, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(`sessions.${index}.sessionCapacity.waitlistCapacity`, 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  function setWaitlistEnabled(enabled: boolean) {
    setValue(`sessions.${index}.sessionCapacity.waitlistEnabled`, enabled, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (!enabled) {
      setValue(`sessions.${index}.sessionCapacity.waitlistCapacity`, 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  function toggleRegistrationMethod(method: SessionRegistrationMethod) {
    const selectedMethods = new Set(registrationMethods ?? []);
    const nextMethods = selectedMethods.has(method)
      ? (registrationMethods ?? []).filter((value) => value !== method)
      : [...(registrationMethods ?? []), method];

    setValue(`sessions.${index}.sessionRules.registrationMethods`, nextMethods, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (method === "personal-qr" && !selectedMethods.has(method)) {
      setValue(`sessions.${index}.sessionCapacity.waitlistEnabled`, false, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(`sessions.${index}.sessionCapacity.waitlistCapacity`, 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({
        title: "Waitlist disabled",
        description: "Personal QR registration cannot use waitlists.",
      });
    }
  }

  function setRegistrationMode(mode: SessionRegistrationMode) {
    setValue(`sessions.${index}.sessionRules.registrationMode`, mode, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (mode === "self_only") {
      setValue(`sessions.${index}.sessionRules.maxRegistrationsPerUser`, 1, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  return (
    <Card className={cn(errorCount > 0 && "border-destructive/60")}>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <Button
              ref={dragHandleRef}
              type="button"
              variant="ghost"
              size="icon"
              className="mt-1 cursor-grab active:cursor-grabbing"
              aria-label={`Reorder session ${index + 1}`}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Session {index + 1}</Badge>
                <Badge>{toTitleLabel(session?.sessionType ?? "service")}</Badge>
                <Badge variant="secondary">{toTitleLabel(session?.status ?? "draft")}</Badge>
                {errorCount > 0 ? (
                  <Badge variant="destructive">
                    {errorCount} {errorCount === 1 ? "field" : "fields"} need attention
                  </Badge>
                ) : null}
              </div>
              <div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="mt-1 space-y-1">
                  <span className="block">
                    {scheduleSummary ?? "Schedule not configured"}
                  </span>
                  <span className="block">
                    {capacitySummary} · Waitlist {waitlistEnabled ? "enabled" : "disabled"} · {session?.questions.length ?? 0} questions
                  </span>
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onToggleExpanded(id)}
            >
              {isExpanded ? (
                <ChevronUp className="mr-2 h-4 w-4" />
              ) : (
                <ChevronDown className="mr-2 h-4 w-4" />
              )}
              {isExpanded ? "Collapse" : "Edit"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="Session actions">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onDuplicate(index)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={index === 0}
                  onSelect={() => onMoveUp(index)}
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Move Up
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={index === totalSessions - 1}
                  onSelect={() => onMoveDown(index)}
                >
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Move Down
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={(event) => event.preventDefault()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this session?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes {title} and all session-level questions currently configured for it.
                        {(session?.questions.length ?? 0) > 0
                          ? ` This session has ${session?.questions.length} configured questions.`
                          : ""}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        type="button"
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => onRemove(index, id)}
                      >
                        Delete Session
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {isExpanded ? (
        <CardContent className="space-y-8">
          {errorCount > 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>This session needs attention</AlertTitle>
              <AlertDescription>
                Review the fields below before continuing to the next step.
              </AlertDescription>
            </Alert>
          ) : null}

          <section className="space-y-4">
            <div>
              <h3 className="font-medium">Basic Information</h3>
              <p className="text-sm text-muted-foreground">
                Name the session and choose how it should be categorized.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={control}
                name={`sessions.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Main Service" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`sessions.${index}.sessionType`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select session type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SESSION_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`sessions.${index}.status`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={eventStatus === "draft" && option.value === "active"}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {eventStatus === "draft" ? (
                      <FormDescription>
                        Sessions cannot be active while the event is still a draft.
                      </FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name={`sessions.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="General worship service and sermon."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-medium">Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Session times are editable independently after copying the event schedule.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={copyEventSchedule}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Copy Event Schedule
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <EventDateTimeField
                control={control}
                name={`sessions.${index}.schedule.startAt`}
                label="Starts At"
                placeholder="Select start date and time"
              />
              <EventDateTimeField
                control={control}
                name={`sessions.${index}.schedule.endAt`}
                label="Ends At"
                placeholder="Select end date and time"
                minDate={session?.schedule.startAt}
              />
            </div>
            <TimezoneSelect
              control={control}
              name={`sessions.${index}.schedule.timezone`}
            />
            {isValidDate(eventSchedule.startAt) && isValidDate(eventSchedule.endAt) ? (
              <Alert>
                <AlertTitle>Event schedule reference</AlertTitle>
                <AlertDescription>
                  {formatSessionSchedule(eventSchedule)}. Sessions are not hard-blocked to this range by the current frontend schema.
                </AlertDescription>
              </Alert>
            ) : null}
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h3 className="font-medium">Location</h3>
              <p className="text-sm text-muted-foreground">
                Use the event location by default, or configure a session-specific override.
              </p>
            </div>
            <FormField
              control={control}
              name={`sessions.${index}.useEventLocation`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <FormLabel>Use Event Location</FormLabel>
                    <FormDescription>
                      This session uses the event&apos;s location: {formatLocationSummary(eventLocation)}.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={setUseEventLocation}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!session?.useEventLocation ? (
              <div className="space-y-6 rounded-lg border p-4">
                <FormField
                  control={control}
                  name={`sessions.${index}.location.locationType`}
                  render={() => (
                    <FormItem>
                      <FormLabel>Location Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={sessionLocationType}
                          onValueChange={(value) =>
                            setSessionLocationType(value as EventLocationType)
                          }
                          className="grid gap-3 md:grid-cols-3"
                        >
                          {LOCATION_TYPE_OPTIONS.map((option) => (
                            <Label
                              key={option.value}
                              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 [&:has([data-state=checked])]:border-primary"
                            >
                              <RadioGroupItem value={option.value} />
                              <span className="text-sm font-medium">{option.label}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`sessions.${index}.location.locationVisibility`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Visibility</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LOCATION_VISIBILITY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {usesPhysicalLocation ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={control}
                      name={`sessions.${index}.location.physicalPlaceName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Venue Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Main Hall" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`sessions.${index}.location.physicalAddress`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Physical Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="GROW Center, Jakarta" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : null}

                {usesVirtualLocation ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={control}
                      name={`sessions.${index}.location.virtualPlatform`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Virtual Platform</FormLabel>
                          <FormControl>
                            <Input placeholder="Zoom, YouTube Live, Google Meet" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`sessions.${index}.location.virtualLink`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Virtual Event Link</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://meet.example.com/sunday-service"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Use an HTTP or HTTPS meeting, stream, or event link.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : null}

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={control}
                    name={`sessions.${index}.location.clickToAction.text`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action Button Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Register Here!" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`sessions.${index}.location.clickToAction.link`}
                    render={({ field }) => <input type="hidden" {...field} />}
                  />
                </div>
              </div>
            ) : null}
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h3 className="font-medium">Capacity and Waitlist</h3>
              <p className="text-sm text-muted-foreground">
                Leave capacity blank for unlimited capacity. Unlimited sessions cannot use a waitlist.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={control}
                name={`sessions.${index}.sessionCapacity.capacity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        placeholder="Unlimited"
                        value={field.value ?? ""}
                        onChange={(event) => setCapacityValue(event.target.value)}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormDescription>
                      Empty means unlimited capacity in the frontend form model.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`sessions.${index}.sessionCapacity.waitlistEnabled`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <FormLabel>Enable Waitlist</FormLabel>
                      <FormDescription>
                        Requires a limited capacity and cannot be used with Personal QR.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        disabled={capacity === null || registrationMethods?.includes("personal-qr")}
                        onCheckedChange={setWaitlistEnabled}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {waitlistEnabled ? (
              <FormField
                control={control}
                name={`sessions.${index}.sessionCapacity.waitlistCapacity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waitlist Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h3 className="font-medium">Registration Rules</h3>
              <p className="text-sm text-muted-foreground">
                Configure approval, check-in methods, and attendee limits for this session.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={control}
                name={`sessions.${index}.sessionRules.requireApproval`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <FormLabel>Require Approval</FormLabel>
                      <FormDescription>
                        Registrations must be approved before they are confirmed.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`sessions.${index}.sessionRules.oneSessionPerEvent`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <FormLabel>Limit Attendee to One Session</FormLabel>
                      <FormDescription>
                        Prevent an attendee from registering for more than one session in this event.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name={`sessions.${index}.sessionRules.registrationMethods`}
              render={({ field }) => {
                const selectedMethods = new Set(field.value);

                return (
                  <FormItem>
                    <FormLabel>Registration Methods</FormLabel>
                    <FormDescription>
                      Select at least one method. The backend contract conflict for event-qr is preserved; only personal-qr waitlist blocking is enforced here.
                    </FormDescription>
                    <div className="grid gap-3 md:grid-cols-3">
                      {REGISTRATION_METHOD_OPTIONS.map((option) => (
                        <Label
                          key={option.value}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 [&:has([data-state=checked])]:border-primary"
                        >
                          <Checkbox
                            checked={selectedMethods.has(option.value)}
                            onCheckedChange={() => toggleRegistrationMethod(option.value)}
                          />
                          <span className="space-y-1">
                            <span className="block text-sm font-medium">
                              {option.label}
                            </span>
                            <span className="block text-xs font-normal text-muted-foreground">
                              {option.description}
                            </span>
                          </span>
                        </Label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={control}
                name={`sessions.${index}.sessionRules.registrationMode`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Mode</FormLabel>
                    <Select value={field.value} onValueChange={setRegistrationMode}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select registration mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REGISTRATION_MODE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {
                        REGISTRATION_MODE_OPTIONS.find(
                          (option) => option.value === field.value
                        )?.description
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`sessions.${index}.sessionRules.maxRegistrationsPerUser`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Registrations Per User</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        disabled={registrationMode === "self_only"}
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <Separator />

          <Alert>
            <AlertTitle>Session questions</AlertTitle>
            <AlertDescription>
              Session-specific registration questions are configured in the next step. This session currently has {session?.questions.length ?? 0} questions.
            </AlertDescription>
          </Alert>

        </CardContent>
      ) : null}
    </Card>
  );
}

export function SessionsStep() {
  const form = useFormContext<CreateEventFormValues>();
  const { control, getValues, formState } = form;
  const { fields, append, remove, move, insert, update } = useFieldArray<
    CreateEventFormValues,
    "sessions",
    "formFieldId"
  >({
    control,
    name: "sessions",
    keyName: "formFieldId",
  });
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(
    () => new Set()
  );
  const sessionErrors = formState.errors.sessions;

  void update;

  useEffect(() => {
    if (!Array.isArray(sessionErrors)) {
      return;
    }

    const firstInvalidIndex = sessionErrors.findIndex(Boolean);

    if (firstInvalidIndex < 0) {
      return;
    }

    const invalidSessionId = getValues(`sessions.${firstInvalidIndex}.clientId`);

    setExpandedSessionIds((previous) => new Set(previous).add(invalidSessionId));
  }, [getValues, sessionErrors]);

  function addSession() {
    const session = createSessionFromEventSchedule(getValues("schedule"));

    append(session);
    setExpandedSessionIds((previous) => new Set(previous).add(session.clientId));
  }

  function duplicateSessionAt(index: number) {
    const duplicatedSession = duplicateSession(getValues(`sessions.${index}`));

    insert(index + 1, duplicatedSession);
    setExpandedSessionIds((previous) =>
      new Set(previous).add(duplicatedSession.clientId)
    );
  }

  function removeSessionAt(index: number, id: string) {
    remove(index);
    setExpandedSessionIds((previous) => {
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
  }

  function toggleExpanded(id: string) {
    setExpandedSessionIds((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function moveSession(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= fields.length) {
      return;
    }

    move(fromIndex, toIndex);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (event.canceled || !isSortableOperation(event.operation)) {
      return;
    }

    const sourceIndex = event.operation.source?.index;
    const targetIndex = event.operation.target?.index;

    if (
      typeof sourceIndex !== "number" ||
      typeof targetIndex !== "number" ||
      sourceIndex === targetIndex
    ) {
      return;
    }

    moveSession(sourceIndex, targetIndex);
  }

  const totalErrorCount = countErrors(sessionErrors);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardTitle>Sessions</CardTitle>
            <CardDescription>
              Add and configure services, classes, tracks, workshops, and other event sessions.
            </CardDescription>
            <p className="text-sm text-muted-foreground">
              {fields.length} {fields.length === 1 ? "session" : "sessions"} configured
            </p>
          </div>
          <Button type="button" onClick={addSession}>
            <Plus className="mr-2 h-4 w-4" />
            Add Session
          </Button>
        </CardHeader>
      </Card>

      {totalErrorCount > 0 ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Some sessions need attention</AlertTitle>
          <AlertDescription>
            Expand the highlighted session cards and review their field messages before continuing.
          </AlertDescription>
        </Alert>
      ) : null}

      {fields.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <CalendarClock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No sessions configured</h3>
              <p className="max-w-xl text-sm text-muted-foreground">
                Sessions can represent services, classes, workshops, tracks, breakout rooms, youth meetings, or other parts of this event.
              </p>
            </div>
            <Button type="button" onClick={addSession}>
              <Plus className="mr-2 h-4 w-4" />
              Add Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DragDropProvider onDragEnd={handleDragEnd}>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <SortableSessionCard
                key={field.formFieldId}
                id={field.clientId}
                index={index}
                totalSessions={fields.length}
                isExpanded={expandedSessionIds.has(field.clientId)}
                sessionError={
                  Array.isArray(sessionErrors) ? sessionErrors[index] : undefined
                }
                onToggleExpanded={toggleExpanded}
                onDuplicate={duplicateSessionAt}
                onRemove={removeSessionAt}
                onMoveUp={(sessionIndex) => moveSession(sessionIndex, sessionIndex - 1)}
                onMoveDown={(sessionIndex) => moveSession(sessionIndex, sessionIndex + 1)}
              />
            ))}
          </div>
        </DragDropProvider>
      )}
    </div>
  );
}
