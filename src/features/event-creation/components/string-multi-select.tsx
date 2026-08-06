"use client";

import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type StringOption = {
  value: string;
  label: string;
};

type StringMultiSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  options: readonly StringOption[];
  placeholder: string;
};

export function StringMultiSelect({
  value,
  onChange,
  options,
  placeholder,
}: StringMultiSelectProps) {
  const selectedValues = new Set(value);

  function toggleValue(optionValue: string) {
    if (selectedValues.has(optionValue)) {
      onChange(value.filter((currentValue) => currentValue !== optionValue));
      return;
    }

    onChange([...value, optionValue]);
  }

  return (
    <div className="space-y-3">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((selectedValue) => {
            const label =
              options.find((option) => option.value === selectedValue)?.label ??
              selectedValue;

            return (
              <Badge
                key={selectedValue}
                variant="secondary"
                className="gap-1.5 rounded-full px-2.5 py-1"
              >
                <span>{label}</span>
                <button
                  type="button"
                  aria-label={`Remove ${label}`}
                  onClick={() => toggleValue(selectedValue)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            );
          })}
        </div>
      ) : null}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-muted-foreground"
          >
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandList>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);

                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => toggleValue(option.value)}
                    className="gap-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
