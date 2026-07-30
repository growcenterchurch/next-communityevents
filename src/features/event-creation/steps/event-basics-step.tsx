"use client";

import { useEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  type EventCategory,
} from "../constants";
import type { CreateEventFormValues } from "../types";
import { slugify } from "../utils/slugify";

const CATEGORY_OPTIONS = [
  {
    value: EVENT_CATEGORIES[0],
    label: "Registration",
    description: "Users register before attending.",
  },
  {
    value: EVENT_CATEGORIES[1],
    label: "Internal Attendance",
    description: "Internal attendance tracking for members or staff.",
  },
  {
    value: EVENT_CATEGORIES[2],
    label: "Announcement",
    description: "Information-only event without sessions.",
  },
  {
    value: EVENT_CATEGORIES[3],
    label: "External Attendance",
    description: "Attendance tracking involving external participants.",
  },
] as const;

const STATUS_OPTIONS = [
  {
    value: EVENT_STATUSES[0],
    label: "Draft",
    description: "Not publicly available and still being configured.",
  },
  {
    value: EVENT_STATUSES[1],
    label: "Active",
    description: "Available according to its access and schedule settings.",
  },
  {
    value: EVENT_STATUSES[2],
    label: "Inactive",
    description: "Disabled without deleting the event.",
  },
] as const;

const createImageRowId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `image-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

type ImageRow = {
  id: string;
};

export function EventBasicsStep() {
  const form = useFormContext<CreateEventFormValues>();
  const { control, getValues, setValue, trigger } = form;
  const title = useWatch({ control, name: "title" });
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(
    () => getValues("slug").trim().length > 0
  );
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<EventCategory | null>(
    null
  );
  const [imageRows, setImageRows] = useState<ImageRow[]>(() =>
    getValues("images.imageLinks").map(() => ({ id: createImageRowId() }))
  );
  const previousTitleRef = useRef(title);

  useEffect(() => {
    if (previousTitleRef.current === title) {
      return;
    }

    previousTitleRef.current = title;

    if (isSlugManuallyEdited) {
      return;
    }

    setValue("slug", slugify(title), {
      shouldDirty: true,
      shouldValidate: Boolean(title),
    });
  }, [isSlugManuallyEdited, setValue, title]);

  function requestCategoryChange(nextCategory: EventCategory) {
    const currentCategory = getValues("category");
    const sessions = getValues("sessions");

    if (
      nextCategory === "announcement" &&
      currentCategory !== "announcement" &&
      sessions.length > 0
    ) {
      setPendingCategory(nextCategory);
      setAnnouncementDialogOpen(true);
      return;
    }

    setValue("category", nextCategory, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function confirmAnnouncementChange() {
    setValue("sessions", [], {
      shouldDirty: true,
      shouldValidate: true,
    });

    setValue("category", pendingCategory ?? "announcement", {
      shouldDirty: true,
      shouldValidate: true,
    });

    setAnnouncementDialogOpen(false);
    setPendingCategory(null);
  }

  function cancelAnnouncementChange() {
    setAnnouncementDialogOpen(false);
    setPendingCategory(null);
  }

  function addImageRow() {
    const currentLinks = getValues("images.imageLinks");
    const lastLink = currentLinks[currentLinks.length - 1];

    if (currentLinks.length > 0 && !lastLink?.trim()) {
      void trigger(`images.imageLinks.${currentLinks.length - 1}`);
      return;
    }

    setValue("images.imageLinks", [...currentLinks, ""], {
      shouldDirty: true,
      shouldValidate: false,
    });
    setImageRows((rows) => [...rows, { id: createImageRowId() }]);
  }

  function removeImageRow(index: number) {
    const nextLinks = getValues("images.imageLinks").filter(
      (_link, linkIndex) => linkIndex !== index
    );

    setValue("images.imageLinks", nextLinks, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setImageRows((rows) => rows.filter((_row, rowIndex) => rowIndex !== index));
  }

  function regenerateSlugFromTitle() {
    setValue("slug", slugify(getValues("title")), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setIsSlugManuallyEdited(false);
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Basics</CardTitle>
            <CardDescription>
              Configure the event title, category, status, and URL-friendly slug.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="off"
                        placeholder="Sunday Service"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="off"
                        placeholder="sunday-service"
                        {...field}
                        onChange={(event) => {
                          setIsSlugManuallyEdited(true);
                          field.onChange(slugify(event.target.value));
                        }}
                      />
                    </FormControl>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <FormDescription>
                        Use lowercase letters, numbers, and hyphens.
                      </FormDescription>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={regenerateSlugFromTitle}
                      >
                        Regenerate from title
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        requestCategoryChange(value as EventCategory)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {
                        CATEGORY_OPTIONS.find(
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
                name="status"
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
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {
                        STATUS_OPTIONS.find(
                          (option) => option.value === field.value
                        )?.description
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Descriptions</CardTitle>
            <CardDescription>
              Add participant-facing copy shown before and after registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={control}
              name="preDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Join our Sunday service for worship, fellowship, and teaching."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the event before users register.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="postDescription.message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post-registration Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Thank you for registering. Please arrive 15 minutes early."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Shown after a user completes registration.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="termsAndConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms and Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please arrive 15 minutes early and present your registration QR code during check-in."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional instructions, attendance rules, consent terms, or
                    participation requirements.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>
              Add image URLs only. Uploads and media library selection can be
              connected later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">Event Images</h3>
                <p className="text-sm text-muted-foreground">
                  Add one or more HTTP or HTTPS image URLs.
                </p>
              </div>

              {imageRows.length > 0 ? (
                <div className="space-y-3">
                  {imageRows.map((row, index) => (
                    <FormField
                      key={row.id}
                      control={control}
                      name={`images.imageLinks.${index}`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                            <div className="flex-1 space-y-2">
                              <FormLabel>Image URL {index + 1}</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/event-1.jpg"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="sm:mt-8"
                              aria-label={`Remove event image ${index + 1}`}
                              onClick={() => removeImageRow(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No event image URLs added yet.
                </p>
              )}

              <Button type="button" variant="outline" onClick={addImageRow}>
                Add Image
              </Button>
            </div>

            <FormField
              control={control}
              name="images.bannerLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/banner.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use a wide image suitable for the event header.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={announcementDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            cancelAnnouncementChange();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change to announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              Announcement events cannot contain sessions. Continuing will remove
              all currently configured sessions and their session-level questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" onClick={cancelAnnouncementChange}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmAnnouncementChange}>
              Remove Sessions and Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
