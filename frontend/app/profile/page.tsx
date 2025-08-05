"use client";

import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Mail, 
  User, 
  GitBranch, 
  Settings, 
  Calendar,
  MapPin,
  Link as LinkIcon,
  Users,
  UserPlus,
  Building,
  CheckCircle,
  XCircle,
  LogOut
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { handleLogout } from "../services/AuthService";

// Interface for repository configuration
interface RepoConfig {
  id: number;
  autoReview: boolean;
}

// API call to fetch repository configurations
const fetchRepoConfigs = async (): Promise<RepoConfig[]> => {
  try {
    const response = await fetch('/api/repo-configs', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching repo configs:', error);
  }
  return [];
};

// Fetch all paginated repositories to get total count
const fetchAllRepos = async (reposUrl: string, token?: string) => {
  let allRepos: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${reposUrl}?per_page=100&page=${page}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    allRepos = allRepos.concat(data);
    hasMore = data.length === 100;
    page++;
  }

  return allRepos;
};

// Format date helper
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function Profile() {
  const [userInfo, setUserInfo] = useState<any>({});
  const [totalRepos, setTotalRepos] = useState<number>(0);
  const [autoReviewRepos, setAutoReviewRepos] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
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
        setLoading(true);
        const access_token = localStorage.getItem("access_token");
        const rawUserData = localStorage.getItem("userInfo");

        if (!rawUserData || !access_token) {
          toast.error("Login again!");
          router.push("/");
          return;
        }

        const parsedUserData = JSON.parse(rawUserData);
        setUserInfo(parsedUserData);

        // Fetch total repositories count
        const allRepos = await fetchAllRepos(
          parsedUserData.user.repos_url,
          access_token
        );
        setTotalRepos(allRepos.length);

        // Fetch auto review configurations
        const configs = await fetchRepoConfigs();
        const enabledCount = configs.filter(config => config.autoReview).length;
        setAutoReviewRepos(enabledCount);

      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" className="flex items-center gap-2">
              <Link href="/home">
                <ArrowLeft className="w-4 h-4" />
                Back to Repositories
              </Link>
            </Button>
            <Button 
              onClick={logout} 
              variant="outline" 
              className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                {userInfo?.user?.avatar_url ? (
                  <Image
                    className="rounded-full border-4 border-white shadow-lg"
                    src={userInfo.user.avatar_url}
                    alt="Profile avatar"
                    width={120}
                    height={120}
                  />
                ) : (
                  <div className="w-[120px] h-[120px] bg-gray-300 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="text-center md:text-left text-white flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {userInfo?.user?.name || userInfo?.user?.login || "Unknown User"}
                </h1>
                <p className="text-blue-100 mb-4 flex items-center justify-center md:justify-start gap-2">
                  <User className="w-4 h-4" />
                  @{userInfo?.user?.login}
                </p>
                
                {userInfo?.user?.bio && (
                  <p className="text-blue-100 max-w-md">
                    {userInfo.user.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">User Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Personal Details
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-500">Full Name</span>
                      <p className="font-medium text-gray-900">
                        {userInfo?.user?.name || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-500">Email</span>
                      <p className="font-medium text-gray-900">
                        {userInfo?.user?.email || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {userInfo?.user?.company && (
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-gray-500" />
                      <div>
                        <span className="text-sm text-gray-500">Company</span>
                        <p className="font-medium text-gray-900">
                          {userInfo.user.company}
                        </p>
                      </div>
                    </div>
                  )}

                  {userInfo?.user?.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-500" />
                      <div>
                        <span className="text-sm text-gray-500">Location</span>
                        <p className="font-medium text-gray-900">
                          {userInfo.user.location}
                        </p>
                      </div>
                    </div>
                  )}

                  {userInfo?.user?.blog && (
                    <div className="flex items-center gap-3">
                      <LinkIcon className="w-5 h-5 text-gray-500" />
                      <div>
                        <span className="text-sm text-gray-500">Website</span>
                        <a 
                          href={userInfo.user.blog}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {userInfo.user.blog}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-500">Joined GitHub</span>
                      <p className="font-medium text-gray-900">
                        {userInfo?.user?.created_at ? formatDate(userInfo.user.created_at) : "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Repository Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Repository Statistics
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <GitBranch className="w-8 h-8 text-blue-600" />
                      <div>
                        <span className="text-sm text-blue-700">Total Repositories</span>
                        <p className="text-2xl font-bold text-blue-900">{totalRepos}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div>
                        <span className="text-sm text-green-700">Auto Review Enabled</span>
                        <p className="text-2xl font-bold text-green-900">{autoReviewRepos}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-8 h-8 text-gray-600" />
                      <div>
                        <span className="text-sm text-gray-700">Auto Review Disabled</span>
                        <p className="text-2xl font-bold text-gray-900">{totalRepos - autoReviewRepos}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Stats */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Social</h4>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                      <Users className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        <strong>{userInfo?.user?.followers || 0}</strong> followers
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                      <UserPlus className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        <strong>{userInfo?.user?.following || 0}</strong> following
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href="/home">
                    <GitBranch className="w-4 h-4 mr-2" />
                    Manage Repositories
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <a 
                    href={userInfo?.user?.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <User className="w-4 h-4 mr-2" />
                    View GitHub Profile
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}