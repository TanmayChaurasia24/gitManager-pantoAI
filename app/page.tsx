"use client"

import { Button } from "@/components/ui/button";
import { handleLogin } from "./services/AuthService";

export default function Home() {

  return (
    <div className="flex justify-center items-center flex-col h-[100vh] w-[100vw]">
      <h1>Welcome to Panto AI</h1>
      <div className="flex flex-col gap-2">
        <Button variant={"default"} size={"sm"} className="border cursor-pointer" onClick={handleLogin}>
          Github
        </Button>
        <Button variant={"default"} size={"sm"} className="border cursor-pointer">
          Gitlab
        </Button>
        <Button variant="default" size={"sm"} className="border cursor-pointer">
          BitBucket
        </Button>
      </div>
    </div>
  );
}
