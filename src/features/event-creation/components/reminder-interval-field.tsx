"use client";

import type { Control } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";

import { REMINDER_INTERVALS, type ReminderInterval } from "../constants";
import type { CreateEventFormValues } from "../types";

const REMINDER_INTERVAL_OPTIONS = [
  { value: REMINDER_INTERVALS[0], label: "24 hours before" },
  { value: REMINDER_INTERVALS[1], label: "1 hour before" },
] as const satisfies readonly { value: ReminderInterval; label: string }[];

export function ReminderIntervalField({
  control,
}: {
  control: Control<CreateEventFormValues>;
}) {
  return (
    <FormField
      control={control}
      name="notification.reminderConfig.intervals"
      render={({ field }) => {
        const selectedIntervals = new Set(field.value);

        function toggleInterval(interval: ReminderInterval) {
          if (selectedIntervals.has(interval)) {
            field.onChange(field.value.filter((value) => value !== interval));
            return;
          }

          field.onChange([...field.value, interval]);
        }

        return (
          <FormItem>
            <FormLabel>Reminder Intervals</FormLabel>
            <FormDescription>
              Choose when reminders should be sent before the event starts.
            </FormDescription>
            <div className="grid gap-3 sm:grid-cols-2">
              {REMINDER_INTERVAL_OPTIONS.map((option) => (
                <Label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 [&:has([data-state=checked])]:border-primary"
                >
                  <Checkbox
                    checked={selectedIntervals.has(option.value)}
                    onCheckedChange={() => toggleInterval(option.value)}
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
  );
}
