"use client";

import { Button } from "@/components/ui/button";
import { handleLogin } from "./services/AuthService";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setHasToken(true);
  }, []);

  return (
    <div className="flex justify-center items-center flex-col h-[100vh] w-[100vw]">
      <h1>Welcome to Panto AI</h1>

      {hasToken ? (
        <Link href={"/home"}>Home</Link>
      ) : (
        <div />
      )}

      <div className="flex flex-col gap-2 mt-4">
        <Button
          variant={"default"}
          size={"sm"}
          className="border cursor-pointer"
          onClick={handleLogin}
        >
          Github
        </Button>
        <Button
          variant={"default"}
          size={"sm"}
          className="border cursor-pointer"
        >
          Gitlab
        </Button>
        <Button variant="default" size={"sm"} className="border cursor-pointer">
          BitBucket
        </Button>
      </div>
    </div>
  );
}
