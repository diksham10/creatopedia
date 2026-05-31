import { NextRequest, NextResponse } from "next/server";
import {
  getUserBySubdomain,
  hasPublicPromptsEnabled,
  isValidSubdomain,
} from "@/lib/subdomain-utils";

/**
 * GET /api/subdomain/[subdomain]/profile
 * Retrieve public profile info for a creator's subdomain
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  const subdomain = params.subdomain;

  // Validate subdomain format
  if (!isValidSubdomain(subdomain)) {
    return NextResponse.json(
      { error: "Invalid subdomain format" },
      { status: 400 }
    );
  }

  try {
    // Get user by subdomain from backend
    const user = await getUserBySubdomain(subdomain);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user allows public access
    if (!hasPublicPromptsEnabled(user)) {
      return NextResponse.json(
        {
          error: "This user has not enabled public prompt access",
        },
        { status: 403 }
      );
    }

    // Return public profile info only
    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name || user.username,
      bio: user.bio || "",
      avatar_url: user.avatar_url || null,
      allow_public_access: true,
    });
  } catch (error) {
    console.error("Error fetching subdomain profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
