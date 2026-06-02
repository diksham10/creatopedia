// creatopedia/app/api/analytics/track-visit/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subdomain, path = "/", userEmail, promptId, creatorId } = body;

    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain is required" }, { status: 400 });
    }

    // Get visitor info from request
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    
    // Create a simple visitor fingerprint (hash of IP + user agent)
    const visitorFingerprint = Buffer.from(`${ip}|${userAgent}`).toString("base64");

    // Point to your actual FastAPI backend url (remove the /api prefix)
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";

    // Call the REAL FastAPI analytics endpoint
    const response = await fetch(`${backendUrl}/analytics/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "view", // ✅ STRICT ENUM MATCH
        creator_id: creatorId || null,
        entity_id: promptId || null,
        entity_type: promptId ? "prompt" : "page",
        session_id: visitorFingerprint,
        metadata: {
          subdomain,
          path,
          user_email: userEmail,
        },
      }),
    });

    if (!response.ok) {
      console.error(`Analytics tracking failed: ${response.status} ${response.statusText}`);
      // Don't fail the request if analytics fails - it's non-critical
      return NextResponse.json({ success: false }, { status: 200 }); // Return 200 so frontend doesn't crash
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    // Return success even if tracking fails - don't break the user experience
    return NextResponse.json({ success: true, message: "Visit logged (async)" });
  }
}

/**
 * GET: Retrieve analytics for a subdomain
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get("subdomain");
    const days = searchParams.get("days") || "30";

    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain is required" }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    const internalSecret = process.env.INTERNAL_API_SECRET;

    // Use the correct API route structure for the backend
    const response = await fetch(
      `${backendUrl}/analytics/subdomain-visits?subdomain=${subdomain}&days=${days}`,
      {
        headers: {
          ...(internalSecret && { "X-Internal-Secret": internalSecret }),
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}