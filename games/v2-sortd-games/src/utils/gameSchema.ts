/**
 * Game Schema Utility
 * Generates Schema.org Game structured data in JSON-LD format
 */

export interface GameSchemaData {
  name: string;
  headline: string;
  description: string;
  url: string;
  image: string;
  isAccessibleForFree?: boolean;
  sourceOrganization?: {
    name: string;
    url: string;
  };
}

/**
 * Default source organization data
 */
const DEFAULT_SOURCE_ORGANIZATION = {
  name: "الشرق للأخبار",
  url: "https://asharq.com/",
};

/**
 * Generates Schema.org Game structured data
 * @param data - Game schema data
 * @returns JSON-LD schema object
 */
export function generateGameSchema(data: GameSchemaData) {
  let defaultUrl = data.url;
  
  if (!defaultUrl && typeof window !== "undefined") {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    defaultUrl = `${baseUrl}${window.location.pathname}`;
  } else if (!defaultUrl) {
    defaultUrl = "https://asharqgames-uat.sortd.pro";
  }

  return {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": data.name,
    "headline": data.headline,
    "description": data.description,
    "url": defaultUrl,
    "image": data.image,
    "isAccessibleForFree": data.isAccessibleForFree !== undefined ? data.isAccessibleForFree : true,
    "sourceOrganization": {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": data.sourceOrganization?.name || DEFAULT_SOURCE_ORGANIZATION.name,
      "url": data.sourceOrganization?.url || DEFAULT_SOURCE_ORGANIZATION.url,
    },
  };
}

/**
 * Injects Game schema JSON-LD into the document head
 * @param schema - The schema object to inject
 * @returns Function to remove the schema (cleanup)
 */
export function injectGameSchema(schema: object): () => void {
  // Remove any existing game schema script
  const existingScript = document.querySelector('script[data-game-schema="true"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Create new script element
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-game-schema", "true");
  script.textContent = JSON.stringify(schema, null, 0);
  
  // Insert into head
  console.log("[saddam] script", script);
  console.log("[saddam] document.head", document.head);
  document.head.appendChild(script);

  // Return cleanup function
  return () => {
    const scriptToRemove = document.querySelector('script[data-game-schema="true"]');
    if (scriptToRemove) {
      scriptToRemove.remove();
    }
  };
}

