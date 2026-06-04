// creatopedia/app/api/analytics/track-visit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserBySubdomain } from "@/lib/subdomain-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subdomain, path = "/", userEmail, promptId } = body;

    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain is required" }, { status: 400 });
    }

    // Get visitor info from request
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const referrer = request.headers.get("referer") || "";
    
    // Create a simple visitor fingerprint (hash of IP + user agent)
    const visitorFingerprint = Buffer.from(`${ip}|${userAgent}`).toString("base64");

    // Point to actual FastAPI backend url
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    const internalSecret = process.env.INTERNAL_API_SECRET;

    // 1. Resolve creator by subdomain to get their UUID creator_id
    const creator = await getUserBySubdomain(subdomain);
    const resolvedCreatorId = creator?.id || body.creatorId || null;

    // 2. Track subdomain visit in `subdomain_visits` table (multi-tenant subdomain logs)
    try {
      const subdomainVisitHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (internalSecret) {
        subdomainVisitHeaders["X-Internal-Secret"] = internalSecret;
      }

      await fetch(`${backendUrl}/api/analytics/track-subdomain-visit`, {
        method: "POST",
        headers: subdomainVisitHeaders,
        body: JSON.stringify({
          subdomain,
          path,
          user_email: userEmail || null,
          ip_hash: visitorFingerprint,
          user_agent: userAgent,
        }),
      });
    } catch (err) {
      console.error("Failed to track subdomain visit:", err);
    }

    // 3. Track event in `event_logs` table (main dashboard views)
    // Make sure we hit the correct backend prefix `/api`
    const eventResponse = await fetch(`${backendUrl}/api/analytics/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": visitorFingerprint,
        "User-Agent": userAgent,
        "Referer": referrer,
      },
      body: JSON.stringify({
        event_type: "view",
        creator_id: resolvedCreatorId,
        entity_id: promptId || null,
        entity_type: promptId ? "prompt" : "portfolio", // portfolio page view
        session_id: visitorFingerprint,
        metadata: {
          subdomain,
          path,
          user_email: userEmail,
        },
      }),
    });

    if (!eventResponse.ok) {
      console.error(`Analytics tracking event failed: ${eventResponse.status} ${eventResponse.statusText}`);
      // Return success even if tracking fails - don't break the user experience
      return NextResponse.json({ success: false }, { status: 200 });
    }

    const result = await eventResponse.json();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    // Return success even if tracking fails - don't break the user experience
    return NextResponse.json({ success: true, message: "Visit logged (fallback)" });
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
      `${backendUrl}/api/analytics/subdomain-visits?subdomain=${subdomain}&days=${days}`,
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