/**
 * Subdomain utilities for multi-tenant prompt sharing system
 * Server-side utilities for subdomain validation and user lookup
 */

/**
 * Parse subdomain from hostname
 * Examples:
 * - user1.localhost:3000 -> user1
 * - john.creatopedia.tech -> john
 * - creatopedia.tech -> null (main domain)
 */
export function parseSubdomain(hostname: string | undefined): string | null {
  if (!hostname) return null;

  // Remove port
  const host = hostname.split(":")[0];

  // Get the base domain from env
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "creatopedia.tech";
  const cleanBaseDomain = baseDomain.replace(/^https?:\/\//, "");

  // Split by dots
  const parts = host.split(".");

  // If it's localhost, the subdomain is the first part
  if (cleanBaseDomain === "localhost" || host === "localhost") {
    return parts.length > 1 ? parts[0] : null;
  }

  // For production domains like creatopedia.tech
  const baseParts = cleanBaseDomain.split(".");
  if (parts.length > baseParts.length) {
    return parts.slice(0, parts.length - baseParts.length).join(".");
  }

  return null;
}

/**
 * Build a subdomain URL
 */
export function buildSubdomainUrl(
  subdomain: string,
  path: string = "",
  protocol: string = "https"
): string {
  const baseDomain =
    process.env.NEXT_PUBLIC_BASE_DOMAIN || "creatopedia.tech";
  const cleanBaseDomain = baseDomain.replace(/^https?:\/\//, "");

  const host =
    cleanBaseDomain === "localhost" || cleanBaseDomain === "localhost:3000"
      ? `${subdomain}.localhost:3000`
      : `${subdomain}.${cleanBaseDomain}`;

  return `${protocol}://${host}${path}`;
}

/**
 * Validate subdomain format (alphanumeric + hyphens, 3-63 chars)
 * Subdomains must follow DNS naming rules
 */
export function isValidSubdomain(subdomain: string): boolean {
  if (!subdomain || typeof subdomain !== "string") return false;
  if (subdomain.length < 3 || subdomain.length > 63) return false;
  // Must start and end with alphanumeric, can contain hyphens in middle
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(subdomain);
}

/**
 * Get user by subdomain from backend
 * This should be called server-side only
 */
export async function getUserBySubdomain(subdomain: string) {
  if (!isValidSubdomain(subdomain)) {
    return null;
  }

  try {
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    const internalSecret = process.env.INTERNAL_API_SECRET;

    // Call your backend API to get user by subdomain/username
    const response = await fetch(
      `${backendUrl}/api/users/by-subdomain/${subdomain}`,
      {
        headers: {
          ...(internalSecret && { "X-Internal-Secret": internalSecret }),
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user by subdomain:", error);
    return null;
  }
}

/**
 * Check if user has public prompts enabled
 */
export function hasPublicPromptsEnabled(user: any): boolean {
  return (
    user?.public_prompts_enabled === true ||
    user?.settings?.allow_public_access === true ||
    user?.allow_public_access === true
  );
}

/**
 * Check if requester email is allowed to view this user's prompts
 * Used for private/email-restricted prompt access
 */
export function isEmailAllowed(
  userAllowedEmails: string[] | undefined,
  requesterEmail: string | undefined
): boolean {
  if (!requesterEmail) return false;
  if (!userAllowedEmails || userAllowedEmails.length === 0) return false;
  return userAllowedEmails.some(
    (email) => email.toLowerCase() === requesterEmail.toLowerCase()
  );
}

/**
 * Get user's public prompts from backend
 */
export async function getUserPublicPrompts(
  subdomain: string,
  accessType: "public" | "email" | "all" = "public",
  userEmail?: string
) {
  if (!isValidSubdomain(subdomain)) {
    return { prompts: [], error: "Invalid subdomain" };
  }

  try {
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    const internalSecret = process.env.INTERNAL_API_SECRET;

    const params = new URLSearchParams({
      access_type: accessType,
      ...(userEmail && { user_email: userEmail }),
    });

    const response = await fetch(
      `${backendUrl}/api/users/${subdomain}/public-prompts?${params}`,
      {
        headers: {
          ...(internalSecret && { "X-Internal-Secret": internalSecret }),
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return { prompts: [], error: `Failed to fetch prompts: ${response.statusText}` };
    }

    const data = await response.json();
    return { prompts: data.prompts || data || [], error: null };
  } catch (error) {
    console.error("Error fetching public prompts:", error);
    return { prompts: [], error: "Internal server error" };
  }
}

/**
 * Record an analytics event for subdomain visit
 */
export async function recordSubdomainVisit(
  subdomain: string,
  visitorInfo: {
    ipHash?: string;
    userAgent?: string;
    userEmail?: string;
    path?: string;
  }
) {
  if (!isValidSubdomain(subdomain)) {
    return null;
  }

  try {
    const response = await fetch("/api/analytics/track-visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subdomain,
        ...visitorInfo,
      }),
    });

    if (!response.ok) {
      console.error("Failed to record visit");
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error recording visit:", error);
    return null;
  }
}
