import { format, isValid } from "date-fns";

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && isValid(value);
}

export function formatEventSchedulePreview(
  startAt: Date | null,
  endAt: Date | null,
  timezone: string
) {
  if (!isValidDate(startAt) || !isValidDate(endAt)) {
    return null;
  }

  const sameDay =
    startAt.getFullYear() === endAt.getFullYear() &&
    startAt.getMonth() === endAt.getMonth() &&
    startAt.getDate() === endAt.getDate();

  const dateLabel = sameDay
    ? format(startAt, "EEEE, d MMMM yyyy")
    : `${format(startAt, "EEEE, d MMMM yyyy")} - ${format(
        endAt,
        "EEEE, d MMMM yyyy"
      )}`;

  return `${dateLabel}\n${format(startAt, "HH:mm")}-${format(
    endAt,
    "HH:mm"
  )} ${timezone}`;
}
