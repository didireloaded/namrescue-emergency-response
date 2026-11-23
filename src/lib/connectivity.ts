import { useEffect, useState } from "react";

/**
 * Navigator online/offline is a connectivity HINT, not proof that an emergency
 * gateway is reachable. Production dispatch requires an authenticated server
 * acknowledgement before any request can be marked as received.
 */
export type Connectivity = "unknown" | "online" | "offline";

export function useConnectivity(): Connectivity {
  const [status, setStatus] = useState<Connectivity>("unknown");
  useEffect(() => {
    const update = () => setStatus(navigator.onLine ? "online" : "offline");
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return status;
}

export function canCreatePreviewRequest(connected: Connectivity): boolean {
  // No auto-sending of SOS requests is ever implied. The caller should use
  // the phone dialer if the device reports no data connection.
  return connected === "online";
}
