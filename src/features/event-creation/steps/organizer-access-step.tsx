"use client";

import { useFormContext, useWatch } from "react-hook-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { CommunityMultiSelect } from "../components/community-multi-select";
import { StringMultiSelect } from "../components/string-multi-select";
import type { CreateEventFormValues, EventAccessFormValue } from "../types";

const USER_TYPE_OPTIONS = [
  { value: "visitor", label: "Visitor" },
  { value: "member", label: "Member" },
  { value: "worker", label: "Worker" },
] as const;

const ROLE_OPTIONS = [
  { value: "leader", label: "Leader" },
  { value: "facilitator", label: "Facilitator" },
  { value: "core", label: "Core Team" },
] as const;

const CAMPUS_OPTIONS = [
  { value: "jakarta", label: "Jakarta" },
  { value: "bandung", label: "Bandung" },
  { value: "surabaya", label: "Surabaya" },
] as const;

const publicAccessValue: EventAccessFormValue = { accessLevel: "public" };

const privateAccessValue: EventAccessFormValue = {
  accessLevel: "private",
  allowedUserTypes: [],
  allowedRoles: [],
  allowedCampuses: [],
  allowedCommunities: [],
};

export function OrganizerAccessStep() {
  const form = useFormContext<CreateEventFormValues>();
  const { control, setValue } = form;
  const access = useWatch({ control, name: "access" });
  const isPrivate = access.accessLevel === "private";

  function setAccessLevel(accessLevel: "public" | "private") {
    setValue(
      "access",
      accessLevel === "private" ? privateAccessValue : publicAccessValue,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organizer & Contacts</CardTitle>
          <CardDescription>
            Search users by name for organizers and event contacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <FormField
            control={control}
            name="organizer.organizers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Organizers</FormLabel>
                <FormControl>
                  <CommunityMultiSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Search and add organizers"
                  />
                </FormControl>
                <FormDescription>
                  At least one organizer is required.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="organizer.contacts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Contacts</FormLabel>
                <FormControl>
                  <CommunityMultiSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Search and add contacts"
                  />
                </FormControl>
                <FormDescription>
                  Optional contacts shown for event support or questions.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access</CardTitle>
          <CardDescription>
            Public events are open. Private events require at least one allowed
            user type, role, campus, or user restriction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={control}
            name="access"
            render={() => (
              <FormItem>
                <FormLabel>Access Level</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={access.accessLevel}
                    onValueChange={(value) =>
                      setAccessLevel(value as "public" | "private")
                    }
                    className="grid gap-3 md:grid-cols-2"
                  >
                    <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 [&:has([data-state=checked])]:border-primary">
                      <RadioGroupItem value="public" className="mt-1" />
                      <span className="space-y-1">
                        <span className="block font-medium">Public</span>
                        <span className="block text-sm font-normal text-muted-foreground">
                          Anyone with event access can view or register.
                        </span>
                      </span>
                    </Label>
                    <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 [&:has([data-state=checked])]:border-primary">
                      <RadioGroupItem value="private" className="mt-1" />
                      <span className="space-y-1">
                        <span className="block font-medium">Private</span>
                        <span className="block text-sm font-normal text-muted-foreground">
                          Limit access to selected audiences or users.
                        </span>
                      </span>
                    </Label>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isPrivate ? (
            <div className="space-y-6 rounded-lg border p-4">
              <div>
                <h3 className="font-medium">Private Restrictions</h3>
                <p className="text-sm text-muted-foreground">
                  Access currently assumes OR semantics pending backend
                  confirmation.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={control}
                  name="access.allowedUserTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Types</FormLabel>
                      <FormControl>
                        <StringMultiSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={USER_TYPE_OPTIONS}
                          placeholder="Select user types"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="access.allowedRoles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roles</FormLabel>
                      <FormControl>
                        <StringMultiSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={ROLE_OPTIONS}
                          placeholder="Select roles"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="access.allowedCampuses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campuses</FormLabel>
                      <FormControl>
                        <StringMultiSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={CAMPUS_OPTIONS}
                          placeholder="Select campuses"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="access.allowedCommunities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Users</FormLabel>
                      <FormControl>
                        <CommunityMultiSelect
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Search and add users"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
