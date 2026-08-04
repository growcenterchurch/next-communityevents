import { API_BASE_URL, API_KEY } from "@/lib/config";

import type { CreateEventPayload } from "../mappers/create-event-payload.mapper";

export const CREATE_EVENT_ENDPOINT = `${
  API_BASE_URL || "http://localhost:8080"
}/api/v2/internal/events`;

export type CreateEventResponse = {
  data?: {
    code?: string;
    eventCode?: string;
    slug?: string;
  };
  code?: string;
  eventCode?: string;
  slug?: string;
  message?: string;
};

export type CreateEventMutationArg = {
  payload: CreateEventPayload;
  accessToken: string;
};

export type ServerFieldError = {
  path: string;
  message: string;
};

export class CreateEventApiError extends Error {
  status: number;
  fieldErrors: ServerFieldError[];

  constructor(message: string, status: number, fieldErrors: ServerFieldError[]) {
    super(message);
    this.name = "CreateEventApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type ErrorResponse = {
  message?: string;
  errors?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function normalizeFieldErrors(errors: unknown): ServerFieldError[] {
  if (!errors) {
    return [];
  }

  if (Array.isArray(errors)) {
    return errors.flatMap((error) => {
      if (!isObject(error)) {
        return [];
      }

      const path = error.path ?? error.field ?? error.property;
      const message = error.message;

      return typeof path === "string" && typeof message === "string"
        ? [{ path, message }]
        : [];
    });
  }

  if (isObject(errors)) {
    return Object.entries(errors).flatMap(([path, value]) => {
      if (typeof value === "string") {
        return [{ path, message: value }];
      }

      if (Array.isArray(value) && typeof value[0] === "string") {
        return [{ path, message: value[0] }];
      }

      return [];
    });
  }

  return [];
}

async function parseErrorResponse(response: Response) {
  try {
    return (await response.json()) as ErrorResponse;
  } catch {
    return {};
  }
}

export async function createEvent(
  url: string,
  { arg }: { arg: CreateEventMutationArg }
): Promise<CreateEventResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY || "",
      Authorization: `Bearer ${arg.accessToken}`,
    },
    body: JSON.stringify(arg.payload),
  });

  if (!response.ok) {
    const errorResponse = await parseErrorResponse(response);
    const fieldErrors = normalizeFieldErrors(errorResponse.errors);

    throw new CreateEventApiError(
      errorResponse.message || "Unable to create the event.",
      response.status,
      fieldErrors
    );
  }

  return (await response.json()) as CreateEventResponse;
}

export function getCreatedEventCode(response: CreateEventResponse) {
  return (
    response.data?.eventCode ??
    response.data?.code ??
    response.eventCode ??
    response.code ??
    response.data?.slug ??
    response.slug
  );
}
