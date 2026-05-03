import requestIp from 'request-ip';
import geoip from 'geoip-lite';
import type { Request } from 'express';

const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  GB: 'United Kingdom', IE: 'Ireland', DE: 'Germany', FR: 'France',
  NL: 'Netherlands', BE: 'Belgium', SE: 'Sweden', NO: 'Norway',
  DK: 'Denmark', FI: 'Finland', AT: 'Austria', CH: 'Switzerland',
  ES: 'Spain', IT: 'Italy', PT: 'Portugal', PL: 'Poland',
  CZ: 'Czech Republic', HU: 'Hungary', RO: 'Romania', GR: 'Greece',
  US: 'United States', CA: 'Canada', MX: 'Mexico',
  AU: 'Australia', NZ: 'New Zealand', SG: 'Singapore', JP: 'Japan',
  KR: 'South Korea', HK: 'Hong Kong', TW: 'Taiwan', IN: 'India',
  MY: 'Malaysia', PH: 'Philippines', TH: 'Thailand', ID: 'Indonesia',
  ZA: 'South Africa', NG: 'Nigeria', GH: 'Ghana', KE: 'Kenya',
  AE: 'United Arab Emirates', SA: 'Saudi Arabia',
  BR: 'Brazil', AR: 'Argentina', CO: 'Colombia', CL: 'Chile',
};

/**
 * Resolves client country from an Express request.
 *
 * Resolution order:
 *   1. DEV_COUNTRY env var — for local testing (e.g. DEV_COUNTRY="United Kingdom")
 *   2. x-forwarded-for / x-real-ip — set by Railway's reverse proxy
 *   3. geoip-lite local DB lookup — zero latency, no external API calls
 *   4. undefined — if IP is private/loopback or lookup fails
 *
 * Returns full country name (e.g. "United Kingdom") not ISO code, because
 * LaunchDarkly's built-in country attribute expects full names in targeting rules.
 */
export function getCountryFromRequest(req: Request): string | undefined {
  // Dev override
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_COUNTRY) {
    return process.env.DEV_COUNTRY;
  }

  const ip = requestIp.getClientIp(req);
  if (!ip) return undefined;

  // Skip private/loopback — no geo data available
  if (
    ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' ||
    ip.startsWith('10.') || ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  ) {
    return process.env.DEV_COUNTRY || undefined;
  }

  const geo = geoip.lookup(ip);
  if (!geo?.country) return undefined;

  return COUNTRY_CODE_TO_NAME[geo.country] ?? geo.country;
}

/** Returns ISO code (e.g. "GB") for internal logic — separate from LD context */
export function getCountryCodeFromRequest(req: Request): string | undefined {
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_COUNTRY_CODE) {
    return process.env.DEV_COUNTRY_CODE;
  }
  const ip = requestIp.getClientIp(req);
  if (!ip) return undefined;
  return geoip.lookup(ip)?.country ?? undefined;
}
