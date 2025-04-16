"use client";
import React from "react";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import Image from "next/image";
import { API_BASE_URL, API_KEY } from "@/lib/config";
import { useToast } from "./ui/use-toast";
import { useRouter } from "next/navigation";

type Gender = "male" | "female";
type MaritalStatus = "single" | "married" | "others";
type YearOfBirth = number;
type PhoneNumber = string;
type Residence = string;
type CommunityOfInterest =
  | "youth"
  | "college"
  | "umum"
  | "professional"
  | "newlywed"
  | "umum";
interface LocationData {
  type: string;
  name: string;
}
type SelectedLocation = string;
type AreaCode = string;

interface FormData {
  name: string;
  gender: Gender | null;
  maritalStatus: MaritalStatus | null;
  yearOfBirth: YearOfBirth | null;
  phoneNumber: PhoneNumber | null;
  address: Residence | null;
  communityOfInterest: CommunityOfInterest | null;
  campusCode: AreaCode | null;
  location: SelectedLocation | null;
}

const JoinCoolForm = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [fullName, setFullName] = React.useState<string>("");
  const [gender, setGender] = React.useState<Gender | null>(null);
  const [maritalStatus, setMaritalStatus] =
    React.useState<MaritalStatus | null>(null);
  const [yearOfBirth, setYearOfBirth] = React.useState<YearOfBirth | null>(
    null
  );
  const [phoneNumber, setPhoneNumber] = React.useState<PhoneNumber | null>(
    null
  );
  const [residence, setResidence] = React.useState<Residence | null>(null);
  const [communityOfInterest, setCommunityOfInterest] =
    React.useState<CommunityOfInterest | null>(null);
  const [areaCode, setAreaCode] = React.useState<AreaCode | null>(null);
  const [locations, setLocations] = React.useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] =
    React.useState<SelectedLocation | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);

  const tokenFetchedRef = React.useRef(false);

  const isValidIndonesianPhone = (phone: string) => {
    // Matches Indonesian phone numbers:
    // - Starts with 08 or +628 or 628
    // - Followed by 8-12 digits
    const phoneRegex = /^(?:08|[+]628|628)[0-9]{8,12}$/;
    return phoneRegex.test(phone);
  };

  useEffect(() => {
    const fetchToken = async () => {
      if (tokenFetchedRef.current) return; // Skip if already fetched

      try {
        const response = await fetch(`${API_BASE_URL}/api/v2/tokens`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
          },
        });
        const result = await response.json();
        if (result.data) {
          const accessToken = result.data.find(
            (token: any) => token.type === "accessToken"
          )?.token;
          setAccessToken(accessToken);
          tokenFetchedRef.current = true; // Mark as fetched
        }
      } catch (error) {
        console.error("Error fetching token:", error);
      }
    };

    fetchToken();
  }, []);

  const getLabelFromValue = (value: CommunityOfInterest | null | undefined) => {
    switch (value) {
      case "youth":
        return "Youth";
      case "college":
        return "College";
      case "professional":
        return "Professional";
      case "newlywed":
        return "Newlywed";
      case "umum":
        return "Umum";
      default:
        return "";
    }
  };

  // Update handleSubmit to use the token
  const handleSubmit = async () => {
    if (!accessToken) {
      console.error("No access token available");
      return;
    }

    // Validate all required fields
    if (
      !fullName ||
      !gender ||
      !maritalStatus ||
      !yearOfBirth ||
      !phoneNumber ||
      !residence ||
      !communityOfInterest ||
      !areaCode ||
      !selectedLocation
    ) {
      toast({
        title: "Join Failed!",
        description: `Please fill all fields!`,
        className: "bg-red-400",
        duration: 3000,
      });
      return;
    }

    if (phoneNumber && !isValidIndonesianPhone(phoneNumber)) {
      toast({
        title: "Join Failed!",
        description: `Please fill a valid phone number!`,
        className: "bg-red-400",
        duration: 3000,
      });
      return;
    }

    if (yearOfBirth && (yearOfBirth < 1920 || yearOfBirth > 2025)) {
      toast({
        title: "Join Failed!",
        description: `Please fill a valid birth year!`,
        className: "bg-red-400",
        duration: 3000,
      });
      return;
    }

    const formData: FormData = {
      name: fullName,
      gender,
      maritalStatus,
      yearOfBirth,
      phoneNumber,
      address: residence,
      communityOfInterest,
      campusCode: areaCode?.toUpperCase() ?? null,
      location: selectedLocation,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/v2/cools/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        toast({
          title: "Register Complete!",
          description: `Congrats, You have successfully joined!`,
          className: "bg-green-400",
          duration: 3000,
        });
        // Redirect to success page after successful form submission
        router.push("/joincool/success");
      } else {
        toast({
          title: "Register Failed!",
          description: `Error: ${result.message}`,
          className: "bg-red-400",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Register Failed!",
        description: `Error: ${error}`,
        className: "bg-red-400",
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    const fetchLocations = async () => {
      if (!areaCode) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v2/campuses/${areaCode}/locations`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": API_KEY,
            },
          }
        );
        const result = await response.json();

        if (result.data) {
          setLocations(result.data);
          // Reset selected location when area changes
          setSelectedLocation(null);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, [areaCode]);

  return (
    <div className="w-full px-2 sm:px-4 py-4 sm:py-6 max-w-3xl sm:mx-auto">
      <div className="bg-gray-100 rounded-xl p-3 sm:p-6">
        <div>
          <div className="relative bg-gray-100 flex flex-row justify-start md:justify-between">
            <div className="flex flex-col">
              <div className="ml-2 text-3xl sm:text-5xl font-light tracking-tighter text-primary">
                <div className="">It's Hot</div>
                <div className="">Outside,</div>
                <div className="">Go COOL!</div>
              </div>
              <div className="my-2 sm:my-4 ml-2 text-base sm:text-xl tracking-tight font-light text-primary flex flex-col">
                <span className="break-words">
                  Let's grow together! Join the Grow Community.
                </span>
                <span className="mt-2 text-xs sm:text-sm break-words">
                  If you need help, just give us a shout on WhatsApp at{" "}
                  <a
                    href="https://wa.me/+6281398812927"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:text-black/50 underline underline-offset-2 inline-block"
                  >
                    +62-813-9881-2927
                  </a>
                </span>
              </div>
            </div>

            <Image
              className="bg-gray-100 object-contain max-h-[100px] sm:max-h-[120px]"
              src="/images/gc-logo-2.png"
              alt="Logo"
              width={60}
              height={60}
              priority
              style={{
                width: "auto",
                height: "100%",
                maxHeight: "120px",
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-y-4 mt-6">
          <div className="relative">
            <Input
              type="text"
              id="floating_outlined"
              className="block px-2.5 pb-2.5 pt-4 w-full text-base text-gray-900 bg-white rounded-lg border-1 border-gray-300 appearance-none  focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              placeholder=" "
              autoFocus={false}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Label
              htmlFor="floating_outlined"
              className="absolute text-sm sm:text-sm text-gray-500 duration-300 transform -translate-y-3 scale-75 top-2 z-10 origin-[0]   px-2 peer-focus:px-2 peer-focus:text-primary-light  peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-3 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1 peer-focus:background-transparent"
            >
              Full Name
            </Label>
          </div>
          <div className="flex flex-row">
            <div className="w-1/2">
              <Select
                value={gender ?? undefined}
                onValueChange={(value: Gender) => setGender(value)}
                onOpenChange={(open) => {
                  if (!open) {
                    document.body.click();
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/2">
              <Select
                value={maritalStatus ?? undefined}
                onValueChange={(value: MaritalStatus) =>
                  setMaritalStatus(value)
                }
                onOpenChange={(open) => {
                  if (!open) {
                    document.body.click();
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Marital Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="relative">
            <Input
              type="number"
              id="floating_outlined_dob"
              className={`block px-2.5 pb-2.5 pt-4 w-full text-base bg-white rounded-lg border-1 ${
                yearOfBirth && (yearOfBirth < 1920 || yearOfBirth > 2025)
                  ? "border-red-500 text-red-500"
                  : "border-gray-300 text-gray-900"
              } appearance-none  focus:outline-none focus:ring-0 focus:border-blue-600 peer`}
              placeholder=" "
              autoFocus={false}
              value={yearOfBirth ?? ""}
              min="1920"
              max="2025"
              onKeyDown={(e) => {
                if (["e", "E", "+", "-"].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setYearOfBirth(null);
                } else {
                  const numValue = Number(value);
                  if (!isNaN(numValue)) {
                    setYearOfBirth(numValue);
                  }
                }
              }}
            />
            <Label
              htmlFor="floating_outlined_dob"
              className="absolute text-sm text-gray-500  duration-300 transform -translate-y-3 scale-75 top-2 z-10 origin-[0]   px-2 peer-focus:px-2 peer-focus:text-primary-light  peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-3 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1 peer-focus:background-transparent"
            >
              <span>Year of Birth</span>
              {yearOfBirth && (yearOfBirth < 1920 || yearOfBirth > 2025) && (
                <span className="text-red-500 text-xs">
                  {" "}
                  - Invalid birth year!
                </span>
              )}
            </Label>
          </div>
          <div className="relative">
            <Input
              type="string"
              id="floating_outlined_phone"
              className={`block px-2.5 pb-2.5 pt-4 w-full text-base  bg-white rounded-lg border-1 ${
                phoneNumber && !isValidIndonesianPhone(phoneNumber)
                  ? "border-red-500 text-red-500"
                  : "border-gray-300"
              } appearance-none  focus:outline-none focus:ring-0 focus:border-blue-600 peer`}
              placeholder=" "
              autoFocus={false}
              minLength={9}
              maxLength={16}
              value={phoneNumber ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setPhoneNumber(null);
                } else {
                  // Only allow numbers
                  const numericValue = value.replace(/[^\d]/g, "");
                  setPhoneNumber(numericValue);
                }
              }}
            />
            <Label
              htmlFor="floating_outlined_phone"
              className={`absolute text-xs text-gray-500 sm:text-sm duration-300 transform -translate-y-[10px] sm:-translate-y-3 scale-75 top-2 z-10 origin-[0] px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-3 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1 peer-focus:background-transparent peer-focus:text-primary-light`}
            >
              <span
                className={`${
                  phoneNumber && !isValidIndonesianPhone(phoneNumber)
                    ? "text-red-500"
                    : ""
                } peer-focus:text-primary-light`}
              >
                {phoneNumber && !isValidIndonesianPhone(phoneNumber)
                  ? "Invalid Phone Number!"
                  : "WhatsApp Number (ex: 081310109833)"}
              </span>
            </Label>
          </div>
          <div className="">
            <Select
              value={areaCode ?? undefined}
              onValueChange={(value: string) => setAreaCode(value)}
              onOpenChange={(open) => {
                if (!open) {
                  document.body.click();
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jkt">Jakarta</SelectItem>
                <SelectItem value="bks">Bekasi</SelectItem>
                <SelectItem value="mdo">Manado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="">
            <Select
              value={selectedLocation ?? undefined}
              onValueChange={(value: string) => setSelectedLocation(value)}
              disabled={!areaCode || locations.length === 0}
              onOpenChange={(open) => {
                if (!open) {
                  document.body.click();
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                {[...locations]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((location) => (
                    <SelectItem key={location.name} value={location.name}>
                      {location.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Input
              type="string"
              id="floating_outlined_address"
              className="block px-2.5 pb-2.5 pt-4 w-full text-base text-gray-900 bg-white rounded-lg border-1 border-gray-300 appearance-none  focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              placeholder=""
              autoFocus={false}
              value={residence ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setResidence(null);
                } else {
                  setResidence(value);
                }
              }}
            />
            <Label
              htmlFor="floating_outlined_address"
              className="absolute text-sm text-gray-500 
               duration-300 transform -translate-y-3 scale-75 top-2 z-10 origin-[0]  px-2 peer-focus:px-2 peer-focus:text-primary-light  peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-3 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1 peer-focus:background-transparent"
            >
              Residence Address
            </Label>
          </div>
          <div className="">
            <Select
              value={communityOfInterest ?? undefined}
              onValueChange={(value: CommunityOfInterest) =>
                setCommunityOfInterest(value)
              }
              onOpenChange={(open) => {
                if (!open) {
                  document.body.click();
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Community of Interest">
                  {getLabelFromValue(communityOfInterest)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youth">
                  <div className="flex flex-col">
                    <span>Youth</span>
                    <span className="text-xs text-muted-foreground">
                      Untuk anak SMP-SMA (13-18 tahun)
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="college">
                  <div className="flex flex-col">
                    <span>College</span>
                    <span className="text-xs text-muted-foreground">
                      Untuk anak kuliah dan fresh graduate (18-25 tahun)
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="professional">
                  <div className="flex flex-col">
                    <span>Professional</span>
                    <span className="text-xs text-muted-foreground">
                      Untuk kelompok usia pekerja dan dewasa muda
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="newlywed">
                  <div className="flex flex-col">
                    <span>Newlywed</span>
                    <span className="text-xs text-muted-foreground">
                      Untuk pasangan yang baru menikah atau yang
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ingin bertumbuh bersama pasangan lainnya
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="umum">
                  <div className="flex flex-col">
                    <span>Umum</span>
                    <span className="text-xs text-muted-foreground">
                      Untuk general, lintas generasi dan status
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          className="my-6 w-full"
          onClick={handleSubmit}
          disabled={
            !accessToken ||
            !fullName ||
            !gender ||
            !maritalStatus ||
            !yearOfBirth ||
            !phoneNumber ||
            !residence ||
            !communityOfInterest ||
            !areaCode ||
            !selectedLocation
          }
        >
          Submit
        </Button>
        <div>
          <div className="flex flex-col gap-2 text-xs sm:text-sm">
            <div className="flex flex-row text-center justify-center items-center flex-wrap">
              <span className="whitespace-nowrap">Follow our</span>
              <i
                className="fi fi-brands-instagram mt-1 mx-1"
                style={{ color: "#be37ac", fontSize: "14px" }}
              />
              <span className="font-semibold">
                <a
                  href="https://www.instagram.com/growcommunitychurch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-black/50 underline underline-offset-2 whitespace-nowrap"
                >
                  @growcommunitychurch
                </a>
              </span>
            </div>

            <div className="flex flex-row flex-wrap text-center justify-center items-center">
              <span className="whitespace-nowrap">Subscribe to our</span>
              <i
                className="fi fi-brands-youtube mx-1 mt-1"
                style={{ color: "#c90d0d", fontSize: "15px" }}
              />
              <span className="font-semibold">
                <a
                  href="https://www.youtube.com/@growcommunitychurch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-black/50 underline underline-offset-2 whitespace-nowrap"
                >
                  Grow Community Church
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinCoolForm;
