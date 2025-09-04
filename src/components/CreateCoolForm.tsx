"use client";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UserMultiSelectCombobox } from "./UserMultiSelectCombobox";
import SearchUserDialog from "./SearchUser";
import withAuth from "@/components/providers/AuthWrapper";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

type UserSelection = {
  name: string;
  id: string;
};

export default function CreateCoolForm() {
  const [communityIdFormData, setCommunityIdFormData] = useState({
    facilitatorCommunityIds: [] as UserSelection[],
    leaderCommunityIds: [] as UserSelection[],
    coreCommunityIds: [] as UserSelection[],
  });
  // const { isAuthenticated, handleExpiredToken, getValidAccessToken } =
  //   useAuth();

  const formSchema = z.object({
    "text-input-0": z.string().min(1, { message: "This field is required" }),
    "text-input-1": z.string(),
    "select-0": z.string().min(1, { message: "This field is required" }),
    "select-1": z.string().min(1, { message: "This field is required" }),
    "select-2": z.string().min(1, { message: "This field is required" }),
    "select-3": z.string().min(1, { message: "This field is required" }),
    "select-4": z.string(),
    "text-0": z.string(),
    "text-1": z.string(),
    "text-2": z.string(),
    "checkbox-0": z.boolean().default(false).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      "text-input-0": "",
      "text-input-1": "",
      "select-0": "JKT",
      "select-1": "",
      "select-2": "hybrid",
      "select-3": "",
      "select-4": "all",
      "text-0": "",
      "text-1": "",
      "text-2": "",
      "checkbox-0": false,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  function onReset() {
    form.reset();
    form.clearErrors();
    setCommunityIdFormData({
      facilitatorCommunityIds: [],
      leaderCommunityIds: [],
      coreCommunityIds: [],
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-2">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-6 sm:p-10">
        <h2 className="text-2xl font-bold text-center mb-8">Create New COOL</h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            onReset={onReset}
            className="space-y-8"
          >
            <div className="grid grid-cols-12 gap-6">
              <FormField
                control={form.control}
                name="text-input-0"
                render={({ field }) => (
                  <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                    <FormLabel className="flex @5xl:flex shrink-0">
                      Cool Name
                    </FormLabel>

                    <div className="w-full">
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            key="text-input-0"
                            placeholder=""
                            type="text"
                            id="text-input-0"
                            className=" "
                            {...field}
                          />
                        </div>
                      </FormControl>

                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="text-input-1"
                render={({ field }) => (
                  <FormItem className="col-span-12 @5xl:col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                    <FormLabel className="flex @5xl:flex shrink-0">
                      Cool Description
                    </FormLabel>

                    <div className="w-full">
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            key="text-input-1"
                            placeholder=""
                            type="text"
                            id="text-input-1"
                            className=" "
                            {...field}
                          />
                        </div>
                      </FormControl>

                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              {/* Area, Location, Location Type in one row on desktop */}
              <div className="col-span-12 flex flex-col gap-4 md:flex-row md:gap-6">
                <div className="w-full md:w-1/3">
                  <FormField
                    control={form.control}
                    name="select-0"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2 items-start">
                        <FormLabel>Area</FormLabel>
                        <div className="w-full">
                          <FormControl>
                            <Select
                              key="select-0"
                              {...field}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem key="JKT" value="JKT">
                                  Jakarta
                                </SelectItem>
                                <SelectItem key="BKS" value="BKS">
                                  Bekasi
                                </SelectItem>
                                <SelectItem key="MDO" value="MDO">
                                  Manado
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <FormField
                    control={form.control}
                    name="select-1"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2 items-start">
                        <FormLabel>Location</FormLabel>
                        <div className="w-full">
                          <FormControl>
                            <Select
                              key="select-1"
                              {...field}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  key="Kelapa Gading"
                                  value="Kelapa Gading"
                                >
                                  Kelapa Gading
                                </SelectItem>
                                <SelectItem key="Sunter" value="Sunter">
                                  Sunter
                                </SelectItem>
                                <SelectItem key="Joglo" value="Joglo">
                                  Joglo
                                </SelectItem>
                                <SelectItem
                                  key="Kebun Jeruk"
                                  value="Kebun Jeruk"
                                >
                                  Kebun Jeruk
                                </SelectItem>
                                <SelectItem
                                  key="Pondok Indah"
                                  value="Pondok Indah"
                                >
                                  Pondok Indah
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <FormField
                    control={form.control}
                    name="select-2"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2 items-start">
                        <FormLabel>Location Type</FormLabel>
                        <div className="w-full">
                          <FormControl>
                            <Select
                              key="select-2"
                              {...field}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem key="online" value="online">
                                  Online
                                </SelectItem>
                                <SelectItem key="offsite" value="offsite">
                                  Offsite
                                </SelectItem>
                                <SelectItem key="hybrid" value="hybrid">
                                  Hybrid
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <FormField
                control={form.control}
                name="select-3"
                render={({ field }) => (
                  <FormItem className="col-span-12 @5xl:col-span-6 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                    <FormLabel className="flex @5xl:flex shrink-0">
                      Category
                    </FormLabel>

                    <div className="w-full">
                      <FormControl>
                        <Select
                          key="select-3"
                          {...field}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full ">
                            <SelectValue placeholder="" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem key="general" value="general">
                              General
                            </SelectItem>

                            <SelectItem key="Professional" value="Professional">
                              Professional
                            </SelectItem>

                            <SelectItem key="huddle" value="huddle">
                              Huddle
                            </SelectItem>

                            <SelectItem key="huddle_youth" value="huddle_youth">
                              Huddle Youth
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>

                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="select-4"
                render={({ field }) => (
                  <FormItem className="col-span-12 @5xl:col-span-6 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                    <FormLabel className="flex @5xl:flex shrink-0">
                      Gender
                    </FormLabel>

                    <div className="w-full">
                      <FormControl>
                        <Select
                          key="select-4"
                          {...field}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full ">
                            <SelectValue placeholder="" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem key="male" value="male">
                              Male
                            </SelectItem>

                            <SelectItem key="female" value="female">
                              Female
                            </SelectItem>

                            <SelectItem key="all" value="all">
                              All
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>

                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {/* Community Ids */}
              <div className="flex flex-col md:flex-row gap-12 lg:mx-28">
                {/* Facilitators */}
                <div className="flex-1">
                  <div className="mb-4">
                    <SearchUserDialog
                      type="facilitator"
                      onSelect={(name, id) => {
                        setCommunityIdFormData((prev) => {
                          const exists = prev.facilitatorCommunityIds.some(
                            (u) => u.id === id
                          );
                          if (exists) return prev;
                          return {
                            ...prev,
                            facilitatorCommunityIds: [
                              ...prev.facilitatorCommunityIds,
                              { name, id },
                            ],
                          };
                        });
                      }}
                    />
                  </div>
                  <h3 className="text-sm text-center">Facilitators:</h3>
                  {communityIdFormData.facilitatorCommunityIds.length > 0 ? (
                    communityIdFormData.facilitatorCommunityIds.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-lg p-2 text-xs border"
                      >
                        <span>
                          <span className="font-semibold">{user.name}</span>{" "}
                          <span className="text-gray-500">(ID: {user.id})</span>
                        </span>
                      </div>
                    ))
                  ) : (
                    <></>
                  )}
                </div>

                {/* Leaders */}
                <div className="flex-1">
                  <div className="mb-4">
                    <SearchUserDialog
                      type="leader"
                      onSelect={(name, id) => {
                        setCommunityIdFormData((prev) => {
                          const exists = prev.leaderCommunityIds.some(
                            (u) => u.id === id
                          );
                          if (exists) return prev;
                          return {
                            ...prev,
                            leaderCommunityIds: [
                              ...prev.leaderCommunityIds,
                              { name, id },
                            ],
                          };
                        });
                      }}
                    />
                  </div>
                  <h3 className="text-sm text-center"> Leaders:</h3>
                  {communityIdFormData.leaderCommunityIds.length > 0 ? (
                    communityIdFormData.leaderCommunityIds.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-lg p-2 text-xs border"
                      >
                        <span>
                          <span className="font-semibold">{user.name}</span>{" "}
                          <span className="text-gray-500">(ID: {user.id})</span>
                        </span>
                      </div>
                    ))
                  ) : (
                    <></>
                  )}
                </div>
                {/* Core */}
                <div className="flex-1">
                  <div className="mb-4">
                    <SearchUserDialog
                      type="core"
                      onSelect={(name, id) => {
                        setCommunityIdFormData((prev) => {
                          const exists = prev.coreCommunityIds.some(
                            (u) => u.id === id
                          );
                          if (exists) return prev;
                          return {
                            ...prev,
                            coreCommunityIds: [
                              ...prev.coreCommunityIds,
                              { name, id },
                            ],
                          };
                        });
                      }}
                    />
                  </div>
                  <h3 className="text-sm text-center"> Core:</h3>
                  {communityIdFormData.coreCommunityIds.length > 0 ? (
                    communityIdFormData.coreCommunityIds.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-lg p-2 text-xs border"
                      >
                        <span>
                          <span className="font-semibold">{user.name}</span>{" "}
                          <span className="text-gray-500">(ID: {user.id})</span>
                        </span>
                      </div>
                    ))
                  ) : (
                    <></>
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="checkbox-0"
                render={({ field }) => (
                  <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                    <FormLabel className="hidden shrink-0">
                      Recurrence
                    </FormLabel>

                    <div className="w-full">
                      <FormControl>
                        <FormLabel
                          key="checkbox-0"
                          className="border-0 space-x-3 w-full flex items-start has-[[data-state=checked]]:border-primary"
                          htmlFor="checkbox-0"
                        >
                          <Checkbox
                            id="checkbox-0"
                            className=""
                            name={field.name}
                            ref={field.ref}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            onBlur={field.onBlur}
                            disabled={field.disabled}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <FormLabel>Recurrence</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Check if COOL is weekly
                            </p>
                          </div>
                        </FormLabel>
                      </FormControl>

                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              {/* Remove the FormField wrapper for the submit button, as it does not need to be a form field */}
              <div className="col-span-12 @5xl:col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="hidden shrink-0">Submit</FormLabel>
                <div className="w-full">
                  <Button
                    key="submit-button-0"
                    id="submit-button-0"
                    name=""
                    className="w-full"
                    type="submit"
                    variant="default"
                  >
                    Submit
                  </Button>
                </div>
              </div>
              <div className="col-span-12 @5xl:col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="hidden shrink-0">Reset</FormLabel>
                <div className="w-full">
                  <Button
                    key="reset-button-0"
                    id="reset-button-0"
                    name=""
                    className="w-full"
                    type="reset"
                    variant="outline"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
