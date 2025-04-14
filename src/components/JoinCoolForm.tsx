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

  // Add this ref before the useEffect
  const tokenFetchedRef = React.useRef(false);

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

  // Update handleSubmit to use the token
  const handleSubmit = async () => {
    if (!accessToken) {
      console.error("No access token available");
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
        console.log("Form submitted successfully:", result);
      } else {
        console.error("Form submission failed:", result);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
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
    <div className="container mx-auto px-4 py-2 sm:p-4 max-w-xl">
      <div className="bg-gray-100 rounded-xl p-4 sm:p-6">
        <div>
          <div className="relative bg-gray-100 flex flex-row justify-start md:justify-between">
            <div className="flex flex-col">
              <div className="text-4xl sm:text-5xl font-light tracking-tighter text-primary">
                <div className="">It's Hot</div>
                <div className="">Outside,</div>
                <div className="">Go COOL!</div>
              </div>
              <div className="my-2 sm:my-4 ml-2 text-lg sm:text-xl tracking-tight font-light text-primary flex flex-col">
                <span>Let's grow together! Join the Grow Community.</span>
                <span className="text-sm">
                  If you need help, just give us a shout on WhatsApp at{" "}
                  <a
                    href="https://wa.me/+6287795558889"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:text-black/50 underline underline-offset-2"
                  >
                    +6287795558889
                  </a>
                </span>
              </div>
            </div>

            <Image
              className="bg-gray-100 object-contain"
              src="/images/gc-logo-2.png"
              alt="Logo"
              width={50}
              height={50}
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
              className="block px-2.5 pb-2.5 pt-4 w-full text-base text-gray-900 bg-white rounded-lg border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              placeholder=""
              autoFocus={false}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Label
              htmlFor="floating_outlined"
              className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-3 scale-75 top-2 z-10 origin-[0]  dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-primary-light  peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-3 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1 peer-focus:background-transparent"
            >
              Full Name
            </Label>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-0">
            <div className="w-full sm:w-1/2">
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
            <div className="w-full sm:w-1/2">
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
                  <SelectItem value="divorced">Divorced</SelectItem>
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
              className="block px-2.5 pb-2.5 pt-4 w-full text-base text-gray-900 bg-white rounded-lg border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              placeholder=""
              autoFocus={false}
              value={yearOfBirth ?? ""}
              min="1900"
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
              className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-3 scale-75 top-2 z-10 origin-[0]  dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-primary-light  peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-3 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1 peer-focus:background-transparent"
            >
              Year of Birth (ex: 1997)
            </Label>
          </div>
          <div className="relative">
            <Input
              type="string"
              id="floating_outlined_phone"
              className="block px-2.5 pb-2.5 pt-4 w-full text-base text-gray-900 bg-white rounded-lg border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              placeholder=""
              autoFocus={false}
              minLength={9}
              maxLength={16}
              value={phoneNumber ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setPhoneNumber(null);
                } else {
                  setPhoneNumber(value);
                }
              }}
            />
            <Label
              htmlFor="floating_outlined_phone"
              className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-3 scale-75 top-2 z-10 origin-[0]  dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-primary-light  peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-3 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1 peer-focus:background-transparent"
            >
              WhatsApp Number (ex: 081310109833)
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
              className="block px-2.5 pb-2.5 pt-4 w-full text-base text-gray-900 bg-white rounded-lg border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
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
              className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-3 scale-75 top-2 z-10 origin-[0]  dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-primary-light  peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-3 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1 peer-focus:background-transparent"
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
                <SelectValue placeholder="Community of Interest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youth">Youth</SelectItem>
                <SelectItem value="college">College</SelectItem>
                <SelectItem value="umum">Umum</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          className="my-6 w-full"
          onClick={handleSubmit}
          disabled={!accessToken}
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
