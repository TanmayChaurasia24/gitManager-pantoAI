"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { handleLogout } from "../services/AuthService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User2Icon } from "lucide-react";
import Link from "next/link";

// Helper function to fetch all paginated repos
const fetchAllRepos = async (reposUrl: string, token?: any) => {
  let allRepos: any[] = [];
  let page = 1;
  let hasMore = true;

  console.log("token is: ", token);
  

  while (hasMore) {
    const response = await fetch(`${reposUrl}?per_page=100&page=${page}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      toast.error("Failed to fetch repositories");
      return [];
    }

    const data = await response.json();
    allRepos = allRepos.concat(data);
    hasMore = data.length === 100;
    page++;
  }

  return allRepos;
};

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
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const access_token = localStorage.getItem("access_token");
        const rawUserData = localStorage.getItem("userInfo");

        if (!rawUserData) {
          toast.error("Login again!");
          return;
        }

        let parsedUserData;
        try {
          parsedUserData = JSON.parse(rawUserData);
        } catch (e) {
          toast.error("Invalid user data. Please login again.");
          return;
        }

        const allRepos = await fetchAllRepos(parsedUserData.user.repos_url, access_token);

        setuserInfo(parsedUserData);
        setUserRepos(allRepos);
        setisLoggedin(true);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch repositories");
      }
    };

    fetchUserData();
  }, []);

  return (
    <div>
      {/* Navbar */}
      <nav className="w-full h-[5vh] bg-black text-white p-5 flex justify-center items-center">
        {isLoggedin && (
          <div className="flex justify-center items-center gap-x-3">
            <Button
              variant={"default"}
              className="border cursor-pointer"
              onClick={logout}
            >
              Logout
            </Button>
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

      {/* Main */}
      <main className="p-6">
        <h2 className="text-xl font-bold mb-4">
          Repositories ({Array.isArray(userRepos) ? userRepos.length : 0})
        </h2>

        {Array.isArray(userRepos) && userRepos.length === 0 ? (
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
