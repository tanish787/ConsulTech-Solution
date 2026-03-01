import { readFileSync } from 'fs';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

type MemberCategory = 'public_institutions';

type SeedMember = {
  company_name: string;
  website: string | null;
};

type CircularMember = {
  company_name: string;
  normalized_name: string;
  description: string | null;
  industry: string | null;
  size: 'small' | 'medium' | 'large' | 'enterprise' | null;
  website: string | null;
  member_category: MemberCategory;
  membership_start_date: string | null;
  loyalty_level: string | null;
  is_approved: boolean;
  membership_duration_months: number | null;
  computed_loyalty_level: string | null;
  next_level: string | null;
  months_until_next_level: number | null;
  created_at?: FieldValue;
  updated_at?: FieldValue;
};

const seedMembers: SeedMember[] = [
  { company_name: 'ETS', website: 'https://www.etsmtl.ca' },
  { company_name: 'Ottawa University', website: 'https://www.uottawa.ca' },
  { company_name: 'Queen\'s University', website: 'https://www.queensu.ca' },
  { company_name: 'Toronto University', website: 'https://www.utoronto.ca' },
  { company_name: 'United Health Network', website: 'https://talkintrashwithuhn.com' },
  { company_name: 'Wilfrid Laurier University', website: 'https://www.wlu.ca' },
  { company_name: 'York University', website: 'https://www.yorku.ca' },
];

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function inferIndustry(name: string): string {
  if (/university|college|school|ets/i.test(name)) return 'Education';
  if (/health|hospital|network/i.test(name)) return 'Healthcare';
  return 'Public Institution';
}

function toCircularMember(seed: SeedMember): CircularMember {
  return {
    company_name: seed.company_name,
    normalized_name: normalizeName(seed.company_name),
    description: null,
    industry: inferIndustry(seed.company_name),
    size: 'enterprise',
    website: seed.website,
    member_category: 'public_institutions',
    membership_start_date: null,
    loyalty_level: null,
    is_approved: true,
    membership_duration_months: null,
    computed_loyalty_level: null,
    next_level: null,
    months_until_next_level: null,
  };
}

function initFirestore(): Firestore {
  if (!getApps().length) {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (serviceAccountPath) {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } else {
      initializeApp({ credential: applicationDefault() });
    }
  }

  return getFirestore();
}

async function writeToFirestore(db: Firestore, members: CircularMember[]) {
  const collection = db.collection('circular_members');

  for (let i = 0; i < members.length; i += 100) {
    const chunk = members.slice(i, i + 100);

    const existingSnapshots = await Promise.all(
      chunk.map((member) => collection.doc(member.normalized_name).get())
    );

    const batch = db.batch();

    for (let j = 0; j < chunk.length; j++) {
      const member = chunk[j];
      const snap = existingSnapshots[j];
      const ref = collection.doc(member.normalized_name);

      if (snap.exists) {
        batch.set(
          ref,
          {
            ...member,
            updated_at: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        batch.set(ref, {
          ...member,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        });
      }
    }

    await batch.commit();
  }
}

async function main() {
  const members = seedMembers.map(toCircularMember);

  if (!process.argv.includes('--write')) {
    console.log(JSON.stringify(members, null, 2));
    console.log('\nRun with --write to upload these documents to Firestore.');
    return;
  }

  const db = initFirestore();
  await writeToFirestore(db, members);
  console.log(`Wrote ${members.length} public institution members to Firestore collection \"circular_members\".`);
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
