"use client";

import type { Control, FieldPathByValue } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { EVENT_TIMEZONES } from "../constants";
import type { CreateEventFormValues } from "../types";

export function TimezoneSelect({
  control,
  name = "schedule.timezone",
}: {
  control: Control<CreateEventFormValues>;
  name?: FieldPathByValue<CreateEventFormValues, string>;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Timezone</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {EVENT_TIMEZONES.map((timezone) => (
                <SelectItem key={timezone} value={timezone}>
                  {timezone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Event times will be interpreted using this timezone.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
