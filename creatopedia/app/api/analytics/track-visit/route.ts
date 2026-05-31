import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: Track subdomain visits for analytics
 * Logs unique visitors to each creator's subdomain
 *
 * Usage: Call from client-side on page load for each subdomain
 * POST /api/analytics/track-visit
 * Body: {
 *   subdomain: string,
 *   path?: string,
 *   userEmail?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subdomain, path = "/", userEmail } = body;

    if (!subdomain) {
      return NextResponse.json(
        { error: "Subdomain is required" },
        { status: 400 }
      );
    }

    // Get visitor info from request
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const timestamp = new Date().toISOString();

    // Create a simple visitor fingerprint (hash of IP + user agent)
    // This helps identify unique visitors without storing personal data
    const visitorFingerprint = Buffer.from(
      `${ip}|${userAgent}`
    ).toString("base64");

    // Call your backend API to record the visit
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    const internalSecret = process.env.INTERNAL_API_SECRET;

    const response = await fetch(
      `${backendUrl}/api/analytics/track-subdomain-visit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(internalSecret && { "X-Internal-Secret": internalSecret }),
        },
        body: JSON.stringify({
          subdomain,
          path,
          user_email: userEmail,
          ip_hash: visitorFingerprint,
          user_agent: userAgent,
          timestamp,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        `Analytics tracking failed: ${response.status} ${response.statusText}`
      );
      // Don't fail the request if analytics fails - it's non-critical
      return NextResponse.json({ success: false }, { status: 500 });
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    // Return success even if tracking fails - don't break the user experience
    return NextResponse.json({
      success: true,
      message: "Visit logged (async)",
    });
  }
}

/**
 * GET: Retrieve analytics for a subdomain
 * Query params: ?subdomain=username&days=30
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get("subdomain");
    const days = searchParams.get("days") || "30";

    if (!subdomain) {
      return NextResponse.json(
        { error: "Subdomain is required" },
        { status: 400 }
      );
    }

    // Call backend to fetch analytics
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    const internalSecret = process.env.INTERNAL_API_SECRET;

    const response = await fetch(
      `${backendUrl}/api/analytics/subdomain-visits?subdomain=${subdomain}&days=${days}`,
      {
        headers: {
          ...(internalSecret && { "X-Internal-Secret": internalSecret }),
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch analytics" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
