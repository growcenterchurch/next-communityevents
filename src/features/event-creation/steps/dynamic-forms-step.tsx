"use client";

import { useEffect, useMemo, useState } from "react";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation, useSortable } from "@dnd-kit/react/sortable";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  ListPlus,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useFieldArray,
  useFormContext,
  useWatch,
  type FieldErrors,
  type FieldPath,
} from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  QUESTION_AUDIENCES,
  QUESTION_TYPES,
  SESSION_TYPES,
  type QuestionAudience,
  type QuestionType,
} from "../constants";
import { createDefaultQuestion } from "../defaults";
import type {
  CreateEventFormValues,
  EventQuestionFormValue,
  EventSessionFormValue,
} from "../types";

type QuestionArrayPath = "questions" | `sessions.${number}.questions`;
type DynamicFormsTab = "event" | "sessions";

const QUESTION_TYPE_OPTIONS = QUESTION_TYPES.map((value) => ({
  value,
  label: toTitleLabel(value),
})) satisfies { value: QuestionType; label: string }[];

const AUDIENCE_OPTIONS = QUESTION_AUDIENCES.map((value) => ({
  value,
  label: toTitleLabel(value),
})) satisfies { value: QuestionAudience; label: string }[];

const SESSION_TYPE_LABELS = new Map(
  SESSION_TYPES.map((value) => [value, toTitleLabel(value)])
);

function toTitleLabel(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function createClientId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `client-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function isChoiceQuestionType(type: QuestionType) {
  return type === "single_choice" || type === "multiple_choice";
}

function cloneQuestion(question: EventQuestionFormValue): EventQuestionFormValue {
  return {
    clientId: createClientId(),
    text: question.text,
    type: question.type,
    requiredFor: [...question.requiredFor],
    visibleFor: [...question.visibleFor],
    choices: [...question.choices],
    minValue: question.minValue,
    maxValue: question.maxValue,
  };
}

function countErrors(value: unknown): number {
  if (!value || typeof value !== "object") {
    return 0;
  }

  if ("message" in value && typeof value.message === "string") {
    return 1;
  }

  return Object.values(value as Record<string, unknown>).reduce<number>(
    (total, child) => total + countErrors(child),
    0
  );
}

function getFirstQuestionErrorIndex(errors: unknown) {
  if (!Array.isArray(errors)) {
    return -1;
  }

  return errors.findIndex(Boolean);
}

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }

  return undefined;
}

function fieldPath(path: string) {
  return path as FieldPath<CreateEventFormValues>;
}

function addToSetIfMissing(values: Set<string>, value: string) {
  if (values.has(value)) {
    return values;
  }

  return new Set(values).add(value);
}

type QuestionBuilderProps = {
  arrayPath: QuestionArrayPath;
  description: string;
  emptyDescription: string;
  expandedQuestionIds: Set<string>;
  questionErrors: FieldErrors<EventQuestionFormValue>[] | undefined;
  title: string;
  onExpandedQuestionIdsChange: (updater: (previous: Set<string>) => Set<string>) => void;
};

function QuestionBuilder({
  arrayPath,
  description,
  emptyDescription,
  expandedQuestionIds,
  questionErrors,
  title,
  onExpandedQuestionIdsChange,
}: QuestionBuilderProps) {
  const form = useFormContext<CreateEventFormValues>();
  const { control, getValues } = form;
  const { fields, append, remove, move, insert } = useFieldArray<
    CreateEventFormValues,
    QuestionArrayPath,
    "formFieldId"
  >({
    control,
    name: arrayPath,
    keyName: "formFieldId",
  });
  const totalErrorCount = countErrors(questionErrors);

  useEffect(() => {
    const firstInvalidIndex = getFirstQuestionErrorIndex(questionErrors);

    if (firstInvalidIndex < 0) {
      return;
    }

    const invalidQuestionId = getValues(
      fieldPath(`${arrayPath}.${firstInvalidIndex}.clientId`)
    );

    if (typeof invalidQuestionId !== "string") {
      return;
    }

    onExpandedQuestionIdsChange((previous) =>
      addToSetIfMissing(previous, invalidQuestionId)
    );
  }, [arrayPath, getValues, onExpandedQuestionIdsChange, questionErrors]);

  function addQuestion() {
    const question = createDefaultQuestion();

    append(question);
    onExpandedQuestionIdsChange((previous) => new Set(previous).add(question.clientId));
  }

  function duplicateQuestionAt(index: number) {
    const duplicatedQuestion = cloneQuestion(
      getValues(fieldPath(`${arrayPath}.${index}`)) as EventQuestionFormValue
    );

    insert(index + 1, duplicatedQuestion);
    onExpandedQuestionIdsChange((previous) =>
      new Set(previous).add(duplicatedQuestion.clientId)
    );
  }

  function removeQuestionAt(index: number, id: string) {
    remove(index);
    onExpandedQuestionIdsChange((previous) => {
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
  }

  function toggleExpanded(id: string) {
    onExpandedQuestionIdsChange((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function moveQuestion(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= fields.length) {
      return;
    }

    move(fromIndex, toIndex);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (event.canceled || !isSortableOperation(event.operation)) {
      return;
    }

    const sourceIndex = event.operation.source?.index;
    const targetIndex = event.operation.target?.index;

    if (
      typeof sourceIndex !== "number" ||
      typeof targetIndex !== "number" ||
      sourceIndex === targetIndex
    ) {
      return;
    }

    moveQuestion(sourceIndex, targetIndex);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-sm text-muted-foreground">
            {fields.length} {fields.length === 1 ? "question" : "questions"} configured
          </p>
        </div>
        <Button type="button" onClick={addQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </div>

      {totalErrorCount > 0 ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Some registration questions need attention</AlertTitle>
          <AlertDescription>
            Expand the highlighted question cards and review their field messages before continuing.
          </AlertDescription>
        </Alert>
      ) : null}

      {fields.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <ListPlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No questions configured</h3>
              <p className="max-w-xl text-sm text-muted-foreground">
                {emptyDescription}
              </p>
            </div>
            <Button type="button" onClick={addQuestion}>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DragDropProvider onDragEnd={handleDragEnd}>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <SortableQuestionCard
                key={field.formFieldId}
                id={field.clientId}
                index={index}
                arrayPath={arrayPath}
                totalQuestions={fields.length}
                isExpanded={expandedQuestionIds.has(field.clientId)}
                questionError={questionErrors?.[index]}
                onToggleExpanded={toggleExpanded}
                onDuplicate={duplicateQuestionAt}
                onRemove={removeQuestionAt}
                onMoveUp={(questionIndex) =>
                  moveQuestion(questionIndex, questionIndex - 1)
                }
                onMoveDown={(questionIndex) =>
                  moveQuestion(questionIndex, questionIndex + 1)
                }
              />
            ))}
          </div>
        </DragDropProvider>
      )}
    </div>
  );
}

type QuestionCardProps = {
  arrayPath: QuestionArrayPath;
  id: string;
  index: number;
  isExpanded: boolean;
  questionError: FieldErrors<EventQuestionFormValue> | undefined;
  totalQuestions: number;
  onDuplicate: (index: number) => void;
  onMoveDown: (index: number) => void;
  onMoveUp: (index: number) => void;
  onRemove: (index: number, id: string) => void;
  onToggleExpanded: (id: string) => void;
};

function SortableQuestionCard(props: QuestionCardProps) {
  const { handleRef, ref, isDragging } = useSortable({
    id: props.id,
    index: props.index,
    type: `question-${props.arrayPath}`,
  });

  return (
    <div ref={ref} className={cn(isDragging && "opacity-60")}>
      <QuestionCard {...props} dragHandleRef={handleRef} />
    </div>
  );
}

function QuestionCard({
  arrayPath,
  id,
  index,
  isExpanded,
  questionError,
  totalQuestions,
  onDuplicate,
  onMoveDown,
  onMoveUp,
  onRemove,
  onToggleExpanded,
  dragHandleRef,
}: QuestionCardProps & { dragHandleRef: (element: Element | null) => void }) {
  const form = useFormContext<CreateEventFormValues>();
  const { control, setValue, trigger } = form;
  const question = useWatch({ control, name: fieldPath(`${arrayPath}.${index}`) }) as
    | EventQuestionFormValue
    | undefined;
  const visibleFor = question?.visibleFor ?? [];
  const requiredFor = question?.requiredFor ?? [];
  const questionType = question?.type ?? "short_text";
  const questionTitle = question?.text.trim() || "Untitled Question";
  const errorCount = countErrors(questionError);
  const visibleSummary = visibleFor.length
    ? visibleFor.map(toTitleLabel).join(", ")
    : "No audience";
  const requiredSummary = requiredFor.length
    ? `${requiredFor.map(toTitleLabel).join(", ")} required`
    : "Optional";

  function handleQuestionTypeChange(nextType: QuestionType) {
    const choices = question?.choices ?? [];

    setValue(fieldPath(`${arrayPath}.${index}.type`), nextType, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (isChoiceQuestionType(nextType)) {
      setValue(
        fieldPath(`${arrayPath}.${index}.choices`),
        choices.length > 0 ? [...choices] : [""],
        { shouldDirty: true, shouldValidate: true }
      );
      setValue(fieldPath(`${arrayPath}.${index}.minValue`), undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(fieldPath(`${arrayPath}.${index}.maxValue`), undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else if (nextType === "number") {
      setValue(fieldPath(`${arrayPath}.${index}.choices`), [], {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else {
      setValue(fieldPath(`${arrayPath}.${index}.choices`), [], {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(fieldPath(`${arrayPath}.${index}.minValue`), undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(fieldPath(`${arrayPath}.${index}.maxValue`), undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    void trigger(fieldPath(`${arrayPath}.${index}`));
  }

  return (
    <Card className={cn(errorCount > 0 && "border-destructive/60")}>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <Button
              ref={dragHandleRef}
              type="button"
              variant="ghost"
              size="icon"
              className="mt-1 cursor-grab active:cursor-grabbing"
              aria-label={`Reorder question ${index + 1}`}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Question {index + 1}</Badge>
                <Badge>{toTitleLabel(questionType)}</Badge>
                <Badge variant="secondary">{visibleSummary}</Badge>
                <Badge variant="secondary">{requiredSummary}</Badge>
                {errorCount > 0 ? (
                  <Badge variant="destructive">Needs attention</Badge>
                ) : null}
              </div>
              <div>
                <CardTitle className="text-xl">{questionTitle}</CardTitle>
                <CardDescription className="mt-1">
                  Display order {index + 1} is generated from this card position.
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end lg:self-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={index === 0}
              onClick={() => onMoveUp(index)}
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              Move Up
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={index === totalQuestions - 1}
              onClick={() => onMoveDown(index)}
            >
              <ArrowDown className="mr-2 h-4 w-4" />
              Move Down
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDuplicate(index)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this question?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {question?.text.trim()
                      ? `"${question.text.trim()}" will be removed from the registration form.`
                      : "This question will be removed from the registration form."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className={buttonVariants({ variant: "destructive" })}
                    onClick={() => onRemove(index, id)}
                  >
                    Delete Question
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={isExpanded ? "Collapse question" : "Expand question"}
              onClick={() => onToggleExpanded(id)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded ? (
        <CardContent className="space-y-6">
          {errorCount > 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>This question has fields that need attention.</AlertTitle>
              <AlertDescription>Review the messages below.</AlertDescription>
            </Alert>
          ) : null}

          <section className="space-y-4">
            <div>
              <h4 className="font-medium">Question</h4>
              <p className="text-sm text-muted-foreground">
                Set the question text and answer type.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
              <FormField
                control={control}
                name={fieldPath(`${arrayPath}.${index}.text`)}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="How did you hear about this event?"
                        value={typeof field.value === "string" ? field.value : ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={fieldPath(`${arrayPath}.${index}.type`)}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select
                      value={typeof field.value === "string" ? field.value : "short_text"}
                      onValueChange={(value) =>
                        handleQuestionTypeChange(value as QuestionType)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {QUESTION_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <Separator />

          <QuestionAudienceFields
            arrayPath={arrayPath}
            index={index}
            visibleFor={visibleFor}
            requiredFor={requiredFor}
          />

          {isChoiceQuestionType(questionType) ? (
            <>
              <Separator />
              <QuestionChoiceEditor
                arrayPath={arrayPath}
                index={index}
                questionError={questionError}
              />
            </>
          ) : null}

          {questionType === "number" ? (
            <>
              <Separator />
              <QuestionNumberRules arrayPath={arrayPath} index={index} />
            </>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}

type QuestionAudienceFieldsProps = {
  arrayPath: QuestionArrayPath;
  index: number;
  requiredFor: QuestionAudience[];
  visibleFor: QuestionAudience[];
};

function QuestionAudienceFields({
  arrayPath,
  index,
  requiredFor,
  visibleFor,
}: QuestionAudienceFieldsProps) {
  const { control, setValue, trigger } = useFormContext<CreateEventFormValues>();

  function setVisibleAudience(audience: QuestionAudience, checked: boolean) {
    const visibleAudienceSet = new Set(visibleFor);

    if (checked) {
      visibleAudienceSet.add(audience);
    } else {
      visibleAudienceSet.delete(audience);
    }

    const nextVisibleFor = AUDIENCE_OPTIONS.map((option) => option.value).filter(
      (value) => visibleAudienceSet.has(value)
    );
    const nextRequiredFor = requiredFor.filter((value) =>
      nextVisibleFor.includes(value)
    );

    setValue(fieldPath(`${arrayPath}.${index}.visibleFor`), nextVisibleFor, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(fieldPath(`${arrayPath}.${index}.requiredFor`), nextRequiredFor, {
      shouldDirty: true,
      shouldValidate: true,
    });
    void trigger(fieldPath(`${arrayPath}.${index}`));
  }

  function setRequiredAudience(audience: QuestionAudience, checked: boolean) {
    if (!visibleFor.includes(audience)) {
      return;
    }

    const requiredAudienceSet = new Set(requiredFor);

    if (checked) {
      requiredAudienceSet.add(audience);
    } else {
      requiredAudienceSet.delete(audience);
    }

    const nextRequiredFor = AUDIENCE_OPTIONS.map((option) => option.value).filter(
      (value) => requiredAudienceSet.has(value)
    );

    setValue(fieldPath(`${arrayPath}.${index}.requiredFor`), nextRequiredFor, {
      shouldDirty: true,
      shouldValidate: true,
    });
    void trigger(fieldPath(`${arrayPath}.${index}`));
  }

  return (
    <section className="space-y-4">
      <div>
        <h4 className="font-medium">Audience</h4>
        <p className="text-sm text-muted-foreground">
          Configure who can see the question and who must answer it.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={control}
          name={fieldPath(`${arrayPath}.${index}.visibleFor`)}
          render={() => (
            <FormItem>
              <FormLabel>Visible For</FormLabel>
              <FormDescription>Choose who can see this question.</FormDescription>
              <div className="space-y-3">
                {AUDIENCE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`${arrayPath}-${index}-visible-${option.value}`}
                      checked={visibleFor.includes(option.value)}
                      onCheckedChange={(checked) =>
                        setVisibleAudience(option.value, checked === true)
                      }
                    />
                    <Label htmlFor={`${arrayPath}-${index}-visible-${option.value}`}>
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={fieldPath(`${arrayPath}.${index}.requiredFor`)}
          render={() => (
            <FormItem>
              <FormLabel>Required For</FormLabel>
              <FormDescription>Choose who must answer this question.</FormDescription>
              <div className="space-y-3">
                {AUDIENCE_OPTIONS.map((option) => {
                  const isVisible = visibleFor.includes(option.value);

                  return (
                    <div key={option.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${arrayPath}-${index}-required-${option.value}`}
                        checked={requiredFor.includes(option.value)}
                        disabled={!isVisible}
                        onCheckedChange={(checked) =>
                          setRequiredAudience(option.value, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`${arrayPath}-${index}-required-${option.value}`}
                        className={cn(!isVisible && "text-muted-foreground")}
                      >
                        {option.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );
}

type QuestionChoiceEditorProps = {
  arrayPath: QuestionArrayPath;
  index: number;
  questionError?: FieldErrors<EventQuestionFormValue>;
};

function QuestionChoiceEditor({
  arrayPath,
  index,
  questionError,
}: QuestionChoiceEditorProps) {
  const { control, setValue, trigger } = useFormContext<CreateEventFormValues>();
  const choicesPath = fieldPath(`${arrayPath}.${index}.choices`);
  const watchedChoices = useWatch({ control, name: choicesPath });
  const choices = Array.isArray(watchedChoices)
    ? watchedChoices.map((choice) => (typeof choice === "string" ? choice : ""))
    : [];
  const [choiceKeys, setChoiceKeys] = useState<string[]>(() =>
    choices.map(() => createClientId())
  );

  useEffect(() => {
    setChoiceKeys((previous) => {
      if (previous.length === choices.length) {
        return previous;
      }

      if (previous.length < choices.length) {
        return [
          ...previous,
          ...Array.from({ length: choices.length - previous.length }, () =>
            createClientId()
          ),
        ];
      }

      return previous.slice(0, choices.length);
    });
  }, [choices.length]);

  function setChoices(nextChoices: string[]) {
    setValue(choicesPath, nextChoices, {
      shouldDirty: true,
      shouldValidate: true,
    });
    void trigger(fieldPath(`${arrayPath}.${index}`));
  }

  function updateChoice(choiceIndex: number, value: string) {
    setChoices(
      choices.map((choice, currentIndex) =>
        currentIndex === choiceIndex ? value : choice
      )
    );
  }

  function addChoice() {
    if (choices.at(-1)?.trim() === "") {
      return;
    }

    setChoiceKeys((previous) => [...previous, createClientId()]);
    setChoices([...choices, ""]);
  }

  function removeChoice(choiceIndex: number) {
    setChoiceKeys((previous) =>
      previous.filter((_, currentIndex) => currentIndex !== choiceIndex)
    );
    setChoices(choices.filter((_, currentIndex) => currentIndex !== choiceIndex));
  }

  function moveChoice(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= choices.length) {
      return;
    }

    const nextChoices = [...choices];
    const [choice] = nextChoices.splice(fromIndex, 1);
    nextChoices.splice(toIndex, 0, choice);

    setChoiceKeys((previous) => {
      const nextKeys = [...previous];
      const [key] = nextKeys.splice(fromIndex, 1);
      nextKeys.splice(toIndex, 0, key);
      return nextKeys;
    });
    setChoices(nextChoices);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="font-medium">Choices</h4>
          <p className="text-sm text-muted-foreground">
            Add the available answer choices in the order they should appear.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addChoice}>
          <Plus className="mr-2 h-4 w-4" />
          Add Choice
        </Button>
      </div>
      <FormField
        control={control}
        name={choicesPath}
        render={() => (
          <FormItem>
            <div className="space-y-3">
              {choices.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Add at least one choice.
                </p>
              ) : null}
              {choices.map((choice, choiceIndex) => (
                <div
                  key={choiceKeys[choiceIndex] ?? `${arrayPath}-${index}-${choiceIndex}`}
                  className="grid gap-2 rounded-md border p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                >
                  <Badge variant="outline" className="w-fit">
                    {choiceIndex + 1}
                  </Badge>
                  <div className="space-y-1">
                    <Label htmlFor={`${arrayPath}-${index}-choice-${choiceIndex}`}>
                      Choice {choiceIndex + 1}
                    </Label>
                    <Input
                      id={`${arrayPath}-${index}-choice-${choiceIndex}`}
                      value={choice}
                      placeholder="Choice value"
                      aria-invalid={
                        getErrorMessage(questionError?.choices?.[choiceIndex])
                          ? true
                          : undefined
                      }
                      onChange={(event) =>
                        updateChoice(choiceIndex, event.target.value)
                      }
                    />
                    {getErrorMessage(questionError?.choices?.[choiceIndex]) ? (
                      <p className="text-sm font-medium text-destructive">
                        {getErrorMessage(questionError?.choices?.[choiceIndex])}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={choiceIndex === 0}
                      aria-label={`Move choice ${choiceIndex + 1} up`}
                      onClick={() => moveChoice(choiceIndex, choiceIndex - 1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={choiceIndex === choices.length - 1}
                      aria-label={`Move choice ${choiceIndex + 1} down`}
                      onClick={() => moveChoice(choiceIndex, choiceIndex + 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Remove choice ${choiceIndex + 1}`}
                      onClick={() => removeChoice(choiceIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  );
}

function QuestionNumberRules({ arrayPath, index }: QuestionChoiceEditorProps) {
  const { control } = useFormContext<CreateEventFormValues>();

  return (
    <section className="space-y-4">
      <div>
        <h4 className="font-medium">Numeric Rules</h4>
        <p className="text-sm text-muted-foreground">
          Optionally restrict the allowed numeric range.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={fieldPath(`${arrayPath}.${index}.minValue`)}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Value</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={typeof field.value === "number" ? field.value : ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === "" ? undefined : Number(event.target.value)
                    )
                  }
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={fieldPath(`${arrayPath}.${index}.maxValue`)}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Value</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={typeof field.value === "number" ? field.value : ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === "" ? undefined : Number(event.target.value)
                    )
                  }
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );
}

type SessionQuestionBuilderProps = {
  expandedQuestionIds: Set<string>;
  questionErrors: FieldErrors<EventQuestionFormValue>[] | undefined;
  sessionIndex: number;
  onExpandedQuestionIdsChange: (updater: (previous: Set<string>) => Set<string>) => void;
};

function SessionQuestionBuilder({
  expandedQuestionIds,
  questionErrors,
  sessionIndex,
  onExpandedQuestionIdsChange,
}: SessionQuestionBuilderProps) {
  return (
    <QuestionBuilder
      arrayPath={`sessions.${sessionIndex}.questions`}
      title="Session Questions"
      description="These questions are shown only when registering for the selected session."
      emptyDescription="Add questions that apply only to this session."
      expandedQuestionIds={expandedQuestionIds}
      questionErrors={questionErrors}
      onExpandedQuestionIdsChange={onExpandedQuestionIdsChange}
    />
  );
}

function getSessionQuestionErrors(
  sessionErrors: FieldErrors<EventSessionFormValue>[] | undefined,
  sessionIndex: number
) {
  return sessionErrors?.[sessionIndex]?.questions as
    | FieldErrors<EventQuestionFormValue>[]
    | undefined;
}

export function DynamicFormsStep() {
  const form = useFormContext<CreateEventFormValues>();
  const { control, formState, getValues } = form;
  const sessions = useWatch({ control, name: "sessions" });
  const eventQuestions = useWatch({ control, name: "questions" });
  const [activeTab, setActiveTab] = useState<DynamicFormsTab>("event");
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();
  const [expandedEventQuestionIds, setExpandedEventQuestionIds] = useState<Set<string>>(
    () => new Set()
  );
  const [expandedSessionQuestionIds, setExpandedSessionQuestionIds] = useState<
    Record<string, Set<string>>
  >({});
  const sessionOptions = useMemo(
    () =>
      (sessions ?? []).map((session) => ({
        clientId: session.clientId,
        title: session.title.trim() || "Untitled Session",
        type: SESSION_TYPE_LABELS.get(session.sessionType) ?? toTitleLabel(session.sessionType),
      })),
    [sessions]
  );
  const selectedSessionIndex = selectedSessionId
    ? (sessions ?? []).findIndex((session) => session.clientId === selectedSessionId)
    : -1;
  const selectedSession =
    selectedSessionIndex >= 0 ? sessions?.[selectedSessionIndex] : undefined;
  const eventQuestionErrors = Array.isArray(formState.errors.questions)
    ? (formState.errors.questions as FieldErrors<EventQuestionFormValue>[])
    : undefined;
  const sessionErrors = Array.isArray(formState.errors.sessions)
    ? (formState.errors.sessions as FieldErrors<EventSessionFormValue>[])
    : undefined;
  const selectedSessionQuestionErrors =
    selectedSessionIndex >= 0
      ? getSessionQuestionErrors(sessionErrors, selectedSessionIndex)
      : undefined;
  const totalErrorCount =
    countErrors(eventQuestionErrors) +
    (sessionErrors ?? []).reduce<number>(
      (total, sessionError) => total + countErrors(sessionError.questions),
      0
    );
  const sessionQuestionCount = (sessions ?? []).reduce(
    (total, session) => total + session.questions.length,
    0
  );

  useEffect(() => {
    if (!sessions?.length) {
      setSelectedSessionId(undefined);
      return;
    }

    if (selectedSessionId && sessions.some((session) => session.clientId === selectedSessionId)) {
      return;
    }

    setSelectedSessionId(sessions[0].clientId);
  }, [selectedSessionId, sessions]);

  useEffect(() => {
    const firstInvalidEventQuestionIndex = getFirstQuestionErrorIndex(
      eventQuestionErrors
    );

    if (firstInvalidEventQuestionIndex >= 0) {
      const invalidQuestionId = getValues(
        `questions.${firstInvalidEventQuestionIndex}.clientId`
      );

      setActiveTab("event");
      setExpandedEventQuestionIds((previous) =>
        addToSetIfMissing(previous, invalidQuestionId)
      );
      return;
    }

    if (!sessionErrors) {
      return;
    }

    const firstInvalidSessionIndex = sessionErrors.findIndex(
      (sessionError) => getFirstQuestionErrorIndex(sessionError?.questions) >= 0
    );

    if (firstInvalidSessionIndex < 0) {
      return;
    }

    const firstInvalidQuestionIndex = getFirstQuestionErrorIndex(
      sessionErrors[firstInvalidSessionIndex]?.questions
    );
    const invalidSessionId = getValues(
      `sessions.${firstInvalidSessionIndex}.clientId`
    );
    const invalidQuestionId = getValues(
      `sessions.${firstInvalidSessionIndex}.questions.${firstInvalidQuestionIndex}.clientId`
    );

    setActiveTab("sessions");
    setSelectedSessionId(invalidSessionId);
    setExpandedSessionQuestionIds((previous) => {
      const previousSet = previous[invalidSessionId] ?? new Set<string>();
      const nextSet = addToSetIfMissing(previousSet, invalidQuestionId);

      if (nextSet === previousSet) {
        return previous;
      }

      return {
        ...previous,
        [invalidSessionId]: nextSet,
      };
    });
  }, [eventQuestionErrors, getValues, sessionErrors]);

  function setSelectedSessionExpandedIds(
    updater: (previous: Set<string>) => Set<string>
  ) {
    if (!selectedSessionId) {
      return;
    }

    setExpandedSessionQuestionIds((previous) => {
      const previousSet = previous[selectedSessionId] ?? new Set<string>();
      const nextSet = updater(previousSet);

      if (nextSet === previousSet) {
        return previous;
      }

      return {
        ...previous,
        [selectedSessionId]: nextSet,
      };
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Dynamic Forms</CardTitle>
          <CardDescription>
            Build event-level and session-level registration questions.
          </CardDescription>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {eventQuestions?.length ?? 0} event {(eventQuestions?.length ?? 0) === 1 ? "question" : "questions"}
            </Badge>
            <Badge variant="secondary">
              {sessionQuestionCount} session {sessionQuestionCount === 1 ? "question" : "questions"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {totalErrorCount > 0 ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Some registration questions need attention before you can continue.</AlertTitle>
          <AlertDescription>
            The first invalid question has been opened in the relevant form tab.
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as DynamicFormsTab)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="event">Event Form</TabsTrigger>
          <TabsTrigger value="sessions" disabled={!sessions?.length}>
            Session Forms
          </TabsTrigger>
        </TabsList>
        <TabsContent value="event" className="mt-6">
          <QuestionBuilder
            arrayPath="questions"
            title="Event Questions"
            description="These questions are shown during registration for the whole event."
            emptyDescription="Add registration questions that apply to the whole event."
            expandedQuestionIds={expandedEventQuestionIds}
            questionErrors={eventQuestionErrors}
            onExpandedQuestionIdsChange={setExpandedEventQuestionIds}
          />
        </TabsContent>
        <TabsContent value="sessions" className="mt-6 space-y-6">
          {!sessions?.length ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Add at least one session before configuring session-specific questions.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="space-y-4">
                  <div>
                    <CardTitle>Session Form</CardTitle>
                    <CardDescription>
                      These questions are shown only when registering for the selected session.
                    </CardDescription>
                  </div>
                  <div className="max-w-xl space-y-2">
                    <Label htmlFor="session-form-selector">Select Session</Label>
                    <Select
                      value={selectedSessionId}
                      onValueChange={setSelectedSessionId}
                    >
                      <SelectTrigger id="session-form-selector">
                        <SelectValue placeholder="Select a session" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessionOptions.map((session) => (
                          <SelectItem key={session.clientId} value={session.clientId}>
                            {session.title} · {session.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
              </Card>

              {selectedSession && selectedSessionIndex >= 0 ? (
                <SessionQuestionBuilder
                  key={selectedSession.clientId}
                  sessionIndex={selectedSessionIndex}
                  expandedQuestionIds={
                    expandedSessionQuestionIds[selectedSession.clientId] ?? new Set()
                  }
                  questionErrors={selectedSessionQuestionErrors}
                  onExpandedQuestionIdsChange={setSelectedSessionExpandedIds}
                />
              ) : null}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
