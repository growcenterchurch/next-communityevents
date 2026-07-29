import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SessionsStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions</CardTitle>
        <CardDescription>
          Add and configure services, classes, tracks, workshops, and other event
          sessions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Session builders will be implemented in a later step.
        </p>
      </CardContent>
    </Card>
  );
}
