"use client";
import React, { useEffect, useState } from "react";
import HeaderNav from "@/components/HeaderNav";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { API_BASE_URL, API_KEY } from "@/lib/config";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import withAuth from "@/components/providers/AuthWrapper";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatDate } from "@/lib/utils";

const EventsPage = () => {
  const [events, setEvents] = useState<any[]>([]); // State to hold fetched events
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state
  const EVENT_EXAMPLE_IMAGE_URL =
    "https://utfs.io/f/OiRxrZt1JqQ4CQoHxw3RfX59ZPjs6OUdGVqBiH0rFAY34Ltm";
  const EVENT_PLACEHOLDER_URL =
    "https://placehold.co/600x400.png?text=Unavailable";
  const router = useRouter();
  const { isAuthenticated, handleExpiredToken, getValidAccessToken } =
    useAuth();

  // Fetch events on component mount
  useEffect(() => {
    async function fetchEvents() {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        handleExpiredToken();
        return;
      }

      try {
        setIsLoading(true); // Set loading state

        const response = await fetch(`${API_BASE_URL}/api/v2/events`, {
          headers: {
            "X-API-KEY": API_KEY,
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`, // Include token in Authorization header
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            handleExpiredToken();
            console.error("Unauthorized - Token expired or invalid");
            return;
          }
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();

        setEvents(data.data); // Store events data
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setIsLoading(false); // Stop loading state
      }
    }

    fetchEvents();
  }, [getValidAccessToken, handleExpiredToken]);

  function handleSession(code: string) {
    return router.push(`/events/${code}`);
  }

  return (
    <>
      <HeaderNav name="Events" link="home"></HeaderNav>
      <main>
        <div className="my-4 mx-2 flex relative flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search an event"
            className="w-full justify-center rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
          />
        </div>
        <Separator />
        <div className="my-4 mx-2 p-3">
          {isLoading ? (
            <p>
              <LoadingSpinner />
            </p>
          ) : events && events.length > 0 ? (
            events
              .filter((event) => event.availabilityStatus !== "unavailable")
              .map((event) => (
                <Card key={event.code} className="rounded-xl mb-4">
                  <div className="flex flex-col md:flex-row">
                    {/* Left Half / Top Half: Image */}
                    <div className="relative md:w-1/2 h-60 md:h-96 overflow-hidden rounded-t-lg md:rounded-l-lg">
                      <Image
                        src={event.imagesLinks[0]}
                        alt="Event Image"
                        layout="fill"
                        className="object-contain"
                        priority
                      />
                    </div>
                    {/* Right Half / Bottom Half: Event Information */}
                    <div className="md:w-1/2">
                      <CardHeader>
                        <CardTitle className="mx-auto md:mx-0">
                          {event.title}
                        </CardTitle>{" "}
                        {/* Event name */}
                      </CardHeader>
                      <CardContent className="flex flex-col items-center md:items-start">
                        <div className="flex flex-row gap-x-3">
                          <Badge
                            className={`flex w-fit p-2 text-center justify-center items-center mb-2 ${
                              event.availabilityStatus === "available"
                                ? "bg-green-700"
                                : "bg-gray-500" // Default color for other statuses
                            }`}
                          >
                            <span className="mx-auto">
                              {event.availabilityStatus}
                            </span>
                          </Badge>
                          <Badge
                            className={`flex w-fit p-2 text-center justify-center items-center mb-2 ${
                              event.locationType === "onsite"
                                ? "bg-green-700"
                                : "bg-primary" // Default color for other statuses
                            }`}
                          >
                            <span className="mx-auto">
                              {event.locationType}
                            </span>
                          </Badge>
                        </div>

                        <div className="p-4">
                          {event.code === "b8d78bd" ? (
                            <>
                              {/* Section: Special Training Info */}
                              <div className="p-4">
                                <p className="text-sm text-gray-500 mb-3">
                                  <span className="font-medium text-gray-700">
                                    Pelatihan Bernyanyi Dasar (Training for
                                    Basic Singing)
                                  </span>{" "}
                                  bagi anak-anak Grow Children kelas 1–6 SD oleh{" "}
                                  <span className="font-medium text-gray-700">
                                    Elaine Tjokro
                                  </span>
                                  .
                                </p>

                                <p className="font-semibold text-gray-700 mb-2">
                                  📌 Informasi Pelatihan:
                                </p>
                                <ul className="list-disc pl-6 text-sm text-gray-500 space-y-1 mb-4">
                                  <li>
                                    Pelatihan dimulai tanggal{" "}
                                    <span className="font-medium text-gray-700">
                                      7 Oktober 2025
                                    </span>{" "}
                                    sampai minggu pertama bulan{" "}
                                    <span className="font-medium text-gray-700">
                                      Desember 2025
                                    </span>
                                    .
                                  </li>
                                  <li>
                                    Pelatihan berlangsung{" "}
                                    <span className="font-medium text-gray-700">
                                      1x seminggu
                                    </span>{" "}
                                    dengan durasi{" "}
                                    <span className="font-medium text-gray-700">
                                      30 menit
                                    </span>
                                    .
                                  </li>
                                  <li>
                                    <em>
                                      Jadwal hanya dipilih satu yang paling
                                      sesuai.
                                    </em>
                                  </li>
                                </ul>

                                {/* Section: Schedule */}
                                <p className="font-semibold text-gray-700 mb-2">
                                  📌 Pilihan Hari dan Jam:
                                </p>

                                <div className="flex flex-col md:flex-row gap-6 w-full">
                                  {/* Selasa */}
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-500 mb-2">
                                      <span className="font-medium text-gray-700">
                                        🗓 Selasa
                                      </span>
                                    </p>
                                    <ul className="list-disc pl-6 text-sm text-gray-500 space-y-1 mb-3">
                                      <li>
                                        <span className="font-medium text-gray-700">
                                          Grade 1 &amp; 2
                                        </span>{" "}
                                        : 16.00 – 16.30 <strong>(Full)</strong>
                                      </li>
                                      <li>
                                        <span className="font-medium text-gray-700">
                                          Grade 3 – 6
                                        </span>{" "}
                                        : 16.30 – 17.00 <strong>(Full)</strong>
                                      </li>
                                      <li>
                                        <span className="font-medium text-gray-700">
                                          Grade 3 – 6
                                        </span>{" "}
                                        : 17.15 – 17.45
                                      </li>
                                    </ul>
                                  </div>
                                  {/* Kamis */}
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-500 mb-2">
                                      <span className="font-medium text-gray-700">
                                        🗓 Kamis
                                      </span>
                                    </p>
                                    <ul className="list-disc pl-6 text-sm text-gray-500 space-y-1">
                                      <li>
                                        <span className="font-medium text-gray-700">
                                          Grade 1 &amp; 2
                                        </span>{" "}
                                        : 16.00 – 16.30 <strong>(Full)</strong>
                                      </li>
                                      <li>
                                        <span className="font-medium text-gray-700">
                                          Grade 3 – 6
                                        </span>{" "}
                                        : 16.30 – 17.00
                                      </li>
                                      <li>
                                        <span className="font-medium text-gray-700">
                                          Grade 3 – 6
                                        </span>{" "}
                                        : 17.15 – 17.45
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-gray-700">
                                Event Time:
                              </p>
                              <p className="text-sm text-gray-500 mb-3">
                                <span className="font-medium text-gray-700">
                                  Start:{" "}
                                  {formatDate(new Date(event.eventStartAt))}
                                </span>
                              </p>
                              <p className="text-sm text-gray-500 mb-3">
                                <span className="font-medium text-gray-700">
                                  End: {formatDate(new Date(event.eventEndAt))}
                                </span>
                              </p>

                              <p className="font-semibold text-gray-700">
                                Registration Time:
                              </p>
                              <p className="text-sm text-gray-500 mb-3">
                                <span className="font-medium text-gray-700">
                                  Open:{" "}
                                  {formatDate(new Date(event.registerStartAt))}
                                </span>
                              </p>
                              <p className="text-sm text-gray-500 mb-3">
                                <span className="font-medium text-gray-700">
                                  Closed:{" "}
                                  {formatDate(new Date(event.registerEndAt))}
                                </span>
                              </p>
                            </>
                          )}

                          <div className="mt-4">
                            {/* {" "}
                          <p className="font-semibold text-gray-700">
                            Total Remaining Seats:
                          </p>
                          <p className="text-sm text-gray-500 my-3">
                            <span className="font-medium text-gray-700">
                              {event.totalRemainingSeats}
                            </span>
                          </p> */}
                            {/* Link to event sessions page */}
                            <div className="flex justify-center md:justify-start">
                              {event.availabilityStatus === "available" ? (
                                event.code === "b8d78bd" ? (
                                  <Button
                                    className="mx-auto w-full"
                                    onClick={() =>
                                      window.open(
                                        "https://docs.google.com/forms/d/e/1FAIpQLSfqh-fBpM8oBpdq2agaEFXzAzL8fTjKrg8qHjib54E0RU_jGQ/viewform",
                                        "_blank", // open in new tab
                                        "noopener,noreferrer" // security best practice
                                      )
                                    }
                                  >
                                    Register Now!
                                  </Button>
                                ) : (
                                  <Button
                                    className="mx-auto w-full "
                                    onClick={() => handleSession(event.code)}
                                  >
                                    Register Now!
                                  </Button>
                                )
                              ) : event.status === "walkin" ? (
                                <Button disabled>
                                  Walk-in : Register On Site
                                </Button>
                              ) : (
                                <>
                                  <Button disabled>Unavailable</Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-center md:justify-start"></CardFooter>
                    </div>
                  </div>
                </Card>
              ))
          ) : events && events.length === 0 ? (
            <p>No events found.</p>
          ) : (
            <p>No events found.</p>
          )}
        </div>
      </main>
    </>
  );
};

export default withAuth(EventsPage);
