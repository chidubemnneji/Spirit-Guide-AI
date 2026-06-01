/**
 * SoulGuide Feature Flags
 *
 * Evaluation priority:
 *   1. LaunchDarkly (if LAUNCHDARKLY_SDK_KEY is set) — real-time, per-user
 *   2. FEATURE_FLAGS env var (JSON override) — legacy fallback
 *   3. Hardcoded defaults — safe fallback if LD is unavailable
 *
 * This means you can:
 *   - Use the LD dashboard to toggle flags live in production
 *   - Target specific users (e.g. serve Sonnet to your own account for demos)
 *   - Roll out features to % of users from the LD dashboard
 *   - Still use FEATURE_FLAGS env var as an emergency override
 */

import { getFlag, getAllFlags, buildContext, ANONYMOUS_CONTEXT } from './services/launchDarkly';
import type { LDContext } from '@launchdarkly/node-server-sdk';

// Legacy env-var fallback (keeps backward compat with existing Railway config)
const envOverrides: Record<string, boolean> = (() => {
  try {
    const env = process.env.FEATURE_FLAGS;
    return env ? JSON.parse(env) : {};
  } catch {
    return {};
  }
})();

const DEFAULTS: Record<string, boolean | string> = {
  TIMED_DEVOTIONALS:   false,
  EVENING_PRAYER:      false,
  AMBIENT_SOUNDS:      false,
  TOPIC_DEVOTIONALS:   false,
  EMAIL_VERIFICATION:  false,
  GOOGLE_AUTH:         false,
};

// ── Synchronous check (uses env overrides + defaults, no LD) ─────────────
// Used in places where we can't await (e.g. middleware setup)
export const flags: Record<string, boolean | string> = { ...DEFAULTS, ...envOverrides };

export function isEnabled(flag: string): boolean {
  return !!flags[flag];
}

// ── Async check via LaunchDarkly (preferred for route handlers) ───────────
// Pass the user object if you have it — enables per-user targeting in LD
export async function isEnabledForUser(
  ldFlag: string,
  user?: { id: number | string; email?: string; name?: string; createdAt?: string | Date; country?: string; primaryStruggle?: string; messageCount?: number; isBetaUser?: boolean }
): Promise<boolean> {
  const context: LDContext = user ? buildContext(user) : ANONYMOUS_CONTEXT;

  // Map legacy uppercase keys to LD kebab-case keys
  const keyMap: Record<string, string> = {
    'EMAIL_VERIFICATION': 'email-verification',
    'GOOGLE_AUTH':        'google-auth',
    'TIMED_DEVOTIONALS':  'timed-devotionals',
    'EVENING_PRAYER':     'evening-prayer',
    'COMMUNITY_SECTION':  'community-section',
    'STREAMING_RESPONSES':'streaming-responses',
  };

  const ldKey = keyMap[ldFlag] || ldFlag;

  try {
    const value = await getFlag(ldKey as any, context);
    return typeof value === 'boolean' ? value : value === 'true';
  } catch {
    // LD unavailable — fall back to env/defaults
    return isEnabled(ldFlag);
  }
}

// ── Get AI model for a specific user ─────────────────────────────────────
// Core use case: A/B test Sonnet vs Haiku per user
export async function getAIModel(
  user?: { id: number | string; email?: string; name?: string; createdAt?: string | Date; country?: string; primaryStruggle?: string; messageCount?: number; isBetaUser?: boolean }
): Promise<string> {
  const context: LDContext = user ? buildContext(user) : ANONYMOUS_CONTEXT;
  const fallback = process.env.PRIMARY_AI_MODEL || "claude-sonnet-4-5";

  try {
    const variant = await getFlag('ai-model-version', context);
    // Only switch to an alternate model if one is explicitly configured;
    // otherwise use the known-good primary model for this endpoint.
    if ((variant as string) === 'haiku' && process.env.FALLBACK_ANTHROPIC_MODEL) {
      return process.env.FALLBACK_ANTHROPIC_MODEL;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

// ── Get all flags for /api/flags endpoint ─────────────────────────────────
export async function getAllFlagsForUser(
  user?: { id: number | string; email?: string; name?: string; country?: string; primaryStruggle?: string; isBetaUser?: boolean }
): Promise<Record<string, boolean | string>> {
  const context: LDContext = user ? buildContext(user) : ANONYMOUS_CONTEXT;

  try {
    const ldFlags = await getAllFlags(context);
    return {
      ...flags,          // legacy env flags as base
      ...ldFlags,        // LD flags override
    };
  } catch {
    return { ...flags };
  }
}
