"use client";

import { CommunityData } from "./types";
import { ColumnDef } from "@tanstack/react-table";

export const communityColumns: ColumnDef<CommunityData>[] = [
  {
    accessorKey: "name",
    header: "Community Name",
  },
  {
    accessorKey: "campusName",
    header: "Campus",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorFn: (row) => row.leaders.map((l) => l.name).join(", "),
    id: "leaders",
    header: "Leaders",
  },
];
