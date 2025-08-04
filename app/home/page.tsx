"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { handleLogout } from "../services/AuthService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User2Icon } from "lucide-react";
import Link from "next/link";

export default function Homepage() {
  const [isLoggedin, setisLoggedin] = useState<boolean>(false);
  const [userInfo, setuserInfo] = useState<any>({});
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const router = useRouter();

  const logout = () => {
    const success = handleLogout();
    if (success) {
      toast.success("Logged out successfully!");
      router.push("/");
    } else {
      toast.error("Error, please try again later!");
    }
  };
  useEffect(() => {
    const fetchtoken = async () => {
      const istoken = localStorage.getItem("token");
      let userdata: any = localStorage.getItem("userInfo")!;
      if (userdata === null) {
        toast.error("login again!");
        return;
      }

      userdata = await JSON.parse(userdata);
      console.log("after user data is: ", userdata);

      const reposResponse: any = await fetch(userdata.user.repos_url);
      const repos = await reposResponse.json();

      console.log("repos are: ", repos);

      if (!repos) {
        toast.error("error fetching all repos, try again!");
        return;
      }

      if (istoken) {
        setuserInfo(userdata);
        setUserRepos(repos);

        setisLoggedin(true);
      } else {
        setisLoggedin(false);
      }
    };

    fetchtoken();
  }, [isLoggedin]);
  return (
    <div>
      <nav className="w-full h-[5vh] bg-black text-white p-5 flex justify-center items-center">
        {isLoggedin && (
          <div className="flex justify-center items-center gap-x-3">
            <div>
              <Button
                variant={"default"}
                className="border cursor-pointer"
                onClick={logout}
              >
                Logout
              </Button>
            </div>
            <Button
              asChild
              className="flex justify-center items-center cursor-pointer"
            >
              <Link href="/profile">
                <User2Icon />
              </Link>
            </Button>
          </div>
        )}
      </nav>
      <main className="p-6">
        <h2 className="text-xl font-bold mb-4">Repositories {userRepos.length}</h2>
        {userRepos.length === 0 ? (
          <p>No repositories found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userRepos.map((repo: any) => (
              <div
                key={repo.id}
                className="border border-gray-200 p-4 rounded shadow hover:shadow-lg transition"
              >
                <h3 className="text-lg font-semibold mb-1">{repo.name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {repo.description || "No description"}
                </p>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 text-sm hover:underline"
                >
                  View on GitHub →
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
