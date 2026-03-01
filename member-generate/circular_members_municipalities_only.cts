import { readFileSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

type CircularMember = {
  company_name: string;
  normalized_name: string;
  description: string | null;
  industry: string | null;
  member_category: 'municipalities_government';
  size: 'small' | 'medium' | 'large' | 'enterprise' | null;
  website: string | null;
  membership_start_date: null;
  loyalty_level: null;
  is_approved: true;
  membership_duration_months: null;
  computed_loyalty_level: null;
  next_level: null;
  months_until_next_level: null;
  created_at?: FieldValue;
  updated_at?: FieldValue;
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const seedMembers: CircularMember[] = [
  { company_name: 'Bluewater Recycling Assoc', normalized_name: normalizeName('Bluewater Recycling Assoc'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.bra.org', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Bowen Island', normalized_name: normalizeName('Bowen Island'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://bowenislandmunicipality.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Brantford', normalized_name: normalizeName('Brantford'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.brantford.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Brockville', normalized_name: normalizeName('Brockville'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://brockville.com', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'City of Greater Sudbury', normalized_name: normalizeName('City of Greater Sudbury'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.greatersudbury.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'City of Montreal', normalized_name: normalizeName('City of Montreal'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://montreal.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'City of St. John\'s', normalized_name: normalizeName("City of St. John's"), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.stjohns.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Cornwall', normalized_name: normalizeName('Cornwall'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.cornwall.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Dufferin', normalized_name: normalizeName('Dufferin'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://dufferincounty.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Durham', normalized_name: normalizeName('Durham'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.durham.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'ECCC', normalized_name: normalizeName('ECCC'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.canada.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Edmonton', normalized_name: normalizeName('Edmonton'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.edmonton.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'EWSWA', normalized_name: normalizeName('EWSWA'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.ewswa.org', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Gananoque', normalized_name: normalizeName('Gananoque'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.gananoque.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Guelph', normalized_name: normalizeName('Guelph'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://guelph.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Haldimand', normalized_name: normalizeName('Haldimand'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.haldimandcounty.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Halton', normalized_name: normalizeName('Halton'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.halton.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Kingston', normalized_name: normalizeName('Kingston'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.cityofkingston.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'London', normalized_name: normalizeName('London'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://london.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Netherlands Government', normalized_name: normalizeName('Netherlands Government'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.netherlandsandyou.nl', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Newmarket', normalized_name: normalizeName('Newmarket'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.newmarket.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Niagara', normalized_name: normalizeName('Niagara'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://niagararegion.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Norfolk', normalized_name: normalizeName('Norfolk'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.norfolkcounty.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Orillia', normalized_name: normalizeName('Orillia'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.orillia.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Ottawa', normalized_name: normalizeName('Ottawa'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://ottawa.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Peel', normalized_name: normalizeName('Peel'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://peelregion.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Pickering', normalized_name: normalizeName('Pickering'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.pickering.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Richmond', normalized_name: normalizeName('Richmond'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.richmond.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null },
  { company_name: 'Strathcona', normalized_name: normalizeName('Strathcona'), description: null, industry: 'Government', member_category: 'municipalities_government', size: null, website: 'https://www.strathcona.ca', membership_start_date: null, loyalty_level: null, is_approved: true, membership_duration_months: null, computed_loyalty_level: null, next_level: null, months_until_next_level: null }
];

function initFirestore(): Firestore {
  if (!getApps().length) {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!serviceAccountPath) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS is not set');
    }
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
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
  const shouldWrite = process.argv.includes('--write');

  if (!shouldWrite) {
    console.log(JSON.stringify(seedMembers, null, 2));
    console.log(`\nPreview only. ${seedMembers.length} municipality/government members ready.`);
    console.log('Run with --write to send them to Firestore.');
    return;
  }

  const db = initFirestore();
  await writeToFirestore(db, seedMembers);
  console.log(`Wrote ${seedMembers.length} municipality/government members to circular_members.`);
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
