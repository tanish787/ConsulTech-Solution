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

// -----------------------------
// Seeded from the paginated CIC businesses archive.
// This version includes the full visible businesses archive (pages 1-10),
// deduplicated where the site repeats an entry (ElastoChem appears on pages 7 and 8).
// -----------------------------

const seedMembers: SeedMember[] = [
  { company_name: 'Definity Financial Corporation', website: 'https://www.definityfinancial.com/', member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/' },
  { company_name: 'Refresco', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/' },
  { company_name: 'Tricentris', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/' },
  { company_name: 'Post Plastics', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/' },
  { company_name: 'Nespresso Canada', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/' },
  { company_name: 'Vio Sustainability', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/' },
  { company_name: 'Provectus', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/' },
  { company_name: 'Innovate Waste Solutions Corp', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/' },
  { company_name: 'Purolator', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/' },
  { company_name: 'Leap Green Polymers', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/' },
  { company_name: 'RioCan REIT', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/2/' },
  { company_name: 'Working Knowledge Inc', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/2/' },
  { company_name: 'Sussex', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/2/' },
  { company_name: 'MCC', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/2/' },
  { company_name: 'GFM', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/2/' },
  { company_name: 'Walmart', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/2/' },
  { company_name: 'Walker', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/2/' },
  { company_name: 'Waste Reduction Group Inc', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/2/' },
  { company_name: 'WasteCo', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/2/' },
  { company_name: 'Walker Environmental', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/2/' },
  { company_name: 'Viridis Environmental Inc', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/3/' },
  { company_name: 'Viking Recycling', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/3/' },
  { company_name: 'VCycene Inc', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/3/' },
  { company_name: 'Toronto Hydro', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/3/' },
  { company_name: 'Tomra', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/3/' },
  { company_name: 'The Charity Hub', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/3/' },
  { company_name: 'The Beer Store', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/3/' },
  { company_name: 'Telus', website: 'https://www.telus.com/', member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/3/' },
  { company_name: 'Suppli', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/3/' },
  { company_name: 'Sobeys', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/3/' },
  { company_name: 'Smart Recycle Consulting', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/4/' },
  { company_name: 'Second Wind Recycling', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/4/' },
  { company_name: 'Robust Recycling', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/4/' },
  { company_name: 'Revolusation', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/4/' },
  { company_name: 'RFCL Innovations Inc', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/4/' },
  { company_name: 'RLG', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/4/' },
  { company_name: 'Reusables', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/4/' },
  { company_name: 'Resource Recycling', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/4/' },
  { company_name: 'ReMM Group', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/4/' },
  { company_name: 'Reclay StewardEdge', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/4/' },
  { company_name: 'Recanex', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/5/' },
  { company_name: 'Raw Materials Company Inc', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/5/' },
  { company_name: 'Quantum Lifecycle', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/5/' },
  { company_name: 'PLAEX', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/5/' },
  { company_name: 'Pragma Tech Waste Solutions', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/5/' },
  { company_name: 'Policy Integrity Consulting', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/5/' },
  { company_name: 'Motioneer', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/5/' },
  { company_name: 'Miller Waste Systems', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/5/' },
  { company_name: 'Metro', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/5/' },
  { company_name: 'MJ Waste Solutions', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/5/' },
  { company_name: 'McDonalds Canada', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/6/' },
  { company_name: 'Market Waste Solutions', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/6/' },
  { company_name: 'Loblaw Companies Limited', website: 'https://www.loblaw.ca/', member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/6/' },
  { company_name: 'LEND-IT.ca', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/6/' },
  { company_name: 'Lark Scientific', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/6/' },
  { company_name: 'Kelleher Environmental', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/6/' },
  { company_name: 'KalTire', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/6/' },
  { company_name: 'Keurig DrPepper Canada', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/6/' },
  { company_name: 'HSR Zero Waste', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/6/' },
  { company_name: 'HP', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/6/' },
  { company_name: 'GFL', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/7/' },
  { company_name: 'General Mills', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/7/' },
  { company_name: 'Friendlier', website: 'https://www.friendlier.com/', member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/7/' },
  { company_name: 'Fullstep Consulting', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/7/' },
  { company_name: 'Emterra Group', website: 'https://www.emterra.ca/', member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/7/' },
  { company_name: 'ETCH Sourcing', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/7/' },
  { company_name: 'Envirotech', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/7/' },
  { company_name: 'Eligant Group Inc', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/7/' },
  { company_name: 'ElastoChem', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/7/' },
  { company_name: 'EFS Plastics', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/7/' },
  { company_name: 'Electronics Recycling Services', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/8/' },
  { company_name: 'Eco-Safe', website: 'https://www.ecosafewaste.com/', member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/8/' },
  { company_name: 'Ecomaterials Inc.', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/8/' },
  { company_name: 'Eco-Growth Solutions', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/8/' },
  { company_name: 'Ecocup by RE-UZ', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/8/' },
  { company_name: 'Dispersa', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/8/' },
  { company_name: 'Creative Polymer Solutions', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/8/' },
  { company_name: 'COM2 Recycling Solutions', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/8/' },
  { company_name: 'Colour Alchemist', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/8/' },
  { company_name: 'Circulr', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/9/' },
  { company_name: 'Circular Partners', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/9/' },
  { company_name: 'CHEP', website: 'https://www.chep.com/ca/en', member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/9/' },
  { company_name: 'CD Sonter', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/9/' },
  { company_name: 'Cascades', website: 'https://www.cascades.com/', member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/9/' },
  { company_name: 'Canada Post', website: 'https://www.canadapost-postescanada.ca/', member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/9/' },
  { company_name: 'Busch Systems', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/9/' },
  { company_name: 'Brookstone Strategy Group', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/9/' },
  { company_name: 'The Box of Life', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/9/' },
  { company_name: 'BGIS', website: 'https://www.bgis.com/', member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/9/' },
  { company_name: 'Bag to Earth', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/10/' },
  { company_name: 'AET', website: null, member_category: 'businesses', source_url: 'https://circularinnovation.ca/member-category/businesses/page/10/' },
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
  let batch = db.batch();
  let opCount = 0;

  for (const member of members) {
    const ref = db.collection('circular_members').doc(member.normalized_name);
    batch.set(
      ref,
      {
        ...member,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    opCount += 1;

    // Firestore batched writes are limited to 500 ops.
    if (opCount === 450) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
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
