import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LocationScheduleStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location & Schedule</CardTitle>
        <CardDescription>
          Configure the event location, schedule, timezone, recurrence, and
          notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Location and schedule fields will be implemented in a later step.
        </p>
      </CardContent>
    </Card>
  );
}
