import * as Sentry from "@sentry/node";

let initialized = false;

/**
 * Initialize Sentry error tracking. No-op unless SENTRY_DSN is set, so the
 * app runs identically with or without Sentry configured.
 *
 * PII scrubbing: this app handles sensitive faith / mental-health content, so
 * we strip request bodies and never send message text. Only error metadata
 * (stack, route, status) is sent.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    // Conservative sampling; raise if you want performance traces.
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      // Strip request bodies and cookies — they may contain private content.
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers["cookie"];
          delete event.request.headers["authorization"];
        }
      }
      return event;
    },
  });
  initialized = true;
}

export function isSentryEnabled(): boolean {
  return initialized;
}

export { Sentry };
