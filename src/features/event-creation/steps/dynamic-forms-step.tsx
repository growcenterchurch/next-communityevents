import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DynamicFormsStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dynamic Forms</CardTitle>
        <CardDescription>
          Build event-level and session-level registration questions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Dynamic registration form builders will be implemented in a later step.
        </p>
      </CardContent>
    </Card>
  );
}
