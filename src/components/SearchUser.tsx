"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useAuth } from "@/components/providers/AuthProvider";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

type SearchUserDialogProps = {
  type?: string;
  onSelect?: (name: string, id: string) => void;
};

export default function SearchUserDialog({
  type,
  onSelect,
}: SearchUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleExpiredToken, getValidAccessToken } = useAuth();

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      handleExpiredToken();
      return;
    }
    try {
      const url = new URL(`${API_BASE_URL}/api/v2/internal/users`);
      url.searchParams.append("search", searchQuery);
      url.searchParams.append("searchBy", "name");
      url.searchParams.append("limit", "5");
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY || "",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setResults(data.data || []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add {type ?? "User"}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Search User by Name</DialogTitle>
          <DialogDescription>
            Enter a name to search for a user.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 items-center mb-4">
          <Input
            placeholder="Enter user name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <Button onClick={handleSearch} disabled={loading || !searchQuery}>
            Search
          </Button>
        </div>
        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {results.length > 0 ? (
          <div className="space-y-2">
            {results.map((user) => (
              <button
                key={user.communityId}
                className="w-full text-left border rounded-lg p-2 hover:bg-gray-100 transition"
                onClick={() => {
                  if (onSelect) {
                    onSelect(user.name, user.communityId);
                  }
                  setOpen(false); // close dialog after selection
                }}
              >
                <span className="font-semibold">{user.name}</span>
                <div className="text-xs text-gray-500">
                  ID: {user.communityId}
                </div>
                <div className="text-xs text-gray-500">
                  Type: {user.userTypes?.join(", ")}
                </div>
              </button>
            ))}
          </div>
        ) : (
          !loading && (
            <p className="text-sm text-muted-foreground">No results found.</p>
          )
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
