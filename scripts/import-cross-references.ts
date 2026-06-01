/**
 * Import a public-domain cross-reference dataset into the `cross_references` table.
 *
 * IMPORTANT: This loads a REAL curated dataset. The app never generates cross
 * references at runtime. The best-known public-domain source is the
 * "Treasury of Scripture Knowledge" (TSK). A widely-used machine-readable
 * version is the OpenBible.info cross-reference dataset (CC-BY), distributed as
 * a TSV with columns: From Verse, To Verse, Votes.
 *
 * Usage:
 *   1. Download the dataset (e.g. cross_references.txt) from a source you trust.
 *   2. Place it at the path below (or pass a path as argv[2]).
 *   3. Run:  DATABASE_URL=... npx tsx scripts/import-cross-references.ts ./cross_references.txt
 *
 * The reference format in these datasets (e.g. "John.1.1") may need mapping to
 * match how your app names references. Adjust `normalizeRef` to fit your scheme
 * before relying on the lookups. Verify a few lookups after import.
 */
import fs from "fs";
import readline from "readline";
import { db } from "../server/db";
import { crossReferences } from "../shared/schema";

function normalizeRef(raw: string): string {
  // Dataset uses e.g. "Gen.1.1" / "John.3.16". Adjust to your app's scheme.
  // This keeps the dataset's "Book.Chapter.Verse" form; map if your app differs.
  return raw.trim();
}

async function main() {
  const path = process.argv[2] || "./cross_references.txt";
  if (!fs.existsSync(path)) {
    console.error(`Dataset not found at ${path}. Download a public-domain cross-reference TSV first.`);
    process.exit(1);
  }

  const rl = readline.createInterface({ input: fs.createReadStream(path), crlfDelay: Infinity });
  let batch: Array<{ fromRef: string; toRef: string; votes: number }> = [];
  let total = 0;
  let isHeader = true;

  async function flush() {
    if (batch.length === 0) return;
    await db.insert(crossReferences).values(batch);
    total += batch.length;
    batch = [];
    if (total % 50000 === 0) console.log(`  …${total} rows`);
  }

  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; } // skip header row
    const parts = line.split("\t");
    if (parts.length < 2) continue;
    const fromRef = normalizeRef(parts[0]);
    const toRef = normalizeRef(parts[1]);
    const votes = parts[2] ? parseInt(parts[2], 10) || 0 : 0;
    if (!fromRef || !toRef) continue;
    batch.push({ fromRef, toRef, votes });
    if (batch.length >= 1000) await flush();
  }
  await flush();
  console.log(`Imported ${total} cross references.`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
