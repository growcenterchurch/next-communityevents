"use client";
import { useEffect, useState } from "react";
import { getColumns, CoolNewJoiner } from "./columns";
import { DataTable } from "./data-table";
import { useAuth } from "@/components/providers/AuthProvider";
import { API_BASE_URL, API_KEY } from "@/lib/config";
import HeaderNav from "@/components/HeaderNav";
import { DataTableViewOptions } from "@/components/DataTableViewOptions";
import { table } from "console";

export default function DemoPage() {
  const { isAuthenticated, handleExpiredToken, getValidAccessToken } =
    useAuth();
  const [data, setData] = useState<CoolNewJoiner[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [statusSummary, setStatusSummary] = useState({
    pending: 0,
    followed: 0,
    completed: 0,
  });
  const userData = isAuthenticated
    ? JSON.parse(localStorage.getItem("userData") || "{}")
    : null;

  const statusOrder = { pending: 0, followed: 1, completed: 2 };

  useEffect(() => {
    async function fetchData() {
      const dataLimit = 100;
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        handleExpiredToken();
        return;
      }
      let url = `${API_BASE_URL}/api/v2/internal/cools/join?limit=${dataLimit}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      const res = await fetch(url, {
        headers: {
          "X-API-KEY": API_KEY || "",
          "Content-Type": "application/json",
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
        cache: "no-store",
      });
      if (res.status === 401) {
        handleExpiredToken();
        return;
      }

      if (!res.ok) {
        setData([]);
        return;
      }
      const json = await res.json();
      // Sort so pending first, then followed, then completed
      interface ApiResponse {
        data: CoolNewJoiner[];
        [key: string]: any;
      }

      const sorted: CoolNewJoiner[] = ((json as ApiResponse).data || []).sort(
        (a: CoolNewJoiner, b: CoolNewJoiner) =>
          (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
      );
      setData(sorted);

      // Count statuses for summary
      const summary = { pending: 0, followed: 0, completed: 0 };
      sorted.forEach((item) => {
        if (item.status in summary) summary[item.status]++;
      });
      setStatusSummary(summary);
    }
    fetchData();
  }, [getValidAccessToken, statusFilter]);

  // Optimistic update handler
  const handleStatusChange = (id: number, status: CoolNewJoiner["status"]) => {
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  return (
    <>
      <HeaderNav name="New Joiners" link="dashboard" />
      <div className="px-6 mx-auto max-h-full py-10 mb-16">
        <h1 className="text-2xl font-bold mb-8 text-center">New Joiners</h1>
        {/* Status Filter */}
        <h2 className="text-xl font-bold mb-2 text-center">Summary</h2>

        <div className="flex justify-center gap-8 mb-6">
          <span className="font-semibold text-yellow-700">
            Pending: {statusSummary.pending} people
          </span>
          <span className="font-semibold text-blue-700">
            Followed-Up : {statusSummary.followed} people
          </span>
          <span className="font-semibold text-green-700">
            Completed: {statusSummary.completed} people
          </span>
        </div>
        <div className="flex justify-end mb-4">
          <select
            className="border rounded px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="followed">Followed</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <DataTable columns={getColumns(handleStatusChange)} data={data} />
      </div>
    </>
  );
}
