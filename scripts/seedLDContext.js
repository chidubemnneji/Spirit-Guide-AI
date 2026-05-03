import * as ld from '@launchdarkly/node-server-sdk';

const SDK_KEY = process.env.LAUNCHDARKLY_SDK_KEY || '';

if (!SDK_KEY) {
  console.error('[LD Seed] ERROR: LAUNCHDARKLY_SDK_KEY not set — skipping');
  process.exit(0);
}

const FLAGS = [
  'ai-model-version',
  'community-section',
  'streaming-responses',
  'email-verification',
  'google-auth',
  'evening-prayer',
  'timed-devotionals',
];

const SEED_CONTEXTS = [
  { kind: 'user', key: 'seed-uk-1', email: 'seed-uk@example.com', name: 'Seed UK', country: 'United Kingdom', custom: { accountAge: 3, primaryStruggle: 'life_feeling_overwhelming', hasCountry: true } },
  { kind: 'user', key: 'seed-us-1', email: 'seed-us@example.com', name: 'Seed US', country: 'United States', custom: { accountAge: 45, primaryStruggle: 'grief_and_loss', hasCountry: true } },
  { kind: 'user', key: 'seed-au-1', email: 'seed-au@example.com', name: 'Seed AU', country: 'Australia', custom: { accountAge: 20, primaryStruggle: 'faith_and_doubt', hasCountry: true } },
  { kind: 'user', key: 'seed-ie-1', email: 'seed-ie@example.com', name: 'Seed IE', country: 'Ireland', custom: { accountAge: 90, primaryStruggle: 'relationship_and_loneliness', hasCountry: true } },
  { kind: 'user', key: 'seed-ng-1', email: 'seed-ng@example.com', name: 'Seed NG', country: 'Nigeria', custom: { accountAge: 1, primaryStruggle: 'purpose_and_identity', hasCountry: true } },
  { kind: 'user', key: 'seed-anon', anonymous: true, custom: { accountAge: 0, primaryStruggle: null, hasCountry: false } },
];

async function seed() {
  console.log('[LD Seed] Connecting...');
  const client = ld.init(SDK_KEY);

  try {
    await client.waitForInitialization({ timeout: 10 });
    console.log('[LD Seed] Connected ✓');
  } catch (err) {
    console.error('[LD Seed] Connection failed — skipping seed:', err.message);
    process.exit(0); // don't block app startup
  }

  let total = 0;
  for (const context of SEED_CONTEXTS) {
    const label = context.country || (context.anonymous ? 'anonymous' : context.key);
    process.stdout.write(`[LD Seed] ${label}: `);
    for (const flag of FLAGS) {
      client.variation(flag, context, false);
      total++;
    }
    console.log('done');
  }

  await client.flush();
  await client.close();
  console.log(`[LD Seed] Complete — ${total} evaluations sent`);
}

seed().catch(err => {
  console.error('[LD Seed] Error (non-fatal):', err.message);
  process.exit(0); // never block app startup
});
