import { readFileSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

interface CircularMemberDoc {
  company_name?: string;
  normalized_name?: string;
  member_category?: string;
}

interface LevelInfo {
  current: string;
  next: string | null;
  monthsUntilNext: number | null;
}

type TierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

const CATEGORY_BUCKET_THRESHOLDS: Record<string, [number, number, number]> = {
  // Thresholds are cumulative cutoffs for a 0-99 hash bucket.
  // These are intentionally biased toward Bronze/Silver/Gold so fewer members land in Platinum.
  // Bronze, Silver, Gold, Platinum
  businesses: [30, 65, 90],                // 30%, 35%, 25%, 10%
  associations_non_profits: [20, 55, 85], // 20%, 35%, 30%, 15%
  municipalities_government: [15, 45, 80],// 15%, 30%, 35%, 20%
  public_institutions: [20, 55, 85],      // 20%, 35%, 30%, 15%
};

const FIXED_TIER_OVERRIDES: Record<string, TierName> = {
  // Keep just a few stable anchors; most members use the weighted spread.
  boma: 'Platinum',
  ellen_macarthur_foundation: 'Platinum',
  csa: 'Platinum',
  canada_plastics_pact: 'Gold',
  circular_materials: 'Gold',
  toronto_university: 'Gold',
  york_university: 'Gold',
  city_of_montreal: 'Gold',
  ottawa: 'Gold',
  friendlier: 'Silver',
  fullstep_consulting: 'Bronze',
  circulr: 'Bronze',
  dispersa: 'Silver',
};

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    shouldWrite: args.includes('--write'),
    limit: (() => {
      const raw = args.find((a) => a.startsWith('--limit='));
      if (!raw) return null;
      const n = Number(raw.split('=')[1]);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
    })(),
  };
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function initDb(): Firestore {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!serviceAccountPath) throw new Error('GOOGLE_APPLICATION_CREDENTIALS is not set');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }
  return getFirestore();
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function chooseTier(key: string, category: string): TierName {
  const forced = FIXED_TIER_OVERRIDES[key];
  if (forced) return forced;

  const thresholds = CATEGORY_BUCKET_THRESHOLDS[category] || CATEGORY_BUCKET_THRESHOLDS.businesses;
  const bucket = hashString(`${category}:${key}`) % 100;

  if (bucket < thresholds[0]) return 'Bronze';
  if (bucket < thresholds[1]) return 'Silver';
  if (bucket < thresholds[2]) return 'Gold';
  return 'Platinum';
}

function chooseMonthsInTier(key: string, tier: TierName): number {
  const roll = hashString(`months:${key}`);

  if (tier === 'Bronze') {
    // 0-2 months
    return roll % 3;
  }
  if (tier === 'Silver') {
    // 3-11 months
    return 3 + (roll % 9);
  }
  if (tier === 'Gold') {
    // 12-23 months
    return 12 + (roll % 12);
  }
  // Platinum: keep it older, but not wildly old; 24-35 months
  return 24 + (roll % 12);
}

function startDateFromMonthsAgo(monthsAgo: number): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1));
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = '01';
  return `${yyyy}-${mm}-${dd}`;
}

function monthDiff(start: Date, end: Date): number {
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  if (end.getUTCDate() < start.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

function computeLevel(months: number): LevelInfo {
  if (months >= 24) return { current: 'Platinum', next: null, monthsUntilNext: null };
  if (months >= 12) return { current: 'Gold', next: 'Platinum', monthsUntilNext: 24 - months };
  if (months >= 3) return { current: 'Silver', next: 'Gold', monthsUntilNext: 12 - months };
  return { current: 'Bronze', next: 'Silver', monthsUntilNext: 3 - months };
}

function pickEstimatedStartDate(doc: CircularMemberDoc, docId: string): { date: string; source: 'weighted_tier_estimate'; chosenTier: TierName; targetMonths: number } {
  // Intentionally ignore stored membership_start_date and created_at.
  // This version also ignores the old fixed date overrides because they skewed too many members into Platinum.
  const key = doc.normalized_name || (doc.company_name ? normalizeName(doc.company_name) : docId);
  const category = doc.member_category || 'businesses';
  const chosenTier = chooseTier(key, category);
  const targetMonths = chooseMonthsInTier(key, chosenTier);
  const date = startDateFromMonthsAgo(targetMonths);
  return { date, source: 'weighted_tier_estimate', chosenTier, targetMonths };
}

async function main() {
  const { shouldWrite, limit } = parseArgs();
  const db = initDb();
  const snapshot = await db.collection('circular_members').get();
  let docs = snapshot.docs;
  if (limit) docs = docs.slice(0, limit);

  let processed = 0;
  let counts: Record<string, number> = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
  let batch = db.batch();
  let batchCount = 0;

  for (const snap of docs) {
    const data = snap.data() as CircularMemberDoc;

    const picked = pickEstimatedStartDate(data, snap.id);
    const start = new Date(`${picked.date}T00:00:00Z`);
    const months = monthDiff(start, new Date());
    const level = computeLevel(months);
    counts[level.current] = (counts[level.current] || 0) + 1;

    console.log(
      `- ${data.company_name || snap.id}: start=${picked.date} (${picked.source}), target_months=${picked.targetMonths}, duration=${months}, level=${level.current}, next_in=${level.monthsUntilNext ?? 'null'}`
    );

    processed += 1;

    if (!shouldWrite) continue;

    batch.set(
      snap.ref,
      {
        membership_start_date: picked.date,
        membership_duration_months: months,
        months_until_next_level: level.monthsUntilNext,
        computed_loyalty_level: level.current,
        next_level: level.next,
        updated_at: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    batchCount += 1;
    if (batchCount === 400) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (shouldWrite && batchCount > 0) {
    await batch.commit();
  }

  console.log(`\nTier mix: Bronze=${counts.Bronze}, Silver=${counts.Silver}, Gold=${counts.Gold}, Platinum=${counts.Platinum}`);

  if (shouldWrite) {
    console.log(`Recomputed membership fields for ${processed} document(s) in circular_members.`);
  } else {
    console.log(`Previewed ${processed} document(s). Run with --write to save.`);
  }
}

main().catch((err) => {
  console.error('Membership field update failed:', err);
  process.exit(1);
});
