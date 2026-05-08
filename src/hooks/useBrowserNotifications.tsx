import { useEffect, useState, useCallback } from "react";

export const useBrowserNotifications = () => {
  const supported = typeof window !== "undefined" && "Notification" in window;
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : "denied"
  );

  const request = useCallback(async () => {
    if (!supported) return "denied" as NotificationPermission;
    const p = await Notification.requestPermission();
    setPermission(p);
    return p;
  }, [supported]);

  const notify = useCallback(
    (title: string, body?: string, url?: string) => {
      if (!supported || permission !== "granted") return;
      // Only show OS notification when tab is hidden, otherwise toast handles it
      if (document.visibilityState === "visible") return;
      try {
        const n = new Notification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: url ?? title,
        });
        if (url) n.onclick = () => { window.focus(); window.location.href = url; n.close(); };
      } catch {/* ignore */}
    },
    [supported, permission]
  );

  return { supported, permission, request, notify };
};
