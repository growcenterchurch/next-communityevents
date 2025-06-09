"use client";

import { useRouter } from "next/navigation";
import withAuth from "@/components/providers/AuthWrapper";
import { useAuth } from "@/components/providers/AuthProvider";
import { Event } from "@/lib/types/event";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL, API_KEY } from "@/lib/config";
import { Search } from "lucide-react";
import Link from "next/link";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import HeaderNav from "@/components/HeaderNav";
import { useToast } from "@/components/ui/use-toast";

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
  userTypes: string[];
}
import { Input } from "@/components/ui/input";

function EventsAdmin() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Add loading state
  const { isAuthenticated, handleExpiredToken, getValidAccessToken } =
    useAuth();
  const { toast } = useToast();
  const userData = isAuthenticated
    ? JSON.parse(localStorage.getItem("userData") || "{}")
    : null;
  const router = useRouter();

  if (userData.role === "user") {
    router.push("/home");
    return null;
  }

  function handleSession(code: any) {
    return router.push(`/dashboard/${code}`);
  }
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  const fetchUsers = async (
    cursor: string | null = null,
    direction: string | null = null,
    name: string | null = null
  ) => {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      handleExpiredToken();
      return;
    }

    try {
      setIsLoading(true);
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
        handleExpiredToken();
        return;
      }

      const data = await response.json();
      setUsers(data.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeUser = async (communityId: string) => {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      handleExpiredToken();
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v2/users/roles-types/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "X-API-Key": API_KEY || "",
          },
          body: JSON.stringify({
            field: "userType",
            communityIds: [communityId],
            changes: ["volunteer"],
          }),
        }
      );

      if (response.status === 401) {
        handleExpiredToken();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to upgrade user");
      }

      toast({
        title: "Success",
        description: "User upgraded to worker successfully.",
        className: "bg-green-400",
        duration: 3000,
      });

      // Optionally, refetch users to update the list
      fetchUsers(null, null, searchQuery);
    } catch (error) {
      console.error("Error upgrading user:", error);
      toast({
        title: "Error",
        description: "Failed to upgrade user. Please try again later.",
        className: "bg-red-400",
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    async function fetchEvents() {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        handleExpiredToken();
        return;
      }

      setIsLoading(true); // Set loading to true before fetching

      try {
        const response = await fetch(`${API_BASE_URL}/api/v2/events`, {
          headers: {
            "X-API-KEY": API_KEY || "",
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (response.status === 401) {
          handleExpiredToken();
          return;
        }
        const data = await response.json();
        setEvents(data.data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setIsLoading(false); // Set loading to false after fetching
      }
    }

    fetchEvents();
  }, []);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 640); // Adjust the width as needed
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null);
  };

  return (
    <>
      <div className="flex min-h-screen w-full flex-col gap-y-4">
        <HeaderNav name="Admin Dashboard" link="home"></HeaderNav>
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Users List</h1>
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
                  setUsers([]); // Clear users when search query is empty
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
            <Button
              variant={"destructive"}
              type="reset"
              onClick={() => {
                setSearchQuery(null);
                setUsers([]); // Clear users when search query is empty
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="container mx-auto p-4">
          {users && users.length > 0 && (
            <>
              <h1 className="text-2xl font-bold mb-2">Search Results</h1>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Community ID</TableHead>
                    <TableHead>User Type</TableHead>
                    <TableHead>Upgrade to Worker</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.email}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.communityId}</TableCell>
                      <TableCell>{user.userTypes.join(", ")}</TableCell>
                      <TableCell>
                        {user.userTypes.includes("user") && (
                          <Button onClick={() => upgradeUser(user.communityId)}>
                            Upgrade
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}

          <h1 className="text-2xl font-bold mt-8 mb-4">Events List</h1>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Description
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Registration
                  </TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.code}>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {event.availabilityStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {event.topics.join(", ")}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {formatDate(event.registerStartAt)} -{" "}
                      {formatDate(event.registerEndAt)}
                    </TableCell>
                    <TableCell>
                      {(event.availabilityStatus === "available" ||
                        event.availabilityStatus === "soon" ||
                        event.availabilityStatus === "closed") && (
                        <Button onClick={() => handleSession(event.code)}>
                          View Details
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <div className="container mx-auto p-4 ">
          <Link
            href={"dashboard/new-joiners"}
            className="text-xl w-[20%] mb-2 hover:underline hover:text-blue-800 border p-4 rounded-xl hover:bg-blue-300  flex items-center justify-start"
          >
            View COOL New Joiners
          </Link>
        </div>
      </div>
    </>
  );
}

export default withAuth(EventsAdmin);
