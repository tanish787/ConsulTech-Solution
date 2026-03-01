import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

type ListingType = 'offer' | 'request' | 'exchange' | 'pilot';

type ListingSeed = {
  listing_id: string;
  owner_name: string;
  title: string;
  short_description: string;
  full_description: string;
  listing_type: ListingType;
  category: string;
  material_or_need: string;
  quantity_estimate: string;
  condition: string;
  desired_partner_types: string[];
  location_hint: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'open';
  tags: string[];
};

type ListingDoc = ListingSeed & {
  owner_normalized_name: string;
  owner_exists_in_members: boolean;
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

function initializeFirestore(): Firestore {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    const parsed = JSON.parse(serviceAccountJson);
    initializeApp({
      credential: cert(parsed),
      projectId: parsed.project_id,
    });
    return getFirestore();
  }

  initializeApp({
    credential: applicationDefault(),
  });
  return getFirestore();
}

const seedListings: ListingSeed[] = [
  {
    listing_id: 'canada_post_mailer_surplus',
    owner_name: 'Canada Post',
    title: 'Surplus corrugated mailers available for reuse',
    short_description: 'Canada Post has excess unused corrugated mailers and padded envelopes available for nonprofits, reuse programs, or small shippers.',
    full_description: 'Canada Post is looking for organizations that can take a bulk lot of unused corrugated mailers, flat pack shipping sleeves, and padded envelopes left over from a packaging refresh. The materials are clean, unused, and suitable for redistribution, donation, or direct reuse by small e-commerce sellers and community organizations.',
    listing_type: 'offer',
    category: 'packaging',
    material_or_need: 'corrugated mailers and padded envelopes',
    quantity_estimate: '8 pallets',
    condition: 'unused',
    desired_partner_types: ['nonprofits', 'small businesses', 'shipping programs'],
    location_hint: 'Greater Toronto Area',
    urgency: 'medium',
    status: 'open',
    tags: ['packaging', 'reuse', 'surplus', 'shipping'],
  },
  {
    listing_id: 'cascades_offspec_fibre_rolls',
    owner_name: 'Cascades',
    title: 'Off-spec recycled fibre rolls for secondary use',
    short_description: 'Cascades is offering off-spec but usable recycled fibre rolls for prototyping, protective packaging, and educational use.',
    full_description: 'Cascades has a batch of off-spec recycled fibre rolls that do not meet a primary customer specification but remain usable for lower-grade packaging, protective wraps, product prototyping, art fabrication, and classroom projects. The company is looking for manufacturers, social enterprises, and institutions that can divert the material from disposal.',
    listing_type: 'offer',
    category: 'paper_and_fibre',
    material_or_need: 'off-spec recycled fibre rolls',
    quantity_estimate: '5 large rolls',
    condition: 'usable with cosmetic/spec variation',
    desired_partner_types: ['manufacturers', 'schools', 'social enterprises'],
    location_hint: 'Ontario / Quebec',
    urgency: 'medium',
    status: 'open',
    tags: ['paper', 'fibre', 'manufacturing', 'diversion'],
  },
  {
    listing_id: 'chep_pallet_redeployment',
    owner_name: 'CHEP',
    title: 'Seasonal pallet surplus needs temporary redeployment partners',
    short_description: 'CHEP is looking for warehouses and distribution partners that can absorb a temporary surplus of reusable pallets.',
    full_description: 'CHEP has a seasonal imbalance in reusable pallet inventory and is seeking logistics, warehousing, and manufacturing partners that can temporarily absorb and recirculate pallet stock rather than leave assets idle. This is intended as a short-term circular asset utilization opportunity.',
    listing_type: 'exchange',
    category: 'logistics_assets',
    material_or_need: 'reusable pallets',
    quantity_estimate: '300 pallets',
    condition: 'ready for circulation',
    desired_partner_types: ['warehouses', 'manufacturers', 'distributors'],
    location_hint: 'Southern Ontario',
    urgency: 'high',
    status: 'open',
    tags: ['pallets', 'reuse', 'logistics', 'asset utilization'],
  },
  {
    listing_id: 'circular_materials_bin_pilot',
    owner_name: 'Circular Materials',
    title: 'Seeking pilot sites for standardized collection bins',
    short_description: 'Circular Materials wants municipalities or property managers to test standardized recycling collection bins in multi-residential settings.',
    full_description: 'Circular Materials is looking for municipalities, building operators, and campus properties willing to run a pilot for standardized collection bins in apartment and condo environments. The goal is to test contamination reduction, resident communication, and better material capture in a real operating environment.',
    listing_type: 'pilot',
    category: 'collection_systems',
    material_or_need: 'pilot locations for collection infrastructure',
    quantity_estimate: '10 to 20 pilot sites',
    condition: 'new pilot program',
    desired_partner_types: ['municipalities', 'property managers', 'campuses'],
    location_hint: 'Canada-wide',
    urgency: 'medium',
    status: 'open',
    tags: ['recycling', 'pilot', 'collection', 'multi-residential'],
  },
  {
    listing_id: 'friendlier_restaurant_expansion',
    owner_name: 'Friendlier',
    title: 'Need food-service partners for reusable container rollout',
    short_description: 'Friendlier is recruiting cafes, food halls, and institutional dining operators to adopt reusable takeout containers.',
    full_description: 'Friendlier is expanding a reusable takeout container program and is seeking restaurants, cafeterias, event venues, and institutional dining operators that want to replace single-use packaging. Ideal partners can support container returns on-site or through a nearby network.',
    listing_type: 'request',
    category: 'reusables',
    material_or_need: 'food-service adoption partners',
    quantity_estimate: '15 partner locations',
    condition: 'launch-ready program',
    desired_partner_types: ['restaurants', 'cafeterias', 'venues'],
    location_hint: 'Toronto and nearby campuses',
    urgency: 'high',
    status: 'open',
    tags: ['reusables', 'food service', 'takeout', 'waste reduction'],
  },
  {
    listing_id: 'general_mills_display_materials',
    owner_name: 'General Mills',
    title: 'Excess display-ready packaging materials available',
    short_description: 'General Mills has overrun corrugated display trays and branded secondary packaging available for reuse or repurposing.',
    full_description: 'General Mills is looking for reuse and recovery partners that can take overrun corrugated display trays, product-ready secondary packaging, and clean food-safe transit materials generated during a merchandising changeover. The company prefers partners that can reuse the materials directly or repurpose them into new packaging streams.',
    listing_type: 'offer',
    category: 'packaging',
    material_or_need: 'corrugated display trays and secondary packaging',
    quantity_estimate: '12 pallets',
    condition: 'clean surplus',
    desired_partner_types: ['packaging reusers', 'food banks', 'manufacturers'],
    location_hint: 'Greater Toronto Area',
    urgency: 'medium',
    status: 'open',
    tags: ['packaging', 'food supply chain', 'surplus', 'reuse'],
  },
  {
    listing_id: 'gfl_rigid_plastics_outlet',
    owner_name: 'GFL Environmental',
    title: 'Looking for end markets for clean rigid plastics',
    short_description: 'GFL Environmental is seeking processors or manufacturers that can take sorted rigid plastic streams for higher-value reuse.',
    full_description: 'GFL Environmental has a recurring volume of sorted rigid plastics that could be directed into a stronger circular pathway if a dependable downstream processor or manufacturer is available. The company is interested in long-term offtake relationships focused on reuse, pelletization, or closed-loop manufacturing.',
    listing_type: 'request',
    category: 'plastics',
    material_or_need: 'sorted rigid plastic streams',
    quantity_estimate: '2 to 4 truckloads per month',
    condition: 'sorted / baled',
    desired_partner_types: ['recyclers', 'compounders', 'manufacturers'],
    location_hint: 'Ontario',
    urgency: 'high',
    status: 'open',
    tags: ['plastics', 'recycling', 'offtake', 'closed loop'],
  },
  {
    listing_id: 'emterra_mixed_plastics_trial',
    owner_name: 'Emterra Group',
    title: 'Seeking pilot partners for harder-to-recycle plastics',
    short_description: 'Emterra Group is testing new pathways for mixed plastics and needs technology or manufacturing partners.',
    full_description: 'Emterra Group is looking for pilot partners that can process mixed plastics currently assigned to lower-value recovery routes. The focus is on practical diversion opportunities, including specialty recycling, product redesign inputs, and manufacturing trials that can absorb a consistent feedstock.',
    listing_type: 'pilot',
    category: 'plastics',
    material_or_need: 'mixed plastic feedstock',
    quantity_estimate: '1 pilot stream',
    condition: 'post-consumer, sorted to pilot spec',
    desired_partner_types: ['technology providers', 'manufacturers', 'recyclers'],
    location_hint: 'Canada-wide',
    urgency: 'medium',
    status: 'open',
    tags: ['plastics', 'pilot', 'innovation', 'diversion'],
  },
  {
    listing_id: 'goodwill_textile_upcycling',
    owner_name: 'Goodwill Industries',
    title: 'Need textile upcycling partners for unsellable apparel',
    short_description: 'Goodwill Industries is seeking makers, repair programs, and textile recyclers for damaged clothing that cannot be sold in-store.',
    full_description: 'Goodwill Industries has a recurring volume of unsellable but still useful textiles, including damaged clothing, linens, and fabric remnants. The organization is looking for partners that can repair, upcycle, or recycle these materials into new products, insulation, rags, or other secondary uses.',
    listing_type: 'request',
    category: 'textiles',
    material_or_need: 'damaged clothing and linens',
    quantity_estimate: '500 kg per month',
    condition: 'mixed quality',
    desired_partner_types: ['textile recyclers', 'makers', 'social enterprises'],
    location_hint: 'Ontario',
    urgency: 'medium',
    status: 'open',
    tags: ['textiles', 'upcycling', 'repair', 'social impact'],
  },
  {
    listing_id: 'united_health_network_linen_reuse',
    owner_name: 'United Health Network',
    title: 'Seeking reuse channel for surplus hospital linens',
    short_description: 'United Health Network wants a compliant reuse or donation pathway for retired but serviceable linens and blankets.',
    full_description: 'United Health Network is looking for vetted partners that can responsibly reuse, redistribute, or transform retired but serviceable linens, blankets, and non-clinical textile stock generated through hospital inventory rotation. Preference goes to organizations with clear sanitation, sorting, and redistribution protocols.',
    listing_type: 'request',
    category: 'healthcare_textiles',
    material_or_need: 'surplus linens and blankets',
    quantity_estimate: 'monthly recurring batches',
    condition: 'serviceable after standard processing',
    desired_partner_types: ['charities', 'textile processors', 'social service organizations'],
    location_hint: 'Toronto',
    urgency: 'high',
    status: 'open',
    tags: ['healthcare', 'linens', 'donation', 'reuse'],
  },
  {
    listing_id: 'york_university_lab_furniture',
    owner_name: 'York University',
    title: 'Lab and office furniture available from renovation turnover',
    short_description: 'York University has desks, shelving, chairs, and select lab benches available for reuse before disposal.',
    full_description: 'York University is clearing a set of furniture and fixtures during a renovation and is prioritizing reuse over disposal. Available items include desks, shelving, task chairs, storage cabinets, and some non-specialized lab benches. The university is seeking schools, nonprofits, startups, and community organizations that can collect and reuse the items quickly.',
    listing_type: 'offer',
    category: 'furniture_and_fixtures',
    material_or_need: 'office and light lab furniture',
    quantity_estimate: '40+ items',
    condition: 'used but functional',
    desired_partner_types: ['schools', 'nonprofits', 'startups'],
    location_hint: 'Toronto',
    urgency: 'high',
    status: 'open',
    tags: ['furniture', 'campus', 'reuse', 'renovation'],
  },
  {
    listing_id: 'ottawa_university_device_reuse',
    owner_name: 'Ottawa University',
    title: 'Seeking refurbishers for retired student-facing devices',
    short_description: 'Ottawa University is looking for certified partners to refurbish laptops and peripherals from a refresh cycle.',
    full_description: 'Ottawa University has a batch of retired laptops, keyboards, mice, and monitors from a scheduled device refresh. The institution wants to extend asset life through refurbishment, redeployment, or community donation rather than standard recycling, and is seeking partners with secure data handling procedures.',
    listing_type: 'request',
    category: 'electronics',
    material_or_need: 'retired laptops and peripherals',
    quantity_estimate: '75 devices plus accessories',
    condition: 'mixed; many functional',
    desired_partner_types: ['refurbishers', 'charities', 'IT asset recovery firms'],
    location_hint: 'Ottawa',
    urgency: 'medium',
    status: 'open',
    tags: ['electronics', 'refurbishment', 'campus', 'reuse'],
  },
  {
    listing_id: 'exhibition_place_event_material_reuse',
    owner_name: 'Exhibition Place',
    title: 'Event signage and build materials available after major shows',
    short_description: 'Exhibition Place is offering reusable signage, temporary barriers, and event build materials after large events.',
    full_description: 'Exhibition Place is seeking reuse organizations, makerspaces, and community groups that can take post-event signage, temporary barriers, modular display components, and lightly used event materials generated after major shows. The aim is to divert clean materials into local reuse channels instead of disposal.',
    listing_type: 'offer',
    category: 'event_materials',
    material_or_need: 'signage and temporary event materials',
    quantity_estimate: 'event-dependent batches',
    condition: 'used, often reusable as-is',
    desired_partner_types: ['makerspaces', 'artists', 'nonprofits'],
    location_hint: 'Toronto',
    urgency: 'medium',
    status: 'open',
    tags: ['events', 'reuse', 'signage', 'materials recovery'],
  },
  {
    listing_id: 'busch_systems_bin_refurbish_program',
    owner_name: 'Busch Systems',
    title: 'Need pilot customers for recycling bin refurbishment',
    short_description: 'Busch Systems is looking for customers to trial a refurbishment and redeployment program for used bins.',
    full_description: 'Busch Systems is launching a refurbishment track for used collection bins and is looking for municipalities, campuses, and commercial properties that want to test repaired and redeployed units. The pilot is designed to extend bin lifespan, reduce virgin material demand, and validate logistics for take-back and refurbishment.',
    listing_type: 'pilot',
    category: 'refurbishment',
    material_or_need: 'pilot customers for refurbished bins',
    quantity_estimate: 'up to 250 bins',
    condition: 'refurbished',
    desired_partner_types: ['municipalities', 'campuses', 'commercial properties'],
    location_hint: 'Ontario',
    urgency: 'medium',
    status: 'open',
    tags: ['bins', 'refurbishment', 'pilot', 'take-back'],
  },
  {
    listing_id: 'efs_plastics_offcolor_pellets',
    owner_name: 'EFS Plastics',
    title: 'Off-colour recycled resin available for non-aesthetic products',
    short_description: 'EFS Plastics has off-colour PCR pellets suitable for black or hidden-component applications.',
    full_description: 'EFS Plastics is offering off-colour post-consumer recycled pellets that do not fit colour-sensitive production runs but remain suitable for products where appearance is secondary. The company is looking for manufacturers able to incorporate these pellets into black products, hidden components, or tolerance-friendly industrial applications.',
    listing_type: 'offer',
    category: 'plastics',
    material_or_need: 'off-colour PCR pellets',
    quantity_estimate: '10 supersacks',
    condition: 'spec-compliant except colour',
    desired_partner_types: ['manufacturers', 'compounders', 'moulders'],
    location_hint: 'Ontario',
    urgency: 'medium',
    status: 'open',
    tags: ['PCR', 'plastics', 'resin', 'manufacturing'],
  },
  {
    listing_id: 'electronics_recycling_services_refurb',
    owner_name: 'Electronics Recycling Services',
    title: 'Seeking refurbishers for reusable display equipment',
    short_description: 'Electronics Recycling Services wants partners that can refurbish functional monitors and peripherals before material recovery.',
    full_description: 'Electronics Recycling Services has incoming electronics streams that include a meaningful number of still-functional monitors, docking stations, and peripherals. The organization is seeking refurbishment partners that can test, redeploy, or donate usable units before the remainder enters downstream recycling.',
    listing_type: 'request',
    category: 'electronics',
    material_or_need: 'functional monitors and peripherals',
    quantity_estimate: '100+ units per quarter',
    condition: 'mixed; screened for reusable units',
    desired_partner_types: ['refurbishers', 'nonprofits', 'IT asset recovery firms'],
    location_hint: 'Canada-wide',
    urgency: 'medium',
    status: 'open',
    tags: ['electronics', 'refurbishment', 'reuse', 'IT'],
  },
  {
    listing_id: 'canadian_coalition_green_health_reusable_gowns',
    owner_name: 'Canadian Coalition for Green Health Care',
    title: 'Need suppliers and pilot hospitals for reusable textiles',
    short_description: 'The coalition is looking for partners to pilot reusable clinical textile systems such as gowns and linen alternatives.',
    full_description: 'Canadian Coalition for Green Health Care is seeking healthcare sites, laundry partners, and suppliers interested in piloting reusable clinical textile systems that reduce single-use waste. The current focus is on practical deployment models, logistics, cleaning capacity, and measurable waste reduction outcomes.',
    listing_type: 'pilot',
    category: 'healthcare_reusables',
    material_or_need: 'pilot partners for reusable textile systems',
    quantity_estimate: '3 to 5 pilot sites',
    condition: 'planning phase',
    desired_partner_types: ['hospitals', 'laundry providers', 'suppliers'],
    location_hint: 'Canada-wide',
    urgency: 'medium',
    status: 'open',
    tags: ['healthcare', 'reusables', 'textiles', 'pilot'],
  },
  {
    listing_id: 'city_of_montreal_furniture_reuse',
    owner_name: 'City of Montreal',
    title: 'Municipal office furniture available for community reuse',
    short_description: 'City of Montreal has surplus desks, filing cabinets, and chairs available before auction or disposal.',
    full_description: 'City of Montreal is offering surplus municipal office furniture generated through a workplace consolidation effort. The city is prioritizing reuse by schools, nonprofits, and community-serving organizations before conventional resale or disposal channels are used.',
    listing_type: 'offer',
    category: 'furniture_and_fixtures',
    material_or_need: 'surplus desks, cabinets, and chairs',
    quantity_estimate: '60 items',
    condition: 'used but serviceable',
    desired_partner_types: ['schools', 'nonprofits', 'community organizations'],
    location_hint: 'Montreal',
    urgency: 'medium',
    status: 'open',
    tags: ['municipal', 'furniture', 'reuse', 'community'],
  },
  {
    listing_id: 'envirocentre_bike_parts_diversion',
    owner_name: 'EnviroCentre',
    title: 'Need repair and training partners for donated bike parts',
    short_description: 'EnviroCentre is looking for bike shops and community programs that can reuse donated parts and frames.',
    full_description: 'EnviroCentre has access to donated bike parts, components, and frames that can be used in repair programming, skills training, and low-cost mobility initiatives. The organization is seeking bike shops, social enterprises, and community groups that can use the parts for direct repair or educational programming.',
    listing_type: 'request',
    category: 'mobility_and_repair',
    material_or_need: 'bike parts and frames',
    quantity_estimate: 'ongoing small batches',
    condition: 'mixed; repairable',
    desired_partner_types: ['bike shops', 'social enterprises', 'community programs'],
    location_hint: 'Ottawa',
    urgency: 'low',
    status: 'open',
    tags: ['repair', 'bikes', 'mobility', 'community'],
  },
  {
    listing_id: 'queen_s_university_dorm_reuse',
    owner_name: "Queen's University",
    title: 'Dorm move-out program needs local reuse partners',
    short_description: 'Queen’s University is seeking charities and reuse groups to collect bedding, small appliances, and household items during move-out.',
    full_description: 'Queen\'s University is organizing a move-out diversion program and is looking for local partners that can collect and redistribute bedding, mini-fridges, fans, lamps, unopened supplies, and other recoverable household goods from student residences. The goal is to keep usable items in circulation and reduce end-of-term waste.',
    listing_type: 'request',
    category: 'campus_reuse',
    material_or_need: 'move-out household goods',
    quantity_estimate: 'seasonal, high volume',
    condition: 'mixed; mostly usable',
    desired_partner_types: ['charities', 'reuse stores', 'student groups'],
    location_hint: 'Kingston',
    urgency: 'high',
    status: 'open',
    tags: ['campus', 'move-out', 'reuse', 'donation'],
  },
  {
    listing_id: 'circular_partners_transport_packaging',
    owner_name: 'Circular Partners',
    title: 'Seeking partners for reusable transport packaging pilot',
    short_description: 'Circular Partners is recruiting shippers and distributors to test a reusable transport packaging loop.',
    full_description: 'Circular Partners is developing a reusable transport packaging loop and wants to work with brands, warehouses, and logistics operators that can participate in a structured pilot. The project is focused on return logistics, loss control, asset tracking, and measurable packaging waste reduction.',
    listing_type: 'pilot',
    category: 'transport_packaging',
    material_or_need: 'pilot participants for reusable logistics packaging',
    quantity_estimate: '5 to 8 partners',
    condition: 'pilot-ready',
    desired_partner_types: ['brands', 'warehouses', 'logistics providers'],
    location_hint: 'Canada-wide',
    urgency: 'medium',
    status: 'open',
    tags: ['packaging', 'logistics', 'pilot', 'reuse'],
  },
];

function buildListingDocs(memberNames: Set<string>): ListingDoc[] {
  return seedListings.map((listing) => {
    const owner_normalized_name = normalizeName(listing.owner_name);
    return {
      ...listing,
      owner_normalized_name,
      owner_exists_in_members: memberNames.has(owner_normalized_name),
    };
  });
}

async function writeListings(db: Firestore, listings: ListingDoc[]) {
  const collection = db.collection('listings');

  for (let i = 0; i < listings.length; i += 100) {
    const chunk = listings.slice(i, i + 100);
    const existing = await Promise.all(
      chunk.map((listing) => collection.doc(listing.listing_id).get())
    );

    const batch = db.batch();

    for (let j = 0; j < chunk.length; j++) {
      const listing = chunk[j];
      const snap = existing[j];
      const ref = collection.doc(listing.listing_id);

      if (snap.exists) {
        batch.set(
          ref,
          {
            ...listing,
            updated_at: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        batch.set(ref, {
          ...listing,
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
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

  const db = initializeFirestore();
  const membersSnap = await db.collection('circular_members').get();
  const memberNames = new Set(membersSnap.docs.map((doc) => doc.id));

  let listings = buildListingDocs(memberNames);
  if (limit && Number.isFinite(limit)) {
    listings = listings.slice(0, limit);
  }

  const missingOwners = listings.filter((listing) => !listing.owner_exists_in_members);

  if (!shouldWrite) {
    console.log(JSON.stringify({
      total_seed_listings: listings.length,
      listings,
      missing_owner_matches: missingOwners.map((l) => ({
        listing_id: l.listing_id,
        owner_name: l.owner_name,
        owner_normalized_name: l.owner_normalized_name,
      })),
    }, null, 2));
    return;
  }

  await writeListings(db, listings);

  console.log(`Wrote ${listings.length} listing(s) to Firestore collection \"listings\".`);
  if (missingOwners.length > 0) {
    console.log('Listings with no matching circular_members doc ID:');
    for (const item of missingOwners) {
      console.log(`- ${item.owner_name} (${item.owner_normalized_name})`);
    }
  }
}

main().catch((error) => {
  console.error('Listing seed failed:', error);
  process.exit(1);
});
