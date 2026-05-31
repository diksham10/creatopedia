import { NextRequest, NextResponse } from "next/server";
import {
  isValidSubdomain,
  getUserBySubdomain,
  hasPublicPromptsEnabled,
  isEmailAllowed,
} from "@/lib/subdomain-utils";

/**
 * GET /api/subdomain/[subdomain]/prompts
 * Retrieve public prompts for a creator's subdomain
 *
 * Query params:
 * - email: optional email to check for private/email-restricted prompts
 * - limit: max results (default 50)
 * - offset: pagination offset (default 0)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  const subdomain = params.subdomain;
  const { searchParams } = new URL(request.url);

  // Validate subdomain format
  if (!isValidSubdomain(subdomain)) {
    return NextResponse.json(
      { error: "Invalid subdomain format" },
      { status: 400 }
    );
  }

  try {
    // Get user by subdomain
    const user = await getUserBySubdomain(subdomain);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user allows public access
    if (!hasPublicPromptsEnabled(user)) {
      return NextResponse.json(
        { error: "Public access is not enabled for this user" },
        { status: 403 }
      );
    }

    // Get query parameters
    const userEmail = searchParams.get("email") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Call backend API to fetch user's public prompts
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    const internalSecret = process.env.INTERNAL_API_SECRET;

    const params_obj = new URLSearchParams({
      include_public: "true",
      limit: limit.toString(),
      offset: offset.toString(),
      ...(userEmail && { email: userEmail }),
    });

    const response = await fetch(
      `${backendUrl}/api/users/${user.id}/prompts?${params_obj}`,
      {
        headers: {
          ...(internalSecret && { "X-Internal-Secret": internalSecret }),
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch prompts" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Filter prompts based on access rules
    let prompts = data.prompts || [];

    // Check if user has email-restricted access levels
    prompts = prompts.filter((prompt: any) => {
      // Public prompts - always show
      if (prompt.access_type === "public" || !prompt.access_type) {
        return true;
      }

      // Email-restricted prompts
      if (prompt.access_type === "email") {
        return isEmailAllowed(prompt.allowed_emails, userEmail);
      }

      // Private prompts - only if user is the owner (shouldn't happen in public view)
      return false;
    });

    return NextResponse.json({
      subdomain,
      user_id: user.id,
      username: user.username,
      prompts: prompts.map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        category: p.category || null,
        access_type: p.access_type || "public",
        createdAt: p.created_at || p.createdAt,
        updatedAt: p.updated_at || p.updatedAt,
      })),
      total: prompts.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching subdomain prompts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
