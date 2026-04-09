// Feature flags — flip to true to enable a feature
// Can be overridden by environment variable FEATURE_FLAGS (JSON)

const defaults: Record<string, boolean> = {
  TIMED_DEVOTIONALS: false,
  EVENING_PRAYER: false,
  AMBIENT_SOUNDS: false,
  TOPIC_DEVOTIONALS: false,
};

function loadFlags(): Record<string, boolean> {
  try {
    const env = process.env.FEATURE_FLAGS;
    if (env) {
      const overrides = JSON.parse(env);
      return { ...defaults, ...overrides };
    }
  } catch {
    console.warn("[flags] Invalid FEATURE_FLAGS env var — using defaults");
  }
  return { ...defaults };
}

export const flags = loadFlags();

export function isEnabled(flag: string): boolean {
  return !!flags[flag];
}
