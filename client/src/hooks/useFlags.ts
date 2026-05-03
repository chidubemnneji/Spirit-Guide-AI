import { useQuery } from "@tanstack/react-query";

interface FeatureFlags {
  TIMED_DEVOTIONALS: boolean;
  EVENING_PRAYER: boolean;
  AMBIENT_SOUNDS: boolean;
  TOPIC_DEVOTIONALS: boolean;
  EMAIL_VERIFICATION: boolean;
  GOOGLE_AUTH: boolean;
  // LaunchDarkly flags
  "community-section": boolean;
  "ai-model-version": string;
  "streaming-responses": boolean;
}

const defaultFlags: FeatureFlags = {
  TIMED_DEVOTIONALS: false,
  EVENING_PRAYER: false,
  AMBIENT_SOUNDS: false,
  TOPIC_DEVOTIONALS: false,
  EMAIL_VERIFICATION: false,
  GOOGLE_AUTH: false,
  "community-section": false,
  "ai-model-version": "haiku",
  "streaming-responses": true,
};

export function useFlags() {
  const { data } = useQuery<FeatureFlags>({
    queryKey: ["/api/flags"],
    // Poll every 30 seconds — picks up LD flag changes and beta toggles
    // without requiring a page refresh
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
    refetchIntervalInBackground: false, // only poll when tab is active
  });
  return data ?? defaultFlags;
}
