"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login/v2");
  }, [router]);
  return (
    <></>
    // <main className="flex h-screen flex-col justify-start md:justify-between items-center bg-white">
    //   {/* Logo Section */}
    //   <div className="my-14 md:mt-28">
    //     <Image
    //       className="bg-white"
    //       src="/images/gc-logo-2.png" // Adjust the path to your logo in the public folder
    //       alt="Logo"
    //       width={300} // Adjust the width of the logo
    //       height={300} // Adjust the height of the logo
    //     />
    //   </div>

    //   {/* Buttons Section */}
    //   <div className="flex flex-col items-center gap-5 mb-40 w-full">
    //     <Button
    //       onClick={() => router.push("/login/v2")}
    //       className="bg-primary text-white hover:bg-gray-300 hover:text-black hover:border-primary w-10/12 md:w-1/3 border-2 border-white rounded-full"
    //     >
    //       Sign In
    //     </Button>
    //     <Button
    //       onClick={() => router.push("/register")}
    //       className="bg-primary text-white hover:bg-white hover:text-black hover:border-primary w-10/12 md:w-1/3 border-2 border-white rounded-full"
    //     >
    //       Sign Up Now!
    //     </Button>
    //   </div>
    // </main>
  );
}
