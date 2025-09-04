"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/router";
import { API_BASE_URL, API_KEY } from "@/lib/config";
import { CoolNewJoiner } from "./types";

export const getColumns = (
  onStatusChange?: (id: number, status: CoolNewJoiner["status"]) => void
): ColumnDef<CoolNewJoiner>[] => [
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Request Date
          <ArrowUpDown className=" h-2 w-2" />
        </Button>
      );
    },
    enableSorting: true,
    cell: ({ row }) => {
      const date = row.original.createdAt;
      if (!date) return "-";
      const d = new Date(date);
      const tanggal = d.toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const jam = d
        .toLocaleTimeString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(".", ":");
      return `${tanggal} ${jam}`;
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className=" h-2 w-2" />
        </Button>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "maritalStatus",
    header: "Marital Status",
  },
  {
    accessorKey: "gender",
    header: "Gender",
  },
  {
    accessorKey: "yearOfBirth",
    header: "Year of Birth",
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone Number",
    cell: ({ row }) => {
      const phone = row.original.phoneNumber;
      const phoneDigits = phone.replace(/^0/, "+62");
      const waLink = `https://wa.me/${phoneDigits}`;
      return (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 underline"
        >
          {phone}
        </a>
      );
    },
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "communityOfInterest",
    header: "Community of Interest",
  },
  {
    accessorKey: "campusCode",
    header: "GC Code",
  },
  {
    accessorKey: "location",
    header: "Location",
  },

  // {
  //   accessorKey: "updatedAt",
  //   header: ({ column }) => {
  //     return (
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //       >
  //         Last Update Time
  //         <ArrowUpDown className=" h-2 w-2" />
  //       </Button>
  //     );
  //   },
  //   enableSorting: true,
  //   cell: ({ row }) => {
  //     const date = row.original.createdAt;
  //     if (!date) return "-";
  //     const d = new Date(date);
  //     const tanggal = d.toLocaleDateString("id-ID", {
  //       timeZone: "Asia/Jakarta",
  //       year: "numeric",
  //       month: "long",
  //       day: "numeric",
  //     });
  //     const jam = d
  //       .toLocaleTimeString("id-ID", {
  //         timeZone: "Asia/Jakarta",
  //         hour: "2-digit",
  //         minute: "2-digit",
  //         hour12: false,
  //       })
  //       .replace(".", ":");
  //     return `${tanggal} ${jam}`;
  //   },
  // },
  {
    accessorKey: "status",
    header: "Status",
    cell: function StatusCell({ row }) {
      const { getValidAccessToken, handleExpiredToken } =
        require("@/components/providers/AuthProvider").useAuth();
      const status = row.original.status;
      const id = row.original.id;
      const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as CoolNewJoiner["status"];
        if (onStatusChange) {
          onStatusChange(id, newStatus); // Optimistically update UI
        }
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          handleExpiredToken();
          return;
        }
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/v2/internal/cools/join/${id}/${newStatus}`,
            {
              method: "PATCH",
              headers: {
                "X-API-KEY": API_KEY || "",
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (res.status === 401) {
            // Handle expired token
            handleExpiredToken();
            return;
          }
        } catch (err) {
          // Optionally: revert optimistic update or show error
        }
      };
      return (
        <select
          defaultValue={status}
          onChange={handleChange}
          className="border rounded px-2 py-1 bg-white"
        >
          <option value="pending">Pending</option>
          <option value="followed">Followed</option>
          <option value="completed">Completed</option>
        </select>
      );
    },
  },
];

export function getRowClassName(status: CoolNewJoiner["status"]) {
  switch (status) {
    case "completed":
      return "bg-green-100";
    case "pending":
      return "bg-yellow-50";
    case "followed":
      return "bg-blue-50";
    default:
      return "";
  }
}
