import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function OrganizerAccessStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizer & Access</CardTitle>
        <CardDescription>
          Select organizers and contacts, then configure public or private access
          restrictions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Organizer and access controls will be implemented in a later step.
        </p>
      </CardContent>
    </Card>
  );
}
