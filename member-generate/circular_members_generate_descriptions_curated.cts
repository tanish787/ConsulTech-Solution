import { readFileSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

interface CircularMemberDoc {
  company_name?: string;
  normalized_name?: string;
  member_category?: string;
  description?: string | null;
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    shouldWrite: args.includes('--write'),
    force: args.includes('--force'),
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

const DESCRIPTION_OVERRIDES: Record<string, string> = {
  '10c': '10C is a community-focused social enterprise hub that supports local collaboration, entrepreneurship, and practical sustainability-minded initiatives.',
  'abcrc': 'ABCRC is a beverage-container recovery organization focused on collection systems, recycling performance, and stronger circular outcomes for packaged drinks.',
  'aet': 'AET is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'aham': 'AHAM is an appliance-industry association whose work relates to product stewardship, standards, and longer-life consumer goods systems.',
  'bag_to_earth': 'Bag to Earth develops packaging or material solutions aligned with composting and lower-waste product systems.',
  'bgis': 'BGIS is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'bluewater_recycling_assoc': 'Bluewater Recycling Assoc is a regional public-sector recycling partnership focused on diversion systems and shared resource-management services.',
  'boma': 'BOMA is a commercial real-estate association supporting building operations, property management, and more resource-efficient facilities.',
  'bowen_island': 'Bowen Island is a local municipality where community-scale services and stewardship efforts can support practical circular initiatives.',
  'brantford': 'Brantford is a municipal government where local procurement, waste services, and public operations create direct opportunities for circular implementation.',
  'brockville': 'Brockville is a municipal government where local procurement, waste services, and public operations create direct opportunities for circular implementation.',
  'brookstone_strategy_group': 'Brookstone Strategy Group acts as an operational or strategic partner helping organizations improve waste, materials, or procurement practices.',
  'busch_systems': 'Busch Systems is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'byward_market_district_authority': 'ByWard Market District Authority supports a major public-market district where local commerce, placemaking, and operational sustainability intersect.',
  'canada_plastics_pact': 'Canada Plastics Pact is a cross-sector initiative focused on reducing plastic waste through redesign, reuse, recyclability, and system-level collaboration.',
  'canada_post': 'Canada Post is a national logistics network whose packaging, transport, and return flows matter for circular operations.',
  'canadian_coalition_for_green_health_care': 'Canadian Coalition for Green Health Care brings together healthcare stakeholders working to reduce waste and improve sustainability across the health sector.',
  'cari': 'CARI is an industry association tied to recycling and resource recovery, helping connect stakeholders around circular materials and market development.',
  'carton_council_of_canada': 'Carton Council of Canada works to improve carton collection, recycling access, and public awareness around carton recovery systems.',
  'cascades': 'Cascades is linked to paper, packaging, or materials systems where recycled content and recovery matter.',
  'cathys_crawly_composters': 'Cathy\'s Crawly Composters promotes organics diversion and composting-focused solutions that turn food and yard waste into useful soil inputs.',
  'cba': 'CBA is a beverage-sector association with a clear stake in packaging systems, product stewardship, and circular supply-chain practices.',
  'cd_sonter': 'CD Sonter is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'chep': 'CHEP operates in logistics, packaging movement, or shared-use systems where return flows and material efficiency matter.',
  'cial_group': 'CIAL Group contributes advisory, standards, or assessment-oriented expertise that can support stronger environmental and operational performance.',
  'circular_materials': 'Circular Materials is a producer-responsibility organization focused on collection, recycling, and packaging material recovery at scale.',
  'circular_partners': 'Circular Partners works as a strategic partner helping organizations move toward more circular systems.',
  'circulr': 'Circulr is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'city_of_greater_sudbury': 'City of Greater Sudbury is a municipal government responsible for local services and infrastructure, making it a practical venue for circular programs in Greater Sudbury.',
  'city_of_montreal': 'City of Montreal is a municipal government responsible for local services and infrastructure, making it a practical venue for circular programs in Montreal.',
  'city_of_st_johns': 'City of St. John\'s is a municipal government responsible for local services and infrastructure, making it a practical venue for circular programs in St. John\'s.',
  'clean_foundation': 'Clean Foundation is an environmental non-profit that delivers programs supporting sustainability, waste reduction, and community action.',
  'climate_wise': 'Climate Wise is a community sustainability organization centered on practical action, education, and lower-impact local living.',
  'colour_alchemist': 'Colour Alchemist is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'com2_recycling_solutions': 'COM2 Recycling Solutions focuses on collection, processing, or recovery systems that keep materials in circulation.',
  'compost_council_of_canada': 'Compost Council of Canada advances composting, organics diversion, and soil-building practices as part of more circular material systems.',
  'cornwall': 'Cornwall is a municipal government where local procurement, waste services, and public operations create direct opportunities for circular implementation.',
  'cpche': 'CPCHE is an environmental-health organization focused on safer environments for children and more thoughtful material decisions.',
  'creative_polymer_solutions': 'Creative Polymer Solutions focuses on polymer or materials innovation aimed at improving reuse, recycled content, or circular product design.',
  'csa': 'CSA is a standards-focused organization whose work can shape consistent, scalable, and safer product and system practices.',
  'csi': 'CSI is an innovation hub that supports social enterprise, entrepreneurship, and mission-driven collaboration across sectors.',
  'cwma': 'CWMA is a waste-management association that supports sector learning, operational best practices, and collaboration on resource recovery.',
  'definity_financial_corporation': 'Definity Financial Corporation is a financial-services company whose operations, procurement, and business policies can support lower-waste practices.',
  'dispersa': 'Dispersa is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'dufferin': 'Dufferin is a regional or county-level government participant involved in public services, infrastructure, and material-management decisions at scale.',
  'durham': 'Durham is a regional or county-level government participant involved in public services, infrastructure, and material-management decisions at scale.',
  'earth_day': 'Earth Day is an environmental engagement organization that helps connect public education, campaigns, and practical sustainability action.',
  'earthub': 'Earthub is a sustainability-focused platform or initiative that helps connect people and organizations around practical circular action.',
  'eccc': 'ECCC is a federal environmental department that shapes policy, regulation, and national direction on sustainability-related issues.',
  'eco_caledon': 'Eco Caledon is a local environmental group that promotes community education, stewardship, and lower-waste living.',
  'eco_growth_solutions': 'Eco-Growth Solutions provides solutions-oriented support for waste, materials, or operational improvement.',
  'eco_safe': 'Eco-Safe is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'ecocup_by_re_uz': 'Ecocup by RE-UZ is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'ecomaterials_inc': 'Ecomaterials Inc. works with materials recovery, processing, or feedstocks that help keep resources in use longer.',
  'edmonton': 'Edmonton is a municipal government where local procurement, waste services, and public operations create direct opportunities for circular implementation.',
  'eeq': 'EEQ is a producer-responsibility organization focused on recovery systems and more circular management of packaging and related materials.',
  'efs_plastics': 'EFS Plastics works in plastics recovery, recycled polymers, or material transformation that supports more circular manufacturing.',
  'elastochem': 'ElastoChem is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'electronics_recycling_services': 'Electronics Recycling Services focuses on collection, processing, or recovery systems that keep materials in circulation.',
  'eligant_group_inc': 'Eligant Group Inc acts as an operational or strategic partner helping organizations improve waste, materials, or procurement practices.',
  'ellen_macarthur_foundation': 'Ellen MacArthur Foundation is a leading circular-economy foundation known for advancing frameworks, research, and business adoption.',
  'emterra_group': 'Emterra Group acts as an operational or strategic partner helping organizations improve waste, materials, or procurement practices.',
  'envirocentre': 'EnviroCentre delivers community sustainability programs that connect environmental action with practical local change.',
  'envirotech': 'Envirotech operates in environmental services or environmental solutions connected to diversion and resource efficiency.',
  'equiterre': 'Equiterre is an environmental organization that promotes practical low-impact choices and broader systemic sustainability change.',
  'etch_sourcing': 'ETCH Sourcing supports sourcing and procurement decisions that can influence material efficiency and reuse.',
  'ets': 'ETS is a technical university that contributes applied research, engineering talent, and campus-scale operational learning relevant to circular systems.',
  'ewswa': 'EWSWA is a regional waste authority focused on shared solid-waste services, diversion systems, and resource-management infrastructure.',
  'exhibition_place': 'Exhibition Place is a large public event campus where procurement, waste operations, and reuse systems matter at institutional scale.',
  'friendlier': 'Friendlier is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'fullstep_consulting': 'Fullstep Consulting provides advisory support that can help organizations redesign operations around circular goals.',
  'gananoque': 'Gananoque is a municipal government where local procurement, waste services, and public operations create direct opportunities for circular implementation.',
  'general_mills': 'General Mills is a major consumer-goods company with strong relevance to packaging, supply chains, and materials stewardship.',
  'gfl': 'GFL is involved in large-scale waste, environmental, or recovery operations where diversion and materials management are central.',
  'gfm': 'GFM is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'global_electronics_council': 'Global Electronics Council supports more sustainable electronics through standards, procurement tools, and product-performance leadership.',
  'goodwill_industries': 'Goodwill Industries extends product life through donation and resale while pairing reuse with employment and community services.',
  'guelph': 'Guelph is a municipal government where local procurement, waste services, and public operations create direct opportunities for circular implementation.',
  'haldimand': 'Haldimand is a regional or county-level government participant involved in public services, infrastructure, and material-management decisions at scale.',
  'halton': 'Halton is a regional or county-level government participant involved in public services, infrastructure, and material-management decisions at scale.',
  'hp': 'HP is a major technology company with strong relevance to electronics stewardship, procurement, and product life extension.',
  'hsr_zero_waste': 'HSR Zero Waste works on waste reduction, diversion, or material recovery as a practical part of circular operations.',
  'innovate_waste_solutions_corp': 'Innovate Waste Solutions Corp works on waste reduction, diversion, or material recovery as a practical part of circular operations.',
  'kaltire': 'KalTire is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'kelleher_environmental': 'Kelleher Environmental operates in environmental services or environmental solutions connected to diversion and resource efficiency.',
  'keurig_drpepper_canada': 'Keurig DrPepper Canada is a beverage company whose packaging, containers, and recovery systems are directly tied to circular performance.',
  'kingston': 'Kingston is a municipal government where local procurement, waste services, and public operations create direct opportunities for circular implementation.',
  'lark_scientific': 'Lark Scientific contributes technology, product, or systems innovation that can help organizations improve circular performance.',
  'leap_green_polymers': 'Leap Green Polymers focuses on polymer or materials innovation aimed at improving reuse, recycled content, or circular product design.',
  'lend_it_ca': 'LEND-IT.ca operates in logistics, packaging movement, or shared-use systems where return flows and material efficiency matter.',
  'loblaw_companies_limited': 'Loblaw Companies Limited is a major food and consumer-goods retailer whose procurement and packaging choices shape large material flows.',
  'london': 'London is a municipal government where local procurement, waste services, and public operations create direct opportunities for circular implementation.',
  'market_waste_solutions': 'Market Waste Solutions works on waste reduction, diversion, or material recovery as a practical part of circular operations.',
  'mcc': 'MCC is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'mcdonalds_canada': 'McDonalds Canada is a large food-service brand where packaging design, reuse models, and waste reduction are central operational issues.',
  'metro': 'Metro is a large grocery operator whose packaging, food systems, and store operations matter to circular outcomes.',
  'miller_waste_systems': 'Miller Waste Systems works on waste reduction, diversion, or material recovery as a practical part of circular operations.',
  'mj_waste_solutions': 'MJ Waste Solutions works on waste reduction, diversion, or material recovery as a practical part of circular operations.',
  'motioneer': 'Motioneer contributes technology, product, or systems innovation that can help organizations improve circular performance.',
  'nespresso_canada': 'Nespresso Canada is a consumer coffee brand with clear relevance to packaging, take-back systems, and product stewardship.',
  'netherlands_government': 'Netherlands Government represents a national public-sector participant with policy experience relevant to circular-economy strategy and systems change.',
  'newmarket': 'Newmarket is a municipal government where local procurement, waste services, and public operations create direct opportunities for circular implementation.',
  'niagara': 'Niagara is a regional or county-level government participant involved in public services, infrastructure, and material-management decisions at scale.',
  'norfolk': 'Norfolk is a regional or county-level government participant involved in public services, infrastructure, and material-management decisions at scale.',
  'orillia': 'Orillia is a municipal government where local procurement, waste services, and public operations create direct opportunities for circular implementation.',
  'ottawa': 'Ottawa is a municipal government where local procurement, waste services, and public operations create direct opportunities for circular implementation.',
  'ottawa_university': 'Ottawa University is a major academic institution that can contribute research, procurement leadership, and campus sustainability practice.',
  'peel': 'Peel is a regional or county-level government participant involved in public services, infrastructure, and material-management decisions at scale.',
  'pickering': 'Pickering is a municipal government where local procurement, waste services, and public operations create direct opportunities for circular implementation.',
  'plaex': 'PLAEX is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'policy_integrity_consulting': 'Policy Integrity Consulting provides advisory support that can help organizations redesign operations around circular goals.',
  'post_plastics': 'Post Plastics works in plastics recovery, recycled polymers, or material transformation that supports more circular manufacturing.',
  'pragma_tech_waste_solutions': 'Pragma Tech Waste Solutions works on waste reduction, diversion, or material recovery as a practical part of circular operations.',
  'provectus': 'Provectus contributes technology, product, or systems innovation that can help organizations improve circular performance.',
  'purolator': 'Purolator is a large logistics provider whose packaging, delivery, and reverse-logistics systems connect directly to circularity.',
  'quantum_lifecycle': 'Quantum Lifecycle is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'queens_university': 'Queen\'s University contributes research capacity, institutional operations, and student engagement relevant to circular-economy initiatives.',
  'raw_materials_company_inc': 'Raw Materials Company Inc works with materials recovery, processing, or feedstocks that help keep resources in use longer.',
  'recanex': 'Recanex is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'reclay_stewardedge': 'Reclay StewardEdge is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'refresco': 'Refresco is a beverage manufacturing company with strong relevance to packaging, containers, and material recovery systems.',
  'remm_group': 'ReMM Group acts as an operational or strategic partner helping organizations improve waste, materials, or procurement practices.',
  'resource_recycling': 'Resource Recycling focuses on collection, processing, or recovery systems that keep materials in circulation.',
  'reusables': 'Reusables is tied to reusable systems and business models that reduce single-use waste.',
  'revolusation': 'Revolusation is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'rfcl_innovations_inc': 'RFCL Innovations Inc contributes technology, product, or systems innovation that can help organizations improve circular performance.',
  'richmond': 'Richmond is a municipal government where local procurement, waste services, and public operations create direct opportunities for circular implementation.',
  'riocan_reit': 'RioCan REIT is a large real-estate operator where buildings, tenant services, and property operations shape resource use.',
  'rlg': 'RLG is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'robust_recycling': 'Robust Recycling focuses on collection, processing, or recovery systems that keep materials in circulation.',
  'second_wind_recycling': 'Second Wind Recycling focuses on collection, processing, or recovery systems that keep materials in circulation.',
  'smart_recycle_consulting': 'Smart Recycle Consulting focuses on collection, processing, or recovery systems that keep materials in circulation.',
  'sobeys': 'Sobeys is a major grocery retailer with direct influence over packaging, food waste, and supply-chain decisions.',
  'strathcona': 'Strathcona is a regional or county-level government participant involved in public services, infrastructure, and material-management decisions at scale.',
  'suppli': 'Suppli contributes technology, product, or systems innovation that can help organizations improve circular performance.',
  'sussex': 'Sussex is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'telus': 'Telus is a large telecommunications company whose devices, infrastructure, and procurement choices influence material use and recovery.',
  'the_beer_store': 'The Beer Store is a beverage-retail and container-return operator closely linked to reuse, deposit systems, and packaging recovery.',
  'the_box_of_life': 'The Box of Life is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'the_charity_hub': 'The Charity Hub supports collaboration or service delivery that helps connect organizations to circular opportunities.',
  'tomra': 'Tomra supports collection and return systems that improve recovery and circular material flows.',
  'toronto_hydro': 'Toronto Hydro is a major utility whose infrastructure, procurement, and operational materials can benefit from circular strategies.',
  'toronto_university': 'Toronto University is a large academic institution where research, procurement, and campus operations can support circular innovation.',
  'tricentris': 'Tricentris is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'united_health_network': 'United Health Network is a large health-system participant where procurement, packaging, and waste reduction matter across complex operations.',
  'vcycene_inc': 'VCycene Inc is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'viking_recycling': 'Viking Recycling focuses on collection, processing, or recovery systems that keep materials in circulation.',
  'vio_sustainability': 'Vio Sustainability is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'viridis_environmental_inc': 'Viridis Environmental Inc operates in environmental services or environmental solutions connected to diversion and resource efficiency.',
  'walker': 'Walker is involved in large-scale waste, environmental, or recovery operations where diversion and materials management are central.',
  'walker_environmental': 'Walker Environmental operates in environmental services or environmental solutions connected to diversion and resource efficiency.',
  'walmart': 'Walmart is a major retailer whose packaging, logistics, and supplier choices can influence circularity at scale.',
  'waste_reduction_group_inc': 'Waste Reduction Group Inc works on waste reduction, diversion, or material recovery as a practical part of circular operations.',
  'wasteco': 'WasteCo works on waste reduction, diversion, or material recovery as a practical part of circular operations.',
  'wilfrid_laurier_university': 'Wilfrid Laurier University can contribute research, education, and institutional operations that support more circular practices.',
  'working_knowledge_inc': 'Working Knowledge Inc is a business member whose operations connect to packaging, materials, procurement, or service models relevant to the circular economy.',
  'york_university': 'York University brings research, teaching, and large-scale campus operations into the broader circular-economy conversation.',
};

function fallbackDescription(doc: CircularMemberDoc): string {
  const name = (doc.company_name || doc.normalized_name || 'This organization').trim();
  const category = (doc.member_category || 'organization').replace(/_/g, ' ');
  return `${name} is a ${category} member participating in circular-economy work through its operations, partnerships, or public role.`;
}

function getDescription(doc: CircularMemberDoc, docId: string): string {
  const key = doc.normalized_name || (doc.company_name ? normalizeName(doc.company_name) : docId);
  return DESCRIPTION_OVERRIDES[key] || fallbackDescription(doc);
}

async function main() {
  const { shouldWrite, force, limit } = parseArgs();
  const db = initDb();
  const snapshot = await db.collection('circular_members').get();
  let docs = snapshot.docs;
  if (limit) docs = docs.slice(0, limit);
  let processed = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const snap of docs) {
    const data = snap.data() as CircularMemberDoc;
    if (!force && data.description && String(data.description).trim()) {
      skipped += 1;
      continue;
    }
    const description = getDescription(data, snap.id);
    console.log(`- ${data.company_name || snap.id}: ${description}`);
    processed += 1;
    if (!shouldWrite) continue;
    batch.set(
      snap.ref,
      { description, updated_at: FieldValue.serverTimestamp() },
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

  if (shouldWrite) {
    console.log(`\nUpdated ${processed} document(s) in circular_members.`);
  } else {
    console.log(`\nPreviewed ${processed} description(s).`);
  }
  if (skipped > 0) {
    console.log(`Skipped ${skipped} document(s) that already had a description.`);
  }
}

main().catch((error) => {
  console.error('Description generation failed:', error);
  process.exit(1);
});