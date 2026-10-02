import type { TrackedEvent } from "./events.ts";

/** Record an anonymous event; fire-and-forget so it never delays navigation. */
export function trackConversion(name: TrackedEvent) {
  try {
    const body = JSON.stringify({ name });
    if (
      !navigator.sendBeacon?.(
        "/api/events",
        new Blob([body], { type: "application/json" }),
      )
    )
      void fetch("/api/events", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => undefined);
  } catch {
    // Analytics must never break the page.
  }
}
