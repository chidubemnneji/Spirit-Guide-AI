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
      // Beta access — used to gate community-section in LD segments
      isBetaUser: user.isBetaUser ?? false,
    },
  };
}

export const ANONYMOUS_CONTEXT: ld.LDContext = {
  kind: 'user',
  key: 'anonymous',
  anonymous: true,
};

export async function getFlag(
  key: FlagKey,
  context: ld.LDContext,
): Promise<string | boolean> {
  const client = await getLDClient();
  if (!client) return DEFAULTS[key];

  try {
    return client.variation(key, context, DEFAULTS[key]) as unknown as string | boolean;
  } catch (err) {
    console.warn(`[LaunchDarkly] flag eval failed for "${key}":`, err);
    return DEFAULTS[key];
  }
}

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

export async function closeLDClient(): Promise<void> {
  if (ldClient) {
    await ldClient.close();
    ldClient = null;
    initPromise = null;
  }
}
