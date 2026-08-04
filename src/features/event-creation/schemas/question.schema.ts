import { z } from "zod";

import { QUESTION_AUDIENCES, QUESTION_TYPES } from "../constants";

const audienceSchema = z.enum(QUESTION_AUDIENCES);
const choiceQuestionTypes = new Set(["single_choice", "multiple_choice"]);

const optionalNumberSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.number().finite("Enter a valid number.").optional()
);

function hasDuplicateValues(values: string[]) {
  const normalizedValues = values.map((value) => value.trim().toLowerCase());

  return new Set(normalizedValues).size !== normalizedValues.length;
}

function hasDuplicateAudiences(values: string[]) {
  return new Set(values).size !== values.length;
}

export const eventQuestionSchema = z
  .object({
    clientId: z.string().min(1),
    text: z.string().trim().min(1, "Enter a question."),
    type: z.enum(QUESTION_TYPES),
    requiredFor: z.array(audienceSchema),
    visibleFor: z
      .array(audienceSchema)
      .min(1, "Select at least one audience that can see this question."),
    choices: z.array(z.string()),
    minValue: optionalNumberSchema,
    maxValue: optionalNumberSchema,
  })
  .superRefine((question, context) => {
    if (hasDuplicateAudiences(question.visibleFor)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visibleFor"],
        message: "Each visible audience can only be selected once.",
      });
    }

    if (hasDuplicateAudiences(question.requiredFor)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requiredFor"],
        message: "Each required audience can only be selected once.",
      });
    }

    const visibleAudiences = new Set(question.visibleFor);
    const invalidRequiredAudience = question.requiredFor.find(
      (audience) => !visibleAudiences.has(audience)
    );

    if (invalidRequiredAudience) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requiredFor"],
        message: "Required audiences must also be visible.",
      });
    }

    if (choiceQuestionTypes.has(question.type)) {
      const trimmedChoices = question.choices.map((choice) => choice.trim());

      if (trimmedChoices.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["choices"],
          message: "Add at least one choice.",
        });
      }

      const blankChoiceIndex = trimmedChoices.findIndex((choice) => !choice);

      if (blankChoiceIndex >= 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["choices", blankChoiceIndex],
          message: "Enter a choice value.",
        });
      }

      if (trimmedChoices.length > 0 && hasDuplicateValues(trimmedChoices)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["choices"],
          message: "Choice values must be unique.",
        });
      }
    } else if (question.choices.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["choices"],
        message: "Choices are only available for choice questions.",
      });
    }

    if (question.type === "number") {
      if (
        question.minValue !== undefined &&
        question.maxValue !== undefined &&
        question.maxValue < question.minValue
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maxValue"],
          message: "Maximum value must be greater than or equal to minimum value.",
        });
      }
    } else if (question.minValue !== undefined || question.maxValue !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minValue"],
        message: "Numeric rules are only available for number questions.",
      });
    }
  });
