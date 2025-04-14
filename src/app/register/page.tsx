"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ChevronLeft, Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";

import { API_BASE_URL, API_KEY } from "@/lib/config";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandInput,
} from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";
import coolDatasets from "../../lib/datasets/cool_dataset.json";
import departmentDatasets from "../../lib/datasets/departments_dataset.json";
import homebaseDatasets from "../../lib/datasets/homebase_dataset.json";
import categoryDatasets from "../../lib/datasets/cool_categories_dataset.json";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

interface CategoryMap {
  [key: string]: string;
}

// Base form schema for general user fields
const baseFormSchema = z.object({
  name: z.string().min(2, { message: "Input your proper full name." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phoneNumber: z.string().min(8, { message: "Invalid phone number" }),
  placeOfBirth: z.string(),
  dateOfBirth: z.date(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

// Worker-specific schema
const workerFormSchema = z.object({
  gender: z.enum(["Male", "Female"], { message: "Field required!" }),
  maritalStatus: z.enum(["single", "married", "others"], {
    message: "Field required!",
  }),
  department: z.string().min(1, { message: "Field required!" }),
  cool: z.number(),
  campus: z.string().min(1, { message: "Field required!" }),

  kkj: z.string().optional(),
  kom: z.boolean(),
  baptis: z.boolean(),
});

// Type for the entire form schema (general + worker-specific fields)
type FormValues = z.infer<typeof baseFormSchema> &
  z.infer<typeof workerFormSchema>;

export default function Register() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isWorker, setIsWorker] = useState<boolean>(false);
  const [openGenderBox, setOpenGenderBox] = useState(false);
  const [openMarriageBox, setOpenMarriageBox] = useState(false);
  const [openDepartmentBox, setOpenDepartmentBox] = useState(false);
  const [openCoolBox, setOpenCoolBox] = useState(false);
  const [openHomebaseBox, setOpenHomebaseBox] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCool, setSelectedCool] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedHomebase, setSelectedHomebase] = useState("");

  // Dynamically set the form schema based on the isWorker checkbox state
  const formSchema = isWorker
    ? baseFormSchema.merge(workerFormSchema) // Merge schemas if worker is selected
    : baseFormSchema; // Use only base schema if not a worker

  // Initialize the form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      gender: undefined,
      maritalStatus: undefined,
      department: "",
      cool: undefined,
      campus: "",
      kkj: "",
      placeOfBirth: undefined,
      kom: false,
      baptis: false,
    },
  });

  const categoryMap: CategoryMap = categoryDatasets.reduce((map, category) => {
    map[category.name.toUpperCase()] = category.code;
    return map;
  }, {} as CategoryMap);

  // Function to get the category code
  function getCategoryCode(categoryName: string): string | null {
    return categoryMap[categoryName.toUpperCase()] || null;
  }

  // Handle form submission
  async function onSubmit(data: FormValues) {
    setLoading(true);
    data.email = data.email.trim().replace(/\s+/g, "").toLowerCase();
    data.phoneNumber = data.phoneNumber
      .trim()
      .replace(/\s+/g, "")
      .replace("+62", "0");

    const formattedDOB = data.dateOfBirth
      ? format(new Date(data.dateOfBirth), "yyyy-MM-dd")
      : null;

    const requestBody = {
      name: data.name.trim(),
      phoneNumber: data.phoneNumber,
      email: data.email,
      password: data.password,
      userTypes: isWorker ? ["volunteer"] : ["user"],
      campusCode: data.campus,
      placeOfBirth: data.placeOfBirth, // Add place of birth field if available
      dateOfBirth: formattedDOB, // Add date of birth field if available
      address: "",
      gender: data.gender?.toLowerCase() || "",
      department_code: data.department || "",
      kkjNumber: data.kkj || "",
      jemaatId: "", // Add jemaatId field if available
      isKom100: data.kom,
      isBaptized: data.baptis,
      maritalStatus: data.maritalStatus?.toLowerCase() || "",
      coolID: data.cool,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/v2/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY || "",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        toast({
          title: "Sign up Successful!",
          description: "Redirecting to the log in page...",
          className: "bg-green-400",
          duration: 1500,
        });

        setTimeout(() => {
          router.push("/login/v2");
        }, 1000);
      } else {
        const errorResult = await response.json();
        if (errorResult.status === "ALREADY_EXISTS") {
          toast({
            title: "Register Failed!",
            description:
              "Error: User with your email/phone number already exists. Please log in!",
            className: "bg-red-400",
            duration: 3000,
          });
        } else {
          toast({
            title: "Register Failed!",
            description: `Error: ${errorResult.message}`,
            className: "bg-red-400",
            duration: 3000,
          });
        }
        throw errorResult;
      }
    } catch (error) {
      console.error("An error occurred:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 md:flex md:flex-col md:items-center md:justify-center">
      <h1 className="text-xl font-bold mb-4">Register</h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="md:space-y-6 md:w-1/3"
        >
          {/* Main registration form fields */}
          <span className=" text-sm font-semibold ">
            All fields are required unless otherwise stated.
          </span>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="my-5">
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    className="shadow-md focus-visible:ring-primary-light"
                    placeholder="Enter your full name."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="my-5">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    className="shadow-md focus-visible:ring-primary-light"
                    placeholder="Enter your email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem className="my-5">
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    className="shadow-md focus-visible:ring-primary-light"
                    placeholder="Enter your phone number"
                    defaultValue="0"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Phone number format: 087800001234
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="placeOfBirth"
            render={({ field }) => (
              <FormItem className="my-5">
                <FormLabel>Place of Birth</FormLabel>
                <FormControl>
                  <Input
                    className="w-[250px] justify-between"
                    {...field}
                    placeholder="Enter your birthplace"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="my-5 flex flex-col">
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Controller
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <DatePicker
                        className="border p-2 rounded shadow-md focus-visible:ring-primary-light mt-3 "
                        selected={field.value}
                        onChange={(date: any) => field.onChange(date)}
                        showYearDropdown
                        yearDropdownItemNumber={80}
                        scrollableYearDropdown
                        placeholderText="Select your date of birth"
                      />
                    )}
                  />
                </FormControl>
                <FormDescription>Date format: MM/DD/YYYY</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="my-5">
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      className="shadow-md focus-visible:ring-primary-light"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...field}
                    />
                  </FormControl>
                  {showPassword ? (
                    <EyeOff
                      className="absolute right-2 top-2 cursor-pointer text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  ) : (
                    <Eye
                      className="absolute right-2 top-2 cursor-pointer text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Worker Checkbox
          <FormItem className="my-5">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isWorker"
                checked={isWorker}
                onCheckedChange={(checked: boolean) => setIsWorker(checked)}
              />
              <Label htmlFor="isWorker">
                I am a worker (pengerja, volunteer, aktivis)
              </Label>
            </div>
          </FormItem> */}
          {/* Conditionally render Worker-specific form fields */}
          {isWorker && (
            <>
              <div className="my-5">
                <span className=" text-sm font-semibold">
                  All fields are required unless otherwise stated.
                </span>
              </div>

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="flex flex-col my-5">
                    <FormLabel>Gender</FormLabel>
                    <Popover
                      open={openGenderBox}
                      onOpenChange={setOpenGenderBox}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[200px] justify-between"
                        >
                          {field.value || "Select Gender"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              <CommandItem
                                onSelect={() => {
                                  field.onChange("Male");
                                  setOpenGenderBox(false);
                                }}
                              >
                                Male
                              </CommandItem>
                              <CommandItem
                                onSelect={() => {
                                  field.onChange("Female");
                                  setOpenGenderBox(false);
                                }}
                              >
                                Female
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kkj"
                render={({ field }) => (
                  <FormItem className="my-5">
                    <FormLabel>KKJ (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        className="w-[250px] justify-between"
                        {...field}
                        placeholder="Enter KKJ number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem className="flex flex-col my-5">
                    <FormLabel>Marital Status</FormLabel>
                    <Popover
                      open={openMarriageBox}
                      onOpenChange={setOpenMarriageBox}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[200px] justify-between"
                        >
                          {field.value || "Select your status"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              <CommandItem
                                onSelect={() => {
                                  field.onChange("single");
                                  setOpenMarriageBox(false);
                                }}
                              >
                                Single
                              </CommandItem>
                              <CommandItem
                                onSelect={() => {
                                  field.onChange("married");
                                  setOpenMarriageBox(false);
                                }}
                              >
                                Married
                              </CommandItem>
                              <CommandItem
                                onSelect={() => {
                                  field.onChange("others");
                                  setOpenMarriageBox(false);
                                }}
                              >
                                Others
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem className="my-5 flex flex-col ">
                    <FormLabel>Department</FormLabel>
                    <Popover
                      open={openDepartmentBox}
                      onOpenChange={setOpenDepartmentBox}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[200px] justify-between"
                        >
                          {selectedDepartment || "Select your department"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search department..." />
                          <CommandList>
                            {departmentDatasets.map((item, index) => (
                              <CommandGroup key={index}>
                                <CommandItem
                                  onSelect={() => {
                                    field.onChange(item.code.toUpperCase());
                                    setSelectedDepartment(
                                      item.department.toUpperCase()
                                    );
                                    setOpenDepartmentBox(false);
                                  }}
                                >
                                  <span className="font-medium">
                                    {item.department.toUpperCase()}
                                  </span>
                                </CommandItem>
                              </CommandGroup>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cool"
                render={({ field }) => (
                  <FormItem className="my-5 flex flex-col">
                    <FormLabel>COOL</FormLabel>
                    <Popover open={openCoolBox} onOpenChange={setOpenCoolBox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="sm:w-[250px] md:w-[350px] justify-between"
                        >
                          {selectedCool || "Select your COOL"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="sm:w-[250px] md:w-[350px] p-0">
                        <Command>
                          <CommandInput placeholder="Search COOL..." />
                          <CommandList>
                            {coolDatasets.map((item, index) => (
                              <CommandGroup key={index} heading={item.category}>
                                <CommandItem
                                  onSelect={() => {
                                    field.onChange(item.no);
                                    setSelectedCool(item.cool);
                                    setSelectedCategory(item.category);
                                    setOpenCoolBox(false);
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {item.cool.toUpperCase()}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      Leader(s): {item.leader.toUpperCase()}
                                    </span>
                                    {/* Display campus in smaller font below the leader */}
                                    <span className="text-xs text-gray-400">
                                      {item.campus.trim()}
                                    </span>
                                  </div>
                                </CommandItem>
                              </CommandGroup>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="campus"
                render={({ field }) => (
                  <FormItem className="my-5 flex flex-col ">
                    <FormLabel>Homebase</FormLabel>
                    <Popover
                      open={openHomebaseBox}
                      onOpenChange={setOpenHomebaseBox}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[200px] justify-between"
                        >
                          {selectedHomebase || "Select your homebase"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandList>
                            {homebaseDatasets.map((item, index) => (
                              <CommandGroup key={index}>
                                <CommandItem
                                  onSelect={() => {
                                    field.onChange(item.code.toUpperCase());
                                    setSelectedHomebase(item.homebase);
                                    setOpenHomebaseBox(false);
                                  }}
                                >
                                  <span className="font-medium">
                                    {item.homebase.toUpperCase()}
                                  </span>
                                </CommandItem>
                              </CommandGroup>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kom"
                render={({ field }) => (
                  <FormItem className="my-5 flex items-center">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)} // Updates the state
                      />
                    </FormControl>
                    <FormLabel className="ml-2">I have attended KOM</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baptis"
                render={({ field }) => (
                  <FormItem className="my-5 flex items-center">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)} // Updates the state
                      />
                    </FormControl>
                    <FormLabel className="ml-2">I have been baptized</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          {/* Submit Button */}
          <Button
            type="submit"
            className="my-8 w-full sm:w-auto"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
