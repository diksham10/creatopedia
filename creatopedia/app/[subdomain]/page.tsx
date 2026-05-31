"use client";

import { useEffect, useState } from "react";
import { headers } from "next/headers";
import { useSearchParams } from "next/navigation";

interface Prompt {
  id: string;
  title: string;
  content: string;
  category?: string;
  createdAt?: string;
}

interface CreatorProfile {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  allow_public_access?: boolean;
}

export default function SubdomainPromptPage({
  params,
}: {
  params: { subdomain: string };
}) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const email = searchParams.get("email");
    if (email) {
      setUserEmail(email);
    }

    // Record visit to analytics
    const recordVisit = async () => {
      try {
        await fetch("/api/analytics/track-visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subdomain: params.subdomain,
            path: window.location.pathname,
            userEmail: email || undefined,
          }),
        });
      } catch (err) {
        console.error("Failed to record visit:", err);
      }
    };

    recordVisit();
  }, [params.subdomain, searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch creator profile
        const creatorRes = await fetch(
          `/api/subdomain/${params.subdomain}/profile`
        );
        if (!creatorRes.ok) {
          setError("Creator not found");
          setLoading(false);
          return;
        }
        const creatorData = await creatorRes.json();
        setCreator(creatorData);

        // Check if we can access prompts
        if (!creatorData.allow_public_access) {
          setError("This creator has not made their prompts public");
          setLoading(false);
          return;
        }

        // Fetch prompts
        const promptRes = await fetch(
          `/api/subdomain/${params.subdomain}/prompts?email=${userEmail}`
        );
        if (!promptRes.ok) {
          setError("Failed to load prompts");
          setLoading(false);
          return;
        }

        const promptsData = await promptRes.json();
        setPrompts(promptsData.prompts || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.subdomain, userEmail]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading prompts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Unable to Load
          </h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            {creator?.avatar_url && (
              <img
                src={creator.avatar_url}
                alt={creator.display_name || creator.username}
                className="w-16 h-16 rounded-full object-cover border-2 border-purple-600"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {creator?.display_name || creator?.username}
              </h1>
              {creator?.bio && (
                <p className="text-slate-600 mt-1">{creator.bio}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {prompts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              No Prompts Available
            </h2>
            <p className="text-slate-600">
              This creator hasn't shared any prompts yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-purple-600"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {prompt.title}
                </h3>
                {prompt.category && (
                  <span className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    {prompt.category}
                  </span>
                )}
                <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                  {prompt.content}
                </p>
                {prompt.createdAt && (
                  <p className="text-slate-400 text-xs">
                    {new Date(prompt.createdAt).toLocaleDateString()}
                  </p>
                )}
                <button className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  View Full Prompt
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
