"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { EventCategory, EventStatus } from "../constants";

type EventBasicsPreviewCardProps = {
  title: string;
  category: EventCategory;
  status: EventStatus;
  preDescription: string;
  firstImageUrl?: string;
};

const CATEGORY_LABELS = {
  registration: "Registration",
  "internal-attendance": "Internal Attendance",
  announcement: "Announcement",
  "external-attendance": "External Attendance",
} satisfies Record<EventCategory, string>;

const STATUS_LABELS = {
  draft: "Draft",
  active: "Active",
  inactive: "Inactive",
} satisfies Record<EventStatus, string>;

function isValidImageUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getStatusBadgeClassName(status: EventStatus) {
  if (status === "active") {
    return "border-transparent bg-green-700 text-white hover:bg-green-700/80";
  }

  if (status === "inactive") {
    return "bg-gray-500 text-white hover:bg-gray-500/80";
  }

  return undefined;
}

export function EventBasicsPreviewCard({
  title,
  category,
  status,
  preDescription,
  firstImageUrl = "",
}: EventBasicsPreviewCardProps) {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [firstImageUrl]);

  const previewTitle = title.trim() || "Untitled Event";
  const description =
    preDescription.trim() || "The event description will appear here.";
  const hasValidImageUrl = isValidImageUrl(firstImageUrl);
  const shouldShowImage = hasValidImageUrl && !hasImageError;

  return (
    <Card className="overflow-hidden rounded-xl">
      <div className="flex flex-col md:flex-row">
        <div className="relative h-60 overflow-hidden bg-muted md:h-96 md:w-1/2">
          {shouldShowImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={firstImageUrl}
              alt={`${previewTitle} event preview`}
              className="h-full w-full object-contain"
              onError={() => setHasImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
              <ImageIcon className="h-10 w-10" />
              <span className="px-4 text-center text-sm">
                {firstImageUrl && (!hasValidImageUrl || hasImageError)
                  ? "Unable to load the first event image."
                  : "No event image preview"}
              </span>
            </div>
          )}
        </div>

        <div className="md:w-1/2">
          <CardHeader>
            <CardTitle className="text-center md:text-left">
              {previewTitle}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-4 md:items-start">
            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
              <Badge className={getStatusBadgeClassName(status)}>
                {STATUS_LABELS[status]}
              </Badge>
              <Badge variant="secondary">{CATEGORY_LABELS[category]}</Badge>
            </div>

            <p className="max-h-40 overflow-y-auto whitespace-pre-line text-center text-sm text-muted-foreground md:text-left">
              {description}
            </p>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
