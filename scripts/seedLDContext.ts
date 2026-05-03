/**
 * Seed LaunchDarkly context schema
 *
 * Run once to teach LD about all context attributes SoulGuide sends.
 * After running, attributes like `country`, `primaryStruggle`, `accountAge`
 * will appear in the LD dashboard targeting rule dropdowns.
 *
 * Usage:
 *   LAUNCHDARKLY_SDK_KEY=sdk-xxx npx ts-node scripts/seedLDContext.ts
 */

import * as ld from '@launchdarkly/node-server-sdk';

const SDK_KEY = process.env.LAUNCHDARKLY_SDK_KEY || '';

if (!SDK_KEY) {
  console.error('Set LAUNCHDARKLY_SDK_KEY before running this script');
  process.exit(1);
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

const SEED_CONTEXTS: ld.LDContext[] = [
  {
    kind: 'user', key: 'seed-uk-1',
    email: 'seed-uk@example.com', name: 'Seed UK',
    country: 'United Kingdom',
    custom: { accountAge: 3, primaryStruggle: 'life_feeling_overwhelming', hasCountry: true },
  },
  {
    kind: 'user', key: 'seed-us-1',
    email: 'seed-us@example.com', name: 'Seed US',
    country: 'United States',
    custom: { accountAge: 45, primaryStruggle: 'grief_and_loss', hasCountry: true },
  },
  {
    kind: 'user', key: 'seed-au-1',
    email: 'seed-au@example.com', name: 'Seed AU',
    country: 'Australia',
    custom: { accountAge: 20, primaryStruggle: 'faith_and_doubt', hasCountry: true },
  },
  {
    kind: 'user', key: 'seed-ie-1',
    email: 'seed-ie@example.com', name: 'Seed IE',
    country: 'Ireland',
    custom: { accountAge: 90, primaryStruggle: 'relationship_and_loneliness', hasCountry: true },
  },
  {
    kind: 'user', key: 'seed-ng-1',
    email: 'seed-ng@example.com', name: 'Seed NG',
    country: 'Nigeria',
    custom: { accountAge: 1, primaryStruggle: 'purpose_and_identity', hasCountry: true },
  },
  {
    kind: 'user', key: 'seed-anon',
    anonymous: true,
    custom: { accountAge: 0, primaryStruggle: null, hasCountry: false },
  },
];

async function seed() {
  console.log('Connecting to LaunchDarkly...');
  const client = ld.init(SDK_KEY);

  try {
    await client.waitForInitialization({ timeout: 10 });
    console.log('Connected\n');
  } catch (err) {
    console.error('Failed to connect:', err);
    process.exit(1);
  }

  console.log(`Evaluating ${FLAGS.length} flags x ${SEED_CONTEXTS.length} contexts...\n`);

  let total = 0;
  for (const context of SEED_CONTEXTS) {
    const label = (context as any).country ?? (context.anonymous ? 'anonymous' : String(context.key));
    process.stdout.write(`  ${label.padEnd(22)}`);
    for (const flag of FLAGS) {
      client.variation(flag, context, false);
      process.stdout.write('.');
      total++;
    }
    console.log(' done');
  }

  await client.flush();
  await client.close();

  console.log(`\n${total} evaluations sent.`);
  console.log('Wait 30-60s then check LD dashboard — targeting rules should now show:');
  console.log('  country, custom.accountAge, custom.primaryStruggle, custom.hasCountry');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
