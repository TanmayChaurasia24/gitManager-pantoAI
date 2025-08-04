"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { handleLogout } from "../services/AuthService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  User2Icon, 
  Star, 
  GitFork, 
  Users, 
  Calendar, 
  Globe, 
  Lock,
  Eye,
  AlertCircle,
  Code,
  FileText,
  BarChart3,
  Settings,
  CheckCircle,
  XCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Interface for repository metadata
interface RepoMetadata {
  contributors: number;
  languages: { [key: string]: number };
  latestRelease?: {
    name: string;
    published_at: string;
  };
}

// Interface for repository configuration
interface RepoConfig {
  id: number;
  autoReview: boolean;
}

// Fetch all paginated repositories
const fetchAllRepos = async (reposUrl: string, token?: string) => {
  let allRepos: any[] = [];
  let page = 1;
  let hasMore = true;

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

// Fetch additional repository metadata
const fetchRepoMetadata = async (repo: any, token?: string): Promise<RepoMetadata> => {
  const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
  const metadata: RepoMetadata = {
    contributors: 0,
    languages: {},
  };

  try {
    // Fetch contributors count
    const contributorsResponse = await fetch(repo.contributors_url, { headers });
    if (contributorsResponse.ok) {
      const contributors = await contributorsResponse.json();
      metadata.contributors = Array.isArray(contributors) ? contributors.length : 0;
    }

    // Fetch languages
    const languagesResponse = await fetch(repo.languages_url, { headers });
    if (languagesResponse.ok) {
      const languages = await languagesResponse.json();
      metadata.languages = languages;
    }

    // Fetch latest release
    const releasesResponse = await fetch(repo.releases_url.replace('{/id}', ''), { headers });
    if (releasesResponse.ok) {
      const releases = await releasesResponse.json();
      if (releases.length > 0) {
        metadata.latestRelease = {
          name: releases[0].name || releases[0].tag_name,
          published_at: releases[0].published_at,
        };
      }
    }
  } catch (error) {
    console.error(`Error fetching metadata for ${repo.name}:`, error);
  }

  return metadata;
};

// API calls for repository configuration
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

const updateRepoConfig = async (repoId: number, autoReview: boolean): Promise<boolean> => {
  try {
    const response = await fetch('/api/repo-configs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({ repoId, autoReview }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error updating repo config:', error);
    return false;
  }
};

// Format date helper
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format bytes to readable size
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function Homepage() {
  const [isLoggedin, setisLoggedin] = useState(false);
  const [userInfo, setuserInfo] = useState<any>({});
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const [expandedRepos, setExpandedRepos] = useState<Set<number>>(new Set());
  const [showingStats, setShowingStats] = useState<Set<number>>(new Set());
  const [repoMetadata, setRepoMetadata] = useState<{ [key: number]: RepoMetadata }>({});
  const [loadingMetadata, setLoadingMetadata] = useState<Set<number>>(new Set());
  const [repoConfigs, setRepoConfigs] = useState<{ [key: number]: boolean }>({});
  const [updatingConfig, setUpdatingConfig] = useState<Set<number>>(new Set());
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
        const access_token = localStorage.getItem("access_token");
        const rawUserData = localStorage.getItem("userInfo");

        if (!rawUserData || !access_token) {
          toast.error("Login again!");
          return;
        }

        const parsedUserData = JSON.parse(rawUserData);
        const allRepos = await fetchAllRepos(
          parsedUserData.user.repos_url,
          access_token
        );

        // Fetch repository configurations
        const configs = await fetchRepoConfigs();
        const configMap: { [key: number]: boolean } = {};
        configs.forEach(config => {
          configMap[config.id] = config.autoReview;
        });

        setuserInfo(parsedUserData);
        setUserRepos(allRepos);
        setRepoConfigs(configMap);
        setisLoggedin(true);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch repositories");
      }
    };

    fetchUserData();
  }, []);

  const toggleRepo = async (repoId: number) => {
    const newSet = new Set(expandedRepos);
    if (newSet.has(repoId)) {
      newSet.delete(repoId);
    } else {
      newSet.add(repoId);
      
      // Fetch metadata if not already loaded
      if (!repoMetadata[repoId] && !loadingMetadata.has(repoId)) {
        setLoadingMetadata(prev => new Set(prev).add(repoId));
        const repo = userRepos.find(r => r.id === repoId);
        const access_token = localStorage.getItem("access_token");
        
        if (repo) {
          const metadata = await fetchRepoMetadata(repo, access_token || undefined);
          setRepoMetadata(prev => ({ ...prev, [repoId]: metadata }));
        }
        
        setLoadingMetadata(prev => {
          const newSet = new Set(prev);
          newSet.delete(repoId);
          return newSet;
        });
      }
    }
    setExpandedRepos(newSet);
  };

  const toggleStats = (repoId: number) => {
    const newSet = new Set(showingStats);
    if (newSet.has(repoId)) {
      newSet.delete(repoId);
    } else {
      newSet.add(repoId);
    }
    setShowingStats(newSet);
  };

  const toggleAutoReview = async (repoId: number) => {
    if (updatingConfig.has(repoId)) return;

    setUpdatingConfig(prev => new Set(prev).add(repoId));
    
    const newAutoReviewStatus = !repoConfigs[repoId];
    const success = await updateRepoConfig(repoId, newAutoReviewStatus);
    
    if (success) {
      setRepoConfigs(prev => ({
        ...prev,
        [repoId]: newAutoReviewStatus
      }));
      toast.success(`Auto Review ${newAutoReviewStatus ? 'enabled' : 'disabled'} for repository`);
    } else {
      toast.error('Failed to update Auto Review setting');
    }
    
    setUpdatingConfig(prev => {
      const newSet = new Set(prev);
      newSet.delete(repoId);
      return newSet;
    });
  };

  const getTopLanguage = (languages: { [key: string]: number }) => {
    if (!languages || Object.keys(languages).length === 0) return null;
    return Object.entries(languages).sort(([,a], [,b]) => b - a)[0];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="w-full h-[5vh] bg-black text-white p-5 flex justify-center items-center">
        {isLoggedin && (
          <div className="flex justify-center items-center gap-x-3">
            <Button onClick={logout} variant="outline" className="text-white border-white hover:bg-white hover:text-black">
              Logout
            </Button>
            <div
              className="rounded-full cursor-pointer ring-2 ring-white/20 hover:ring-white/40 transition-all"
              onClick={() => router.push("/profile")}
            >
              <Image
                className="rounded-full"
                src={userInfo.user?.avatar_url}
                alt="profile avatar"
                width={32}
                height={32}
              />
            </div>
          </div>
        )}
      </nav>

      {/* Main */}
      <main className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Repository List & Configuration
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Code className="w-4 h-4" />
            {userRepos.length} repositories found • Configure Auto Review settings
          </p>
        </div>

        {userRepos.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No repositories found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {userRepos.map((repo) => (
              <div
                key={repo.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Repository Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                      {repo.name}
                    </h3>
                    <div className="flex items-center gap-1 ml-2">
                      {repo.private ? (
                        <Lock className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Globe className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {repo.description || "No description provided"}
                  </p>

                  {/* Auto Review Status */}
                  <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Auto Review</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAutoReview(repo.id)}
                      disabled={updatingConfig.has(repo.id)}
                      className={`${
                        repoConfigs[repo.id] 
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {updatingConfig.has(repo.id) ? (
                        "..."
                      ) : repoConfigs[repo.id] ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          ON
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          OFF
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Repository Stats */}
                  {showingStats.has(repo.id) && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Repository Statistics</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-blue-700">Stars:</span>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="font-medium">{repo.stargazers_count}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-blue-700">Default Branch:</span>
                          <p className="font-medium mt-1">{repo.default_branch}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-blue-700">Auto Review Status:</span>
                          <div className="flex items-center gap-1 mt-1">
                            {repoConfigs[repo.id] ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                <span className="font-medium text-green-700">Enabled</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-red-600" />
                                <span className="font-medium text-red-700">Disabled</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>{repo.stargazers_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork className="w-4 h-4" />
                      <span>{repo.forks_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{repo.watchers_count}</span>
                    </div>
                  </div>

                  {/* Language */}
                  {repo.language && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-gray-700">{repo.language}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                    >
                      View on GitHub →
                    </a>
                    {repo.homepage && (
                      <a
                        href={repo.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800 text-sm font-medium hover:underline"
                      >
                        Live Demo →
                      </a>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 bg-gray-50 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStats(repo.id)}
                      className="flex-1"
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
                      {showingStats.has(repo.id) ? "Hide Stats" : "Show Stats"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRepo(repo.id)}
                      className="flex-1"
                      disabled={loadingMetadata.has(repo.id)}
                    >
                      {loadingMetadata.has(repo.id) ? (
                        "Loading..."
                      ) : expandedRepos.has(repo.id) ? (
                        "Hide Details"
                      ) : (
                        "Show Details"
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRepos.has(repo.id) && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {/* Basic Info */}
                      <div className="col-span-2 mt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Repository Details</h4>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Visibility:</span>
                        <div className="flex items-center gap-1 mt-1">
                          {repo.private ? (
                            <>
                              <Lock className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-700">Private</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-3 h-3 text-green-600" />
                              <span className="text-gray-700">Public</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500">Size:</span>
                        <p className="text-gray-700 mt-1">{formatBytes(repo.size * 1024)}</p>
                      </div>

                      <div>
                        <span className="text-gray-500">Created:</span>
                        <p className="text-gray-700 mt-1">{formatDate(repo.created_at)}</p>
                      </div>

                      <div>
                        <span className="text-gray-500">Updated:</span>
                        <p className="text-gray-700 mt-1">{formatDate(repo.updated_at)}</p>
                      </div>

                      <div>
                        <span className="text-gray-500">Default Branch:</span>
                        <p className="text-gray-700 mt-1">{repo.default_branch}</p>
                      </div>

                      <div>
                        <span className="text-gray-500">Open Issues:</span>
                        <p className="text-gray-700 mt-1">{repo.open_issues_count}</p>
                      </div>

                      {/* Additional Metadata */}
                      {repoMetadata[repo.id] && (
                        <>
                          <div>
                            <span className="text-gray-500">Contributors:</span>
                            <div className="flex items-center gap-1 mt-1">
                              <Users className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-700">{repoMetadata[repo.id].contributors}</span>
                            </div>
                          </div>

                          {Object.keys(repoMetadata[repo.id].languages).length > 0 && (
                            <div className="col-span-2">
                              <span className="text-gray-500">Languages:</span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {Object.entries(repoMetadata[repo.id].languages)
                                  .sort(([,a], [,b]) => b - a)
                                  .slice(0, 5)
                                  .map(([lang, bytes]) => (
                                    <span
                                      key={lang}
                                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                    >
                                      {lang}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}

                          {repoMetadata[repo.id].latestRelease && (
                            <div className="col-span-2">
                              <span className="text-gray-500">Latest Release:</span>
                              <p className="text-gray-700 mt-1">
                                {repoMetadata[repo.id].latestRelease!.name} • {' '}
                                {formatDate(repoMetadata[repo.id].latestRelease!.published_at)}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Features */}
                      <div className="col-span-2 mt-2">
                        <span className="text-gray-500">Features:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {repo.has_issues && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Issues
                            </span>
                          )}
                          {repo.has_projects && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Projects
                            </span>
                          )}
                          {repo.has_wiki && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Wiki
                            </span>
                          )}
                          {repo.has_pages && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Pages
                            </span>
                          )}
                          {repo.has_discussions && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Discussions
                            </span>
                          )}
                          {repo.allow_forking && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Forkable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}