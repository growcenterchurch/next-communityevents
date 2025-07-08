"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL, API_KEY } from "@/lib/config";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import withAuth from "@/components/providers/AuthWrapper";
import { useAuth } from "@/components/providers/AuthProvider";
import HeaderNav from "@/components/HeaderNav";
import VerifyTicketDialog from "@/components/VerifyTicketDialog";
import { useToast } from "@/components/ui/use-toast";

interface EventDetails {
  type: string;
  code: string;
  title: string;
  allowedFor: string;
  allowedRoles: string[];
  allowedUsers: string[];
  allowedCampuses: string[];
  status: string;
}

interface EventSession {
  type: string;
  eventCode: string;
  code: string;
  title: string;
  registerFlow: string;
  checkType: string;
  totalSeats: number;
  bookedSeats: number;
  scannedSeats: number;
  totalRemainingSeats: number;
  status: string;
}

interface User {
  name: string;
  communityId: string;
  phoneNumber: string;
  email: string;
  status: string;
  departmentName: string;
  coolName: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  previous: string | null;
  next: string | null;
  totalData: number;
}

function EventSessionsAdmin({ params }: { params: { eventCode: string } }) {
  const router = useRouter();
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const { handleExpiredToken, getValidAccessToken } = useAuth();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEventDetails = async () => {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      router.push("/login/v2");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v2/internal/events/${params.eventCode}/summary`,
        {
          headers: {
            "X-API-KEY": API_KEY || "",
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (response.status === 401) {
        router.push("/login/v2");
        return;
      }
      const data = await response.json();
      setEventDetails(data.details);
      setSessions(data.data || []); // Ensure sessions is an array
    } catch (error) {
      console.error("Error fetching event details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [params.eventCode]);

  const fetchUsers = async (
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
      const url = new URL(`${API_BASE_URL}/api/v2/internal/users`);
      url.searchParams.append("limit", "10");
      if (cursor) {
        url.searchParams.append("cursor", cursor);
      }
      if (direction) {
        url.searchParams.append("direction", direction);
      }
      if (name) {
        url.searchParams.append("searchBy", "name");
        url.searchParams.append("search", name);
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
        router.push("/login/v2");
        return;
      }

      const data = await response.json();
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const registerUser = async (user: User) => {
    if (!selectedSession) {
      toast({
        title: "Error",
        description: "Please select a session first.",
        variant: "destructive",
      });
      return;
    }

    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      router.push("/login/v2");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v2/events/registers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-API-Key": API_KEY || "",
        },
        body: JSON.stringify({
          communityId: user.communityId,
          eventCode: params.eventCode,
          instanceCode: selectedSession,
          identifier: "",
          isPersonalQR: true,
          name: user.name,
          registerAt: new Date().toISOString(),
        }),
      });

      if (response.status === 401) {
        handleExpiredToken();
        return;
      }

      if (response.ok) {
        toast({
          title: "Success",
          description: `${user.name} has been registered successfully.`,
          variant: "default",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to register user.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error registering user:", error);
      toast({
        title: "Error",
        description: "An error occurred while registering the user.",
        variant: "default",
      });
    }
  };

  return (
    <>
      <HeaderNav
        name={`Admin Dashboard Event-${params.eventCode}`}
        link="dashboard"
      />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Event Details</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {eventDetails && (
              <>
                <div className="mb-4">
                  <h2 className="text-xl font-bold">{eventDetails.title}</h2>
                  <p className="text-sm">
                    <strong>Allowed For:</strong> {eventDetails.allowedFor}
                  </p>
                  <p className="text-sm">
                    <strong>Status:</strong> {eventDetails.status}
                  </p>
                  <Badge className="mt-2">{eventDetails.status}</Badge>
                </div>
                <Button
                  className="my-4"
                  onClick={() => {
                    router.push(`/dashboard/${params.eventCode}/report`);
                  }}
                >
                  View Report
                </Button>
              </>
            )}
            <h2 className="text-xl font-bold my-4">Sessions</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Total Seats
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Booked Seats
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Remaining Seats
                  </TableHead>
                  <TableHead>Camera Scan</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Hardware Scan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <TableRow key={session.code}>
                      <TableCell>{session.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {session.totalSeats}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {session.bookedSeats}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {session.totalRemainingSeats}
                      </TableCell>
                      <TableCell>
                        <VerifyTicketDialog
                          eventCode={params.eventCode}
                          eventName={eventDetails ? eventDetails.title : ""}
                          sessionCode={session.code}
                          sessionName={session.title}
                          onlineEvent={false}
                        ></VerifyTicketDialog>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => {
                            router.push(
                              `/qrscan/${params.eventCode}/${session.code}`
                            );
                          }}
                        >
                          QR Scanner (Hardware)
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No sessions available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </>
        )}
      </div>
      <h2 className="text-xl font-bold my-6 text-center">
        Manual Registration
      </h2>
      <div className="relative w-full max-w-lg mx-auto">
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
                setSearchQuery(null);
                fetchUsers();
              }
            }}
          />
          <Button
            type="submit"
            onClick={() => {
              fetchUsers(null, null, searchQuery);
            }}
          >
            Search
          </Button>
        </div>
        <RadioGroup
          className="flex flex-row mt-4"
          onValueChange={(value) => setSelectedSession(value)}
          defaultValue={sessions[0]?.code}
        >
          {sessions.map((session, index) => (
            <div key={index} className="flex items-center space-x-1">
              <RadioGroupItem value={session.code} id={session.code} />
              <Label htmlFor={session.code}>{session.title}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <div className="p-4 my-4 w-[90%] mx-auto mt-4">
        <Table>
          {!searchQuery && (
            <TableCaption>Total Users: {pagination?.totalData}</TableCaption>
          )}
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Community ID</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department Name</TableHead>
              <TableHead>Cool Name</TableHead>
              <TableHead>Register</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users &&
              users.map((user) => (
                <TableRow key={user.communityId}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.communityId}</TableCell>
                  <TableCell>{user.phoneNumber}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.departmentName ?? null}</TableCell>
                  <TableCell>{user.coolName ?? null}</TableCell>
                  <TableCell>
                    <Button onClick={() => registerUser(user)}>Register</Button>
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
                      fetchUsers(pagination.previous, "prev", searchQuery);
                    } else {
                      fetchUsers(pagination.previous, "prev");
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
                      fetchUsers(pagination.next, "next", searchQuery);
                    } else {
                      fetchUsers(pagination.next, "next");
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
}

export default withAuth(EventSessionsAdmin);
