"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL, API_KEY } from "@/lib/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import QRDownloader from "@/components/QRDownloader";

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

type EventReportFormat = "csv" | "xlsx";
type EventReportDownload = `${string}:${EventReportFormat}` | null;

const SORT_SESSIONS_BY_TITLE_DATE = true;
const TITLE_DATE_SORT_EVENT_CODES = new Set(["5f75ed1", "0b855b5", "c011b1d"]);
const SESSIONS_TABLE_PAGE_SIZE = 5;

const monthNames: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const getSessionTitleDateTime = (title: string) => {
  const isoDateMatch = title.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
  }

  const dayMonthMatch = title.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\s+(\d{4})\b/i,
  );
  if (dayMonthMatch) {
    const [, day, monthName, year] = dayMonthMatch;
    const month = monthNames[monthName.toLowerCase()];

    if (month !== undefined) {
      return new Date(Number(year), month, Number(day)).getTime();
    }
  }

  const monthDayMatch = title.match(
    /\b([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i,
  );
  if (monthDayMatch) {
    const [, monthName, day, year] = monthDayMatch;
    const month = monthNames[monthName.toLowerCase()];

    if (month !== undefined) {
      return new Date(Number(year), month, Number(day)).getTime();
    }
  }

  return null;
};

const getSessionsForTable = (sessions: EventSession[], eventCode: string) => {
  if (
    !SORT_SESSIONS_BY_TITLE_DATE ||
    !TITLE_DATE_SORT_EVENT_CODES.has(eventCode)
  ) {
    return sessions;
  }

  return [...sessions].sort((currentSession, nextSession) => {
    const currentDate = getSessionTitleDateTime(currentSession.title);
    const nextDate = getSessionTitleDateTime(nextSession.title);

    if (currentDate === null && nextDate === null) {
      return 0;
    }

    if (currentDate === null) {
      return 1;
    }

    if (nextDate === null) {
      return -1;
    }

    return nextDate - currentDate;
  });
};

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
  const [sessionsTablePage, setSessionsTablePage] = useState(1);
  const [reportDownload, setReportDownload] =
    useState<EventReportDownload>(null);
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
        },
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
    name: string | null = null,
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

  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      setSelectedSession(sessions[0].code);
    }
  }, [sessions, selectedSession]);

  useEffect(() => {
    setSessionsTablePage(1);
  }, [params.eventCode, sessions.length]);

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

  const getDownloadFilename = (
    response: Response,
    fallbackFilename: string,
  ) => {
    const contentDisposition = response.headers.get("content-disposition");
    const filenameMatch = contentDisposition?.match(
      /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i,
    );

    return filenameMatch?.[1]
      ? decodeURIComponent(filenameMatch[1])
      : fallbackFilename;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadEventReport = async (
    session: EventSession,
    format: EventReportFormat,
  ) => {
    if (!session.code) {
      toast({
        title: "Error",
        description: "This instance cannot be exported.",
        variant: "destructive",
      });
      return;
    }

    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      router.push("/login/v2");
      return;
    }

    const searchParams = new URLSearchParams({
      format,
      eventCode: params.eventCode,
      instanceCode: session.code,
    });

    const fallbackFilename = `${params.eventCode}-${session.code}-registrations.${format}`;

    setReportDownload(`${session.code}:${format}`);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v2/internal/events/registers/download?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-API-Key": API_KEY || "",
          },
        },
      );

      if (response.status === 401) {
        handleExpiredToken();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to download report.");
      }

      const blob = await response.blob();
      downloadBlob(blob, getDownloadFilename(response, fallbackFilename));

      toast({
        title: "Report downloaded",
        description: `${session.title} registrations ${format.toUpperCase()} export is ready.`,
      });
    } catch (error) {
      console.error("Error downloading event report:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while downloading the report.",
        variant: "destructive",
      });
    } finally {
      setReportDownload(null);
    }
  };

  const selectedSessionDetails = sessions.find(
    (session) => session.code === selectedSession,
  );
  const tableSessions = getSessionsForTable(sessions, params.eventCode);
  const sessionsTableTotalPages = Math.max(
    1,
    Math.ceil(tableSessions.length / SESSIONS_TABLE_PAGE_SIZE),
  );
  const normalizedSessionsTablePage = Math.min(
    sessionsTablePage,
    sessionsTableTotalPages,
  );
  const sessionsTableStartIndex =
    (normalizedSessionsTablePage - 1) * SESSIONS_TABLE_PAGE_SIZE;
  const paginatedTableSessions = tableSessions.slice(
    sessionsTableStartIndex,
    sessionsTableStartIndex + SESSIONS_TABLE_PAGE_SIZE,
  );

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
              {tableSessions.length > 0 && (
                <TableCaption>
                  Showing {sessionsTableStartIndex + 1}-
                  {Math.min(
                    sessionsTableStartIndex + SESSIONS_TABLE_PAGE_SIZE,
                    tableSessions.length,
                  )}{" "}
                  of {tableSessions.length} sessions
                </TableCaption>
              )}
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
                  <TableHead className="hidden sm:table-cell">
                    QR Code
                  </TableHead>
                  <TableHead>Export</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTableSessions.length > 0 ? (
                  paginatedTableSessions.map((session) => (
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
                              `/qrscan/${params.eventCode}/${session.code}`,
                            );
                          }}
                        >
                          QR Scanner (Hardware)
                        </Button>
                      </TableCell>
                      <TableCell>
                        <QRDownloader
                          text={`${params.eventCode}+${session.code}`}
                          title={`${eventDetails?.title}`}
                          subheading={`${session.title}`}
                          filename={`QR-${eventDetails?.title} ${session.title}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => downloadEventReport(session, "csv")}
                            disabled={reportDownload !== null}
                          >
                            {reportDownload === `${session.code}:csv` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            CSV
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => downloadEventReport(session, "xlsx")}
                            disabled={reportDownload !== null}
                          >
                            {reportDownload === `${session.code}:xlsx` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            Excel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      No sessions available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {tableSessions.length > SESSIONS_TABLE_PAGE_SIZE && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setSessionsTablePage((page) => Math.max(1, page - 1))
                        }
                        className={cn(
                          normalizedSessionsTablePage === 1 &&
                            "pointer-events-none opacity-50",
                        )}
                      />
                    </PaginationItem>
                    <PaginationItem className="flex items-center px-3 text-sm text-muted-foreground">
                      Page {normalizedSessionsTablePage} of{" "}
                      {sessionsTableTotalPages}
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setSessionsTablePage((page) =>
                            Math.min(sessionsTableTotalPages, page + 1),
                          )
                        }
                        className={cn(
                          normalizedSessionsTablePage ===
                            sessionsTableTotalPages &&
                            "pointer-events-none opacity-50",
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
      <section className="container mx-auto space-y-4 px-4 py-10">
        {/* <div className="space-y-1 text-center">
          <h2 className="text-xl font-bold">Manual Registration</h2>
          <p className="text-sm text-muted-foreground">
            Select an instance and register attendees without scanning.
          </p>
        </div> */}

        {/* <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Choose an instance</CardTitle>
              <CardDescription>
                Pick where these registrations should land.
              </CardDescription>
            </div>
            {selectedSessionDetails && (
              <Badge variant="secondary" className="w-fit">
                {selectedSessionDetails.status}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <button
                  key={session.code}
                  onClick={() => setSelectedSession(session.code)}
                  className={cn(
                    "rounded-xl border bg-background p-4 text-left transition hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    selectedSession === session.code
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-muted"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-xs uppercase text-muted-foreground">
                        Instance
                      </p>
                      <h3 className="text-base font-semibold">
                        {session.title}
                      </h3>
                    </div>
                    <Badge variant="outline">{session.status}</Badge>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <dt className="text-muted-foreground">Total</dt>
                      <dd className="font-semibold">{session.totalSeats}</dd>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <dt className="text-muted-foreground">Booked</dt>
                      <dd className="font-semibold">{session.bookedSeats}</dd>
                    </div>
                    <div className="col-span-2 rounded-lg bg-muted/50 px-3 py-2">
                      <dt className="text-muted-foreground">Remaining</dt>
                      <dd className="font-semibold">
                        {session.totalRemainingSeats}
                      </dd>
                    </div>
                  </dl>
                </button>
              ))}
            </div>
            {sessions.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                No sessions available for manual registration.
              </p>
            )}
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <CardTitle>Find a user to register</CardTitle>
            <CardDescription>
              {selectedSessionDetails
                ? `Adding people to ${selectedSessionDetails.title}`
                : "Select an instance to enable registration."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search a user"
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchQuery ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    if (value === "") {
                      setSearchQuery(null);
                      fetchUsers();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    fetchUsers(null, null, searchQuery);
                  }}
                >
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery(null);
                    fetchUsers();
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                {!searchQuery && (
                  <TableCaption>
                    Total Users: {pagination?.totalData}
                  </TableCaption>
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
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.communityId}</TableCell>
                        <TableCell>{user.phoneNumber}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.departmentName ?? null}</TableCell>
                        <TableCell>{user.coolName ?? null}</TableCell>
                        <TableCell>
                          <Button
                            disabled={!selectedSession}
                            onClick={() => registerUser(user)}
                          >
                            Register
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  {pagination?.previous && (
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => {
                          if (searchQuery) {
                            fetchUsers(
                              pagination.previous,
                              "prev",
                              searchQuery,
                            );
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
          </CardContent>
        </Card>
      </section>
    </>
  );
}

export default withAuth(EventSessionsAdmin);
