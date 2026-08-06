"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import type { Control, FieldPathByValue } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

import type { CreateEventFormValues } from "../types";

type EventDateTimeFieldProps = {
  control: Control<CreateEventFormValues>;
  name: FieldPathByValue<CreateEventFormValues, Date | null>;
  label: string;
  placeholder: string;
  description?: string;
  minDate?: Date | null;
};

export function EventDateTimeField({
  control,
  name,
  label,
  placeholder,
  description,
  minDate,
}: EventDateTimeFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <DatePicker
              selected={field.value instanceof Date ? field.value : null}
              onChange={(date: Date | null) => field.onChange(date)}
              onBlur={field.onBlur}
              showTimeSelect
              isClearable
              minDate={minDate ?? undefined}
              timeIntervals={15}
              dateFormat="dd MMMM yyyy, HH:mm"
              placeholderText={placeholder}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              )}
              wrapperClassName="w-full"
              calendarClassName="!font-sans"
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
