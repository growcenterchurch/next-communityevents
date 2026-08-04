"use client";

import { useEffect, useState } from "react";
import { Check, Search, User, X } from "lucide-react";
import useSWR from "swr";

import { useAuth } from "@/components/providers/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { searchEventAccessUsers } from "../api/event-access-lookups";
import type { CommunityOption } from "../types";

type CommunityMultiSelectProps = {
  value: CommunityOption[];
  onChange: (value: CommunityOption[]) => void;
  placeholder: string;
  emptyText?: string;
};

function useDebouncedValue(value: string, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}

export function CommunityMultiSelect({
  value,
  onChange,
  placeholder,
  emptyText = "No users found.",
}: CommunityMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const { getValidAccessToken, handleExpiredToken } = useAuth();
  const shouldSearch = debouncedQuery.length >= 2;
  const selectedIds = new Set(value.map((option) => option.id));
  const { data = [], error, isLoading } = useSWR(
    shouldSearch ? ["event-access-users", debouncedQuery] : null,
    async ([, searchQuery]) => {
      const accessToken = await getValidAccessToken();

      if (!accessToken) {
        handleExpiredToken();
        return [];
      }

      return searchEventAccessUsers(searchQuery, accessToken);
    },
    { keepPreviousData: true }
  );

  function addOption(option: CommunityOption) {
    if (selectedIds.has(option.id)) {
      return;
    }

    onChange([...value, option]);
    setQuery("");
    setOpen(true);
  }

  function removeOption(optionId: string) {
    onChange(value.filter((option) => option.id !== optionId));
  }

  return (
    <div className="space-y-3">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((option) => (
            <Badge
              key={option.id}
              variant="secondary"
              className="gap-1.5 rounded-full px-2.5 py-1"
            >
              <User className="h-3.5 w-3.5" />
              <span>{option.name}</span>
              <button
                type="button"
                aria-label={`Remove ${option.name}`}
                onClick={() => removeOption(option.id)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-muted-foreground"
          >
            <Search className="mr-2 h-4 w-4" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type at least 2 characters..."
                className="h-11 border-0 px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <CommandList>
              {!shouldSearch ? (
                <CommandEmpty>Type at least 2 characters.</CommandEmpty>
              ) : isLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Searching...
                </p>
              ) : error ? (
                <p className="py-6 text-center text-sm text-destructive">
                  Search failed.
                </p>
              ) : data.length === 0 ? (
                <CommandEmpty>{emptyText}</CommandEmpty>
              ) : (
                data.map((option) => {
                  const isSelected = selectedIds.has(option.id);

                  return (
                    <CommandItem
                      key={option.id}
                      value={option.id}
                      onSelect={() => addOption(option)}
                      className="gap-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="font-medium">{option.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {option.id}
                      </span>
                    </CommandItem>
                  );
                })
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
