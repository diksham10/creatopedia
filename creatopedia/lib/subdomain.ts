/**
 * Subdomain utilities for multi-tenant prompt sharing system
 */

/**
 * Parse subdomain from hostname
 * Examples:
 * - user1.localhost:3000 -> user1
 * - john.prompthub.com -> john
 * - prompthub.com -> null (main domain)
 */
export function parseSubdomain(hostname: string | undefined): string | null {
  if (!hostname) return null;

  // Remove port
  const host = hostname.split(":")[0];

  // Get the base domain from env
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost";

  // Split by dots
  const parts = host.split(".");

  // If it's localhost, the subdomain is the first part (before :)
  if (baseDomain === "localhost") {
    return parts.length > 1 ? parts[0] : null;
  }

  // For production domains like prompthub.com
  const baseParts = baseDomain.split(".");
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
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost";
  const host =
    baseDomain === "localhost"
      ? `${subdomain}.localhost:3000`
      : `${subdomain}.${baseDomain}`;

  return `${protocol}://${host}${path}`;
}

/**
 * Validate subdomain format (alphanumeric + hyphens, 3-63 chars)
 */
export function isValidSubdomain(subdomain: string): boolean {
  if (!subdomain || typeof subdomain !== "string") return false;
  if (subdomain.length < 3 || subdomain.length > 63) return false;
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(subdomain);
}

/**
 * Get user from subdomain (performs database lookup)
 * This should be called server-side only
 */
export async function getUserBySubdomain(subdomain: string) {
  if (!isValidSubdomain(subdomain)) {
    return null;
  }

  try {
    // Call your backend API to get user by subdomain/username
    const response = await fetch(
      `${process.env.BACKEND_API_URL || "http://localhost:8000"}/api/users/by-subdomain/${subdomain}`,
      {
        headers: {
          "X-Internal-Secret": process.env.INTERNAL_API_SECRET || "",
        },
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
  return user?.public_prompts_enabled === true || user?.settings?.allow_public_access === true;
}

/**
 * Check if requester email is allowed to view this user's prompts
 */
export function isEmailAllowed(
  userAllowedEmails: string[] | undefined,
  requesterEmail: string | undefined
): boolean {
  if (!requesterEmail) return false;
  if (!userAllowedEmails || userAllowedEmails.length === 0) return false;
  return userAllowedEmails.includes(requesterEmail);
}
