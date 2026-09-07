"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

const CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";
// Mirror backend logic: sandbox keys do NOT start with "Mid-client-production-"
const IS_SANDBOX = !CLIENT_KEY.startsWith("Mid-client-production-");
const SNAP_JS_URL = IS_SANDBOX
  ? "https://app.sandbox.midtrans.com/snap/snap.js"
  : "https://app.midtrans.com/snap/snap.js";

export function useMidtrans() {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current || typeof window === "undefined") return;

    // Idempotent — only add once
    if (document.querySelector(`script[src="${SNAP_JS_URL}"]`)) {
      scriptLoaded.current = true;
      return;
    }

    const script = document.createElement("script");
    script.src = SNAP_JS_URL;
    script.setAttribute("data-client-key", CLIENT_KEY);
    script.async = true;
    script.onload = () => { scriptLoaded.current = true; };
    document.head.appendChild(script);
  }, []);

  const pay = (
    token: string,
    callbacks: {
      onSuccess?: (result: unknown) => void;
      onPending?: (result: unknown) => void;
      onError?: (result: unknown) => void;
      onClose?: () => void;
    }
  ) => {
    if (!window.snap) {
      console.error("[useMidtrans] Snap.js not loaded yet");
      callbacks.onError?.({ message: "Payment SDK not ready" });
      return;
    }
    window.snap.pay(token, callbacks);
  };

  return { pay };
}
