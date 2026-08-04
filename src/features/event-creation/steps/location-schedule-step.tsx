"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

import { EventDateTimeField } from "../components/event-date-time-field";
import { ReminderIntervalField } from "../components/reminder-interval-field";
import { TimezoneSelect } from "../components/timezone-select";
import {
  EVENT_LOCATION_TYPES,
  EVENT_LOCATION_VISIBILITIES,
  NOTIFICATION_CHANNELS,
  type EventLocationType,
  type NotificationChannel,
} from "../constants";
import type { CreateEventFormValues, EventLocationFormValue } from "../types";
import { formatEventSchedulePreview } from "../utils/event-date-time";

const LOCATION_TYPE_OPTIONS = [
  {
    value: EVENT_LOCATION_TYPES[0],
    label: "Online",
    description:
      "The event takes place through a virtual meeting or streaming platform.",
  },
  {
    value: EVENT_LOCATION_TYPES[1],
    label: "Offline",
    description: "The event takes place at a physical venue.",
  },
  {
    value: EVENT_LOCATION_TYPES[2],
    label: "Hybrid",
    description: "The event is available both at a physical venue and online.",
  },
] as const;

const LOCATION_VISIBILITY_OPTIONS = [
  {
    value: EVENT_LOCATION_VISIBILITIES[0],
    label: "Before Registration",
    description: "Show the location before the attendee completes registration.",
  },
  {
    value: EVENT_LOCATION_VISIBILITIES[1],
    label: "After Registration",
    description: "Reveal the location only after successful registration.",
  },
  {
    value: EVENT_LOCATION_VISIBILITIES[2],
    label: "Always Visible",
    description: "Show the location both before and after registration.",
  },
] as const;

const NOTIFICATION_CHANNEL_OPTIONS = [
  { value: NOTIFICATION_CHANNELS[0], label: "Email" },
  { value: NOTIFICATION_CHANNELS[1], label: "WhatsApp" },
] as const satisfies readonly { value: NotificationChannel; label: string }[];

function createNextLocation(
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
      locationType: nextLocationType,
      virtualLink:
        "virtualLink" in currentLocation ? currentLocation.virtualLink : "",
      virtualPlatform:
        "virtualPlatform" in currentLocation
          ? currentLocation.virtualPlatform
          : "",
    };
  }

  if (nextLocationType === "offline") {
    return {
      ...commonValues,
      locationType: nextLocationType,
      physicalPlaceName:
        "physicalPlaceName" in currentLocation
          ? currentLocation.physicalPlaceName
          : "",
      physicalAddress:
        "physicalAddress" in currentLocation
          ? currentLocation.physicalAddress
          : "",
    };
  }

  return {
    ...commonValues,
    locationType: nextLocationType,
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

export function LocationScheduleStep() {
  const form = useFormContext<CreateEventFormValues>();
  const { control, getValues, setValue } = form;
  const locationType = useWatch({ control, name: "location.locationType" });
  const startAt = useWatch({ control, name: "schedule.startAt" });
  const endAt = useWatch({ control, name: "schedule.endAt" });
  const timezone = useWatch({ control, name: "schedule.timezone" });
  const remindersEnabled = useWatch({
    control,
    name: "notification.reminderConfig.enabled",
  });
  const isRecurring = useWatch({ control, name: "recurrence.isRecurring" });
  const isPhysicalLocation =
    locationType === "offline" || locationType === "hybrid";
  const isVirtualLocation =
    locationType === "online" || locationType === "hybrid";
  const schedulePreview = formatEventSchedulePreview(startAt, endAt, timezone);

  function setLocationType(nextLocationType: EventLocationType) {
    setValue(
      "location",
      createNextLocation(nextLocationType, getValues("location")),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  }

  function setRemindersEnabled(enabled: boolean) {
    setValue("notification.reminderConfig.enabled", enabled, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (!enabled) {
      setValue("notification.reminderConfig.intervals", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  // TODO: Convert wall-clock dates plus timezone in the future API payload mapper.
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
          <CardDescription>
            Configure where attendees can access this event before or after
            registration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={control}
            name="location.locationType"
            render={() => (
              <FormItem>
                <FormLabel>Location Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={locationType}
                    onValueChange={(value) =>
                      setLocationType(value as EventLocationType)
                    }
                    className="grid gap-3 md:grid-cols-3"
                  >
                    {LOCATION_TYPE_OPTIONS.map((option) => (
                      <Label
                        key={option.value}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 [&:has([data-state=checked])]:border-primary"
                      >
                        <RadioGroupItem value={option.value} className="mt-1" />
                        <span className="space-y-1">
                          <span className="block font-medium">{option.label}</span>
                          <span className="block text-sm font-normal text-muted-foreground">
                            {option.description}
                          </span>
                        </span>
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
            name="location.locationVisibility"
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
                <FormDescription>
                  {
                    LOCATION_VISIBILITY_OPTIONS.find(
                      (option) => option.value === field.value
                    )?.description
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {isPhysicalLocation ? (
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={control}
                name="location.physicalPlaceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Main Hall" {...field} />
                    </FormControl>
                    <FormDescription>
                      The recognizable name of the building, room, or event venue.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="location.physicalAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="GROW Center, Jakarta" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the complete address attendees should use to reach the
                      venue.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ) : null}

          {isVirtualLocation ? (
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={control}
                name="location.virtualPlatform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Virtual Platform</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Zoom, YouTube Live, Google Meet"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="location.virtualLink"
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

          <Separator />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="location.clickToAction.text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Button Text</FormLabel>
                  <FormControl>
                    <Input placeholder="Register Here!" {...field} />
                  </FormControl>
                  <FormDescription>
                    The label shown on the event action button.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="location.clickToAction.link"
              render={({ field }) => <input type="hidden" {...field} />}
            />
          </div>

          <Alert>
            <AlertTitle>CTA action</AlertTitle>
            <AlertDescription>
              Only NORMAL_FLOW is currently defined for the action value, so the
              button action is kept as a hidden form value.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>
            Set the event wall-clock date, time, and timezone. UTC payload
            serialization belongs in the later API mapper.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <EventDateTimeField
              control={control}
              name="schedule.startAt"
              label="Starts At"
              placeholder="Select start date and time"
            />
            <EventDateTimeField
              control={control}
              name="schedule.endAt"
              label="Ends At"
              placeholder="Select end date and time"
              minDate={startAt}
            />
          </div>

          <TimezoneSelect control={control} />

          {schedulePreview ? (
            <div className="rounded-lg border bg-muted/40 p-4">
              <h3 className="text-sm font-medium">Schedule Preview</h3>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {schedulePreview}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recurrence</CardTitle>
          <CardDescription>
            Configure whether this event follows a repeating schedule.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="recurrence.isRecurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <FormLabel>Recurring Event</FormLabel>
                  <FormDescription>
                    Enable this when the event follows a repeating schedule.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {isRecurring ? (
            <Alert>
              <AlertTitle>Recurrence details</AlertTitle>
              <AlertDescription>
                Detailed recurrence rules are not yet configurable in this form.
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Choose attendee notification channels and optional reminders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={control}
            name="notification.notificationChannels"
            render={({ field }) => {
              const selectedChannels = new Set(field.value);

              function toggleChannel(channel: NotificationChannel) {
                if (selectedChannels.has(channel)) {
                  field.onChange(
                    field.value.filter((value) => value !== channel)
                  );
                  return;
                }

                field.onChange([...field.value, channel]);
              }

              return (
                <FormItem>
                  <FormLabel>Notification Channels</FormLabel>
                  <FormDescription>
                    Choose how attendees should receive event notifications.
                  </FormDescription>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {NOTIFICATION_CHANNEL_OPTIONS.map((option) => (
                      <Label
                        key={option.value}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 [&:has([data-state=checked])]:border-primary"
                      >
                        <Checkbox
                          checked={selectedChannels.has(option.value)}
                          onCheckedChange={() => toggleChannel(option.value)}
                        />
                        <span className="text-sm font-medium">{option.label}</span>
                      </Label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={control}
            name="notification.reminderConfig.enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <FormLabel>Send Event Reminders</FormLabel>
                  <FormDescription>
                    Enable reminder messages before the event starts.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={setRemindersEnabled}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {remindersEnabled ? <ReminderIntervalField control={control} /> : null}
        </CardContent>
      </Card>
    </div>
  );
}
