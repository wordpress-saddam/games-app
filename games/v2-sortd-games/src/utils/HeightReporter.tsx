import { useEffect, useRef } from "react";

type HeightReporterProps = {
  children: React.ReactNode;
  messageType?: string; // Optional, default is 'height'
};

const HeightReporter = ({ children, messageType = "height" }: HeightReporterProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastReportedHeight = useRef<number | null>(null); // Track previous height

  const sendHeightIfChanged = () => {
    if (!containerRef.current) return;

    const currentHeight = containerRef.current.offsetHeight;

    if (lastReportedHeight.current !== currentHeight) {
      lastReportedHeight.current = currentHeight;

      const messagePayload = {
        type: messageType,
        value: currentHeight,
      };

      console.log(`[HeightReporter] Sending height: ${currentHeight}px for type: ${messageType}`);

      window.postMessage(
        JSON.stringify(messagePayload)
      );

      if (typeof (window as any).Resize !== 'undefined' && (window as any).Resize.postMessage) {
            (window as any).Resize.postMessage(JSON.stringify(messagePayload));
            console.log(`[HeightReporter] Sent message to Resize for type: ${messageType}`);
        } else {
            console.log(`Resize not available. Cannot send message for type: ${messageType}`);
        }
    }
  };

  useEffect(() => {
    sendHeightIfChanged();

    window.addEventListener("resize", sendHeightIfChanged);

    const observer = new MutationObserver(() => {
      console.log("[HeightReporter] DOM mutated, checking for height change...");
      sendHeightIfChanged();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }

    return () => {
      window.removeEventListener("resize", sendHeightIfChanged);
      observer.disconnect();
    };
  }, [messageType]);

  return <div ref={containerRef}>{children}</div>;
};

export default HeightReporter;
