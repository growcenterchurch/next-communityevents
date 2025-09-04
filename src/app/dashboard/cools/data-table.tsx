"use client";
import { CommunityData } from "./types";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  data: CommunityData[];
  columns: ColumnDef<CommunityData>[];
};

export function CoolDataTable<TData, TValue>({ columns, data }: Props) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const router = useRouter();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-5 text-center">Cool Management</h1>
      <div className="flex items-center justify-between gap-2 py-4 px-2 bg-white rounded-t-lg shadow-sm border-b">
        <div className="relative w-full max-w-xs">
          <Input
            placeholder="Search COOLs..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            title="Filter"
          >
            <Filter className="h-5 w-5 text-gray-600" />
          </button>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
            title="Add COOL"
          >
            <Plus
              className="h-5 w-5 text-primary"
              onClick={() => router.push("/dashboard/cools/create")}
            />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded-b-lg shadow-md">
        <Table className="min-w-full text-sm">
          <TableHeader className="sticky top-0 z-10 bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-4 py-3 font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-50"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    idx % 2 === 0
                      ? "bg-white hover:bg-blue-50 transition-colors"
                      : "bg-gray-50 hover:bg-blue-50 transition-colors"
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-4 py-3 border-b border-gray-100"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-gray-400"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
