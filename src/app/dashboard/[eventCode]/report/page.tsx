"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeaderNav from "@/components/HeaderNav";
import { API_BASE_URL, API_KEY } from "@/lib/config";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { useToast } from "@/components/ui/use-toast";

interface EventDetails {
  details: {
    title: string;
    type: string;
    code: string;
    allowedFor: string;
    status: string;
    totalBookedSeats: number;
    totalScannedSeats: number;
  };
  data: {
    code: string;
    title: string;
    registerFlow: string;
    checkType: string;
    totalSeats: number;
    bookedSeats: number;
    scannedSeats: number;
    totalRemainingSeats: number;
    status: string;
  }[];
}

interface Registrant {
  id: string;
  name: string;
  communityId: string;
  eventCode: string;
  eventName: string;
  instanceCode: string;
  instanceName: string;
  departmentName: string;
  coolName: string;
  registeredBy: string;
  status: string;
  registeredAt: string;
  verifiedAt: string;
}

interface Pagination {
  previous: string | null;
  next: string | null;
  totalData: number;
}

const ReportPage = ({ params }: { params: { eventCode: string } }) => {
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [openInstanceBox, setOpenInstanceBox] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(
    "All"
  );
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [selectedInstanceDetails, setSelectedInstanceDetails] = useState<
    EventDetails["data"][0] | null
  >(null);
  const { getValidAccessToken, handleExpiredToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const fetchRegistrants = async (
    cursor: string | null = null,
    direction: string | null = null,
    name: string | null = null
  ) => {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      router.push("/login/v2");
      return;
    }

    try {
      const url = new URL(`${API_BASE_URL}/api/v2/internal/events/registers`);
      url.searchParams.append("limit", "500");
      url.searchParams.append("EventCode", params.eventCode);
      if (cursor) {
        url.searchParams.append("cursor", cursor);
      }
      if (direction) {
        url.searchParams.append("direction", direction);
      }
      if (name) {
        url.searchParams.append("name", name);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-API-Key": API_KEY || "",
        },
      });

      if (response.status === 401) {
        handleExpiredToken();
        return;
      }

      const data = await response.json();
      setRegistrants(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching registrants:", error);
    }
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        router.push("/login/v2");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v2/internal/events/${params.eventCode}/summary`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              "X-API-Key": API_KEY || "",
            },
          }
        );

        if (response.status === 401) {
          handleExpiredToken();
          return;
        }

        const data = await response.json();
        setEventDetails(data);
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [params.eventCode, getValidAccessToken, handleExpiredToken]);

  const updateRegistrantStatus = async (id: string) => {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      router.push("/login/v2");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v2/events/registers/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "X-API-Key": API_KEY || "",
          },
          body: JSON.stringify({
            status: "success",
            updatedAt: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Registrant status updated!",
          description: "User has attended the event.",
          className: "bg-green-400",
          duration: 2000,
        });
      }

      if (response.status === 401) {
        handleExpiredToken();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update registrant status");
      }

      // Optionally, refetch registrants to update the UI
      fetchRegistrants();
    } catch (error) {
      console.error("Error updating registrant status:", error);
    }
  };

  useEffect(() => {
    fetchRegistrants();
  }, [params.eventCode, getValidAccessToken, handleExpiredToken]);

  useEffect(() => {
    if (selectedInstance === "All") {
      setSelectedInstanceDetails(null);
    } else {
      const instance = eventDetails?.data.find(
        (instance) => instance.title === selectedInstance
      );
      setSelectedInstanceDetails(instance || null);
    }
  }, [selectedInstance, eventDetails]);

  if (loading) {
    return <p className="text-center mt-4">Loading...</p>;
  }

  if (!eventDetails) {
    return <p className="text-center mt-4">No event details available.</p>;
  }

  return (
    <>
      <HeaderNav
        name={`Report for event ${eventDetails.details.title} (${params.eventCode})`}
        link={`dashboard/${params.eventCode}`}
      />
      <div className="p-4 my-4">
        <p className="text-2xl font-bold my-4 mx-auto text-center">
          {eventDetails.details.title} - Event Report
        </p>
        <div className="flex justify-center mb-4">
          <Popover open={openInstanceBox} onOpenChange={setOpenInstanceBox}>
            <PopoverTrigger asChild>
              <Button variant="outline" className=" justify-between">
                {selectedInstance}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="mx-auto text-center p-3">
              <Command>
                <CommandInput placeholder="Search instance..." />
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      key="all"
                      onSelect={() => {
                        setSelectedInstance("All");
                        setOpenInstanceBox(false);
                      }}
                    >
                      All
                    </CommandItem>
                    {eventDetails.data.map((instance) => (
                      <CommandItem
                        key={instance.code}
                        onSelect={() => {
                          setSelectedInstance(instance.title);
                          setOpenInstanceBox(false);
                        }}
                      >
                        {instance.title}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-row justify-center gap-4 flex flex-wrap">
          <Card className="">
            <CardHeader></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center">
                <p className="font-semibold text-lg">Total Booked Seats:</p>
                <p className="font-bold text-2xl">
                  {selectedInstanceDetails?.bookedSeats ??
                    eventDetails.details.totalBookedSeats}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="">
            <CardHeader></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center">
                <p className="font-semibold text-lg ">Total Scanned Seats:</p>
                <p className="font-bold text-2xl">
                  {" "}
                  {selectedInstanceDetails?.scannedSeats ??
                    eventDetails.details.totalScannedSeats}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="my-4 flex flex-col items-center justify-center border border-black/15 border-t-2 border-x-0 border-b-0 p-4">
        <span className="font-bold text-2xl mb-4 ">Registrants</span>
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <div className="flex w-full max-w-sm items-center space-x-2">
            {" "}
            <Input
              type="search"
              placeholder="Search a user"
              className="w-full rounded-lg bg-background pl-8"
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                if (value === "") {
                  fetchRegistrants();
                  setSearchQuery(null);
                }
              }}
            />
            <Button
              type="submit"
              onClick={() => {
                fetchRegistrants(null, null, searchQuery);
              }}
            >
              Search
            </Button>
          </div>
        </div>
      </div>
      <div className="p-4 my-4 w-[90%] mx-auto">
        <Table>
          {!searchQuery && (
            <TableCaption>Total Users: {pagination?.totalData}</TableCaption>
          )}
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Community ID</TableHead>
              <TableHead>Instance Name</TableHead>
              <TableHead>Department Name</TableHead>
              <TableHead>Cool Name</TableHead>
              <TableHead>Registration Status</TableHead>
              <TableHead>Manual Register</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrants &&
              registrants.map((registrant) => (
                <TableRow key={registrant.id}>
                  <TableCell className="font-medium">
                    {registrant.name}
                  </TableCell>
                  <TableCell>{registrant.communityId}</TableCell>
                  <TableCell>{registrant.instanceName}</TableCell>
                  <TableCell>{registrant.departmentName ?? null}</TableCell>
                  <TableCell>{registrant.coolName ?? null}</TableCell>
                  <TableCell
                    className={
                      registrant.status === "success" ? "text-green-500" : ""
                    }
                  >
                    {registrant.status}
                  </TableCell>
                  <TableCell>
                    <Button
                      disabled={registrant.status === "success"}
                      onClick={() => {
                        updateRegistrantStatus(registrant.id);
                      }}
                    >
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <div className="w-full flex justify-center mb-10">
        <Pagination>
          <PaginationContent>
            {pagination?.previous && (
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    if (searchQuery) {
                      fetchRegistrants(
                        pagination.previous,
                        "prev",
                        searchQuery
                      );
                    } else {
                      fetchRegistrants(pagination.previous, "prev");
                    }
                  }}
                />
              </PaginationItem>
            )}
            {pagination?.next && (
              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    if (searchQuery) {
                      fetchRegistrants(pagination.next, "next", searchQuery);
                    } else {
                      fetchRegistrants(pagination.next, "next");
                    }
                  }}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
};

export default ReportPage;
