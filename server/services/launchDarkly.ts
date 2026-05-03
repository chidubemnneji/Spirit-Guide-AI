/**
 * SoulGuide — LaunchDarkly Integration
 *
 * Features:
 *  - Singleton client with graceful fallback to safe defaults
 *  - Rich user context: country, accountAge, primaryStruggle, messageCount,
 *    isHighEngagement, isBetaUser
 *  - variationDetail() for evaluation reasons (RULE_MATCH, TARGET_MATCH etc)
 *  - Custom metric tracking for experimentation
 */

import * as ld from '@launchdarkly/node-server-sdk';

const DEFAULTS = {
  'ai-model-version':    'haiku' as string,
  'community-section':   false,
  'streaming-responses': true,
  'email-verification':  false,
  'google-auth':         false,
  'evening-prayer':      false,
  'timed-devotionals':   false,
};

export type FlagKey = keyof typeof DEFAULTS;

let ldClient: ld.LDClient | null = null;
let initPromise: Promise<void> | null = null;

export async function getLDClient(): Promise<ld.LDClient | null> {
  const sdkKey = process.env.LAUNCHDARKLY_SDK_KEY;
  if (!sdkKey) return null;
  if (ldClient) return ldClient;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        ldClient = ld.init(sdkKey);
        await ldClient.waitForInitialization({ timeout: 5 });
        console.log('[LaunchDarkly] connected ✓');
      } catch (err) {
        console.warn('[LaunchDarkly] init failed — using safe defaults:', err);
        ldClient = null;
      }
    })();
  }

  await initPromise;
  return ldClient;
}

// ── Context builder ───────────────────────────────────────────────────────
export function buildContext(user: {
  id: number | string;
  email?: string;
  name?: string;
  createdAt?: string | Date;
  country?: string;
  primaryStruggle?: string;
  lifeStage?: string;
  messageCount?: number;
  isBetaUser?: boolean;
}): ld.LDContext {
  return {
    kind: 'user',
    key: String(user.id),
    email: user.email,
    name: user.name,
    country: user.country,
    custom: {
      accountAge: user.createdAt
        ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      primaryStruggle: user.primaryStruggle ?? null,
      lifeStage: user.lifeStage ?? null,
      hasCountry: !!user.country,
      messageCount: user.messageCount ?? 0,
      isHighEngagement: (user.messageCount ?? 0) >= 50,
      isBetaUser: user.isBetaUser ?? false,
    },
  };
}

export const ANONYMOUS_CONTEXT: ld.LDContext = {
  kind: 'user',
  key: 'anonymous',
  anonymous: true,
};

// ── Flag evaluation with reason logging ──────────────────────────────────
// Uses variationDetail() instead of variation() so we know WHY a flag resolved:
//   RULE_MATCH    — a targeting rule matched (e.g. isBetaUser = true)
//   TARGET_MATCH  — the user was individually targeted
//   FALLTHROUGH   — no rules matched, default served
//   OFF           — flag is turned off
//   ERROR         — evaluation error
export async function getFlag(
  key: FlagKey,
  context: ld.LDContext,
): Promise<string | boolean> {
  const client = await getLDClient();
  if (!client) return DEFAULTS[key];

  try {
    const detail = client.variationDetail(key, context, DEFAULTS[key]);
    const value = await Promise.resolve(detail) as any;

    // Log evaluation reason in development / staging for debugging
    if (process.env.NODE_ENV !== 'production' || process.env.LD_LOG_REASONS === 'true') {
      const reason = (value as any)?.reason ?? value?.reason;
      console.log(`[LaunchDarkly] flag=${key} value=${JSON.stringify((value as any)?.value ?? value)} reason=${JSON.stringify(reason)}`);
    }

    // variationDetail returns { value, variationIndex, reason }
    const resolved = (value as any)?.value ?? value;
    return resolved as unknown as string | boolean;
  } catch (err) {
    console.warn(`[LaunchDarkly] flag eval failed for "${key}":`, err);
    return DEFAULTS[key];
  }
}

// ── getAllFlags ───────────────────────────────────────────────────────────
export async function getAllFlags(context: ld.LDContext): Promise<Record<string, string | boolean>> {
  const client = await getLDClient();
  if (!client) return { ...DEFAULTS };

  try {
    const state = client.allFlagsState(context);
    const all = (state as any).toJSON?.() ?? {};
    return {
      'ai-model-version':    String(all['ai-model-version']    ?? DEFAULTS['ai-model-version']),
      'community-section':   Boolean(all['community-section']   ?? DEFAULTS['community-section']),
      'streaming-responses': Boolean(all['streaming-responses'] ?? DEFAULTS['streaming-responses']),
      'email-verification':  Boolean(all['email-verification']  ?? DEFAULTS['email-verification']),
      'google-auth':         Boolean(all['google-auth']          ?? DEFAULTS['google-auth']),
      'evening-prayer':      Boolean(all['evening-prayer']       ?? DEFAULTS['evening-prayer']),
      'timed-devotionals':   Boolean(all['timed-devotionals']    ?? DEFAULTS['timed-devotionals']),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

// ── Metric tracking for Experimentation ──────────────────────────────────
// LD Experimentation lets you attach metrics to flag variations and measure
// which variation drives better outcomes. We track these events:
//
//   chat-message-sent     — user sent a message (primary engagement metric)
//   chat-session-length   — messages per session (quality signal)
//   community-post-created — user created a community post
//   community-prayer-given — user prayed for someone
//   beta-joined            — user joined the beta programme
//
// In LD dashboard: Experiments → Create experiment → attach metric to flag
// Then compare: do Sonnet users send more messages than Haiku users?

export async function trackMetric(
  metricKey: string,
  context: ld.LDContext,
  value?: number,
): Promise<void> {
  const client = await getLDClient();
  if (!client) return;

  try {
    if (value !== undefined) {
      client.track(metricKey, context, null, value);
    } else {
      client.track(metricKey, context, null);
    }
  } catch (err) {
    console.warn(`[LaunchDarkly] metric tracking failed for "${metricKey}":`, err);
  }
}

// ── Graceful shutdown ──────────────────────────────────────────────────────
export async function closeLDClient(): Promise<void> {
  if (ldClient) {
    await ldClient.close();
    ldClient = null;
    initPromise = null;
  }
}
