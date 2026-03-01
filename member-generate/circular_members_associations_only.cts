import * as cheerio from 'cheerio';
import { initializeApp, applicationDefault, cert, AppOptions } from 'firebase-admin/app';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';

// -----------------------------
// Types
// -----------------------------

type MemberCategory =
  | 'associations_non_profits'
  | 'municipalities_government'
  | 'businesses'
  | 'public_institutions';

type OrgSize = 'small' | 'medium' | 'large' | 'enterprise' | null;

type CircularMember = {
  company_name: string;
  description: string | null;
  industry: string | null;
  member_category: MemberCategory;
  size: OrgSize;
  website: string | null;

  membership_start_date: string | null;
  loyalty_level: string | null;
  is_approved: boolean;

  created_at?: FieldValue;
  updated_at?: FieldValue;

  membership_duration_months: number | null;
  computed_loyalty_level: string | null;
  next_level: string | null;
  months_until_next_level: number | null;

  source_url: string;
  normalized_name: string;
};

type SeedMember = {
  company_name: string;
  website: string | null;
  member_category: MemberCategory;
  source_url: string;
};

// -----------------------------
// Seeded from the four CIC pages provided by the user.
// This avoids brittle scraping of the directory page HTML while preserving
// a snapshot that matches the source pages at the time of collection.
// -----------------------------

const seedMembers: SeedMember[] = [
  { company_name: '10C', website: 'https://10carden.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'ABCRC', website: 'https://abcrc.com', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'AHAM', website: 'https://www.aham.org', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'BOMA', website: 'https://bomacanada.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'ByWard Market District Authority', website: 'https://www.byward-market.com', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Canada Plastics Pact', website: 'https://plasticspact.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Canadian Coalition for Green Health Care', website: 'https://greenhealthcare.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'CARI', website: 'https://cari-acir.org', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Carton Council of Canada', website: 'https://www.recyclecartons.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Cathy’s Crawly Composters', website: 'https://www.cathyscomposters.com', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'CBA', website: 'https://www.canadianbeverage.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'CIAL Group', website: 'https://www.cialgroup.com', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Circular Materials', website: 'https://www.circularmaterials.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Clean Foundation', website: 'https://cleanfoundation.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Climate Wise', website: 'https://windfallcentre.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Compost Council of Canada', website: 'https://www.compost.org', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'CPCHE', website: 'https://healthyenvironmentforkids.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'CSA', website: 'https://www.csagroup.org', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'CSI', website: 'https://socialinnovation.org', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'CWMA', website: 'https://cwma.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Earth Day', website: 'https://earthday.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Earthub', website: 'https://www.earthub.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Eco Caledon', website: 'https://ecocaledon.org', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'EEQ', website: 'https://www.eeq.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Ellen MacArthur Foundation', website: 'https://www.ellenmacarthurfoundation.org', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'EnviroCentre', website: 'https://www.envirocentre.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Equiterre', website: 'https://www.equiterre.org', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Exhibition Place', website: 'https://www.explace.on.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Global Electronics Council', website: 'https://globalelectronicscouncil.org', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
  { company_name: 'Goodwill Industries', website: 'https://www.goodwillindustries.ca', member_category: 'associations_non_profits', source_url: 'https://circularinnovation.ca/membership/associations-non-profits/' },
];

// -----------------------------
// Helpers
// -----------------------------

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function inferIndustry(text: string, category: MemberCategory): string | null {
  const t = text.toLowerCase();

  if (category === 'municipalities_government') return 'Government';
  if (category === 'public_institutions') return 'Education';
  if (category === 'associations_non_profits') return 'Nonprofit / Association';

  if (/(recycling|waste|landfill|compost|diversion)/.test(t)) return 'Waste Management';
  if (/(packaging|containers|reuse|reusable)/.test(t)) return 'Packaging / Reuse';
  if (/(retail|stores|grocery|consumer)/.test(t)) return 'Retail';
  if (/(logistics|supply chain|shipping|postal)/.test(t)) return 'Logistics';
  if (/(technology|software|platform|ai|data)/.test(t)) return 'Technology';
  if (/(manufacturing|materials|plastics|polymer|paper)/.test(t)) return 'Manufacturing';
  if (/(telecom|communications|network)/.test(t)) return 'Telecommunications';
  if (/(consulting|engineering|advisory)/.test(t)) return 'Consulting / Engineering';

  return 'Business Services';
}

function inferSize(text: string, category: MemberCategory): OrgSize {
  if (category === 'municipalities_government') return 'large';
  if (category === 'public_institutions') return 'large';

  const t = text.toLowerCase();

  if (/(global|multinational|fortune|thousands of employees|worldwide)/.test(t)) return 'enterprise';
  if (/(hundreds of employees|national|canada-wide|across north america)/.test(t)) return 'large';
  if (/(growing team|mid-sized|across canada)/.test(t)) return 'medium';

  if (category === 'associations_non_profits') return 'medium';
  return null;
}

function firstMeaningfulText(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (!value) continue;
    const trimmed = value.replace(/\s+/g, ' ').trim();
    if (trimmed.length >= 30) return trimmed;
  }
  return null;
}

async function fetchDescriptionAndSignals(url: string): Promise<{ description: string | null; text: string }> {
  try {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CircularMembersImporter/1.0; +https://example.com)'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const data = await response.text();

    const $ = cheerio.load(data);
    $('script, style, noscript, svg').remove();

    const metaDescription = $('meta[name="description"]').attr('content');
    const ogDescription = $('meta[property="og:description"]').attr('content');
    const h1 = $('h1').first().text();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const fallbackExcerpt = bodyText.slice(0, 280);

    return {
      description: firstMeaningfulText(metaDescription, ogDescription, h1, fallbackExcerpt),
      text: [metaDescription, ogDescription, h1, bodyText.slice(0, 5000)].filter(Boolean).join(' ')
    };
  } catch {
    return { description: null, text: '' };
  }
}

async function enrichMember(seed: SeedMember): Promise<CircularMember> {
  const normalized_name = normalizeName(seed.company_name);
  let description: string | null = null;
  let signalText = seed.company_name;

  if (seed.website) {
    const fetched = await fetchDescriptionAndSignals(seed.website);
    description = fetched.description;
    signalText += ` ${fetched.text}`;
  }

  const industry = inferIndustry(signalText, seed.member_category);
  const size = inferSize(signalText, seed.member_category);

  return {
    company_name: seed.company_name,
    description,
    industry,
    member_category: seed.member_category,
    size,
    website: seed.website,

    membership_start_date: null,
    loyalty_level: null,
    is_approved: true,

    membership_duration_months: null,
    computed_loyalty_level: null,
    next_level: null,
    months_until_next_level: null,

    source_url: seed.source_url,
    normalized_name,
  };
}

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    write: args.has('--write'),
    out: process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : null,
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || null,
  };
}

function initFirestore(): Firestore {
  const options: AppOptions = {};

  // If GOOGLE_APPLICATION_CREDENTIALS is set, applicationDefault() works.
  // Otherwise, users can set FIREBASE_SERVICE_ACCOUNT_JSON to a path.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const raw = fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'utf8');
    options.credential = cert(JSON.parse(raw));
  } else {
    options.credential = applicationDefault();
  }

  initializeApp(options);
  return getFirestore();
}

async function writeToFirestore(db: Firestore, members: CircularMember[]) {
  const collection = db.collection('circular_members');

  for (let i = 0; i < members.length; i += 100) {
    const chunk = members.slice(i, i + 100);

    const existingSnapshots = await Promise.all(
      chunk.map((member) => collection.doc(member.normalized_name).get())
    );

    let batch = db.batch();

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
  const args = parseArgs();

  const enriched: CircularMember[] = [];
  for (const seed of seedMembers) {
    const item = await enrichMember(seed);
    enriched.push(item);
    console.log(`Prepared: ${item.company_name}`);
  }

  if (args.out) {
    fs.writeFileSync(args.out, JSON.stringify(enriched, null, 2), 'utf8');
    console.log(`Wrote JSON preview to ${args.out}`);
  }

  if (!args.write) {
    console.log('\nPreview mode only. Use --write to upload to Firestore.');
    console.log(JSON.stringify(enriched.slice(0, 5), null, 2));
    return;
  }

  const db = initFirestore();
  await writeToFirestore(db, enriched);
  console.log(`Uploaded ${enriched.length} members to Firestore collection: circular_members`);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
