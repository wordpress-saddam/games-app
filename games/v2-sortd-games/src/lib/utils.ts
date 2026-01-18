import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Adds UTM parameters to a URL if they don't already exist.
 * Preserves existing query parameters and hash fragments.
 * 
 * @param url - The URL string to add UTM parameters to
 * @param utmSource - The utm_source value (default: "gameshub.asharq.com")
 * @param utmMedium - The utm_medium value (default: "referral")
 * @returns The URL with UTM parameters appended
 */
export function addUtmParams(
  url: string,
  utmSource: string = "gameshub.asharq.com",
  utmMedium: string = "referral"
): string {
  if (!url || typeof url !== "string") {
    return url;
  }

  try {
    // Parse the URL
    const urlObj = new URL(url);
    
    // Check if UTM parameters already exist
    const hasUtmSource = urlObj.searchParams.has("utm_source");
    const hasUtmMedium = urlObj.searchParams.has("utm_medium");
    
    // Only add UTM parameters if they don't already exist
    if (!hasUtmSource) {
      urlObj.searchParams.set("utm_source", utmSource);
    }
    
    if (!hasUtmMedium) {
      urlObj.searchParams.set("utm_medium", utmMedium);
    }
    
    // Return the URL with hash preserved
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails (e.g., relative URL), handle it manually
    // Check if it's a relative URL or malformed URL
    if (url.startsWith("/") || !url.includes("://")) {
      // Relative URL - append query params manually
      const [path, existingQuery] = url.split("?");
      const [pathWithoutHash, hash] = path.split("#");
      
      const params = new URLSearchParams(existingQuery || "");
      
      if (!params.has("utm_source")) {
        params.set("utm_source", utmSource);
      }
      
      if (!params.has("utm_medium")) {
        params.set("utm_medium", utmMedium);
      }
      
      const queryString = params.toString();
      const result = queryString 
        ? `${pathWithoutHash}?${queryString}${hash ? `#${hash}` : ""}`
        : `${pathWithoutHash}${hash ? `#${hash}` : ""}`;
      
      return result;
    }
    
    // If all else fails, return the original URL
    console.warn("Failed to parse URL for UTM parameters:", url, error);
    return url;
  }
}
