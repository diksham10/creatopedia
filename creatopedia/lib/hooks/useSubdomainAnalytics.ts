/**
 * Hook for tracking subdomain visits and analytics
 * Use this in layout or page components to automatically track visits
 */

"use client";

import { useEffect } from "react";

interface TrackingOptions {
  userEmail?: string;
  customData?: Record<string, any>;
}

export function useSubdomainAnalytics(options?: TrackingOptions) {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        // Extract subdomain from hostname
        const hostname = window.location.hostname;
        const parts = hostname.split(".");
        let subdomain: string | null = null;

        if (hostname === "localhost" || hostname === "127.0.0.1") {
          subdomain = "localhost";
        } else if (parts.length > 2) {
          // subdomain.domain.com -> subdomain
          subdomain = parts[0];
        } else if (parts.length === 2 && !hostname.includes("www")) {
          // Could be subdomain.localhost
          subdomain = parts[0];
        }

        if (!subdomain) {
          return;
        }

        // Track the visit
        await fetch("/api/analytics/track-visit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subdomain,
            path: window.location.pathname,
            userEmail: options?.userEmail,
            ...options?.customData,
          }),
        });
      } catch (error) {
        console.warn("Failed to track visit:", error);
      }
    };

    // Track on mount
    trackVisit();

    // Optionally track on route changes
    const handlePopState = () => trackVisit();
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [options?.userEmail]);
}

