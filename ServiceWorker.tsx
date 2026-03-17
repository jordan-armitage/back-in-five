"use client";

import { useEffect } from "react";

export default function ServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const onLoad = () => {
      const swUrl = new URL("sw.js", window.location.href);
      navigator.serviceWorker.register(swUrl).catch(() => {
        // Silent fail keeps the app usable even if SW registration fails.
      });
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
