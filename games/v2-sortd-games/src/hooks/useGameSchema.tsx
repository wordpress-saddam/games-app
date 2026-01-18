import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { generateGameSchema, injectGameSchema, GameSchemaData } from "../utils/gameSchema";

/**
 * React hook to inject Game schema JSON-LD into the document head
 * 
 * @param data - Game schema data
 * @param enabled - Whether to inject the schema (default: true)
 * 
 * @example
 * ```tsx
 * useGameSchema({
 *   name: "Quiz",
 *   headline: "Quiz - Asharq Games",
 *   description: "Test your knowledge with our interactive quiz game",
 *   url: "https://asharqgames-uat.sortd.pro/games/quiz",
 *   image: "https://asharqgames-uat.sortd.pro/assets/quiz-image.jpg"
 * });
 * ```
 */
export function useGameSchema(data: GameSchemaData, enabled: boolean = true) {
  const location = useLocation();

  useEffect(() => {
    if (!enabled) {
      // Remove schema if disabled
      const existingScript = document.querySelector('script[data-game-schema="true"]');
      if (existingScript) {
        existingScript.remove();
      }
      return;
    }

    // Generate schema
    const schema = generateGameSchema(data);
    
    // Inject into head
    const cleanup = injectGameSchema(schema);
    console.log("[saddam] schema", schema);
    console.log("[saddam] clean up", cleanup);
    // Cleanup on unmount or when data changes
    return cleanup;
  }, [data.name, data.headline, data.description, data.url, data.image, enabled, location.pathname]);
}

