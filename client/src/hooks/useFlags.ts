import { useQuery } from "@tanstack/react-query";

interface FeatureFlags {
  TIMED_DEVOTIONALS: boolean;
  EVENING_PRAYER: boolean;
  AMBIENT_SOUNDS: boolean;
  TOPIC_DEVOTIONALS: boolean;
  EMAIL_VERIFICATION: boolean;
}

const defaultFlags: FeatureFlags = {
  TIMED_DEVOTIONALS: false,
  EVENING_PRAYER: false,
  AMBIENT_SOUNDS: false,
  TOPIC_DEVOTIONALS: false,
  EMAIL_VERIFICATION: false,
};

export function useFlags() {
  const { data } = useQuery<FeatureFlags>({
    queryKey: ["/api/flags"],
    staleTime: 1000 * 60 * 5,
  });
  return data ?? defaultFlags;
}
