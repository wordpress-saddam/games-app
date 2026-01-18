import ReactGA from 'react-ga4';
const MASTER_ACCOUNT_MEASUREMENT_ID = "G-STS1NKBZ5H";
import config from '../config/host-config';
let isInitialized = false;

async function getPublisherMeasurementId(): Promise<string | undefined> {
  try {
    const hostname = window.location.hostname;
    if (!hostname) {
      console.log("GA: No hostname found. Cannot retrieve measurement_id.");
      return "";
    }
    const measurementId = config?.ga4_measurement_id?.[hostname] ?? ""; "";

    if (typeof measurementId === 'string' && measurementId.length > 0) {
      return measurementId;
    } else {
      console.log(`GA: Publisher measurement_id not found or invalid for hostname '${hostname}' in host-config.json.`);
      return "";
    }
  } catch (error) {
    console.error("GA: Error fetching or parsing host-config.json:", error);
    return "";
  }
}

export const initializeGA = async () => {
  if (isInitialized) {
    return;
  }

  const gaInitializationConfigs = [];

  if (MASTER_ACCOUNT_MEASUREMENT_ID) {
    gaInitializationConfigs.push({ trackingId: MASTER_ACCOUNT_MEASUREMENT_ID });
  } else {
    console.log("GA: MASTER_ACCOUNT_MEASUREMENT_ID is not defined.");
  }

  const publisherMeasurementId = await getPublisherMeasurementId();
  if (publisherMeasurementId) {
    gaInitializationConfigs.push({ trackingId: publisherMeasurementId });
  }

  if (gaInitializationConfigs.length > 0) {
    ReactGA.initialize(gaInitializationConfigs);
    isInitialized = true;
  } else {
    console.log("GA: No measurement IDs available for initialization.");
  }
};

export const sendPageView = (path: string) => {
  if (isInitialized) {
    ReactGA.send({ hitType: "pageview", page: path });
  }
};
export const sendCustomEvent = (
  eventName: string,
  eventParams: Record<string, any>
) => {
  if (!isInitialized) {
    console.log("GA not initialized. Call initializeGA() first. Event not sent.");
    return;
  }

  if (!eventName || typeof eventName !== 'string') {
    console.error("Invalid event name for GA event. Event not sent.");
    return;
  }

  ReactGA.event(eventName, eventParams);
};

// Expose sendCustomEvent globally for use in plain JavaScript files
(window as any).sendCustomEvent = sendCustomEvent;
