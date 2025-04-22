"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/providers/AuthProvider";
import withAuth from "@/components/providers/AuthWrapper";
import HeaderNav from "@/components/HeaderNav";
import { useParams } from "next/navigation";
import { API_BASE_URL, API_KEY } from "@/lib/config";
import { EventResponse } from "@/lib/types/event";
import { Loader2 } from "lucide-react"; // Import a loading icon for better feedback
import { useRouter } from "next/navigation";

const QRScan: React.FC = () => {
  const { eventCode, sessionCode } = useParams();
  const [scannerInput, setScannerInput] = useState<string>("");
  const { isAuthenticated, handleExpiredToken } = useAuth();
  const [message, setMessage] = useState<string>("");
  const [registeredResponse, setRegisteredResponse] =
    useState<EventResponse | null>(null);
  const [error, setError] = useState<boolean>(false); // Add error state
  const [loading, setLoading] = useState<boolean>(false); // Add a loading state
  const lastSubmittedQRCode = useRef<string | null>(null);
  const router = useRouter();
  const { getValidAccessToken } = useAuth();

  const userData = isAuthenticated
    ? JSON.parse(localStorage.getItem("userData") || "{}")
    : null;

  const sendToAPI = async (qrCode: string) => {
    if (lastSubmittedQRCode.current === qrCode || !qrCode) return; // Prevent redundant calls
    lastSubmittedQRCode.current = qrCode;
    setLoading(true);
    setError(false); // Reset error state

    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      handleExpiredToken();
      return;
    }

    try {
      const patchResponse = await fetch(
        `${API_BASE_URL}/api/v2/events/registers/${qrCode}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "X-API-Key": API_KEY || "",
          },
          body: JSON.stringify({
            status: "success",
            updatedAt: new Date().toISOString(),
          }),
        }
      );

      // try {
      //   const response = await fetch(`${API_BASE_URL}/api/v2/events/registers`, {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${accessToken}`,
      //       "X-API-Key": API_KEY || "",
      //     },
      //     body: JSON.stringify({
      //       communityId: qrCode,
      //       eventCode: eventCode,
      //       instanceCode: sessionCode,
      //       isPersonalQR: true,
      //       name: userData.name,
      //       registerAt: new Date().toISOString(),
      //       description: "Offline Registration",
      //       // registrants: [
      //       //   {
      //       //     name: userData.name,
      //       //   },
      //       // ],
      //     }),
      //   });

      if (!patchResponse.ok) {
        // Manually throw an error to handle it in the catch block
        const errorResult = await patchResponse.json(); // Try to get the error details from the response body
        const errorMessage = errorResult?.message || "Unknown error occurred";
        throw new Error(errorMessage); // Throw the error so it can be caught by the catch block
      }

      const data = await patchResponse.json();
      setMessage("Registration successful!");
      setRegisteredResponse(data);
      console.log(data);
    } catch (error: any) {
      // Catch both fetch errors and manually thrown errors
      console.error("Error while connecting to the API", error);
      setMessage(error.message || "Error connecting to the server.");
      setError(true); // Set error state in case of failure
    } finally {
      setLoading(false);
    }
  };

  // Effect to handle API call whenever a new QR code is scanned
  useEffect(() => {
    if (scannerInput) {
      sendToAPI(scannerInput.trim());
    }
  }, [scannerInput]);

  // Effect to handle QR code scanning
  useEffect(() => {
    let accumulatedInput = "";

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;

      if (key === "Enter" || key === "n") {
        const scannedCode = accumulatedInput.trim();
        if (scannedCode) {
          setScannerInput(scannedCode);
        }
        accumulatedInput = ""; // Clear accumulated input after submission
      } else {
        accumulatedInput += key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <HeaderNav
        name={`QR Scanner for Event Code: ${eventCode} | Session: ${sessionCode}`}
        link={`dashboard/${eventCode}`}
      />
      <div className="w-full flex justify-center mt-8">
        <Card className="w-full max-w-2xl mx-auto p-4 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-lg font-bold">
              QR Scanner
            </CardTitle>
            <CardDescription className="text-center">
              {loading ? "Processing..." : message || "Awaiting scan..."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="py-4">
              {loading ? (
                <div className="flex justify-center items-center">
                  <Loader2 className="animate-spin h-6 w-6" />
                </div>
              ) : error ? (
                <div className="bg-red-100 p-4 rounded-md">
                  <h3 className="font-semibold text-xl text-red-700">
                    Scan Failed!
                  </h3>
                  <p>{message}</p>
                </div>
              ) : registeredResponse ? (
                <div className="bg-green-100 p-4 rounded-md">
                  <h3 className="font-semibold text-xl">Scan Successful!</h3>
                  <p>Name: {registeredResponse.name}</p>
                  <p>Registered By: {registeredResponse.identifier}</p>
                  <p>Status: {registeredResponse.status}</p>
                </div>
              ) : (
                <p className="text-gray-500">No QR code scanned yet.</p>
              )}
            </div>
            <div className="mt-6">
              <p className="text-gray-600">
                Next scan ready. Please scan the next QR code.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default withAuth(QRScan);
