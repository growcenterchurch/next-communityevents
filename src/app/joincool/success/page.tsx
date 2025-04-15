"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SuccessJoinCoolPage = () => {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8 max-w-md flex flex-col items-center justify-center min-h-[80vh]">
      <Card className="w-full shadow-lg">
        <CardHeader className="flex flex-col items-center pb-2">
          <div className="mb-4">
            <Image
              src="/images/gc-logo-2.png"
              alt="Grow Community Logo"
              width={80}
              height={80}
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Registration Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-center text-gray-700 mb-6">
            Congratulations! You have successfully joined the Grow Community.
            We're excited to have you with us! Thank you and God bless you.
          </p>
          {/* <div className="flex flex-col w-full gap-3">
            <Button className="w-full" onClick={() => router.push("/home")}>
              Go to Home
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/joincool")}
            >
              Register Another Person
            </Button>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuccessJoinCoolPage;
