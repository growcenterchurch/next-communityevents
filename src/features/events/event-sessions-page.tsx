"use client";
import React, { useEffect, useState } from "react";
import HeaderNav from "@/components/HeaderNav";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { API_BASE_URL, API_KEY } from "@/lib/config";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/components/providers/AuthProvider";
import withAuth from "@/components/providers/AuthWrapper";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import VerifyTicketDialog from "@/components/VerifyTicketDialog";
import ReactMarkdown from "react-markdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import SnowfallComponent from "@/components/SnowfallComponent";
import {
  getPreServiceEventConfig,
  PreServiceIrOption,
} from "@/lib/preservice-events";

interface EventDetails {
  type: string;
  code: string;
  title: string;
  allowedCampuses: string[];
  allowedFor: string;
  allowedRoles: string[];
  allowedUsers: string[];
  availabilityStatus: string;
  description: string;
  eventEndAt: string;
  eventStartAt: string;
  imageLinks: string[];
  isRecurring: boolean;
  locationName: string;
  locationType: string;
  recurrence: string;
  registerEndAt: string;
  registerStartAt: string;
  termsAndConditions: string;
  topics: string[];
}

function getPreServiceTimeZone(option: PreServiceIrOption) {
  return option.time.includes("WIT") ? "Asia/Jayapura" : "Asia/Jakarta";
}

function getPreServiceCurrentTime(option: PreServiceIrOption, now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: getPreServiceTimeZone(option),
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  const second = parts.find((part) => part.type === "second")?.value ?? "00";

  return {
    label: `${hour}:${minute}:${second}`,
    minutes: Number(hour) * 60 + Number(minute),
  };
}

function getTimeInMinutes(time: string) {
  const [hour = "0", minute = "0"] = time.split(":");

  return Number(hour) * 60 + Number(minute);
}

function getPreServiceOptionRegistrationDebug(
  option: PreServiceIrOption,
  now: Date,
) {
  const currentTime = getPreServiceCurrentTime(option, now);
  const registrationEndMinutes = getTimeInMinutes(option.registrationEndTime);

  return {
    currentTime: currentTime.label,
    registrationEndTime: option.registrationEndTime,
    isClosed: currentTime.minutes > registrationEndMinutes,
  };
}

const EventSessions = () => {
  const { eventCode } = useParams(); // Retrieve eventCode from the route params
  const normalizedEventCode = Array.isArray(eventCode)
    ? eventCode[0]
    : (eventCode ?? "");
  const preServiceEventConfig = getPreServiceEventConfig(normalizedEventCode);
  const isPreServiceEvent = Boolean(preServiceEventConfig);
  const [sessions, setSessions] = useState<any[]>([]); // State to hold sessions
  const [details, setDetails] = useState<EventDetails | null>(null); // State to hold sessions
  const [isLoading, setIsLoading] = useState<boolean>(false); // State for loading
  const [error, setError] = useState<string | null>(null); // State for errors
  const [selectedIrBySession, setSelectedIrBySession] = useState<
    Record<string, string>
  >({});
  const [now, setNow] = useState(() => new Date());
  const { isAuthenticated, handleExpiredToken, getValidAccessToken } =
    useAuth();

  const router = useRouter();

  // Fetch sessions when the component mounts or when eventCode changes
  useEffect(() => {
    async function fetchSessions() {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        handleExpiredToken();
        return;
      }
      setIsLoading(true); // Set loading state
      setError(null); // Reset error state

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v2/events/${normalizedEventCode}`,
          {
            headers: {
              "X-API-KEY": API_KEY || "",
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            handleExpiredToken();
            console.error("Unauthorized - Token expired or invalid");
            return;
          }
          if (response.status === 404) {
            setSessions([]);
            setDetails(null);
            return;
          }
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();
        console.log("Fetched sessions data:", data);
        setSessions(data.data); // Update sessions state
        setDetails(data.details);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
        setError("Failed to load sessions. Please try again later.");
      } finally {
        setIsLoading(false); // Stop loading state
      }
    }

    fetchSessions();
  }, [normalizedEventCode]);

  useEffect(() => {
    if (!isPreServiceEvent) {
      return;
    }

    const intervalId = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(intervalId);
  }, [isPreServiceEvent]);

  function handleRegistration(
    eventCode: string | string[],
    sessionCode: string,
    maxRegistrants: number,
  ) {
    return router.push(
      `/events/${eventCode}/${sessionCode}/${maxRegistrants}/registration`,
    );
  }

  function handlePrivateRegistration() {
    return router.push(`/events/${normalizedEventCode}/internal`);
  }

  const getSelectedIrValue = (sessionCode: string) =>
    selectedIrBySession[sessionCode];

  return (
    <>
      {/* <SnowfallComponent /> */}
      <HeaderNav name="Event Sessions" link="events" />
      <main>
        {/* Loading and Error States */}
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : sessions.length === 0 ? (
          <p className="text-center">No sessions available for this event.</p>
        ) : (
          // Display fetched sessions
          sessions
            .filter((session) => session.availabilityStatus !== "unavailable")
            .sort((a, b) =>
              (a.title ?? "").localeCompare(b.title ?? "", undefined, {
                numeric: true,
              }),
            )
            .map((session) => {
              const currentIrValue = getSelectedIrValue(session.code);
              const currentIrOption = preServiceEventConfig?.irOptions.find(
                (option) => option.number === currentIrValue,
              );
              const currentIrDebug = currentIrOption
                ? getPreServiceOptionRegistrationDebug(currentIrOption, now)
                : null;
              const isCurrentIrOptionClosed = currentIrDebug?.isClosed ?? false;

              return (
                <Card
                  key={session.code}
                  className="rounded-xl mx-2 my-5 md:w-1/2 md:mx-auto"
                >
                  <div className="flex flex-col">
                    <CardHeader>
                      <CardTitle>{session.title}</CardTitle>{" "}
                    </CardHeader>
                    <CardContent className="flex flex-col">
                      <Badge
                        className={`flex w-fit p-2 text-center justify-center items-center mb-2 ${
                          session.availabilityStatus === "available"
                            ? "bg-green-700"
                            : session.availabilityStatus === "unavailable"
                              ? "bg-red-500"
                              : "bg-gray-400" // Default color for other statuses
                        }`}
                      >
                        <span className="mx-auto">
                          {session.availabilityStatus}
                        </span>
                      </Badge>
                      <div className="text-sm">
                        {" "}
                        <ReactMarkdown>{session.description}</ReactMarkdown>
                      </div>
                      <Separator />
                      <div className="mt-2 pt-4">
                        <p className="font-semibold text-lg text-gray-700">
                          Event Time:
                        </p>
                        <p className="text-sm text-gray-500 my-3">
                          <span className="font-medium text-gray-700">
                            {formatDate(new Date(session.instanceStartAt))} -{" "}
                            {formatDate(new Date(session.instanceEndAt))}
                          </span>
                        </p>
                      </div>

                      <Separator />
                      <div className="mt-2 pt-4">
                        <p className="font-semibold text-gray-700">
                          Number of seats:
                        </p>
                        <p className="text-sm text-gray-500 my-3">
                          <span className="font-medium text-gray-700">
                            {session.totalRemainingSeats}
                          </span>
                        </p>
                      </div>
                      <Separator />
                    </CardContent>
                    <CardFooter
                      className={
                        isPreServiceEvent
                          ? "flex w-full flex-col gap-4"
                          : undefined
                      }
                    >
                      {session.availabilityStatus === "available" ? (
                        isPreServiceEvent ? (
                          <>
                            <div className="w-full">
                              <Label className="text-lg uppercase text-gray-800">
                                <span className="font-extrabold">
                                  Pilih Waktu Preservice
                                </span>{" "}
                              </Label>
                              <br />
                              <Label className="text-base  text-gray-800">
                                <span className="font-extrabold">
                                  Tap / ketuk pilihan preservice anda dibawah
                                </span>
                              </Label>
                              <Select
                                value={currentIrValue ?? undefined}
                                onValueChange={(value) =>
                                  setSelectedIrBySession((prev) => ({
                                    ...prev,
                                    [session.code]: value,
                                  }))
                                }
                              >
                                <SelectTrigger
                                  chevronSize={30}
                                  className="my-8 h-auto items-start rounded-lg border-gray-900 bg-white py-6"
                                >
                                  {currentIrOption ? (
                                    <div className="flex flex-col text-left">
                                      <span className="text-lg font-semibold text-gray-900">
                                        Preservice {currentIrOption.number}
                                      </span>
                                      <span className="text-base text-gray-600">
                                        {currentIrOption.time} •{" "}
                                        {currentIrOption.location}
                                      </span>
                                      <span className="text-base text-gray-600">
                                        {currentIrOption.team}
                                      </span>
                                      <span className="text-base text-gray-600">
                                        Start: {currentIrOption.eventStartTime}{" "}
                                        - {currentIrOption.eventEndTime}
                                      </span>
                                      <span className="text-base text-gray-600">
                                        Register Open:{" "}
                                        {currentIrOption.registrationStartTime}{" "}
                                        - {currentIrOption.registrationEndTime}
                                      </span>
                                      {currentIrDebug ? (
                                        <span className="text-sm text-blue-700">
                                          Debug: current{" "}
                                          {currentIrDebug.currentTime} compared
                                          to end{" "}
                                          {currentIrDebug.registrationEndTime}
                                        </span>
                                      ) : null}
                                      {isCurrentIrOptionClosed ? (
                                        <span className="text-base font-semibold text-red-600">
                                          Registration closed
                                        </span>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col text-left text-gray-700">
                                      <span className="text-lg font-semibold">
                                        Pilih Preservice IR
                                      </span>
                                      <span className="text-base">
                                        Pilih slot sebelum registrasi
                                      </span>
                                    </div>
                                  )}
                                </SelectTrigger>
                                <SelectContent>
                                  {preServiceEventConfig?.irOptions.map(
                                    (option) => {
                                      const optionDebug =
                                        getPreServiceOptionRegistrationDebug(
                                          option,
                                          now,
                                        );
                                      const isOptionClosed =
                                        optionDebug.isClosed;

                                      return (
                                        <SelectItem
                                          key={option.number}
                                          value={option.number}
                                          disabled={isOptionClosed}
                                          className="py-2"
                                        >
                                          <div className="flex flex-col text-left">
                                            <span className="text-base font-semibold text-gray-900">
                                              Preservice {option.number}
                                            </span>
                                            <span className="text-base text-gray-600">
                                              {option.time}
                                            </span>
                                            <span className="text-base text-gray-600">
                                              {option.location}
                                            </span>
                                            <span className="text-base text-gray-600">
                                              {option.team}
                                            </span>
                                            <span className="text-base text-gray-600">
                                              Start: {option.eventStartTime} -{" "}
                                              {option.eventEndTime}
                                            </span>
                                            <span className="text-base text-gray-600">
                                              Register Open:{" "}
                                              {option.registrationStartTime} -{" "}
                                              {option.registrationEndTime}
                                            </span>
                                            <span className="text-sm text-blue-700">
                                              Debug: current{" "}
                                              {optionDebug.currentTime} compared
                                              to end{" "}
                                              {optionDebug.registrationEndTime}
                                            </span>
                                            {isOptionClosed ? (
                                              <span className="text-base font-semibold text-red-600">
                                                Registration closed
                                              </span>
                                            ) : null}
                                          </div>
                                        </SelectItem>
                                      );
                                    },
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <VerifyTicketDialog
                              triggerLabel="Register Now!"
                              eventName={details?.title ?? "Homebase"}
                              eventCode={normalizedEventCode}
                              sessionCode={session.code}
                              sessionName={session.title}
                              onlineEvent={true}
                              irNumber={currentIrOption?.number}
                              disabled={
                                !currentIrOption || isCurrentIrOptionClosed
                              }
                            />
                          </>
                        ) : details?.allowedFor === "public" &&
                          (normalizedEventCode === "d49f0c5" ||
                            normalizedEventCode === "b5a30e1") ? (
                          <Button
                            onClick={() =>
                              handleRegistration(
                                normalizedEventCode,
                                session.code,
                                session.maxPerTransaction,
                              )
                            }
                          >
                            Register Now!
                          </Button>
                        ) : details?.allowedFor === "private" ? (
                          <Button onClick={() => handlePrivateRegistration()}>
                            Register for Event
                          </Button>
                        ) : (
                          <Button disabled>Invalid Event Type</Button>
                        )
                      ) : (
                        <Button disabled>Registration Closed</Button>
                      )}
                    </CardFooter>
                  </div>
                </Card>
              );
            })
        )}
      </main>
    </>
  );
};

export default withAuth(EventSessions);
