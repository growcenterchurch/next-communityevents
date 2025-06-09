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
  const userData = isAuthenticated
    ? JSON.parse(localStorage.getItem("userData") || "{}")
    : null;

  useEffect(() => {
    async function fetchData() {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        handleExpiredToken();
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/v2/internal/cools/join`, {
        headers: {
          "X-API-KEY": API_KEY || "",
          "Content-Type": "application/json",
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
        cache: "no-store",
      });
      if (!res.ok) {
        setData([]);
        return;
      }
      const json = await res.json();
      setData(json.data || []);
    }
    fetchData();
  }, [getValidAccessToken]);

  // Optimistic update handler
  const handleStatusChange = (id: number, status: CoolNewJoiner["status"]) => {
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  return (
    <>
      <HeaderNav name="New Joiners" link="dashboard" />
      <div className="px-6 mx-auto max-h-full py-10">
        <h1 className="text-2xl font-bold mb-8 text-center">New Joiners</h1>
        <DataTable columns={getColumns(handleStatusChange)} data={data} />
      </div>
    </>
  );
}
