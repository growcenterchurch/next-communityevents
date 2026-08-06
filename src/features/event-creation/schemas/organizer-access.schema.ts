import { z } from "zod";

import { EVENT_ACCESS_LEVELS } from "../constants";

const communityOptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  avatarUrl: z.string().optional(),
});

export const organizerSchema = z.object({
  organizers: z.array(communityOptionSchema).min(1, "Select at least one organizer."),
  contacts: z.array(communityOptionSchema),
});

const publicAccessSchema = z.object({
  accessLevel: z.literal(EVENT_ACCESS_LEVELS[0]),
});

const privateAccessSchema = z.object({
  accessLevel: z.literal(EVENT_ACCESS_LEVELS[1]),
  allowedUserTypes: z.array(z.string()),
  allowedRoles: z.array(z.string()),
  allowedCampuses: z.array(z.string()),
  allowedCommunities: z.array(communityOptionSchema),
});

export const eventAccessSchema = z.discriminatedUnion("accessLevel", [
  publicAccessSchema,
  privateAccessSchema,
]).superRefine((values, context) => {
  if (values.accessLevel !== "private") {
    return;
  }

  const hasAtLeastOne =
    values.allowedUserTypes.length +
      values.allowedRoles.length +
      values.allowedCampuses.length +
      values.allowedCommunities.length >
    0;

  if (!hasAtLeastOne) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select at least one restriction for a private event.",
    });
  }
});
