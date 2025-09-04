// components/UserMultiSelectCombobox.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
// import { useDebounce } from "@/lib/hooks/useDebounce";
import { X, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type User = {
  id: string;
  name: string;
  email: string;
};

interface UserMultiSelectComboboxProps {
  role: "facilitator" | "leader" | "core";
  onChange: (userIds: string[], role: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

// Mock example users
const exampleUsers: User[] = [
  { id: "46365047776", name: "Regina George", email: "regina@mean.com" },
  { id: "73646933745", name: "Andy Sachs", email: "andy@runway.com" },
  { id: "55527252706", name: "Miranda Priestly", email: "miranda@vogue.com" },
  { id: "29933509256", name: "Jason Bourne", email: "jason@cia.gov" },
  { id: "12573519345", name: "Leslie Knope", email: "leslie@pawnee.gov" },
];

export function UserMultiSelectCombobox({
  role,
  onChange,
  open,
  setOpen,
}: UserMultiSelectComboboxProps) {
  const [query, setQuery] = useState("");
  //   const debouncedQuery = useDebounce(query, 300);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  //   const [open, setOpen] = useState(false);

  //   useEffect(() => {
  //     if (!debouncedQuery) {
  //       setUsers([]);
  //       return;
  //     }

  useEffect(() => {
    // Simulate "search" by filtering mock users
    const filtered = exampleUsers.filter(
      (user) => user.name.toLowerCase()
      // .includes(debouncedQuery.toLowerCase())
    );

    setUsers(filtered);
  }, []);

  const addUser = (user: User) => {
    if (selectedUsers.find((u) => u.id === user.id)) return;
    const updated = [...selectedUsers, user];
    setSelectedUsers(updated);
    onChange(
      updated.map((u) => u.id),
      role
    );
    setQuery("");
    // Only close the popover after selecting a user
    setOpen(true); // keep open for multi-select experience
  };

  const removeUser = (userId: string) => {
    const updated = selectedUsers.filter((u) => u.id !== userId);
    setSelectedUsers(updated);
    onChange(
      updated.map((u) => u.id),
      role
    );
  };

  return (
    <div className="space-y-2">
      {/* Selected users display */}
      <div className="flex flex-wrap gap-2 min-h-[36px]">
        {selectedUsers.map((user) => (
          <Badge
            key={user.id}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-blue-50 border border-blue-200 text-blue-700"
          >
            <User className="w-4 h-4 mr-1 text-blue-400" />
            <span className="truncate max-w-[120px]">{user.name}</span>
            <X
              className="w-3 h-3 cursor-pointer ml-1 text-blue-400 hover:text-red-500 transition-colors"
              onClick={() => removeUser(user.id)}
            />
          </Badge>
        ))}
      </div>

      {/* Search input + dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (!open) setOpen(true);
              }}
              placeholder={`Search ${role}s...`}
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all bg-white"
            />
            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[320px] shadow-lg border border-gray-200 rounded-lg bg-white">
          <Command>
            <CommandList>
              {users.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground text-center">
                  No users found.
                </p>
              ) : (
                users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.name}
                    onSelect={() => addUser(user)}
                    className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-blue-50"
                  >
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-gray-800">
                      {user.name}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      {user.id}
                    </span>
                  </CommandItem>
                ))
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
