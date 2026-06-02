/* DeepTechEval Commercialisation Intelligence Tool — static app */
(function () {
  'use strict';

  const TOTAL_PAGES = 11;
  const REPORT_PAGE = 10;
  const STORAGE_KEY = 'engsui.codex.v1';
  // Bump when DEMO_STARTUPS form data changes — triggers in-place resync of saved
  // demo records on next load so updated financials propagate without wiping user
  // edits to non-demo entries.
  const DEMO_DATA_VERSION = '2026-06-01.calibration-csv-sector-multiples';
  const DEMO_VERSION_KEY = 'engsui.codex.demoVersion';
  const LAST_EXPORT_KEY = 'engsui.codex.v1.lastExport';
  const EXPORT_SCHEMA_VERSION = '1.0';
  const REMINDER_AMBER_DAYS = 7;
  const REMINDER_RED_DAYS = 30;
  const SEED_FLAG = 'engsui.codex.seeded.v1';
  const UNDO_WINDOW_MS = 30 * 1000; // 30 seconds
  const TRASH_RETENTION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

  let currentPage = 0;
  let radarChart = null;
  let valChart = null;
  let savedStartups = [];
  let archivedStartups = [];
  let activeStartupId = null;
  let reportGenerationTimer = null;
  let hasGeneratedReport = false;
  let undoDeleteState = null;
  let undoDeleteTimer = null;
  let undoTickTimer = null;

  // Calibrated against Calibration Stage.csv (8 startups): bumps applied to ccus
  // (Alt Carbon Frontier-CDR premium → 12), nano (E-Spin DCF tighten → 9), and
  // wind (Powerzest pre-revenue terminal trim → 3). Other sectors retained — tight
  // variance in calibration set.
  const SECTOR_MULTIPLES = {
    hydrogen: 8, solar: 5, storage: 7, ccus: 12, biofuels: 5,
    iot: 10, wind: 3, nuclear: 12, nano: 9, w2e: 5,
    efficiency: 8, water: 6, biotech: 7, other: 6
  };
  const SECTOR_LABELS = {
    hydrogen: 'Green Hydrogen', solar: 'Solar / PV', storage: 'Energy Storage',
    ccus: 'CCUS', biofuels: 'Biofuels', iot: 'IIoT / Smart Grid',
    wind: 'Wind', nuclear: 'Nuclear / SMR', nano: 'Nanomaterials',
    w2e: 'Waste-to-Energy', efficiency: 'AI Energy Efficiency',
    water: 'Water Tech', biotech: 'Industrial Biotech', other: 'Other Deep-Tech'
  };

  // Demo startups seeded on first visit so users see the tool in action.
  // Each form object maps to the input IDs listed in FIELD_IDS.
  const DEMO_STARTUPS = [
    {
      name: 'GreenH2 Technologies',
      form: {
        'p-name': 'GreenH2 Technologies', 'p-yr': '2021',
        'p-desc': 'Solid-oxide electrolyser achieving 95% Faradaic efficiency for industrial-scale green hydrogen production.',
        'p-target': 'Refineries upgrading hydrogen production systems',
        'p-incubator': 'IIT Bombay SINE',
        'p-sec': 'hydrogen', 'p-stage': 'sa', 'p-hq': 'Bengaluru, Karnataka',
        'p-eval': 'the investor Strategy · Demo', 'p-founder-ask': '55', 'p-notes': 'Strong EPCM alignment; National Hydrogen Mission anchor candidate.',
        't-trl': '8', 't-pilot': '8', 't-iv': '1', 't-data': '5', 't-uniq': '5', 't-scale': '4', 't-mfg': '3', 't-rel': '4',
        't-benchmarks': 'Third-party benchmark (TÜV SÜD); 8,000 hr endurance test passed',
        'ip-status': '7', 'ip-breadth': '4', 'ip-quality': '4', 'ip-fto': '4', 'ip-pub': '4', 'ip-origin': '4', 'ip-sec': '4',
        'tm-exp': '5', 'tm-biz': '4', 'tm-net': '5', 'tm-comp': '4', 'tm-inst': '5', 'tm-div': '4', 'tm-adv': '4', 'tm-tr': '4', 'tm-ft': '3',
        'm-tam': '5', 'm-sam': '4', 'm-cagr': '45', 'm-disc': '4', 'm-loi': '4', 'm-paying': '1', 'm-uc': '5', 'm-comp': '4', 'm-pol': '5',
        'a-reg': '3', 'a-capex': '3', 'a-integ': '3', 'a-inc': '4', 'a-sc': '4', 'a-price': '3',
        'b-rm': '4', 'b-ue': '4', 'b-cas': '4', 'b-ops': '3', 'b-arr': '18', 'b-arr3': '120', 'b-arr7': '450', 'b-monthly': '1500000', 'b-ebitda': '30', 'b-burn': '80', 'b-runway': '18',
        'e-fit': '5', 'e-epc': '5', 'e-nat': '5', 'e-lic': '4', 'e-ask': '5'
      }
    },
    {
      name: 'CarbonLoop CCUS',
      form: {
        'p-name': 'CarbonLoop CCUS', 'p-yr': '2022',
        'p-desc': 'Amine-free solvent-based carbon capture retrofit for cement and steel plants with 40% lower regeneration energy.',
        'p-target': 'Cement majors and integrated steel producers',
        'p-incubator': 'IIT Madras Incubation Cell',
        'p-sec': 'ccus', 'p-stage': 'psa', 'p-hq': 'Chennai, Tamil Nadu',
        'p-eval': 'the investor Strategy · Demo', 'p-founder-ask': '22', 'p-notes': 'Pilot with mid-size cement plant signed; paid field trial underway.',
        't-trl': '6', 't-pilot': '6', 't-iv': '1', 't-data': '4', 't-uniq': '4', 't-scale': '3', 't-mfg': '2', 't-rel': '3',
        't-benchmarks': 'CPCB pilot monitoring data; third-party solvent analysis (NCL Pune)',
        'ip-status': '4', 'ip-breadth': '3', 'ip-quality': '3', 'ip-fto': '3', 'ip-pub': '3', 'ip-origin': '4', 'ip-sec': '3',
        'tm-exp': '4', 'tm-biz': '3', 'tm-net': '3', 'tm-comp': '3', 'tm-inst': '4', 'tm-div': '3', 'tm-adv': '2', 'tm-tr': '3', 'tm-ft': '2',
        'm-tam': '4', 'm-sam': '3', 'm-cagr': '25', 'm-disc': '2', 'm-loi': '2', 'm-paying': '1', 'm-uc': '3', 'm-comp': '3', 'm-pol': '3',
        'a-reg': '2', 'a-capex': '3', 'a-integ': '2', 'a-inc': '3', 'a-sc': '2', 'a-price': '2',
        'b-rm': '3', 'b-ue': '3', 'b-cas': '3', 'b-ops': '2', 'b-arr': '1.5', 'b-arr3': '22', 'b-arr7': '120', 'b-monthly': '150000', 'b-ebitda': '22', 'b-burn': '25', 'b-runway': '10',
        'e-fit': '3', 'e-epc': '3', 'e-nat': '2', 'e-lic': '2', 'e-ask': '3'
      }
    },
    {
      name: 'SolarFlex Modular',
      form: {
        'p-name': 'SolarFlex Modular', 'p-yr': '2024',
        'p-desc': 'Thin-film perovskite-silicon tandem PV panels for rooftop retrofits — early prototype stage.',
        'p-target': 'Commercial rooftop developers',
        'p-incubator': 'IIT Delhi Bioincubator',
        'p-sec': 'solar', 'p-stage': 'seed', 'p-hq': 'Delhi', 'p-eval': 'the investor Strategy · Demo',
        'p-founder-ask': '8', 'p-notes': 'Lab-stage; reliability data missing; founders part-time.',
        't-trl': '3', 't-pilot': '2', 't-iv': '0', 't-data': '2', 't-uniq': '3', 't-scale': '2', 't-mfg': '1', 't-rel': '2',
        't-benchmarks': 'Lab simulation + small-area cell testing only',
        'ip-status': '2', 'ip-breadth': '1', 'ip-quality': '1', 'ip-fto': '1', 'ip-pub': '1', 'ip-origin': '2', 'ip-sec': '2',
        'tm-exp': '3', 'tm-biz': '2', 'tm-net': '2', 'tm-comp': '2', 'tm-inst': '3', 'tm-div': '2', 'tm-adv': '1', 'tm-tr': '2', 'tm-ft': '1',
        'm-tam': '4', 'm-sam': '3', 'm-cagr': '18', 'm-disc': '1', 'm-loi': '1', 'm-paying': '0', 'm-uc': '2', 'm-comp': '2', 'm-pol': '4',
        'a-reg': '3', 'a-capex': '3', 'a-integ': '3', 'a-inc': '2', 'a-sc': '2', 'a-price': '2',
        'b-rm': '2', 'b-ue': '2', 'b-cas': '2', 'b-ops': '2', 'b-arr': '0', 'b-arr3': '4', 'b-arr7': '25', 'b-monthly': '0', 'b-ebitda': '15', 'b-burn': '8', 'b-runway': '4',
        'e-fit': '3', 'e-epc': '2', 'e-nat': '3', 'e-lic': '2', 'e-ask': '2'
      }
    },
    {
      // Real company — IIT Kanpur spin-out. Included as a live validation case for the framework.
      // Sources: espinnanotech.com, Tracxn, Crunchbase, YourStory, ZaubaCorp (CIN U29253UP2010PTC042649).
      // All field values derived from verifiable public data; unknowns scored conservatively.
      name: 'E-Spin Nanotech',
      form: {
        'p-name': 'E-Spin Nanotech', 'p-yr': '2010',
        'p-desc': 'IIT Kanpur spin-out commercialising electrospinning machines and nanofiber-based filtration products — industrial air filters, N95 "Swasa" masks, and lab instruments for research institutions.',
        'p-target': 'Research institutions (IITs, IISc, CSIR, DRDO), pharmaceutical OEMs, and industrial filtration integrators',
        'p-incubator': 'SIIC IIT Kanpur (incubated 2012)',
        'p-sec': 'nano', 'p-stage': 'sa', 'p-hq': 'Kanpur, Uttar Pradesh',
        'p-eval': 'the investor Strategy · Demo', 'p-founder-ask': '20',
        'p-notes': 'Bootstrapped 15-yr operation: 500+ global machine installations, FY25 revenue ₹7.41 Cr, DSIR-recognised R&D, 27 employees. Founder Dr. Sandip Patil (IIT Kanpur PhD). Only external funding: $70K ACT grant (2020). Customers include multiple IITs, IISc, BITS Pilani, CSIR (CECRI, IICT), Ministry of Defence, Sankara Netralaya, Eucare Pharma — no confirmed PSU (ONGC/IOCL/NTPC) relationships. Validation case: strong execution + indirect strategic fit (nanofiber filtration adjacent to refinery emission control / industrial HVAC, not a core energy technology).',
        't-trl': '9', 't-pilot': '10', 't-iv': '1', 't-data': '4', 't-uniq': '3', 't-scale': '4', 't-mfg': '4', 't-rel': '5',
        't-benchmarks': 'DSIR-recognised R&D facility; 500+ commercial installations worldwide over 15 years; machines deployed at IITs, IISc, CSIR labs, DRDO, and international universities (Oklahoma State, Wyoming, Nebraska, KAUST).',
        'ip-status': '5', 'ip-breadth': '2', 'ip-quality': '2', 'ip-fto': '1', 'ip-pub': '3', 'ip-origin': '2', 'ip-sec': '3',
        'tm-exp': '5', 'tm-biz': '4', 'tm-net': '3', 'tm-comp': '4', 'tm-inst': '5', 'tm-div': '4', 'tm-adv': '2', 'tm-tr': '4', 'tm-ft': '2',
        'm-tam': '3', 'm-sam': '3', 'm-cagr': '20', 'm-disc': '4', 'm-loi': '4', 'm-paying': '1', 'm-uc': '4', 'm-comp': '2', 'm-pol': '2',
        'a-reg': '3', 'a-capex': '4', 'a-integ': '4', 'a-inc': '3', 'a-sc': '3', 'a-price': '3',
        'b-rm': '5', 'b-ue': '3', 'b-cas': '4', 'b-ops': '2', 'b-arr': '7.4', 'b-arr3': '15', 'b-arr7': '40', 'b-monthly': '6100000', 'b-ebitda': '14', 'b-burn': '5', 'b-runway': '24',
        'e-fit': '2', 'e-epc': '3', 'e-nat': '2', 'e-lic': '2', 'e-ask': '3',
        'vd-peer-multiple': '3.0', 'vd-peers': 'Pall Corp · Donaldson · Camfil · Filtrex · Clarcor (industrial filtration peers — mature; E-Spin is smaller / higher-tech but lower scale, so multiple conservatively at lower end of peer range)'
      }
    },
    {
      // Real company — consumer AI robotics. Included as a NEGATIVE validation case:
      // commercially excellent startup that should REJECT on the investor strategic-fit hard gate
      // (energy-infrastructure thesis, not consumer edtech). Confirms gate works as designed.
      // Sources: miko.ai, Tracxn, LinkedIn, public Series D press (Nov 2025).
      // Financial figures are conservative public estimates; exact ARR not disclosed.
      name: 'Miko Technologies',
      form: {
        'p-name': 'Miko Technologies', 'p-yr': '2015',
        'p-desc': 'AI-powered companion robots for children (ages 5–10) — interactive learning, conversational AI, parental controls, age-appropriate content library. Flagship products Miko 3 and Miko Mini sold in 140+ countries.',
        'p-target': 'Parents of children aged 5–10 globally; DTC via Amazon, retail partners, and miko.ai.',
        'p-incubator': 'Bootstrapped (founded as Emotix at Mumbai)',
        'p-sec': 'iot', 'p-stage': 'sb', 'p-hq': 'Mumbai, Maharashtra',
        'p-eval': 'the investor Strategy · Demo', 'p-founder-ask': '',
        'p-notes': 'Series D raised Nov 2025; cumulative funding ~$102M (IvyCap, Chiratae, + 120 investors). Consumer deep-tech — deliberately included to stress-test the the investor-fit hard gate. Expected outcome: high CRS on tech/market/team, REJECT on engagement (strategic fit < 3).',
        't-trl': '9', 't-pilot': '10', 't-iv': '1', 't-data': '4', 't-uniq': '4', 't-scale': '5', 't-mfg': '3', 't-rel': '4',
        't-benchmarks': 'CE, FCC, BIS certifications; millions of units shipped across 140+ countries over 8+ years of commercial deployment.',
        'ip-status': '6', 'ip-breadth': '3', 'ip-quality': '2', 'ip-fto': '1', 'ip-pub': '0', 'ip-origin': '1', 'ip-sec': '3',
        'tm-exp': '4', 'tm-biz': '4', 'tm-net': '4', 'tm-comp': '5', 'tm-inst': '3', 'tm-div': '4', 'tm-adv': '3', 'tm-tr': '5', 'tm-ft': '3',
        'm-tam': '5', 'm-sam': '4', 'm-cagr': '25', 'm-disc': '4', 'm-loi': '4', 'm-paying': '1', 'm-uc': '5', 'm-comp': '3', 'm-pol': '2',
        'a-reg': '3', 'a-capex': '5', 'a-integ': '5', 'a-inc': '4', 'a-sc': '4', 'a-price': '3',
        'b-rm': '5', 'b-ue': '3', 'b-cas': '4', 'b-ops': '3', 'b-arr': '358', 'b-arr3': '1000', 'b-arr7': '3000', 'b-monthly': '298000000', 'b-ebitda': '22', 'b-burn': '1000', 'b-runway': '36',
        'e-fit': '1', 'e-epc': '1', 'e-nat': '1', 'e-lic': '1', 'e-ask': '1',
        'conf-m1': 'high', 'conf-m2': 'medium', 'conf-m3': 'high', 'conf-m4': 'high', 'conf-m5': 'medium', 'conf-m6': 'medium', 'conf-m7': 'high',
        'vd-date': '2026-04-20', 'vd-audit-years': 'inception',
        'vd-market-ref': '4600', 'vd-market-ref-note': 'Entrackr · Series D · Aug 2025 · $550M post-money',
        'vd-profile': 'Consumer robotics OEM: AI companion robots for children. Revenue mix — hardware (Miko 3 / Miko Mini flagship) plus content subscriptions. Global DTC + retail distribution in 140+ countries.',
        'vd-captable': 'Founders (Sneh Vaswani, Prashant Iyengar, Chintan Raikar) diluted across 5 rounds; IvyCap Ventures and Chiratae Ventures lead institutional stakes; 120+ other investors on cap table post Series D (Nov 2025).',
        'vd-peers': 'ROYBI Robot · Embodied Moxie · Leka · Moxie by Embodied · Sphero indi',
        'vd-peer-multiple': '4.5',
        'vd-ipr-dd': 'in-progress',
        'vd-legal-dd': 'in-progress',
        'vd-reg-dd': 'in-progress',
        'vd-ehs-dd': 'clean', 'vd-ehs-notes': 'Consumer electronics — no site-level EHS exposure; ODM-manufactured, compliance handled at supplier end.'
      }
    },
    {
      // Real company — Indian carbon-dioxide removal (CDR) startup using Enhanced Rock Weathering (ERW).
      // Positive the investor-fit validation case: opposite of Miko — lower CRS on IP/business maturity but
      // squarely in the energy-transition thesis (CCUS / Net Zero critical path). Expected: passes
      // the investor gate, likely "Promising" or "Commercially ready" verdict, engagement = engineering or license.
      // Sources: altcarbon.com, Frontier offtake announcements, climate-tech press.
      // Exact revenue / burn figures not publicly disclosed — values are conservative estimates.
      name: 'Alt Carbon',
      form: {
        'p-name': 'Alt Carbon', 'p-yr': '2023',
        'p-desc': 'Enhanced Rock Weathering (ERW) carbon-dioxide removal: spreads basalt rock dust on Darjeeling tea plantations to permanently sequester CO₂. Sells durable, measurable carbon-removal credits to corporate climate buyers.',
        'p-target': 'Corporate CDR buyers (Frontier coalition, tech majors); tea plantation partners in West Bengal / Northeast India.',
        'p-incubator': 'Bootstrapped',
        'p-sec': 'ccus', 'p-stage': 'seed', 'p-hq': 'Kolkata, West Bengal',
        'p-eval': 'the investor Strategy · Demo', 'p-founder-ask': '',
        'p-notes': 'First Indian startup to secure Frontier (Stripe-led) CDR offtake. Founders: Shrey &amp; Sparsh Agarwal. Validation case: strong the investor alignment (CCUS / Net Zero), early-stage business maturity, established ERW science (low IP moat — depends on execution + MRV rigour).',
        't-trl': '7', 't-pilot': '8', 't-iv': '1', 't-data': '3', 't-uniq': '3', 't-scale': '3', 't-mfg': '2', 't-rel': '3',
        't-benchmarks': 'Third-party MRV via Isometric protocol; Frontier pre-purchase agreement executed; field deployment active on tea plantations.',
        'ip-status': '1', 'ip-breadth': '0', 'ip-quality': '0', 'ip-fto': '1', 'ip-pub': '2', 'ip-origin': '1', 'ip-sec': '2',
        'tm-exp': '3', 'tm-biz': '3', 'tm-net': '3', 'tm-comp': '3', 'tm-inst': '3', 'tm-div': '3', 'tm-adv': '3', 'tm-tr': '4', 'tm-ft': '3',
        'm-tam': '5', 'm-sam': '3', 'm-cagr': '40', 'm-disc': '4', 'm-loi': '4', 'm-paying': '1', 'm-uc': '4', 'm-comp': '3', 'm-pol': '3',
        'a-reg': '3', 'a-capex': '3', 'a-integ': '3', 'a-inc': '4', 'a-sc': '3', 'a-price': '3',
        'b-rm': '3', 'b-ue': '3', 'b-cas': '3', 'b-ops': '3', 'b-arr': '5', 'b-arr3': '50', 'b-arr7': '200', 'b-monthly': '400000', 'b-ebitda': '30', 'b-burn': '15', 'b-runway': '24',
        'e-fit': '4', 'e-epc': '3', 'e-nat': '4', 'e-lic': '3', 'e-ask': '3',
        'conf-m1': 'medium', 'conf-m2': 'high', 'conf-m3': 'medium', 'conf-m4': 'high', 'conf-m5': 'medium', 'conf-m6': 'low', 'conf-m7': 'high',
        'vd-date': '2026-04-20', 'vd-audit-years': '1',
        'vd-market-ref': '398.5', 'vd-market-ref-note': 'Calibrated (Calibration Stage.csv): ₹398.5 Cr implied post-money from $12M Seed May 2025 @ 25% dilution. Tracxn post-money not disclosed.',
        'vd-profile': 'ERW-based CDR: basalt sourcing → field application on tea plantations → MRV (soil/water sampling, isotope analysis) → carbon-credit issuance → offtake to climate buyers. Revenue = CDR credit sales; unit economics depend on basalt logistics cost and tonne-CO₂ price achieved.',
        'vd-captable': 'Founders (Shrey & Sparsh Agarwal) retain majority; seed round 2024 led by climate-focused VCs. Institutional stakes not publicly itemised.',
        'vd-peers': 'Lithos Carbon · Eion · UNDO · Mati Carbon · Terradot',
        'vd-ipr-dd': 'not-started',
        'vd-legal-dd': 'in-progress',
        'vd-reg-dd': 'in-progress',
        'vd-ehs-dd': 'in-progress', 'vd-ehs-notes': 'Basalt sourcing / application subject to land-use and mining-adjacent regulations; MRV process itself is the material compliance workstream.'
      }
    },
    {
      // Real company — Mumbai micro-wind / hybrid renewables startup. Included as a live validation
      // case for early-stage, sparse-data evaluations — the kind of file where most modules sit in
      // low/medium confidence and the framework's conservative defaults matter most.
      // Verified sources: Tofler (CIN U74999MH2019PTC327691), YourStory company profile,
      // TheOrg / company registrar, TIDES IIT Roorkee incubation listing, powerzest.in.
      // Values where public data is thin are scored conservatively and flagged in p-notes.
      name: 'Powerzest Energy Solutions',
      form: {
        'p-name': 'Powerzest Energy Solutions', 'p-yr': '2019',
        'p-desc': 'Mumbai-based micro-wind / hybrid wind-solar OEM. Flagship product is a patented "Adaptable Disc Turbine" designed to generate electricity in minimal wind conditions, targeted at rural/urban off-grid applications. Portfolio also includes solar panels, hybrid kits, EV charging stations, solar street lights, and a compact "Pocket Watt" unit.',
        'p-target': 'Rural / remote off-grid households, telecom tower operators, EV charging infrastructure, green advertising, and building-integrated micro-generation.',
        'p-incubator': 'TIDES, IIT Roorkee (co-founder Avinash Gupta listed as incubatee)',
        'p-sec': 'wind', 'p-stage': 'seed', 'p-hq': 'Mumbai, Maharashtra',
        'p-eval': 'the investor Strategy · Demo', 'p-founder-ask': '',
        'p-notes': 'Incorporated 5 Jul 2019 (CIN U74999MH2019PTC327691). Directors: Raj Pankaj Oak (DIN 08502363) and Avinash Kumar Gupta (DIN 08502364, B.E. Mechanical, Mumbai University). Authorised capital ₹1.0 lakh, paid-up ₹20,000 — clearly bootstrapped. Last AGM filed Nov 2021 (compliance lag noted). Website currently shows "products coming soon" — pre-commercial / pilot-stage deployment, no named customer case studies disclosed. No public funding rounds confirmed. Flagship Adaptable Disc Turbine has an Indian patent grant; no international patent family confirmed. Scoring bias: most modules held at conservative values because independent performance data, paying-customer evidence, and audited financials are not publicly disclosed.',
        't-trl': '6', 't-pilot': '5', 't-iv': '0', 't-data': '2', 't-uniq': '3', 't-scale': '2', 't-mfg': '2', 't-rel': '2',
        't-benchmarks': 'Indian patent granted for the Adaptable Disc Turbine (low-wind generation). No third-party endurance data, accredited-lab performance report, or named pilot MRV disclosed on the company website or public filings.',
        'ip-status': '5', 'ip-breadth': '1', 'ip-quality': '2', 'ip-fto': '1', 'ip-pub': '1', 'ip-origin': '2', 'ip-sec': '2',
        'tm-exp': '3', 'tm-biz': '2', 'tm-net': '2', 'tm-comp': '2', 'tm-inst': '2', 'tm-div': '0', 'tm-adv': '1', 'tm-tr': '1', 'tm-ft': '1',
        'm-tam': '4', 'm-sam': '3', 'm-cagr': '22', 'm-disc': '2', 'm-loi': '1', 'm-paying': '0', 'm-uc': '2', 'm-comp': '2', 'm-pol': '4',
        'a-reg': '2', 'a-capex': '2', 'a-integ': '2', 'a-inc': '3', 'a-sc': '3', 'a-price': '2',
        'b-rm': '2', 'b-ue': '2', 'b-cas': '2', 'b-ops': '2', 'b-arr': '0', 'b-arr3': '3', 'b-arr7': '15', 'b-monthly': '0', 'b-ebitda': '10', 'b-burn': '2', 'b-runway': '6',
        'e-fit': '3', 'e-epc': '2', 'e-nat': '4', 'e-lic': '3', 'e-ask': '2',
        'conf-m1': 'low', 'conf-m2': 'medium', 'conf-m3': 'low', 'conf-m4': 'low', 'conf-m5': 'low', 'conf-m6': 'low', 'conf-m7': 'medium',
        'vd-date': '2026-04-21', 'vd-cin': 'U74999MH2019PTC327691', 'vd-audit-years': '1',
        'vd-market-ref': '0', 'vd-market-ref-note': 'No publicly-disclosed valuation. Paid-up capital ₹20K; no institutional funding announced — market reference not applicable at this stage.',
        'vd-profile': 'Distributed renewables OEM (micro-wind + hybrid wind-solar + EV charging). Revenue model = direct product sales + installation/integration services. Flagship differentiator is the patented Adaptable Disc Turbine for low-wind conditions; remainder of portfolio (solar panels, charge controllers, street lights, EV charging) is largely commoditised.',
        'vd-captable': 'Two-founder structure: Raj Oak and Avinash Gupta retain full majority. Paid-up capital ₹20,000 on ₹1.0 lakh authorised. No institutional investors publicly visible. No disclosed CCDs / SAFEs / convertibles.',
        'vd-peers': 'Aeolos Wind Energy · Primus Wind Power · Kestrel Renewable Energy · WindTree (New World Wind) · Avant Garde Innovations (Indian micro-wind peer)',
        'vd-peer-multiple': '',
        'vd-ipr-dd': 'in-progress',
        'vd-legal-dd': 'in-progress',
        'vd-legal-notes': 'Last AGM on record is Nov 2021 — verify MCA annual-filing compliance status and any ROC notices before diligence sign-off.',
        'vd-reg-dd': 'not-started',
        'vd-reg-notes': 'Grid-tied micro-wind and hybrid systems typically require BIS certification and CEA grid-connection compliance; product-level certification status not publicly visible.',
        'vd-ehs-dd': 'not-started'
      }
    },
    {
      // Real company — IIT Roorkee biotech spin-out producing industrial enzymes via
      // solid-state fermentation. Chosen as a second validation case alongside Powerzest
      // because Fermentech is ALREADY an DeepTechEval seed-grant recipient (so the investor has prior
      // exposure) and has a direct 2G ethanol / biofuels angle via cellulase + xylanase.
      // Verified sources: Tofler (CIN U74999DL2017PTC322401), fermentechlabs.com,
      // a-IDEA NAARM blog, YourStory company page, TIDES IIT Roorkee listing.
      // Financial data is not publicly disclosed; scoring is held conservative and
      // confidence is flagged low on modules that rely on non-public evidence.
      name: 'Fermentech Labs',
      form: {
        'p-name': 'Fermentech Labs', 'p-yr': '2017',
        'p-desc': 'IIT Roorkee-incubated industrial biotech producing five enzymes (pectinase, cellulase, xylanase, phytase, amylase) via proprietary solid-state fermentation (SSF) on agro-industrial and fruit-processing waste. Claimed novel thermo-tolerant and acid-stable phytase in a bespoke SSF bioreactor.',
        'p-target': 'Fruit-juice and wine clarification, textile processing, biofuel production (2G ethanol cellulase/xylanase), pharmaceuticals, animal feed supplement, pulp and paper processing.',
        'p-incubator': 'TIDES BioNEST, IIT Roorkee (MAC Building)',
        'p-sec': 'biotech', 'p-stage': 'seed', 'p-hq': 'Roorkee, Uttarakhand',
        'p-eval': 'the investor Strategy · Demo', 'p-founder-ask': '',
        'p-notes': 'Incorporated 21 Aug 2017 (CIN U74999DL2017PTC322401, RoC Delhi). Directors: Dr. Sidharth Arora (DIN 07903394, IIT Roorkee PhD, Founder/CEO) and Pushpa Rani (DIN 07903399). Authorised capital ₹10 lakh, paid-up only ₹50,910 — bootstrapped with non-dilutive grant funding. Last AGM filed 30 Sep 2022 — 3-year MCA compliance lag, verify current filing status before diligence. Team of ~5 listed on website (adds Dr. Ankita Bhatt, Umme Habiba, Ganga Rawat, Adesh Shivane). Confirmed grants: DBT Biotechnology Ignition Grant (BIG), BIRAC seed grant via a-IDEA NAARM BioNest programme (2021, to scale enzyme production), and DeepTechEval seed grant — the investor is therefore a known prior funder. Recognition: Slush Helsinki 2018 (Indian delegation), Global Bio India 2019, first prize at BRIC Idea Exposition (IKP Knowledge Park x BIRAC x IIT Roorkee, Nov 2019). No paying-customer case studies, revenue figures, named pilot MRV, or patent grants confirmed publicly — scoring held conservative across Tech/IP/Market/Business with confidence flagged low. strategic fit is the distinctive angle: SSF-derived cellulase + xylanase feed directly into 2G cellulosic ethanol, which is adjacent to the investor EPC scope.',
        't-trl': '6', 't-pilot': '4', 't-iv': '1', 't-data': '3', 't-uniq': '3', 't-scale': '2', 't-mfg': '2', 't-rel': '2',
        't-benchmarks': 'Thermo-tolerant and acid-stable phytase developed in novel SSF bioreactor (claimed on company site); BIRAC + DBT BIG grant funding implies some independent technical review. No third-party enzyme-activity characterisation, accredited-lab assay reports, or named pilot-scale MRV disclosed publicly.',
        'ip-status': '3', 'ip-breadth': '1', 'ip-quality': '2', 'ip-fto': '1', 'ip-pub': '2', 'ip-origin': '3', 'ip-sec': '3',
        'tm-exp': '4', 'tm-biz': '2', 'tm-net': '3', 'tm-comp': '2', 'tm-inst': '4', 'tm-div': '3', 'tm-adv': '1', 'tm-tr': '2', 'tm-ft': '2',
        'm-tam': '4', 'm-sam': '2', 'm-cagr': '8', 'm-disc': '2', 'm-loi': '1', 'm-paying': '0', 'm-uc': '3', 'm-comp': '2', 'm-pol': '4',
        'a-reg': '2', 'a-capex': '3', 'a-integ': '3', 'a-inc': '4', 'a-sc': '2', 'a-price': '2',
        'b-rm': '2', 'b-ue': '2', 'b-cas': '2', 'b-ops': '2', 'b-arr': '0', 'b-arr3': '8.5', 'b-arr7': '36.1', 'b-monthly': '0', 'b-ebitda': '25', 'b-burn': '2', 'b-runway': '14',
        'e-fit': '3', 'e-epc': '2', 'e-nat': '4', 'e-lic': '3', 'e-ask': '3',
        'conf-m1': 'low', 'conf-m2': 'low', 'conf-m3': 'medium', 'conf-m4': 'low', 'conf-m5': 'low', 'conf-m6': 'low', 'conf-m7': 'medium',
        'vd-date': '2026-04-22', 'vd-cin': 'U74999DL2017PTC322401', 'vd-audit-years': '1',
        'vd-market-ref': '0', 'vd-market-ref-note': 'No disclosed valuation or institutional priced round. Paid-up capital ₹50,910; only non-dilutive grants (DBT BIG, BIRAC, DeepTechEval) confirmed — market reference not applicable at this stage.',
        'vd-profile': 'Industrial-biotech enzyme producer. Revenue model = direct enzyme sales + potential licensing of SSF bioreactor process. Differentiation is solid-state fermentation on agro-waste feedstock (circular-economy cost angle) vs. dominant submerged-fermentation incumbents. Core commercial thesis rests on matching incumbent enzyme activity at lower feedstock cost — unproven at scale on public evidence.',
        'vd-captable': 'Two-director structure (founder + family co-director — common bootstrapped Pvt Ltd pattern). Paid-up capital ₹50,910 on ₹10.0 lakh authorised. Grant funding is non-dilutive (DBT BIG, BIRAC a-IDEA, DeepTechEval) so founder equity effectively 100%. No institutional priced round or convertible instruments publicly visible.',
        'vd-peers': 'Novonesis (Novozymes) · IFF (DuPont Industrial Biosciences) · AB Enzymes · Advanced Enzyme Technologies (India, listed — NSE: ADVENZYMES) · Aumgene Biosciences · Zytex Biotech. Indian listed peer Advanced Enzymes trades at ~4–5× revenue but Fermentech is pre-scale; peer multiple not directly applicable.',
        'vd-peer-multiple': '',
        'vd-ipr-dd': 'in-progress',
        'vd-ipr-notes': 'Company references a "novel SSF bioreactor" and "thermo-tolerant, acid-stable phytase" but no granted Indian patent is publicly confirmed on Tofler or the company website. Verify IP filing status (provisional vs complete, PCT vs national-phase) and assignment from IIT Roorkee before licensing/IP-backed valuation.',
        'vd-legal-dd': 'in-progress',
        'vd-legal-notes': 'Last AGM on record is 30 Sep 2022 — ~3-year compliance lag. Verify MCA annual-filing status, any ROC strike-off notices, and current Active/Dormant status before committing funds.',
        'vd-reg-dd': 'not-started',
        'vd-reg-notes': 'Enzyme products sold for food/feed applications require FSSAI licence and (where applicable) feed-grade certifications. Regulatory posture not disclosed publicly — gate on documented certifications before commercial off-take.',
        'vd-ehs-dd': 'not-started',
        'vd-ehs-notes': 'SSF bioreactor operations involve living microbial cultures and agro-waste handling — confirm biosafety-level classification, effluent treatment plan, and state pollution-control-board consent for the Roorkee R&D unit.'
      }
    },
    {
      // Real company — IIT BHU Varanasi engineer-founded modular floating-infrastructure
      // OEM. Included as the most mature validation case in the demo set: disclosed FY24
      // revenue, confirmed institutional seed round, and the world-first floating CNG
      // filling station commissioned by GAIL India (inaugurated by PM Modi) — a direct
      // energy-PSU reference that stress-tests the the investor-fit / EPC scoring axes.
      // Verified sources: Tofler (CIN U45300UP2018PTC102280, FY24 revenue ₹2.14 Cr),
      // acquainfra.com, Tracxn legal entity record, multiple news/PMO disclosures on
      // the Ganga floating CNG station. Scoring leans more confident than earlier demos
      // because commercial deployments are named and multi-year.
      name: 'Acquafront Infrastructure',
      form: {
        'p-name': 'Acquafront Infrastructure Pvt Ltd (AIPL)', 'p-yr': '2018',
        'p-desc': 'IIT BHU Varanasi-founded modular-floating-infrastructure OEM. Turn-key floating platforms, pontoons, barges, jetties, and docks — product families include Steel-integrated Floating Jetty (SIFJ), GFRC Floating Beams, Acquaworks (construction pontoons), and Acqualeisure (tourism infra). Built the world-first Floating CNG Filling Station on the Ganga for GAIL India, inaugurated by the Prime Minister.',
        'p-target': 'Energy PSUs (GAIL, oil & gas), state governments (water supply, municipal pumping, inland waterways), mining operators (dewatering), port/shipping authorities, tourism developers, defence/civil seaplane docks.',
        'p-incubator': 'Bootstrapped + seed institutional funding (no incubator disclosed)',
        'p-sec': 'water', 'p-stage': 'seed', 'p-hq': 'Noida, Uttar Pradesh',
        'p-eval': 'the investor Strategy · Demo', 'p-founder-ask': '',
        'p-notes': 'Incorporated 20 Mar 2018 (CIN U45300UP2018PTC102280, RoC Uttar Pradesh). Directors: Achin Agrawal and Ankit Patel (both co-founders, from incorporation), Yash Patel (Mar 2021), Subodh Chawla (Nominee Director, Mar 2021 — indicates institutional investor presence). Founders are Civil/Mechanical engineers from IIT (BHU) Varanasi. Authorised capital ₹65 lakh, paid-up ₹57.8 lakh — meaningful equity base. Last AGM filed 30 Sep 2024 — current on MCA compliance. Disclosed FY24 revenue ₹2.14 Cr (Tofler). Secured $0.5M (≈₹4 Cr) seed round in FY23–24 — round terms not publicly disclosed. Corporate office: I-THUM, Sector 62 Noida; manufacturing at Rania Industrial Area, Kanpur; registered office Jalaun. Commercial installations with multi-year uptime: Hirakud Reservoir water supply (7+ yrs), Beohari Dam supply serving 20,000+ residents (7+ yrs), Ostapal Mine dewatering (Odisha), Bhopal Quarry pontoon, Sabarmati Riverfront seaplane dock, 550th Guru Nanak Jayanti floating Gurudwara (Punjab), Assam project (Oct 2024). Flagship the investor-adjacent reference: Floating CNG Filling Station on Ganga commissioned by GAIL India Limited.',
        't-trl': '9', 't-pilot': '10', 't-iv': '1', 't-data': '4', 't-uniq': '4', 't-scale': '3', 't-mfg': '3', 't-rel': '4',
        't-benchmarks': 'Multiple commercial deployments with 7+ year continuous uptime (Hirakud Reservoir, Beohari Dam). GAIL-commissioned Floating CNG Filling Station passed CCoE/PESO-level safety diligence (inferred from PM-inauguration context — certification documentation to be sighted in diligence). MoMSME registered; Kanpur manufacturing facility operational.',
        'ip-status': '3', 'ip-breadth': '2', 'ip-quality': '2', 'ip-fto': '2', 'ip-pub': '1', 'ip-origin': '2', 'ip-sec': '3',
        'tm-exp': '4', 'tm-biz': '3', 'tm-net': '4', 'tm-comp': '3', 'tm-inst': '3', 'tm-div': '2', 'tm-adv': '2', 'tm-tr': '4', 'tm-ft': '2',
        'm-tam': '3', 'm-sam': '3', 'm-cagr': '15', 'm-disc': '4', 'm-loi': '3', 'm-paying': '1', 'm-uc': '4', 'm-comp': '3', 'm-pol': '4',
        'a-reg': '3', 'a-capex': '3', 'a-integ': '4', 'a-inc': '4', 'a-sc': '3', 'a-price': '3',
        'b-rm': '4', 'b-ue': '3', 'b-cas': '3', 'b-ops': '3', 'b-arr': '2.14', 'b-arr3': '42', 'b-arr7': '72.5', 'b-monthly': '1789000', 'b-ebitda': '8', 'b-burn': '0', 'b-runway': '24',
        'e-fit': '4', 'e-epc': '4', 'e-nat': '4', 'e-lic': '2', 'e-ask': '3',
        'conf-m1': 'medium', 'conf-m2': 'low', 'conf-m3': 'medium', 'conf-m4': 'medium', 'conf-m5': 'medium', 'conf-m6': 'medium', 'conf-m7': 'high',
        'vd-date': '2026-04-22', 'vd-cin': 'U45300UP2018PTC102280', 'vd-audit-years': '5',
        'vd-market-ref': '0', 'vd-market-ref-note': '$0.5M (≈₹4 Cr) seed round in FY23–24 disclosed but pre-money and priced-round terms not public. On conservative seed-dilution assumptions (20–30%), implied post-money sits in the ₹13–20 Cr band — directional only, not a defensible anchor.',
        'vd-profile': 'Modular floating-infrastructure EPC + product manufacturer. Revenue model = project-based turn-key contracts (engineering + fabrication + installation) with PSUs, state governments, and private infra clients. Differentiation is modular engineering know-how (SIFJ, GFRC floating beams) + proven multi-year reliability on named deployments. Floating CNG Filling Station is a world-first reference that opens adjacent oil-and-gas logistics use cases.',
        'vd-captable': 'Four-director structure: two founding directors (Achin Agrawal, Ankit Patel) + one additional (Yash Patel, Mar 2021) + one Nominee Director (Subodh Chawla, Mar 2021) who represents the seed-round institutional investor. Paid-up ₹57.8 lakh on ₹65 lakh authorised. Seed $0.5M round in FY23–24 — cap-table and shareholding pattern to be requested in diligence.',
        'vd-peers': 'Versadock (UK) · Candock (Canada) · Marinetek · Jetfloat · EZ Dock · Connect-A-Dock · Sealand Pontoons · domestic EPC peers for inland-waterways work (L&T Heavy Engineering, Cochin Shipyard on larger scale). Listed comparables for floating-infra pure-play are scarce; peer multiple set at 4× as a blended infra-EPC / specialty-manufacturing reference.',
        'vd-peer-multiple': '4.0',
        'vd-ipr-dd': 'not-started',
        'vd-ipr-notes': 'SIFJ and GFRC Floating Beam product lines referenced as proprietary but no granted Indian/PCT patent confirmed publicly. Verify IP filing status, design registrations, and trademark coverage (Acquaworks, Acqualeisure) before licensing-implicit valuation uplift.',
        'vd-legal-dd': 'clean',
        'vd-legal-notes': 'AGM 30 Sep 2024 on record — MCA compliance current. No active litigation or ROC notices surfaced in public record; confirm under counsel opinion.',
        'vd-reg-dd': 'in-progress',
        'vd-reg-notes': 'Floating CNG station required CCoE (PESO) clearance, CNG dispensing licence, and GAIL-side safety sign-off. Confirm regulatory package for each deployed product line (marine works consent, IWAI approvals for inland waterways, state PCB consents for manufacturing).',
        'vd-ehs-dd': 'in-progress',
        'vd-ehs-notes': 'Kanpur manufacturing unit requires UPPCB consents (air, water, hazardous-waste) and worker safety compliance. Marine deployments trigger site-specific EHS plans — verify for each named deployment.'
      }
    },
    {
      // Real company — IIT Bombay spin-out manufacturing Lithium Titanate Oxide (LTO)
      // battery cells and packs for commercial EVs and defence. Included as a high-growth,
      // deep-losses validation case: strong tech/team/market scores, severely negative EBITDA,
      // and a ₹1,900 Cr post-money valuation that stress-tests Revenue Multiple vs DCF.
      // Sources: Tracxn financial statements FY2019–FY2024, company profile, log9materials.com,
      // MCA filings (CIN U29253KA2015PTC126433), press coverage (YourStory, Inc42, TechCrunch).
      // Expected the investor engagement: LICENSE (strong IP + energy-storage thesis, limited direct EPC fit).
      name: 'Log9 Materials',
      form: {
        'p-name': 'Log9 Materials Scientific Pvt Ltd', 'p-yr': '2015',
        'p-desc': 'IIT Bombay spin-out commercialising Lithium Titanate Oxide (LTO) battery cells, packs, and Battery Management Systems for commercial EVs (3W, 4W), stationary energy storage, and defence. LTO chemistry offers 3× faster charge, 15,000+ cycle life, and wide-temperature operation vs LFP — at higher unit cost. Customers include Euler Motors (flagship EV partner), Tata Motors pilots, and DRDO.',
        'p-target': 'Commercial EV OEMs (3-wheeler, 4-wheeler fleet operators), defence/government battery procurement, and stationary industrial storage integrators.',
        'p-incubator': 'SINE IIT Bombay (incubated 2015)',
        'p-sec': 'storage', 'p-stage': 'sb', 'p-hq': 'Bengaluru, Karnataka',
        'p-eval': 'the investor Strategy · Demo', 'p-founder-ask': '',
        'p-notes': 'Incorporated 2015 (CIN U29253KA2015PTC126433). Founders: Akshay Singhal (CEO, IIT Bombay) and Kartik Hajela (COO, IIT Bombay). Total raised $90.3M across rounds (Amara Raja, Mitsui, Petronas Ventures, IIFL Finance, Kalaari Capital). Revenue trajectory: FY20 ₹0.66 Cr → FY21 ₹8.6 Cr → FY22 ₹25.5 Cr → FY23 ₹74.4 Cr → FY24 ₹110.3 Cr (5Y CAGR 226%; 1Y CAGR 48%). EBITDA margin severely negative at −67% in FY24 (₹−73.9 Cr). Total debt ₹203.5 Cr, D/E 1.68. BIS certified under IS 16270. Post-money ~$228M (₹1,900 Cr) at Oct 2023 funding round. Key validation case: growth inflection + deep losses + premium valuation — tests scoring and advisory-flag system under real stress conditions.',
        't-trl': '9', 't-pilot': '10', 't-iv': '1', 't-data': '4', 't-uniq': '4', 't-scale': '4', 't-mfg': '4', 't-rel': '4',
        't-benchmarks': 'BIS certification for LTO cells (IS 16270); commercial deployments in Euler Motors 3-wheelers and Tata Motors pilots; DRDO supply contract; IIT Bombay peer-reviewed publications on LTO electrochemistry; 15,000+ cycle life validated in field use.',
        'ip-status': '6', 'ip-breadth': '3', 'ip-quality': '3', 'ip-fto': '2', 'ip-pub': '3', 'ip-origin': '4', 'ip-sec': '3',
        'tm-exp': '5', 'tm-biz': '4', 'tm-net': '5', 'tm-comp': '5', 'tm-inst': '5', 'tm-div': '4', 'tm-adv': '3', 'tm-tr': '5', 'tm-ft': '3',
        'm-tam': '5', 'm-sam': '4', 'm-cagr': '35', 'm-disc': '4', 'm-loi': '4', 'm-paying': '1', 'm-uc': '3', 'm-comp': '2', 'm-pol': '5',
        'a-reg': '4', 'a-capex': '2', 'a-integ': '4', 'a-inc': '4', 'a-sc': '2', 'a-price': '2',
        'b-rm': '3', 'b-ue': '1', 'b-cas': '2', 'b-ops': '2', 'b-arr': '110.3', 'b-arr3': '280', 'b-arr7': '800', 'b-monthly': '91900000', 'b-ebitda': '22', 'b-burn': '175', 'b-runway': '18',
        'e-fit': '3', 'e-epc': '2', 'e-nat': '5', 'e-lic': '3', 'e-ask': '3',
        'conf-m1': 'high', 'conf-m2': 'medium', 'conf-m3': 'high', 'conf-m4': 'high', 'conf-m5': 'medium', 'conf-m6': 'low', 'conf-m7': 'high',
        'vd-date': '2026-04-22', 'vd-cin': 'U29253KA2015PTC126433', 'vd-audit-years': '5',
        'vd-market-ref': '1900', 'vd-market-ref-note': 'Oct 2023 round: post-money ~$228M (≈₹1,900 Cr); implied Revenue Multiple 19.8× on trailing ARR · Tracxn / press coverage.',
        'vd-profile': 'IIT Bombay spin-out: LTO battery cell + pack + BMS manufacturer. Revenue model = hardware sales (cells, packs, integrated battery systems) to EV OEMs and defence. LTO chemistry differentiator is superior cycle life (15,000+ cycles), 3× faster charging, and thermal stability vs LFP — commanded at a price premium. Commercial traction is real (Euler Motors, Tata, DRDO) but unit economics are severely negative: EBITDA −67% in FY24, total debt ₹203.5 Cr. Business thesis is volume-driven margin improvement — standard for deep-tech hardware plays — but the cost gap vs Chinese LFP cells (~40–60% cheaper) is the existential risk.',
        'vd-captable': 'Founders Akshay Singhal and Kartik Hajela (both IIT Bombay). Institutional investors: Amara Raja Group (strategic lead), Mitsui (Japan, strategic), Petronas Ventures, IIFL Finance, Kalaari Capital. Total $90.3M raised across multiple rounds. Significant dilution implied from seed through Series B/C; exact shareholding pattern and round-by-round cap table to be requested in diligence.',
        'vd-peers': 'Amara Raja Energy & Mobility (NSE: ARE&M) · Exide Energy Solutions · BYD (China, listed) · CATL (China, listed) · Epsilon Advanced Materials · Altmin India · Tata Chemicals (emerging battery materials) · Panasonic Energy India',
        'vd-peer-multiple': '19.8',
        'vd-ipr-dd': 'in-progress',
        'vd-ipr-notes': 'Multiple patents from IIT Bombay portfolio assigned to Log9, covering LTO cell chemistry, electrode formulation, and BMS algorithms. International filings via PCT for core innovations. LTO is a crowded global patent space (Sony, Toshiba, Altairnano, Chinese manufacturers) — require full FTO opinion before licensing or EPC-integration engagement. Verify assignment deed from IIT Bombay, granted vs pending status, and renewal schedule.',
        'vd-legal-dd': 'in-progress',
        'vd-reg-dd': 'in-progress',
        'vd-reg-notes': 'BIS certification for lithium-ion cells under IS 16270 obtained. AIS-156 Phase II (automotive battery safety) compliance required for continued OEM fitment; verify scope and expiry. DRDO supply contracts may carry additional defence-procurement compliance obligations.',
        'vd-ehs-dd': 'in-progress',
        'vd-ehs-notes': 'Battery cell manufacturing involves lithium, organic electrolyte solvents, and fluorine-containing binders — classified hazardous under HWM Rules 2016. Verify KSPCB consent-to-operate for Bengaluru unit (air, water, solid/hazardous waste). End-of-life battery recycling obligation under CPCB Extended Producer Responsibility (EPR) framework — confirm EPR plan registration and targets.'
      }
    },
    {
      // Real company — IIT Madras spin-out, nanotechnology-based Atmospheric Water Generator.
      // CRITICAL validation case: Engineers India Limited (the investor) is already listed as an
      // investor/supporter by Tracxn alongside HDFC Capital and RTBI — this is a live the investor
      // portfolio company. Platform should correctly output EQUITY engagement, confirming what
      // the investor has already done. Co-founder Prof. Thalappil Pradeep (IISc PhD, Padma Shri, 500+
      // publications, 50+ patents) is the scientific anchor. EBITDA-positive since FY22-23 —
      // a rare quality for a deep-tech hardware startup at this revenue scale.
      // Sources: Tracxn company profile Apr 2026, MCA (CIN U74999TN2017PTC118695),
      // vayujal.com, financial statements FY2020-21 to FY2024-25.
      name: 'VayuJal',
      form: {
        'p-name': 'VayuJal Technologies Private Limited', 'p-yr': '2016',
        'p-desc': 'Chennai-based IIT Madras spin-out manufacturing nanotechnology-based Atmospheric Water Generators (AWGs) that produce potable water directly from ambient air. Technology co-developed with Prof. Thalappil Pradeep (IIT Madras, Padma Shri — one of India\'s most cited nanomaterials scientists, 500+ publications, 50+ patents). Products target remote/arid industrial sites, defence forward areas, and disaster-relief deployments where conventional water infrastructure is absent.',
        'p-target': 'Remote and water-scarce industrial sites (oil & gas plant sites, power stations, mining camps), government/defence water supply for forward areas and strategic locations, disaster-relief and humanitarian water provisioning.',
        'p-incubator': 'RTBI / IITM Incubation Cell, IIT Madras',
        'p-sec': 'water', 'p-stage': 'seed', 'p-hq': 'Chennai, Tamil Nadu',
        'p-eval': 'the investor Strategy · Demo', 'p-founder-ask': '',
        'p-notes': 'Incorporated Sep 20, 2017 (CIN U74999TN2017PTC118695; founded 2016). Founders: Ramesh Kumar (CEO, SRM BTech 2014, IIT Madras MS 2020), Ankit Nagar (Director, IIT Kanpur BTech 2016), Prof. Thalappil Pradeep (Director, IISc PhD 1991, Padma Shri, National Science Academy Fellow — scientific anchor). Team of 12 (Feb 2026). CRITICAL: Engineers India Limited (the investor) is listed by Tracxn as an investor/supporter alongside HDFC Capital and RTBI — the investor already has exposure to VayuJal, making this a live validation of the platform\'s engagement output. Cap table (Mar 2022): Prof. Pradeep 40%, Ramesh Kumar 35%, Ankit Nagar 20%, RTBI/IITM 5%; 10,000 shares outstanding. Revenue trajectory: FY20-21 ₹33.2L → FY21-22 ₹56.3L → FY22-23 ₹87.3L → FY23-24 ₹28.3L → FY24-25 ₹63.8L (lumpy, project-based; 5Y CAGR 39%). EBITDA positive from FY22-23 onward (₹4.5L in FY24-25, 7% margin). Net profit ₹2.2L. Total debt ₹62.9L. Negative accumulated equity (₹33.1L deficit). Ranked 11th of 85 global AWG competitors (Tracxn).',
        't-trl': '8', 't-pilot': '7', 't-iv': '1', 't-data': '3', 't-uniq': '4', 't-scale': '3', 't-mfg': '2', 't-rel': '3',
        't-benchmarks': 'Commercial AWG products with revenue every year since FY20-21. Prof. Pradeep\'s nanotechnology research internationally peer-reviewed (500+ publications, 50+ IIT Madras patents). RTBI + the investor institutional endorsement provides independent technical validation. No third-party AWG volumetric-output or energy-efficiency certification sheet publicly available on vayujal.com — request in diligence.',
        'ip-status': '5', 'ip-breadth': '2', 'ip-quality': '3', 'ip-fto': '2', 'ip-pub': '4', 'ip-origin': '4', 'ip-sec': '3',
        'tm-exp': '4', 'tm-biz': '2', 'tm-net': '4', 'tm-comp': '3', 'tm-inst': '5', 'tm-div': '3', 'tm-adv': '3', 'tm-tr': '3', 'tm-ft': '3',
        'm-tam': '4', 'm-sam': '3', 'm-cagr': '22', 'm-disc': '3', 'm-loi': '2', 'm-paying': '1', 'm-uc': '3', 'm-comp': '3', 'm-pol': '4',
        'a-reg': '3', 'a-capex': '4', 'a-integ': '4', 'a-inc': '4', 'a-sc': '3', 'a-price': '3',
        'b-rm': '3', 'b-ue': '3', 'b-cas': '3', 'b-ops': '2', 'b-arr': '0.638', 'b-arr3': '2', 'b-arr7': '8', 'b-monthly': '530000', 'b-ebitda': '18', 'b-burn': '0', 'b-runway': '24',
        'e-fit': '4', 'e-epc': '4', 'e-nat': '4', 'e-lic': '3', 'e-ask': '3',
        'conf-m1': 'medium', 'conf-m2': 'medium', 'conf-m3': 'high', 'conf-m4': 'medium', 'conf-m5': 'medium', 'conf-m6': 'medium', 'conf-m7': 'high',
        'vd-date': '2026-04-22', 'vd-cin': 'U74999TN2017PTC118695', 'vd-audit-years': '5',
        'vd-market-ref': '0', 'vd-market-ref-note': 'No priced equity round disclosed. RTBI (5% cap-table equity) and implied the investor + HDFC Capital involvement appears to be through incubation grants — no post-money valuation available. Revenue Multiple on trailing ARR (₹0.638 Cr × 6× water sector) gives directional ₹3–4 Cr — not a defensible anchor at this scale.',
        'vd-profile': 'AWG manufacturer: nanotechnology-based atmospheric water generation. Revenue model = unit sales of AWG products + potential maintenance/service contracts. Scientific anchor is Prof. Thalappil Pradeep\'s nanomaterials IP from IIT Madras (50+ patents). Revenue is project-driven and lumpy (range ₹28L–₹87L in last 5 years). EBITDA turned positive FY22-23 — lean 12-person team is a quality indicator at this scale. Negative accumulated equity (₹33.1L deficit, FY24-25) from early-year losses. Total debt ₹62.9L. Strategic thesis: Prof. Pradeep\'s nanotechnology enables more energy-efficient AWG than conventional desiccant/refrigeration competitors — if defensible at industrial volume, high margin potential.',
        'vd-captable': 'Three-founder structure (Mar 2022 public snapshot): Prof. Thalappil Pradeep 40%, Ramesh Kumar (CEO) 35%, Ankit Nagar 20%, RTBI via IITM Incubation Cell 5%. Total 10,000 shares outstanding. No priced round has altered this structure publicly. the investor and HDFC Capital are listed as institutional investors by Tracxn but do not appear in the MCA cap table — verify the exact investment instrument (grant agreement, SAFE note, convertible debenture, or equity) in diligence before any further commitment.',
        'vd-peers': 'Uravu Labs (Bengaluru, Seed, $6.07M — closest Indian AWG competitor) · SOURCE Global PBC (Scottsdale, Series D, $361M — largest global) · Infinite Cooling (Cambridge, Series A, $16.3M) · WaHa (Fremont, Series A, $12M) · Maithri Aquatech (Secunderabad, Seed, $535K) · Aeronero (Chennai, Seed, $1.53M — local competitor)',
        'vd-peer-multiple': '',
        'vd-ipr-dd': 'in-progress',
        'vd-ipr-notes': 'Prof. Thalappil Pradeep holds 50+ patents from IIT Madras covering nanomaterials, water purification, and atmospheric moisture capture. Verify (1) which specific patents are formally assigned to VayuJal Technologies vs. retained by IIT Madras institution, (2) assignment deed terms (exclusive/non-exclusive, territory, field-of-use), (3) royalty or milestone payment obligations back to IIT Madras, and (4) any right-of-first-refusal or ownership-reversion clauses. This is the single most critical diligence item before equity engagement.',
        'vd-legal-dd': 'in-progress',
        'vd-legal-notes': 'Negative equity (₹33.1L accumulated deficit) and total liabilities ₹1.6 Cr vs. assets ₹1.3 Cr — balance sheet is technically insolvent; verify no creditor enforcement or winding-up risk. Verify exact legal instrument by which the investor and HDFC Capital are investors (grant agreement vs. equity shares vs. convertible note) — Tracxn lists them as investors but the MCA cap table does not reflect equity stakes. Confirm MCA annual filing currency through FY24-25.',
        'vd-reg-dd': 'not-started',
        'vd-reg-notes': 'AWG products intended for potable water must meet IS 10500 (Indian Standard for drinking water). Electrical/appliance safety compliance under IS 13252 / BIS scheme. If AWG output is packaged or supplied to consumers, FSSAI registration may apply. Confirm BIS product certification scope, model-level approvals, and any state-level pollution-board consent for Chennai manufacturing/assembly unit.',
        'vd-ehs-dd': 'not-started',
        'vd-ehs-notes': 'Nanotechnology-based manufacturing may involve fine-particle handling and chemical precursors — verify particle-size classification and worker exposure controls per CPCB nanotechnology advisory (2020). Tamil Nadu PCB consent-to-operate for assembly/manufacturing unit to be confirmed. AWG water output quality should be tested against IS 10500 parameters (heavy metals, microbial) for each deployment site.'
      }
    }
  ];

  /* ---------- tiny DOM helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const gn = (id, d = 0) => { const e = $(id); if (!e || e.value === '') return d; const n = parseFloat(e.value); return isNaN(n) ? d : n; };
  const gu = (id, d = 0) => gn(id, d);
  const gs = (id, d = '') => { const e = $(id); return e ? (e.value || d) : d; };
  const gc = (id) => { const e = $(id); return !!(e && e.checked); };
  const setText = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- navigation ---------- */
  function showPage(n) {
    n = Math.max(0, Math.min(TOTAL_PAGES - 1, n));
    currentPage = n;
    document.querySelectorAll('.page').forEach((p, i) => p.classList.toggle('active', i === n));
    document.querySelectorAll('.tab-button').forEach((t) => {
      const p = parseInt(t.dataset.page, 10);
      t.classList.toggle('active', p === n);
    });
    const fill = $('progress-fill');
    if (fill) fill.style.width = Math.round(((n + 1) / TOTAL_PAGES) * 100) + '%';
    const prev = $('prev-page'), next = $('next-page'), lbl = $('bottom-label'), bar = $('bottom-nav');
    if (n === REPORT_PAGE) {
      if (bar) bar.style.display = 'none';
      // Keep previously generated report visible across tab switches.
      if (!hasGeneratedReport) {
        const gate = reportGateCheck();
        if (!gate.ok) {
          showReportGate(gate.missing);
        } else {
          showReportPlaceholder('Click “Generate full evaluation report ↗” to calculate and publish results.');
        }
      }
    }
    else {
      if (bar) bar.style.display = 'grid';
      if (prev) prev.style.visibility = n === 0 ? 'hidden' : 'visible';
      if (next) next.textContent = n === REPORT_PAGE - 1 ? 'Generate report →' : 'Next →';
      if (lbl) lbl.textContent = 'Step ' + (n + 1) + ' of ' + (TOTAL_PAGES - 1);
    }
  }
  function go(d) {
    const nx = currentPage + d;
    if (nx === REPORT_PAGE && d > 0) {
      requestReportGeneration();
    } else {
      showPage(nx);
    }
  }

  /* ---------- slider wiring (data-output=…-out) ---------- */
  function wireSliders() {
    document.querySelectorAll('input[type="range"][data-output]').forEach((el) => {
      const out = $(el.dataset.output);
      if (!out) return;
      const id = el.id;
      const fmt = () => {
        const v = el.value;
        if (id === 't-trl') return 'TRL ' + v;
        if (id === 'm-cagr' || id === 'b-ebitda') return v + '%';
        return v + '/5';
      };
      out.textContent = fmt();
      el.addEventListener('input', () => { out.textContent = fmt(); });
    });
  }

  /* ---------- SCORING (ported from the earlier baseline implementation) ---------- */
  function techScore() {
    const trl = gu('t-trl', 3), pilot = gu('t-pilot', 0), data = gu('t-data', 2);
    const uniq = gu('t-uniq', 3), scale = gu('t-scale', 2), rel = gu('t-rel', 2);
    const iv = gu('t-iv', 0);
    const s =
      Math.round((trl / 9) * 7) +                // max 7
      Math.round((pilot / 10) * 6) +             // max 6
      Math.round(((data - 1) / 4) * 3) +         // max 3
      Math.round(((uniq - 1) / 4) * 4) +         // max 4
      Math.round(((scale - 1) / 4) * 3) +        // max 3
      (rel >= 4 ? 1 : 0) +                       // max 1 (compressed from 2)
      (iv >= 1 ? 1 : 0);                         // max 1 (newly active)
    return Math.min(25, Math.max(0, s));
  }
  function ipScore() {
    const st = gu('ip-status', 0), br = gu('ip-breadth', 0), q = gu('ip-quality', 0);
    const fto = gu('ip-fto', 0), pub = gu('ip-pub', 0), sec = gu('ip-sec', 3), org = gu('ip-origin', 0);
    const s =
      Math.min(7, st) + Math.min(4, br) + Math.min(4, q) + Math.min(4, fto) + Math.min(4, pub) +
      (sec >= 4 ? 2 : sec >= 3 ? 1 : 0) + Math.min(4, org);
    return Math.min(15, Math.max(0, s));
  }
  // Rebalanced so raw sub-score max = 20 (no truncation of high performers).
  function teamScore() {
    const exp = gu('tm-exp', 2), biz = gu('tm-biz', 2), net = gu('tm-net', 2);
    const comp = gu('tm-comp', 2), inst = gu('tm-inst', 2);
    const adv = gu('tm-adv', 0), tr = gu('tm-tr', 3), ft = gu('tm-ft', 1);
    const div = gu('tm-div', 3);
    const s =
      (exp - 1) +                                    // max 4
      Math.round(((biz - 1) / 4) * 3) +              // max 3
      Math.round(((net - 1) / 4) * 2) +              // max 2
      Math.round(((comp - 1) / 4) * 3) +             // max 3
      Math.round(((inst - 1) / 4) * 3) +             // max 3
      Math.min(2, adv) +                             // max 2
      (tr >= 3 ? 1 : 0) +                            // max 1
      Math.min(1, ft) +                              // max 1
      (div >= 3 ? 1 : 0);                            // max 1 (newly active, replaces tm-kp)
    return Math.min(20, Math.max(0, s));
  }
  function marketScore() {
    const tam = gu('m-tam', 1), sam = gu('m-sam', 1), cagr = gu('m-cagr', 12);
    const disc = gu('m-disc', 0), loi = gu('m-loi', 0), uc = gu('m-uc', 3);
    const comp = gu('m-comp', 3), pol = gu('m-pol', 1);
    const s =
      (tam - 1) + Math.round(((sam - 1) / 4) * 2) + Math.min(2, Math.round(cagr / 20)) +
      Math.min(4, disc) + Math.min(4, loi) +
      Math.round(((uc - 1) / 4) * 3) + Math.round(((comp - 1) / 4) * 3) + (pol - 1);
    return Math.min(20, Math.max(0, s));
  }
  function adoptScore() {
    const reg = gu('a-reg', 2), capex = gu('a-capex', 2), integ = gu('a-integ', 3);
    const inc = gu('a-inc', 3), sc = gu('a-sc', 2), price = gu('a-price', 2);
    const s =
      Math.round((reg - 1) * 1.2) + Math.round((capex - 1) * 1.2) +
      Math.round(((integ - 1) / 4) * 3) + Math.round(((inc - 1) / 4) * 3) +
      Math.round(((sc - 1) / 4) * 2) + (price - 1);
    return Math.min(15, Math.max(0, s));
  }
  // Rebalanced so RM/UE don't dominate (was 8/8); adds runway contribution.
  function bizScore() {
    const rm = gu('b-rm', 2), ue = gu('b-ue', 2), cas = gu('b-cas', 2), ops = gu('b-ops', 2);
    const arr = gn('b-arr', 0);
    const runway = gn('b-runway', 0);
    const s =
      Math.round(((rm - 1) / 4) * 3) +               // max 3
      Math.round(((ue - 1) / 4) * 3) +               // max 3
      Math.round(((cas - 1) / 4) * 2) +              // max 2
      Math.max(0, Math.min(3, ops - 1)) +            // max 3
      (arr > 10 ? 2 : arr > 0 ? 1 : 0) +             // max 2
      (runway >= 12 ? 2 : runway >= 6 ? 1 : 0);      // max 2
    return Math.min(15, Math.max(0, s));
  }
  function eilScore() {
    const fit = gu('e-fit', 3), epc = gu('e-epc', 1), nat = gu('e-nat', 1);
    const lic = gu('e-lic', 2), ask = gu('e-ask', 1);
    const s =
      Math.round(((fit - 1) / 4) * 3) + (epc - 1) +
      Math.round(((nat - 1) / 4) * 3) +
      (lic >= 3 ? 1 : 0) + (ask >= 3 ? 1 : 0);
    return Math.min(10, Math.max(0, s));
  }
  function totalScore() {
    return techScore() + ipScore() + teamScore() + marketScore() + adoptScore() + bizScore() + eilScore();
  }

  // Portfolio Priority Score — weighted composite used to rank saved startups
  // for investment-committee attention. Emphasises commercial readiness (CRS)
  // and strategic fit over pure tech strength.
  function priorityScore() {
    const crsN = (totalScore() / 120) * 100;
    const eilN = (eilScore() / 10) * 100;
    const techN = (techScore() / 25) * 100;
    const ipN = (ipScore() / 15) * 100;
    const mktN = (marketScore() / 20) * 100;
    return Math.round(crsN * 0.40 + eilN * 0.20 + techN * 0.15 + ipN * 0.10 + mktN * 0.15);
  }
  function priorityBucket(p) {
    if (p >= 75) return { lbl: 'High', cls: 'priority-high' };
    if (p >= 55) return { lbl: 'Mid',  cls: 'priority-mid' };
    return { lbl: 'Low', cls: 'priority-low' };
  }

  // Dynamic Weight Calibration System — re-weights modules based on TRL stage so
  // early-stage startups aren't penalised for absent market proof, and late-stage
  // startups aren't over-credited for tech that's already de-risked.
  function dwcsProfile() {
    const trl = gu('t-trl', 3);
    if (trl <= 3) return { label: 'Early (TRL 1–3)', tech: 1.3, ip: 1.3, team: 1.1, mkt: 0.7, adopt: 0.7, biz: 0.5, eil: 1.0 };
    if (trl <= 6) return { label: 'Mid (TRL 4–6)',   tech: 1.0, ip: 1.1, team: 1.1, mkt: 1.0, adopt: 1.0, biz: 0.9, eil: 1.0 };
    return         { label: 'Late (TRL 7–9)',  tech: 0.8, ip: 0.9, team: 1.0, mkt: 1.2, adopt: 1.2, biz: 1.3, eil: 1.0 };
  }
  function dwcsAdjusted() {
    const p = dwcsProfile();
    const t = techScore(), ip = ipScore(), te = teamScore(), m = marketScore();
    const a = adoptScore(), b = bizScore(), e = eilScore();
    const weighted = t * p.tech + ip * p.ip + te * p.team + m * p.mkt + a * p.adopt + b * p.biz + e * p.eil;
    const maxWeighted = 25 * p.tech + 15 * p.ip + 20 * p.team + 20 * p.mkt + 15 * p.adopt + 15 * p.biz + 10 * p.eil;
    const scaled = maxWeighted > 0 ? Math.round((weighted / maxWeighted) * 120) : 0;
    return { profile: p, raw: totalScore(), adjusted: scaled,
      rows: [
        { l: 'Technology', raw: t, max: 25, mult: p.tech },
        { l: 'IP', raw: ip, max: 15, mult: p.ip },
        { l: 'Team', raw: te, max: 20, mult: p.team },
        { l: 'Market', raw: m, max: 20, mult: p.mkt },
        { l: 'Adoption', raw: a, max: 15, mult: p.adopt },
        { l: 'Business', raw: b, max: 15, mult: p.biz },
        { l: 'Strategic Fit', raw: e, max: 10, mult: p.eil }
      ]};
  }
  // 5-band verdict — adds an elite "Investment-grade" band above 85%.
  function verdict(s) {
    const pct = (s / 120) * 100;
    if (pct >= 85) return { lbl: 'Investment-grade — deploy', c: '#0b4a24', bg: '#c5e9d0' };
    if (pct >= 75) return { lbl: 'Commercially ready', c: '#155724', bg: '#d4edda' };
    if (pct >= 58) return { lbl: 'Promising — validation needed', c: '#0c447c', bg: '#e6f1fb' };
    if (pct >= 42) return { lbl: 'High risk — conditional support', c: '#856404', bg: '#fff3cd' };
    return { lbl: 'Not commercially viable', c: '#7b1d1d', bg: '#f8d7da' };
  }
  // Engagement gate — Investor strategic fit is now a hard minimum for any engagement.
  function engagementDecision() {
    const ts = totalScore(), es = eilScore(), ips = ipScore(), tech = techScore();
    const epc = gu('e-epc', 1), ask = gu('e-ask', 1);
    if (ts < 50 || tech < 10 || es < 3) return 'reject';
    if (ts >= 85 && es >= 7 && epc >= 3) return 'equity';
    if (ts >= 70 && ips >= 10 && ask >= 3 && es >= 5) return 'license';
    if (ts >= 55 && epc >= 3 && es >= 4) return 'engineering';
    return 'watch';
  }

  /* ---------- VALUATION (config-driven) ---------- */
  function readValuationConfig() {
    return {
      dcf: {
        enabled: gc('cfg-dcf-enabled'),
        base: gu('cfg-dcf-base-discount', 35),
        terminalMult: gu('cfg-dcf-terminal-multiple', 6),
        trl13: gu('cfg-dcf-trl13', 10),
        trl45: gu('cfg-dcf-trl45', 7),
        trl67: gu('cfg-dcf-trl67', 4)
      },
      vc: { enabled: gc('cfg-vc-enabled'), irr: gu('cfg-vc-irr', 35), years: gu('cfg-vc-years', 7) },
      strategic: {
        enabled: gc('cfg-strategic-enabled'),
        eil: gu('cfg-strategic-eil', 20),
        ip: gu('cfg-strategic-ip', 10),
        team: gu('cfg-strategic-team', 5)
      },
      rev: {
        enabled: gc('cfg-rev-enabled'),
        basis: gs('cfg-rev-year', 'arr3'),
        haircut: gu('cfg-rev-haircut', 35)
      },
      berkus: { enabled: gc('cfg-berkus-enabled'), max: gu('cfg-berkus-max', 25) },
      scorecard: {
        enabled: gc('cfg-scorecard-enabled'),
        base: gu('cfg-scorecard-base', 18),
        unit: gu('cfg-scorecard-unit', 1.5)
      }
    };
  }
  function sectorMultiple() {
    const s = gs('p-sec', 'other');
    const override = $('sec-mult-' + s);
    if (override) {
      const v = parseFloat(override.value);
      if (!isNaN(v) && v > 0) return v;
    }
    return SECTOR_MULTIPLES[s] || 6;
  }
  // Tune DCF inputs for company profile. A pre-revenue TRL 3–5 startup and a
  // revenue-generating TRL 8–9 operator have fundamentally different risk, so using
  // the same 35%/6× defaults produces sub-liquidation outputs for mature companies.
  // When the tool's defaults are still in place (user hasn't explicitly tuned), apply
  // a profile-appropriate WACC/terminal. If the user has changed either field, respect
  // that choice.
  function dcfEffectiveConfig(cfg) {
    const arr0 = gn('b-arr', 0);
    const arr3 = gn('b-arr3', 0);
    const arr7 = gn('b-arr7', 0);
    const trl = gu('t-trl', 3);
    const userSetWacc = cfg.dcf.base !== 35;
    const userSetTerm = cfg.dcf.terminalMult !== 6;
    const matureRevenue = arr0 > 0 && trl >= 8;
    // Sector-tied terminal multiple. Different verticals exit at materially
    // different EBITDA multiples (water/EPC 6× vs IoT/SaaS 10–12×). Anchor mature
    // tier terminal to sectorMultiple() so advisor-grade DCFs reflect sector
    // exit reality instead of a single tech-grade 10× default.
    const secMult = sectorMultiple();
    // Pre-revenue but credibly projecting (TRL 6–7 with concrete arr3/arr7) sits
    // between mature operator and seed-stage moonshot. Standard biotech / advisory
    // DCF for this tier uses ~30% WACC, 6× terminal, and bakes risk into the base
    // WACC (no further TRL stacking) — matches transaction-advisor conventions.
    const projecting = !matureRevenue && trl >= 6 && (arr3 > 0 || arr7 > 0);
    // Embryonic tier: TRL ≤4 + no current ARR (pure pre-revenue moonshot).
    // Calibration showed Powerzest-class startups (₹0.75 Cr actual vs ₹1.2 Cr tool)
    // overshoot with default 35%/6×. Tighten to 40% WACC + 4× terminal.
    const embryonic = !matureRevenue && !projecting && trl <= 4 && arr0 === 0;
    const zeroTrl = { trl13: 0, trl45: 0, trl67: 0 };
    if (matureRevenue) {
      return {
        ...cfg.dcf,
        base: userSetWacc ? cfg.dcf.base : 25,
        terminalMult: userSetTerm ? cfg.dcf.terminalMult : secMult,
        ...(userSetWacc ? {} : zeroTrl),
        autoTuned: !userSetWacc || !userSetTerm,
        tunedWacc: !userSetWacc,
        tunedTerm: !userSetTerm,
        tier: 'mature'
      };
    }
    if (projecting) {
      return {
        ...cfg.dcf,
        base: userSetWacc ? cfg.dcf.base : 30,
        terminalMult: userSetTerm ? cfg.dcf.terminalMult : 6,
        ...(userSetWacc ? {} : zeroTrl),
        autoTuned: !userSetWacc,
        tunedWacc: !userSetWacc,
        tunedTerm: false,
        tier: 'projecting'
      };
    }
    if (embryonic) {
      return {
        ...cfg.dcf,
        base: userSetWacc ? cfg.dcf.base : 40,
        terminalMult: userSetTerm ? cfg.dcf.terminalMult : 4,
        ...(userSetWacc ? {} : zeroTrl),
        autoTuned: !userSetWacc || !userSetTerm,
        tunedWacc: !userSetWacc,
        tunedTerm: !userSetTerm,
        tier: 'embryonic'
      };
    }
    return { ...cfg.dcf, autoTuned: false, tunedWacc: false, tunedTerm: false, tier: 'early' };
  }
  function dcfValuation(cfg) {
    if (!cfg.dcf.enabled) return null;
    const eff = dcfEffectiveConfig(cfg);
    return dcfAt({ ...cfg, dcf: eff }, eff.base, eff.terminalMult);
  }
  function dcfAt(cfg, baseDiscount, terminalMult) {
    const arr3 = gn('b-arr3', 0);
    const arr7 = gn('b-arr7', 0);
    const arr0 = gn('b-arr', 0);
    const ebitda = gu('b-ebitda', 20) / 100;
    const trl = gu('t-trl', 3);
    const add = trl <= 3 ? cfg.dcf.trl13 : trl <= 5 ? cfg.dcf.trl45 : trl <= 7 ? cfg.dcf.trl67 : trl <= 8 ? 2 : 0;
    const dr = (baseDiscount + add) / 100;
    if (arr3 <= 0 && arr7 <= 0) return 0;
    // 7-year explicit forecast + terminal at end of Y7. Piecewise ramp: arr0 → arr3 over
    // Y1–Y3 (high-growth phase), arr3 → arr7 over Y4–Y7 (maturation phase). Anchoring on
    // current ARR prevents the implicit Y1 contraction defect; extending to Y7 shrinks the
    // terminal-value share of PV and aligns DCF with the VC Method's Y7 horizon.
    let r;
    if (arr7 > 0 && arr3 > 0) {
      // Preferred: both projections available — piecewise ramp.
      const startY1 = arr0 > 0 ? arr0 : arr3 * 0.33;
      const g1 = arr3 > startY1 ? Math.pow(arr3 / startY1, 1 / 3) : 1.1;
      const g2 = arr7 > arr3 ? Math.pow(arr7 / arr3, 1 / 4) : 1.05;
      const y1 = startY1 * g1;
      const y2 = y1 * g1;
      const y4 = arr3 * g2;
      const y5 = y4 * g2;
      const y6 = y5 * g2;
      r = [y1, y2, arr3, y4, y5, y6, arr7];
    } else if (arr7 > 0) {
      // arr3 missing — ramp from arr0 (or 10% of arr7) directly to arr7 over 7 years.
      const startY1 = arr0 > 0 ? arr0 : arr7 * 0.10;
      const g = arr7 > startY1 ? Math.pow(arr7 / startY1, 1 / 7) : 1.1;
      r = [];
      let cur = startY1;
      for (let i = 0; i < 7; i += 1) { cur *= g; r.push(cur); }
    } else {
      // arr7 missing — fall back to arr3-only ramp but extend to Y7 by compounding the
      // arr0→arr3 CAGR for 4 more years.
      const startY1 = arr0 > 0 ? arr0 : arr3 * 0.33;
      const g = arr3 > startY1 ? Math.pow(arr3 / startY1, 1 / 3) : 1.1;
      const y1 = startY1 * g, y2 = y1 * g;
      r = [y1, y2, arr3, arr3 * g, arr3 * g * g, arr3 * Math.pow(g, 3), arr3 * Math.pow(g, 4)];
    }
    let pv = 0;
    r.forEach((rv, i) => { pv += (rv * ebitda) / Math.pow(1 + dr, i + 1); });
    const tv = (r[6] * ebitda * terminalMult) / Math.pow(1 + dr, 7);
    return round1(pv + tv);
  }
  function dcfSensitivity(cfg) {
    if (!cfg.dcf.enabled) return null;
    const dr = cfg.dcf.base;
    const tm = cfg.dcf.terminalMult;
    const drDeltas = [-10, -5, 0, 5, 10];
    const tmDeltas = [-2, -1, 0, 1, 2];
    const rows = drDeltas.map((dd) => ({
      dr: dr + dd,
      cells: tmDeltas.map((td) => dcfAt(cfg, dr + dd, Math.max(1, tm + td)))
    }));
    return { rows, tmAxis: tmDeltas.map((td) => Math.max(1, tm + td)) };
  }
  function vcValuation(cfg) {
    if (!cfg.vc.enabled) return null;
    const arr7 = gn('b-arr7', 0);
    if (arr7 <= 0) return 0;
    const exitV = arr7 * sectorMultiple();
    const irr = cfg.vc.irr / 100;
    return round1(exitV / Math.pow(1 + irr, cfg.vc.years));
  }
  function revenueMultipleValuation(cfg) {
    if (!cfg.rev.enabled) return null;
    const basisArr = cfg.rev.basis === 'arr7'
      ? gn('b-arr7', 0)
      : cfg.rev.basis === 'arr0'
      ? gn('b-arr', 0)
      : gn('b-arr3', 0);
    if (basisArr <= 0) return 0;
    const gross = basisArr * sectorMultiple();
    // Current-ARR basis is the trailing (already-realised) number — no forward-projection
    // risk, so the standard 35% haircut would be double-counting sector risk. Use a
    // lighter illiquidity discount instead.
    const effectiveHaircut = cfg.rev.basis === 'arr0' ? Math.min(cfg.rev.haircut, 20) : cfg.rev.haircut;
    const haircut = 1 - effectiveHaircut / 100;
    return round1(gross * Math.max(0, haircut));
  }
  function berkusValuation(cfg) {
    if (!cfg.berkus.enabled) return null;
    const sound = Math.min(1, techScore() / 25);
    const proto = Math.min(1, (gu('t-pilot', 0) / 10 + (gu('t-trl', 3) >= 6 ? 1 : 0.4)) / 2);
    const team = Math.min(1, teamScore() / 20);
    const rel = Math.min(1, marketScore() / 20);
    const rollout = Math.min(1, adoptScore() / 15);
    const avg = (sound + proto + team + rel + rollout) / 5;
    return round1(cfg.berkus.max * avg);
  }
  function scorecardValuation(cfg) {
    if (!cfg.scorecard.enabled) return null;
    const normal = 12; // out of 120 target "normal" modules score
    const tech = techScore() - normal * (25 / 120);
    const team = teamScore() - normal * (20 / 120);
    const mkt = marketScore() - normal * (20 / 120);
    const adopt = adoptScore() - normal * (15 / 120);
    const biz = bizScore() - normal * (15 / 120);
    const ip = ipScore() - normal * (15 / 120);
    const eil = eilScore() - normal * (10 / 120);
    const delta = tech * 0.25 + team * 0.18 + mkt * 0.18 + adopt * 0.13 + biz * 0.13 + ip * 0.08 + eil * 0.05;
    return round1(Math.max(0, cfg.scorecard.base + delta * cfg.scorecard.unit));
  }
  function peerMultipleValuation() {
    const arr = gn('b-arr', 0);
    const mult = gn('vd-peer-multiple', 0);
    if (arr <= 0 || mult <= 0) return null;
    return round1(arr * mult * 0.80); // 20% illiquidity/size discount vs listed peers
  }
  function strategicValuation(cfg, dcfVal) {
    if (!cfg.strategic.enabled) return null;
    const base = (dcfVal != null && dcfVal > 0) ? dcfVal : (dcfValuation({ ...cfg, dcf: { ...cfg.dcf, enabled: true } }) || 0);
    const eilUp = (eilScore() / 10) * (cfg.strategic.eil / 100);
    const ipUp = (ipScore() / 15) * (cfg.strategic.ip / 100);
    const teamUp = (teamScore() / 20) * (cfg.strategic.team / 100);
    return round1(base * (1 + eilUp + ipUp + teamUp));
  }
  function round1(v) { return Math.round(v * 10) / 10; }

  /* ---------- report rendering ---------- */
  function barHTML(label, score, max, colour, confKey) {
    const pct = max > 0 ? Math.round((score / max) * 100) : 0;
    const badge = confKey ? confidenceBadge(gs(confKey, 'medium')) : '';
    return `<div class="bar-row">
      <span class="bar-label">${esc(label)}${badge}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${colour}"></div></div>
      <span class="bar-score" style="color:${colour}">${score}/${max}</span>
    </div>`;
  }
  function confidenceBadge(level) {
    const map = { high: ['confidence-high', 'High'], medium: ['confidence-med', 'Med'], low: ['confidence-low', 'Low'] };
    const [cls, label] = map[level] || map.medium;
    return ` <span class="confidence-badge ${cls}">${label} conf</span>`;
  }

  function showReportPlaceholder(message) {
    const ph = $('report-placeholder');
    const body = $('report-body');
    if (body) body.classList.add('hidden');
    if (ph) {
      ph.style.display = '';
      ph.textContent = message || 'Complete the modules and click “Generate full evaluation report” to view results.';
    }
    hasGeneratedReport = false;
  }

  function setReportBusyState(isBusy) {
    const btn = $('generate-report');
    if (!btn) return;
    btn.disabled = isBusy;
    btn.textContent = isBusy ? 'Calculating report…' : 'Generate full evaluation report ↗';
  }

  // Soft gate: report requires startup name + at least one module scored.
  // Returns { ok: bool, missing: [labels] }.
  function reportGateCheck() {
    const missing = [];
    const name = gs('p-name', '').trim();
    if (!name) missing.push('Startup name (Profile tab)');
    const sector = gs('p-sec', '').trim();
    if (!sector) missing.push('Sector selection (Profile tab)');
    const anyScore = techScore() + ipScore() + teamScore() + marketScore()
                   + adoptScore() + bizScore() + eilScore();
    if (anyScore <= 0) missing.push('At least one module scored (M1–M7)');
    return { ok: missing.length === 0, missing };
  }

  function showReportGate(missing) {
    const ph = $('report-placeholder');
    const body = $('report-body');
    if (body) body.classList.add('hidden');
    if (ph) {
      ph.style.display = '';
      ph.innerHTML = (
        '<div class="report-gate">' +
          '<div class="report-gate-title">Complete a quick startup profile to view the full report</div>' +
          '<div class="report-gate-sub">DeepTechEval needs minimum inputs before scoring, valuation and engagement recommendations can be generated.</div>' +
          '<ul class="report-gate-list">' +
            missing.map(function (m) {
              return '<li><span class="report-gate-x">•</span> ' + m + '</li>';
            }).join('') +
          '</ul>' +
          '<div class="report-gate-cta-row">' +
            '<button class="button button-primary" id="report-gate-back">← Start with Profile</button>' +
            '<a class="button" href="#waitlist">Join Pro waitlist</a>' +
          '</div>' +
        '</div>'
      );
      var back = document.getElementById('report-gate-back');
      if (back) back.addEventListener('click', function () { showPage(0); });
    }
    hasGeneratedReport = false;
  }

  function requestReportGeneration() {
    if (reportGenerationTimer) {
      clearTimeout(reportGenerationTimer);
      reportGenerationTimer = null;
    }
    const gate = reportGateCheck();
    if (!gate.ok) {
      showPage(REPORT_PAGE);
      showReportGate(gate.missing);
      setReportBusyState(false);
      return;
    }
    showPage(REPORT_PAGE);
    showReportPlaceholder('Calculating scores, valuation, and recommendations…');
    setReportBusyState(true);
    reportGenerationTimer = setTimeout(() => {
      generateReport();
      setReportBusyState(false);
      reportGenerationTimer = null;
    }, 700);
  }

  function generateReport() {
    const t = techScore(), ip = ipScore(), te = teamScore(), m = marketScore();
    const a = adoptScore(), b = bizScore(), e = eilScore();
    const tot = totalScore(), v = verdict(tot);
    const cfg = readValuationConfig();
    const dcfEff = dcfEffectiveConfig(cfg);
    const dcf = dcfValuation(cfg);
    const vc = vcValuation(cfg);
    const rev = revenueMultipleValuation(cfg);
    const berk = berkusValuation(cfg);
    const score = scorecardValuation(cfg);
    const strat = strategicValuation(cfg, dcf);
    const peer = peerMultipleValuation();
    const decision = engagementDecision();
    const name = gs('p-name', 'Unnamed Startup');
    const desc = gs('p-desc', '—');
    const trl = gu('t-trl', 3);
    const stage = gs('p-stage', 'idea');
    const sector = gs('p-sec', 'other');

    showPage(REPORT_PAGE);
    const ph = $('report-placeholder'), body = $('report-body');
    if (ph) ph.style.display = 'none';
    if (body) body.classList.remove('hidden');
    hasGeneratedReport = true;

    // header
    $('report-header').innerHTML = `
      <div>
        <div class="report-company">${esc(name)}</div>
        <div class="report-desc">${esc(desc)}</div>
        <div class="report-meta">TRL ${trl} · ${esc(stage.toUpperCase())} · ${esc(SECTOR_LABELS[sector] || 'Other')} · Total: ${tot}/120</div>
      </div>
      <div style="text-align:right">
        <span class="report-verdict" style="background:${v.bg};color:${v.c}">${v.lbl}</span>
      </div>`;

    // top metric cards
    const mets = [
      { l: 'Total CRS', v: tot, m: 120, c: '#0c2340' },
      { l: 'Technology', v: t, m: 25, c: '#185fa5' },
      { l: 'Team', v: te, m: 20, c: '#1a6b38' },
      { l: 'IP', v: ip, m: 15, c: '#534ab7' },
      { l: 'Strategic Fit', v: e, m: 10, c: '#0c447c' }
    ];
    $('report-top-metrics').innerHTML = mets.map((x) =>
      `<div class="metric-card"><div class="metric-value" style="color:${x.c}">${x.v}<small>/${x.m}</small></div><div class="metric-label">${x.l}</div></div>`
    ).join('');

    // module bars (with evidence-confidence badges)
    const modules = [
      { l: 'Technology readiness', v: t, m: 25, c: '#185fa5', k: 'conf-m1' },
      { l: 'IP & Patents', v: ip, m: 15, c: '#534ab7', k: 'conf-m2' },
      { l: 'Team & Leadership', v: te, m: 20, c: '#1a6b38', k: 'conf-m3' },
      { l: 'Market validation', v: m, m: 20, c: '#ba7517', k: 'conf-m4' },
      { l: 'Adoption feasibility', v: a, m: 15, c: '#a32d2d', k: 'conf-m5' },
      { l: 'Business model', v: b, m: 15, c: '#712b13', k: 'conf-m6' },
      { l: 'Investor strategic fit', v: e, m: 10, c: '#0c447c', k: 'conf-m7' }
    ];
    $('report-module-bars').innerHTML = modules.map((x) => barHTML(x.l, x.v, x.m, x.c, x.k)).join('');

    // radar
    if (radarChart) radarChart.destroy();
    radarChart = new Chart($('report-radar'), {
      type: 'radar',
      data: {
        labels: ['Technology', 'IP', 'Team', 'Market', 'Adoption', 'Business', 'Strategic Fit'],
        datasets: [{
          label: 'Score %',
          data: [
            Math.round((t / 25) * 100), Math.round((ip / 15) * 100),
            Math.round((te / 20) * 100), Math.round((m / 20) * 100),
            Math.round((a / 15) * 100), Math.round((b / 15) * 100),
            Math.round((e / 10) * 100)
          ],
          backgroundColor: 'rgba(12,35,64,0.12)', borderColor: '#0c2340',
          pointBackgroundColor: '#0c2340', pointRadius: 4, borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 25, color: '#888', font: { size: 9 } }, pointLabels: { font: { size: 10 }, color: '#555' } } }
      }
    });

    // team sub-scores (rebalanced — raw max 20, no truncation)
    const teamSubs = [
      { l: 'Domain expertise', v: gu('tm-exp', 2) - 1, m: 4 },
      { l: 'Commercial experience', v: Math.round(((gu('tm-biz', 2) - 1) / 4) * 3), m: 3 },
      { l: 'Industry network', v: Math.round(((gu('tm-net', 2) - 1) / 4) * 2), m: 2 },
      { l: 'Team completeness', v: Math.round(((gu('tm-comp', 2) - 1) / 4) * 3), m: 3 },
      { l: 'Institutional origin', v: Math.round(((gu('tm-inst', 2) - 1) / 4) * 3), m: 3 },
      { l: 'Advisory board', v: Math.min(2, gu('tm-adv', 0)), m: 2 },
      { l: 'Execution track record', v: gu('tm-tr', 3) >= 3 ? 1 : 0, m: 1 },
      { l: 'Full-time commitment', v: Math.min(1, gu('tm-ft', 1)), m: 1 },
      { l: 'Team diversity', v: gu('tm-div', 3) >= 3 ? 1 : 0, m: 1 }
    ];
    $('report-team-bars').innerHTML = teamSubs.map((x) => barHTML(x.l, x.v, x.m, '#1a6b38')).join('');

    // IP sub-scores
    const ipSubs = [
      { l: 'Patent filing status', v: Math.min(7, gu('ip-status', 0)), m: 7 },
      { l: 'Portfolio breadth', v: Math.min(4, gu('ip-breadth', 0)), m: 4 },
      { l: 'Claim quality', v: Math.min(4, gu('ip-quality', 0)), m: 4 },
      { l: 'FTO clearance', v: Math.min(4, gu('ip-fto', 0)), m: 4 },
      { l: 'Publications', v: Math.min(4, gu('ip-pub', 0)), m: 4 },
      { l: 'Secrecy depth', v: gu('ip-sec', 3) >= 4 ? 2 : gu('ip-sec', 3) >= 3 ? 1 : 0, m: 2 },
      { l: 'IP origin clarity', v: Math.min(4, gu('ip-origin', 0)), m: 4 }
    ];
    $('report-ip-bars').innerHTML = ipSubs.map((x) => barHTML(x.l, x.v, x.m, '#534ab7')).join('');

    // extra metrics (keep richer codex features visible)
    const extraList = [
      ['Sector', SECTOR_LABELS[sector] || 'Other'],
      ['Stage', stage.toUpperCase()],
      ['TRL', 'TRL ' + trl],
      ['Independent validation', gu('t-iv', 0) ? 'Yes' : 'No'],
      ['Manufacturing readiness', ['-', 'Low', 'Medium', 'High'][gu('t-mfg', 1)] || '-'],
      ['Paying customers today', gu('m-paying', 0) ? 'Yes' : 'No'],
      ['Current ARR (₹ Cr)', gn('b-arr', 0).toFixed(1)],
      ['Projected ARR Y3 (₹ Cr)', gn('b-arr3', 0).toFixed(1)],
      ['Projected ARR Y7 (₹ Cr)', gn('b-arr7', 0).toFixed(1)],
      ['Current monthly revenue (₹)', gn('b-monthly', 0).toLocaleString('en-IN')],
      ['Monthly burn (₹ lakhs)', gn('b-burn', 0).toFixed(1)],
      ['Cash runway (months)', gn('b-runway', 0).toFixed(0)],
      ['Founder valuation ask (₹ Cr)', gn('p-founder-ask', 0).toFixed(1)],
      ['Target customer', gs('p-target', '—')],
      ['Incubator / host', gs('p-incubator', '—')]
    ];
    $('report-extra-metrics').innerHTML = extraList.map(([k, val]) =>
      `<div class="metric-list-item"><span>${esc(k)}</span><strong>${esc(val)}</strong></div>`
    ).join('');

    // consistency / risk flags
    const flags = [];
    if (trl >= 7 && gu('t-pilot', 0) === 0) flags.push({ cls: 'risk-critical', txt: 'TRL ≥ 7 claimed but no pilot deployed — TRL claim requires scrutiny.' });
    if (gu('t-uniq', 3) >= 4 && gu('m-comp', 3) <= 2) flags.push({ cls: 'risk-watch', txt: 'High technology uniqueness claimed alongside intense competition — cross-verify differentiation claim.' });
    if (ip < 6) flags.push({ cls: 'risk-critical', txt: 'Weak IP position (' + ip + '/15). Do not commit equity before at least a complete patent filing.' });
    if (tot >= 70 && ip < 10) flags.push({ cls: 'risk-watch', txt: 'Strong overall CRS but weak IP — licensing gate requires IP ≥ 10.' });
    if (gu('m-loi', 0) === 0 && gu('m-paying', 0) === 0) flags.push({ cls: 'risk-watch', txt: 'No LOIs signed and no paying customers — market validation is below minimum bar.' });
    if (gu('tm-ft', 1) === 0) flags.push({ cls: 'risk-critical', txt: 'Founders not full-time — hard red flag for serious investors.' });
    const _rw = gn('b-runway', 0);
    if (_rw > 0 && _rw < 6) flags.push({ cls: 'risk-critical', txt: 'Cash runway below 6 months (' + _rw + 'm) — insolvency risk before next diligence cycle.' });
    else if (_rw > 0 && _rw < 12) flags.push({ cls: 'risk-watch', txt: 'Cash runway under 12 months (' + _rw + 'm) — bridge financing may be required.' });
    const _lowConf = ['conf-m1','conf-m2','conf-m3','conf-m4','conf-m5','conf-m6','conf-m7'].filter((k) => gs(k, 'medium') === 'low');
    if (_lowConf.length) {
      const modMap = { 'conf-m1': 'Tech', 'conf-m2': 'IP', 'conf-m3': 'Team', 'conf-m4': 'Market', 'conf-m5': 'Adoption', 'conf-m6': 'Business', 'conf-m7': 'EIL' };
      flags.push({ cls: 'risk-watch', txt: 'Low evidence confidence on: ' + _lowConf.map((k) => modMap[k]).join(', ') + '. Scores in these modules are founder-reported and require diligence before acting.' });
    }
    // Data Room-driven flags
    const ddMap = { 'vd-sec-dd': 'Secretarial', 'vd-ipr-dd': 'IPR', 'vd-legal-dd': 'Legal', 'vd-reg-dd': 'Regulatory', 'vd-ehs-dd': 'EHS' };
    const _ddObs = Object.keys(ddMap).filter((k) => gs(k, '') === 'observations');
    if (_ddObs.length) flags.push({ cls: 'risk-watch', txt: 'Due-diligence observations pending on: ' + _ddObs.map((k) => ddMap[k]).join(', ') + '. Review Data Room before IC.' });
    const _hasText = (id) => { const t = gs(id, '').trim().toLowerCase(); return t && t !== 'none' && t !== 'nil' && t !== 'n/a' && t !== 'na'; };
    if (_hasText('vd-legal-litigation')) flags.push({ cls: 'risk-critical', txt: 'Active/threatened legal litigation disclosed — review before equity commitment.' });
    if (_hasText('vd-ipr-litigation')) flags.push({ cls: 'risk-critical', txt: 'Active IP litigation or infringement allegations disclosed — gate the licensing decision on resolution.' });
    if (_hasText('vd-ehs-violations')) flags.push({ cls: 'risk-watch', txt: 'EHS violations / notices disclosed — quantify remediation liability before investment.' });
    const _ar = gn('vd-ar-days', 0); if (_ar > 120) flags.push({ cls: 'risk-watch', txt: 'Trade receivable days high (' + _ar + 'd) — working-capital stress risk.' });
    // market-ref divergence flag is appended after valuation block computes recValue

    // valuation cards
    // Scorecard requires a sector-comparable base to be methodologically sound. When the user
    // leaves cfg-scorecard-base at its default (₹18 Cr), the output is an unanchored CRS-weighted
    // inflation of a placeholder — surface that as a warning rather than silently reporting it.
    const scorecardUnanchored = cfg.scorecard.enabled && cfg.scorecard.base === 18;
    const scorecardWarn = scorecardUnanchored
      ? 'Base left at default (₹18 Cr) — enter a sector-comparable median (e.g. Inc42/Entrackr seed-stage median) in Valuation Config to anchor this estimate.'
      : '';
    // Going-concern sanity check: for a revenue-generating company, DCF must at least
    // exceed current ARR, otherwise the inputs (EBITDA margin, WACC, terminal multiple)
    // are producing a sub-liquidation number and the evaluator needs to re-check them.
    // Two-tier: DCF below ARR is a hard warning (sub-liquidation); DCF within 1.5× ARR
    // is a softer warning — defensible for early-stage but a symptom of pre-revenue
    // defaults leaking into a mature-company evaluation.
    const currentArr = gn('b-arr', 0);
    const dcfBelowArr = cfg.dcf.enabled && dcf != null && dcf > 0 && currentArr > 0 && dcf < currentArr;
    const dcfNearArr = cfg.dcf.enabled && dcf != null && dcf > 0 && currentArr > 0 && !dcfBelowArr && dcf <= 1.5 * currentArr;
    const dcfWarn = dcfBelowArr
      ? `DCF (₹${dcf.toFixed(1)} Cr) is below current ARR (₹${currentArr.toFixed(1)} Cr) — re-check EBITDA margin, WACC, and terminal multiple in Valuation Config before citing this number.`
      : dcfNearArr
      ? `DCF (₹${dcf.toFixed(1)} Cr) is within 1.5× current ARR (₹${currentArr.toFixed(1)} Cr) — typical symptom of pre-revenue config defaults. If evaluating a revenue-generating business, tune WACC and terminal multiple in Valuation Config for a defensible number.`
      : '';
    const dcfNoteSuffix = dcfEff.autoTuned
      ? dcfEff.tier === 'mature'
        ? ` · auto-tuned for TRL ${gu('t-trl', 3)} + revenue-generating profile (WACC 25%, terminal ${dcfEff.terminalMult}× sector EBITDA, TRL premium suppressed)`
        : dcfEff.tier === 'projecting'
        ? ` · auto-tuned for TRL ${gu('t-trl', 3)} + projecting profile (WACC 30%, terminal ${dcfEff.terminalMult}×, TRL premium suppressed — advisor-aligned)`
        : ''
      : '';
    const dcfWarnLevel = dcfBelowArr ? 'hard' : dcfNearArr ? 'soft' : '';
    const valRows = [
      { k: 'dcf', l: 'Risk-adjusted DCF', v: dcf, n: `WACC ${dcfEff.base}%${dcfEff.autoTuned ? '' : '+TRL-risk'} · terminal ${dcfEff.terminalMult}× · 7-yr explicit · arr0→arr3→arr7 ramp${dcfNoteSuffix}`, warn: dcfWarn, warnLevel: dcfWarnLevel },
      { k: 'vc', l: 'VC Method', v: vc, n: `${cfg.vc.years}-yr exit · ${cfg.vc.irr}% IRR · sector multiple` },
      { k: 'strategic', l: 'Strategic Value (the investor)', v: strat, n: 'DCF + the investor/IP/team uplift' },
      { k: 'rev', l: 'Revenue Multiple', v: rev, n: `${cfg.rev.basis === 'arr7' ? 'Y7' : cfg.rev.basis === 'arr0' ? 'Current' : 'Y3'} ARR × sector mult · ${cfg.rev.basis === 'arr0' ? Math.min(cfg.rev.haircut, 20) : cfg.rev.haircut}% haircut` },
      { k: 'berkus', l: 'Berkus', v: berk, n: `Max ₹${cfg.berkus.max} Cr · early-stage` },
      { k: 'scorecard', l: 'Scorecard', v: score, n: `Base ₹${cfg.scorecard.base} Cr · delta ×${cfg.scorecard.unit}`, warn: scorecardWarn, warnLevel: scorecardUnanchored ? 'hard' : '' },
      { k: 'peer', l: 'Peer multiple', v: peer, n: `ARR × ${gn('vd-peer-multiple', 0)}× peer × 0.80 illiquidity discount` }
    ].filter((r) => r.v != null);

    // Recommended valuation method — CRS-driven, with TRL as a secondary guard.
    // Rationale: commercial readiness score is a better proxy for which valuation
    // lens reflects reality than TRL alone (a high-TRL tech with weak team/market
    // should still be valued via Scorecard, not DCF).
    let recommendedKey;
    if (tot >= 85 && trl >= 7) recommendedKey = 'dcf';
    else if (tot >= 70 && trl >= 5) recommendedKey = 'vc';
    else if (tot >= 50) recommendedKey = 'scorecard';
    else recommendedKey = 'berkus';
    // Demote DCF when Peer Multiple (anchored on direct listed comparables × current ARR)
    // produces a materially higher value. DCF's forward-projection assumptions break down for
    // mature revenue-generating companies where listed-peer multiples are a more reliable
    // lens — recommending a DCF that prices the business below its peer-implied floor is a
    // methodological failure regardless of what CRS/TRL suggest.
    let demotedFrom = null;
    if (recommendedKey === 'dcf' && peer != null && peer > 0 && dcf != null && dcf > 0 && dcf < 0.5 * peer && currentArr > 0) {
      demotedFrom = 'dcf';
      recommendedKey = 'peer';
    }
    const marketRef = gn('vd-market-ref', 0);
    const marketRefNote = gs('vd-market-ref-note', '');
    const recValue = (valRows.find((r) => r.k === recommendedKey) || {}).v || 0;
    let refCard = '';
    if (marketRef > 0) {
      const gap = recValue > 0 ? (marketRef / recValue) : 0;
      const gapTxt = gap > 0 ? (gap >= 1 ? `${gap.toFixed(1)}× above tool` : `${(1 / gap).toFixed(1)}× below tool`) : '—';
      const gapColor = gap >= 2 || (gap > 0 && gap <= 0.5) ? '#a32d2d' : gap >= 1.3 || gap <= 0.77 ? '#a36d17' : '#155724';
      refCard = `<div class="valuation-card" style="border-color:${gapColor};background:#fffbea">
        <div class="valuation-kicker">Market reference · sanity check</div>
        <div class="valuation-value">₹${marketRef.toFixed(1)} Cr</div>
        <div class="valuation-note" style="color:${gapColor}"><strong>${esc(gapTxt)}</strong>${marketRefNote ? ' · ' + esc(marketRefNote) : ''}</div>
      </div>`;
    }
    $('report-valuations').innerHTML = valRows.map((r) => {
      const rec = r.k === recommendedKey;
      const warned = !!r.warn;
      const level = r.warnLevel || (warned ? 'hard' : '');
      // Warning style wins over recommended style — an unanchored estimate shouldn't be
      // celebrated, even if it's what CRS picked. Hard warnings use amber card; soft
      // warnings keep a neutral card but carry an amber note.
      const cardStyle = level === 'hard'
        ? 'border-color:#a36d17;background:#fff8e6;'
        : rec ? 'border-color:#1a6b38;background:#f0fbf4;' : '';
      const kickerSuffix = level === 'hard'
        ? ' · illustrative only'
        : level === 'soft'
        ? ' · review inputs'
        : rec ? ' · recommended' : '';
      const warnHeader = level === 'hard' ? '⚠ Unanchored' : level === 'soft' ? 'ℹ Sanity check' : '';
      const warnNote = warned
        ? `<div class="valuation-note" style="color:#a36d17;margin-top:4px"><strong>${warnHeader}</strong> · ${esc(r.warn)}</div>`
        : '';
      return `<div class="valuation-card${rec ? ' recommended' : ''}" style="${cardStyle}">
        <div class="valuation-kicker">${esc(r.l)}${kickerSuffix}</div>
        <div class="valuation-value">₹${r.v > 0 ? r.v.toFixed(1) : '—'} Cr</div>
        <div class="valuation-note">${esc(r.n)}</div>
        ${warnNote}
      </div>`;
    }).join('') + refCard;

    // Finalise risk flags now that market-ref comparison is available
    if (marketRef > 0 && recValue > 0) {
      const _g = marketRef / recValue;
      if (_g >= 3 || _g <= 0.33) flags.push({ cls: 'risk-watch', txt: 'Market reference diverges >3× from tool estimate (' + _g.toFixed(1) + '×) — triangulate before pricing the deal.' });
    }
    if (recommendedKey === 'scorecard' && scorecardUnanchored) {
      flags.push({ cls: 'risk-watch', txt: 'Scorecard is the recommended method but its base (₹18 Cr) is still the tool default — enter a sector-comparable median in Valuation Config before citing this number externally.' });
    }
    if (dcfBelowArr) {
      flags.push({ cls: 'risk-watch', txt: 'DCF (₹' + dcf.toFixed(1) + ' Cr) falls below current ARR (₹' + currentArr.toFixed(1) + ' Cr) — inputs are implying sub-liquidation value. Re-check EBITDA margin, WACC, and terminal multiple before using this number.' });
    }
    if (demotedFrom === 'dcf') {
      flags.push({ cls: 'risk-info', txt: 'Recommendation switched from DCF (₹' + dcf.toFixed(1) + ' Cr) to Peer Multiple (₹' + peer.toFixed(1) + ' Cr) — DCF priced the company below 50% of its peer-implied value, so the peer lens is methodologically more reliable for this revenue-generating profile.' });
    }
    // Revenue Multiple basis nudge — for mature revenue-generating companies, a Year-3 or
    // Year-7 projection base is the wrong lens; current (trailing) ARR × sector multiple is
    // how listed comparables are priced.
    if (cfg.rev.enabled && trl >= 8 && currentArr > 0 && cfg.rev.basis !== 'arr0') {
      flags.push({ cls: 'risk-info', txt: 'Revenue Multiple is using ' + (cfg.rev.basis === 'arr7' ? 'Year 7' : 'Year 3') + ' projected ARR, but this company is TRL ' + trl + ' with current ARR of ₹' + currentArr.toFixed(1) + ' Cr. Switch "Projection basis" in Valuation Config to "Use current ARR" — mature revenue-generating companies are priced off trailing revenue, not forward projections.' });
    }
    if (!flags.length) flags.push({ cls: 'risk-info', txt: 'No critical consistency issues detected.' });
    $('report-risk-flags').innerHTML = flags.map((f) => `<div class="risk-flag ${f.cls}">${esc(f.txt)}</div>`).join('');

    // DCF sensitivity table
    const sens = dcfSensitivity(cfg);
    const sensHolder = $('report-dcf-sensitivity');
    if (sensHolder) {
      if (sens && (gn('b-arr3', 0) > 0 || gn('b-arr7', 0) > 0)) {
        const header = '<th>Discount \\ Terminal ×</th>' + sens.tmAxis.map((t) => `<th>${t}×</th>`).join('');
        const body = sens.rows.map((r) => `<tr><th>${r.dr}%</th>${r.cells.map((c) => `<td>₹${c.toFixed(0)}</td>`).join('')}</tr>`).join('');
        sensHolder.innerHTML = `<div style="margin-top:14px;font-size:11px;color:var(--text-tertiary);margin-bottom:6px">DCF sensitivity · rows = base discount rate, columns = terminal EBITDA multiple. Values in ₹ Cr.</div>
          <table class="portfolio-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
      } else {
        sensHolder.innerHTML = '';
      }
    }

    // Data Room summary
    const drHolder = $('report-dataroom');
    if (drHolder) {
      const ddLabel = (v) => ({ 'not-started': 'Not started', 'in-progress': 'In progress', 'clean': 'Clean', 'observations': 'Observations pending' }[v] || '—');
      const sections = [
        { title: 'A · Valuation metadata', items: [
          ['Date of valuation', gs('vd-date', '')],
          ['CIN', gs('vd-cin', '')],
          ['Startup India benefit', gs('vd-startup-india', '')],
          ['Audited financials', gs('vd-audit-years', '')],
          ['Market reference (₹ Cr)', gn('vd-market-ref', 0) > 0 ? gn('vd-market-ref', 0).toFixed(1) + ' — ' + gs('vd-market-ref-note', '') : ''],
          ['Brief profile', gs('vd-profile', '')]
        ]},
        { title: 'B · Shareholding & securities', items: [
          ['Cap table', gs('vd-captable', '')],
          ['CCD / convertible terms', gs('vd-ccd-terms', '')],
          ['Fair value of investments (₹ Cr)', gn('vd-invest-fv', 0) > 0 ? gn('vd-invest-fv', 0).toFixed(1) : ''],
          ['Land value (₹ Cr)', gn('vd-land-value', 0) > 0 ? gn('vd-land-value', 0).toFixed(1) : '']
        ]},
        { title: 'C · Historical & current financials', items: [
          ['Current investments', gs('vd-current-invest', '')],
          ['Other income', gs('vd-other-income', '')],
          ['Current projects & booking', gs('vd-current-projects', '')]
        ]},
        { title: 'D · Projections', items: [
          ['Horizon (yrs)', gs('vd-proj-years', '')],
          ['Revenue CAGR (%)', gs('vd-proj-rev-growth', '')],
          ['Purchases % of sales', gs('vd-purchases-pct', '')],
          ['Assumptions', gs('vd-proj-assumptions', '')],
          ['Cost drivers', gs('vd-major-cost-drivers', '')],
          ['Additional expenses', gs('vd-addl-expenses', '')],
          ['Current salary (₹ Cr/yr)', gn('vd-salary-now', 0) > 0 ? gn('vd-salary-now', 0).toFixed(1) : ''],
          ['Hires cost (₹ Cr)', gn('vd-hires-cost', 0) > 0 ? gn('vd-hires-cost', 0).toFixed(1) : ''],
          ['Salary bifurcation', gs('vd-salary-bifurc', '')],
          ['Additional hires plan', gs('vd-hires-needed', '')]
        ]},
        { title: 'E · Working capital', items: [
          ['AR days', gs('vd-ar-days', '')],
          ['AP days', gs('vd-ap-days', '')],
          ['Other expense days', gs('vd-exp-days', '')],
          ['Inventory days', gs('vd-inv-days', '')]
        ]},
        { title: 'F · Debt & financing', items: [
          ['Secured loans', gs('vd-secured-loans', '')],
          ['Unsecured loans', gs('vd-unsecured-loans', '')],
          ['Additional loan required (₹ Cr)', gn('vd-addl-loan', 0) > 0 ? gn('vd-addl-loan', 0).toFixed(1) : ''],
          ['Financing structure', gs('vd-financing', '')]
        ]},
        { title: 'G · Secretarial DD', items: [
          ['Status', ddLabel(gs('vd-sec-dd', ''))],
          ['Reviewer', gs('vd-sec-reviewer', '')],
          ['Observations', gs('vd-sec-dd-notes', '')]
        ]},
        { title: 'H · IPR DD', items: [
          ['Status', ddLabel(gs('vd-ipr-dd', ''))],
          ['Counsel', gs('vd-ipr-reviewer', '')],
          ['Litigation', gs('vd-ipr-litigation', '')],
          ['Liens / licences-out', gs('vd-ipr-liens', '')],
          ['Data privacy', gs('vd-ipr-privacy', '')],
          ['Notes', gs('vd-ipr-notes', '')]
        ]},
        { title: 'I · Legal DD', items: [
          ['Status', ddLabel(gs('vd-legal-dd', ''))],
          ['Counsel', gs('vd-legal-reviewer', '')],
          ['Material contracts', gs('vd-legal-material-contracts', '')],
          ['Related-party', gs('vd-legal-related-party', '')],
          ['Litigation', gs('vd-legal-litigation', '')],
          ['Notes', gs('vd-legal-notes', '')]
        ]},
        { title: 'J · Regulatory DD', items: [
          ['Status', ddLabel(gs('vd-reg-dd', ''))],
          ['Consultant', gs('vd-reg-reviewer', '')],
          ['FEMA / RBI', gs('vd-reg-fema', '')],
          ['Licences', gs('vd-reg-licences', '')],
          ['Labour', gs('vd-reg-labour', '')],
          ['Notes', gs('vd-reg-notes', '')]
        ]},
        { title: 'K · EHS DD', items: [
          ['Status', ddLabel(gs('vd-ehs-dd', ''))],
          ['Consultant', gs('vd-ehs-reviewer', '')],
          ['Consents', gs('vd-ehs-consents', '')],
          ['Audits', gs('vd-ehs-audits', '')],
          ['Violations', gs('vd-ehs-violations', '')],
          ['Notes', gs('vd-ehs-notes', '')]
        ]},
        { title: 'L · Peer comparables', items: [
          ['Peers', gs('vd-peers', '')],
          ['Median peer EV/Revenue multiple', gn('vd-peer-multiple', 0) > 0 ? gn('vd-peer-multiple', 0).toFixed(1) + '×' : '']
        ]}
      ];
      let completed = 0, total = 0;
      sections.forEach((sec) => sec.items.forEach(([, v]) => { total++; if (String(v || '').trim() && String(v).trim() !== '—') completed++; }));
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      const html = sections.map((sec) => {
        const rows = sec.items.filter(([, v]) => String(v || '').trim() && String(v).trim() !== '—')
          .map(([k, v]) => `<div class="metric-list-item"><span>${esc(k)}</span><strong style="max-width:60%;text-align:right;word-break:break-word;white-space:normal">${esc(v)}</strong></div>`).join('');
        if (!rows) return '';
        return `<div style="margin-bottom:14px"><div class="section-title" style="margin-top:0">${esc(sec.title)}</div><div class="metric-list">${rows}</div></div>`;
      }).filter(Boolean).join('');
      drHolder.innerHTML = `<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:10px">Completeness: <strong>${completed}/${total}</strong> fields filled (${pct}%). Empty fields are hidden below.</div>${html || '<div class="metric-list-item"><em>No Data Room fields populated.</em></div>'}`;
    }

    if (valChart) valChart.destroy();
    valChart = new Chart($('report-valuations-chart'), {
      type: 'bar',
      data: {
        labels: valRows.map((r) => r.l),
        datasets: [{
          data: valRows.map((r) => r.v || 0),
          backgroundColor: ['#185fa5', '#ba7517', '#155724', '#534ab7', '#a32d2d', '#712b13'].slice(0, valRows.length),
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { callback: (v) => '₹' + v + 'Cr', font: { size: 9 } } },
          y: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });

    // engagement cards
    const engOpts = [
      { k: 'equity', t: 'Equity investment', cond: 'CRS ≥ 85 · Strategic Fit ≥ 7 · EPC ≥ 3', rec: 'Milestone-based tranches; IP co-dev clause; board observer; ROFR on EPCM.', col: '#0c447c', bg: '#e6f1fb' },
      { k: 'license', t: 'Licensing agreement', cond: 'CRS ≥ 70 · IP ≥ 10 · Strategic Fit ≥ 5 · founder willing', rec: 'Exclusive field-of-use license; royalty escalators; independent IP valuation.', col: '#633806', bg: '#faeeda' },
      { k: 'engineering', t: 'Engineering partnership', cond: 'CRS ≥ 55 · EPC ≥ 3 · Strategic Fit ≥ 4', rec: 'MSA with preferred-technology status; integrate in 1–2 upcoming projects.', col: '#155724', bg: '#d4edda' },
      { k: 'reject', t: 'Reject / watch list', cond: 'CRS < 50 · Tech < 10 · or Strategic Fit < 3', rec: 'Structured gap analysis; 6-month watch; re-evaluate.', col: '#7b1d1d', bg: '#f8d7da' },
      { k: 'watch', t: 'Hold / further validation', cond: 'Does not meet above gates', rec: 'Request diligence data; monitor for 3 months.', col: '#856404', bg: '#fff3cd' }
    ];
    $('report-engagement').innerHTML = engOpts.map((x) => {
      const rec = x.k === decision;
      return `<div class="engagement-card${rec ? ' recommended' : ''}" style="${rec ? 'border-color:' + x.col + ';background:' + x.bg : ''}">
        <div class="engagement-title" style="color:${x.col}">${esc(x.t)}${rec ? '<span class="small-badge" style="background:' + x.col + ';color:#fff">Recommended</span>' : ''}</div>
        <div class="engagement-note">${esc(x.cond)}</div>
        <div class="engagement-note">${esc(x.rec)}</div>
      </div>`;
    }).join('');

    // risk matrix
    const rMat = [
      { l: 'Technology risk', v: trl <= 3 ? 'Very High' : trl <= 5 ? 'High' : trl <= 7 ? 'Moderate' : 'Low', hi: trl <= 4, lo: trl >= 7 },
      { l: 'Team risk', v: te < 8 ? 'High' : te < 14 ? 'Moderate' : 'Low', hi: te < 8, lo: te >= 14 },
      { l: 'IP risk', v: ip < 5 ? 'Very High' : ip < 9 ? 'High' : ip < 12 ? 'Moderate' : 'Low', hi: ip < 7, lo: ip >= 12 },
      { l: 'Market risk', v: m < 8 ? 'High' : m < 14 ? 'Moderate' : 'Low', hi: m < 8, lo: m >= 14 },
      { l: 'Adoption risk', v: a < 6 ? 'High' : a < 11 ? 'Moderate' : 'Low', hi: a < 6, lo: a >= 11 },
      { l: 'Commercial risk', v: b < 5 ? 'High' : b < 10 ? 'Moderate' : 'Low', hi: b < 5, lo: b >= 10 }
    ];
    $('report-risk-matrix').innerHTML = `<div class="risk-grid">${rMat.map((r) => {
      const c = r.hi ? '#a32d2d' : r.lo ? '#155724' : '#856404';
      return `<div class="risk-row"><span>${esc(r.l)}</span><span style="color:${c};font-weight:700">${esc(r.v)}</span></div>`;
    }).join('')}</div>`;

    // recommendations
    const recs = [];
    if (t < 12) recs.push({ cls: 'risk-critical', txt: 'Tech readiness ' + t + '/25 is low at TRL ' + trl + '. Support via pilot, not equity, until TRL ≥ 6 with third-party data.' });
    if (ip < 6) recs.push({ cls: 'risk-critical', txt: 'IP protection critically weak (' + ip + '/15). Require a complete patent application before any commitment.' });
    if (te < 8) recs.push({ cls: 'risk-watch', txt: 'Team gaps (' + te + '/20). Require commercial co-founder hire as pre-condition.' });
    if (te >= 15) recs.push({ cls: 'risk-info', txt: 'Strong team (' + te + '/20) — a primary investment signal.' });
    if (ip >= 10) recs.push({ cls: 'risk-info', txt: 'Strong IP (' + ip + '/15). Negotiate exclusive field-of-use licensing as part of any term sheet.' });
    if (m < 8) recs.push({ cls: 'risk-watch', txt: 'Market validation insufficient (' + m + '/20). Require 3 signed LOIs before term sheet.' });
    if (e >= 7) recs.push({ cls: 'risk-info', txt: 'High strategic fit (' + e + '/10). Anchor EPCM partnership recommended.' });
    if (decision === 'equity') recs.push({ cls: 'risk-info', txt: 'Recommended: Equity. 3 milestone tranches + IP co-dev + board observer + ROFR on EPCM. Range ~₹' + (dcf || 0).toFixed(1) + '–₹' + (strat || 0).toFixed(1) + ' Cr.' });
    if (decision === 'license') recs.push({ cls: 'risk-info', txt: 'Recommended: Licensing. 7-yr exclusive field-of-use with royalty escalators; independent IP valuation.' });
    if (decision === 'engineering') recs.push({ cls: 'risk-info', txt: 'Recommended: Engineering partnership. MSA with preferred-technology status.' });
    if (decision === 'reject') recs.push({ cls: 'risk-critical', txt: 'Recommended: Reject. CRS ' + tot + '/120 · Tech ' + t + '/25 · Strategic Fit ' + e + '/10 — below minimum gate.' });
    if (decision === 'watch') recs.push({ cls: 'risk-watch', txt: 'Recommended: Hold. Does not yet clear equity/license/partner gates; re-evaluate after validation milestones.' });
    $('report-recommendations').innerHTML = recs.map((r) => `<div class="recommendation-note ${r.cls}">${esc(r.txt)}</div>`).join('');

    // DWCS (stage-adjusted CRS)
    renderDwcs();

    // portfolio snapshot
    renderPortfolioTable();

    // footer
    $('report-footer').innerHTML = `DeepTechEval Platform · Evaluator: ${esc(gs('p-eval', 'the investor Strategy'))} · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · Confidential — internal use only`;

    // commercial lock — blur the real report unless email captured
    applyReportLock();
  }

  /* ---------- Report lock (email-gated full report) ---------- */
  const EMAIL_UNLOCK_KEY = 'dte.emailUnlocked';
  function isReportUnlocked() {
    try { return localStorage.getItem(EMAIL_UNLOCK_KEY) === '1'; } catch (_) { return false; }
  }
  function applyReportLock() {
    const body = $('report-body');
    if (!body) return;
    // Strip any previous overlay
    const prev = document.getElementById('report-lock-overlay');
    if (prev) prev.remove();
    if (isReportUnlocked()) {
      body.classList.remove('locked');
      return;
    }
    body.classList.add('locked');
    const name = gs('p-name', 'your startup');
    const overlay = document.createElement('div');
    overlay.id = 'report-lock-overlay';
    overlay.className = 'report-lock-overlay';
    overlay.innerHTML = (
      '<div class="report-lock-card">' +
        '<div class="report-lock-eyebrow">Personalised report ready</div>' +
        '<div class="report-lock-title">Unlock the full report for ' + esc(name) + '</div>' +
        '<div class="report-lock-sub">' +
          'Free beta unlocks the complete scoring breakdown, valuation range, ' +
          'engagement recommendation and risk flags. One email — no spam.' +
        '</div>' +
        '<form name="report-unlock" method="POST" data-netlify="true" class="report-lock-form">' +
          '<input type="hidden" name="form-name" value="report-unlock" />' +
          '<input type="hidden" name="startup-name" value="' + esc(name) + '" />' +
          '<input type="email" name="email" required placeholder="analyst@yourfund.com" />' +
          '<button type="submit" class="button button-primary">Unlock report →</button>' +
        '</form>' +
        '<div class="report-lock-sample">' +
          '<a href="#" id="report-lock-sample-link">See a sample report (Acme Hydrogen demo) →</a>' +
        '</div>' +
        '<div class="report-lock-fineprint">Already unlocked? <a href="#" id="report-lock-restore">Restore access</a></div>' +
      '</div>'
    );
    body.parentNode.insertBefore(overlay, body);

    // Intercept form submit — capture via Netlify Forms in background, unlock locally
    const form = overlay.querySelector('form');
    if (form) {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const data = new FormData(form);
        try {
          fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data).toString()
          });
        } catch (_) {}
        try { localStorage.setItem(EMAIL_UNLOCK_KEY, '1'); } catch (_) {}
        setStatus('Report unlocked. Thanks for joining the beta.');
        applyReportLock();
      });
    }

    // Sample-report link → load demo (GreenH2) into fields + re-generate
    const sampleLink = overlay.querySelector('#report-lock-sample-link');
    if (sampleLink) {
      sampleLink.addEventListener('click', function (ev) {
        ev.preventDefault();
        const demo = savedStartups.find(function (s) { return s.name === 'GreenH2 Technologies'; });
        if (demo) {
          loadStartup(demo.id);
          setStatus('Sample loaded — scroll to view a fully filled-in report');
          requestReportGeneration();
        } else {
          setStatus('Sample data unavailable — clear localStorage to reseed demos');
        }
      });
    }

    const restoreLink = overlay.querySelector('#report-lock-restore');
    if (restoreLink) {
      restoreLink.addEventListener('click', function (ev) {
        ev.preventDefault();
        try { localStorage.setItem(EMAIL_UNLOCK_KEY, '1'); } catch (_) {}
        applyReportLock();
        setStatus('Access restored');
      });
    }
  }

  function renderDwcs() {
    const holder = $('report-dwcs');
    if (!holder) return;
    const d = dwcsAdjusted();
    const delta = d.adjusted - d.raw;
    const deltaLbl = delta === 0 ? 'no change' : (delta > 0 ? '+' + delta : String(delta));
    const rows = d.rows.map((r) => `<div class="dwcs-row">
      <span class="dwcs-name">${esc(r.l)}</span>
      <span class="dwcs-mult">×${r.mult.toFixed(1)}</span>
      <span class="dwcs-score">${r.raw}/${r.max}</span>
    </div>`).join('');
    holder.innerHTML = `<div class="dwcs-panel">
      <div style="font-size:12px;color:var(--text-tertiary);margin-bottom:8px">
        Stage profile: <strong style="color:var(--navy)">${esc(d.profile.label)}</strong> — module weights re-normalised so scores reflect what matters at this TRL.
      </div>
      ${rows}
      <div class="dwcs-summary">
        <span>Raw CRS: <strong>${d.raw}/120</strong></span>
        <span>Stage-adjusted CRS: <strong>${d.adjusted}/120</strong> (${esc(deltaLbl)})</span>
      </div>
    </div>`;
  }

  function renderPortfolioTable() {
    const holder = $('report-portfolio');
    if (!holder) return;
    if (!savedStartups.length) { holder.innerHTML = '<div style="font-size:12px;color:var(--text-tertiary)">No saved startups yet. Save the current evaluation from the Profile tab to build a portfolio view.</div>'; return; }
    // Compute priority for each saved startup (handles legacy records without it).
    const withPriority = savedStartups.map((s) => {
      let p = typeof s.priority === 'number' ? s.priority : null;
      if (p === null && s.form) p = summariseForm(s.form).priority;
      return { ...s, priority: p || 0 };
    }).sort((a, b) => b.priority - a.priority);
    const rows = withPriority.map((s) => {
      const bucket = priorityBucket(s.priority);
      return `<tr>
        <td>${esc(s.name || 'Unnamed')}</td>
        <td>${esc(s.sector || '-')}</td>
        <td>${s.total}/120</td>
        <td class="priority-cell ${bucket.cls}">${s.priority} (${bucket.lbl})</td>
        <td>${esc(s.verdict)}</td>
        <td>${esc(s.decision)}</td>
      </tr>`;
    }).join('');
    holder.innerHTML = `<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:8px">
      Priority = CRS×40% + the investor×20% + Tech×15% + Market×15% + IP×10%. Ranked descending.
    </div>
    <table class="portfolio-table">
      <thead><tr><th>Startup</th><th>Sector</th><th>CRS</th><th>Priority</th><th>Verdict</th><th>Decision</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  /* ---------- Saved startups (localStorage) ---------- */
  const FIELD_IDS = [
    'p-name', 'p-yr', 'p-desc', 'p-target', 'p-incubator', 'p-sec', 'p-stage', 'p-hq', 'p-eval', 'p-founder-ask', 'p-notes',
    't-trl', 't-pilot', 't-iv', 't-data', 't-uniq', 't-scale', 't-mfg', 't-rel', 't-benchmarks',
    'ip-status', 'ip-breadth', 'ip-quality', 'ip-fto', 'ip-pub', 'ip-origin', 'ip-sec',
    'tm-exp', 'tm-biz', 'tm-net', 'tm-comp', 'tm-inst', 'tm-div', 'tm-adv', 'tm-tr', 'tm-ft',
    'm-tam', 'm-sam', 'm-cagr', 'm-disc', 'm-loi', 'm-paying', 'm-uc', 'm-comp', 'm-pol',
    'a-reg', 'a-capex', 'a-integ', 'a-inc', 'a-sc', 'a-price',
    'b-rm', 'b-ue', 'b-cas', 'b-ops', 'b-arr', 'b-arr3', 'b-arr7', 'b-monthly', 'b-ebitda', 'b-burn', 'b-runway',
    'e-fit', 'e-epc', 'e-nat', 'e-lic', 'e-ask',
    'conf-m1', 'conf-m2', 'conf-m3', 'conf-m4', 'conf-m5', 'conf-m6', 'conf-m7',
    'vd-date', 'vd-cin', 'vd-startup-india', 'vd-audit-years', 'vd-profile', 'vd-market-ref', 'vd-market-ref-note',
    'vd-captable', 'vd-ccd-terms', 'vd-invest-fv', 'vd-land-value',
    'vd-current-invest', 'vd-other-income', 'vd-current-projects',
    'vd-proj-years', 'vd-proj-rev-growth', 'vd-purchases-pct', 'vd-proj-assumptions',
    'vd-major-cost-drivers', 'vd-addl-expenses', 'vd-salary-now', 'vd-hires-cost',
    'vd-salary-bifurc', 'vd-hires-needed',
    'vd-ar-days', 'vd-ap-days', 'vd-exp-days', 'vd-inv-days',
    'vd-secured-loans', 'vd-unsecured-loans', 'vd-addl-loan', 'vd-financing',
    'vd-sec-dd', 'vd-sec-reviewer', 'vd-sec-dd-notes',
    'vd-ipr-dd', 'vd-ipr-reviewer', 'vd-ipr-litigation', 'vd-ipr-liens', 'vd-ipr-privacy', 'vd-ipr-notes',
    'vd-legal-dd', 'vd-legal-reviewer', 'vd-legal-material-contracts', 'vd-legal-related-party', 'vd-legal-litigation', 'vd-legal-notes',
    'vd-reg-dd', 'vd-reg-reviewer', 'vd-reg-fema', 'vd-reg-licences', 'vd-reg-labour', 'vd-reg-notes',
    'vd-ehs-dd', 'vd-ehs-reviewer', 'vd-ehs-consents', 'vd-ehs-audits', 'vd-ehs-violations', 'vd-ehs-notes',
    'vd-peers', 'vd-peer-multiple'
  ];
  const CFG_IDS = [
    'cfg-dcf-enabled', 'cfg-dcf-base-discount', 'cfg-dcf-terminal-multiple', 'cfg-dcf-trl13', 'cfg-dcf-trl45', 'cfg-dcf-trl67',
    'cfg-vc-enabled', 'cfg-vc-irr', 'cfg-vc-years',
    'cfg-strategic-enabled', 'cfg-strategic-eil', 'cfg-strategic-ip', 'cfg-strategic-team',
    'cfg-rev-enabled', 'cfg-rev-year', 'cfg-rev-haircut',
    'cfg-berkus-enabled', 'cfg-berkus-max',
    'cfg-scorecard-enabled', 'cfg-scorecard-base', 'cfg-scorecard-unit'
  ];
  const CFG_DEFAULTS = {
    'cfg-dcf-enabled': true,
    'cfg-dcf-base-discount': '35',
    'cfg-dcf-terminal-multiple': '6',
    'cfg-dcf-trl13': '10',
    'cfg-dcf-trl45': '7',
    'cfg-dcf-trl67': '4',
    'cfg-vc-enabled': true,
    'cfg-vc-irr': '35',
    'cfg-vc-years': '7',
    'cfg-strategic-enabled': true,
    'cfg-strategic-eil': '20',
    'cfg-strategic-ip': '10',
    'cfg-strategic-team': '5',
    'cfg-rev-enabled': true,
    'cfg-rev-year': 'arr3',
    'cfg-rev-haircut': '35',
    'cfg-berkus-enabled': true,
    'cfg-berkus-max': '25',
    'cfg-scorecard-enabled': true,
    'cfg-scorecard-base': '18',
    'cfg-scorecard-unit': '1.5'
  };

  function snapshotForm() {
    const data = {};
    FIELD_IDS.forEach((id) => { const el = $(id); if (el) data[id] = el.value; });
    CFG_IDS.forEach((id) => { const el = $(id); if (!el) return; data[id] = el.type === 'checkbox' ? el.checked : el.value; });
    // sector multiples overrides
    data.__sectorMultiples = {};
    Object.keys(SECTOR_MULTIPLES).forEach((k) => {
      const el = $('sec-mult-' + k);
      if (el) data.__sectorMultiples[k] = el.value;
    });
    return data;
  }
  function restoreValuationDefaults() {
    CFG_IDS.forEach((id) => {
      const el = $(id);
      if (!el) return;
      const def = CFG_DEFAULTS[id];
      if (el.type === 'checkbox') el.checked = !!def;
      else if (def !== undefined) el.value = def;
    });
    Object.keys(SECTOR_MULTIPLES).forEach((k) => {
      const el = $('sec-mult-' + k);
      if (!el) return;
      el.value = String(SECTOR_MULTIPLES[k]);
    });
    setStatus('Valuation defaults restored');
  }
  function restoreForm(data) {
    if (!data) return;
    FIELD_IDS.forEach((id) => {
      const el = $(id);
      if (el && data[id] !== undefined) el.value = data[id];
    });
    CFG_IDS.forEach((id) => {
      const el = $(id);
      if (!el) return;
      if (data[id] === undefined) return;
      if (el.type === 'checkbox') el.checked = !!data[id]; else el.value = data[id];
    });
    if (data.__sectorMultiples) {
      Object.keys(data.__sectorMultiples).forEach((k) => {
        const el = $('sec-mult-' + k);
        if (el) el.value = data.__sectorMultiples[k];
      });
    }
    // refresh slider outputs
    document.querySelectorAll('input[type="range"][data-output]').forEach((el) => el.dispatchEvent(new Event('input')));
  }

  function persistSavedList() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStartups)); } catch (_) {}
  }
  function loadSavedList() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      savedStartups = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(savedStartups)) savedStartups = [];
    } catch (_) { savedStartups = []; }
    seedDemosIfFirstVisit();
    loadArchivedList();
  }
  function loadArchivedList() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY + '.trash');
      archivedStartups = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(archivedStartups)) archivedStartups = [];
    } catch (_) { archivedStartups = []; }
    purgeExpiredTrash();
  }
  function persistArchivedList() {
    purgeExpiredTrash();
    try { localStorage.setItem(STORAGE_KEY + '.trash', JSON.stringify(archivedStartups)); } catch (_) {}
  }
  function purgeExpiredTrash() {
    const cutoff = Date.now() - TRASH_RETENTION_MS;
    archivedStartups = archivedStartups.filter((s) => {
      const t = new Date(s.archivedAt || s.deletedAt || Date.now()).getTime();
      return !isNaN(t) && t >= cutoff;
    });
  }
  function clearUndoState() {
    undoDeleteState = null;
    if (undoDeleteTimer) {
      clearTimeout(undoDeleteTimer);
      undoDeleteTimer = null;
    }
    if (undoTickTimer) {
      clearInterval(undoTickTimer);
      undoTickTimer = null;
    }
  }
  function armUndoFor(id) {
    clearUndoState();
    undoDeleteState = { id, expiresAt: Date.now() + UNDO_WINDOW_MS };
    undoDeleteTimer = setTimeout(() => {
      clearUndoState();
      renderSavedList();
      setStatus('Undo window expired');
    }, UNDO_WINDOW_MS);
    undoTickTimer = setInterval(() => {
      const btn = $('undo-delete-btn');
      const remain = getUndoRemainingMs();
      if (btn && remain > 0) btn.textContent = `Undo delete (${fmtRemaining(remain)})`;
    }, 250);
  }
  function getUndoRemainingMs() {
    if (!undoDeleteState) return 0;
    return Math.max(0, undoDeleteState.expiresAt - Date.now());
  }
  function fmtRemaining(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  }
  function seedDemosIfFirstVisit() {
    // Seed any demo startup that is missing from the saved list by name. This lets
    // new demos added in later versions appear for existing users without wiping
    // their other saved startups. Dedup is done against both d.name and
    // d.form['p-name'] because the saved record's .name is derived from p-name
    // (mismatch between the two previously caused re-seeding on every load).
    const demoFormNames = new Set(
      DEMO_STARTUPS.map((d) => ((d.form && d.form['p-name']) || d.name || '').toLowerCase())
        .filter(Boolean)
    );
    // One-time cleanup: collapse duplicate demo rows to the newest copy per name.
    const seenDemo = new Map();
    const deduped = [];
    let removed = 0;
    savedStartups.forEach((s) => {
      const key = (s.name || '').toLowerCase();
      const isDemoName = s.demo === true || demoFormNames.has(key);
      if (!isDemoName) { deduped.push(s); return; }
      const prev = seenDemo.get(key);
      if (!prev) {
        seenDemo.set(key, s);
        deduped.push(s);
      } else {
        removed++;
        const prevTs = Date.parse(prev.updated || prev.created || 0) || 0;
        const curTs = Date.parse(s.updated || s.created || 0) || 0;
        if (curTs > prevTs) {
          const idx = deduped.indexOf(prev);
          if (idx >= 0) deduped[idx] = s;
          seenDemo.set(key, s);
        }
      }
    });
    if (removed > 0) savedStartups = deduped;

    const existingNames = new Set(savedStartups.map((s) => (s.name || '').toLowerCase()));
    const stamp = new Date().toISOString();
    let added = 0;
    DEMO_STARTUPS.forEach((d, i) => {
      const savedName = ((d.form && d.form['p-name']) || d.name || '').toLowerCase();
      if (existingNames.has(savedName)) return;
      if (existingNames.has((d.name || '').toLowerCase())) return;
      const summary = summariseForm(d.form);
      savedStartups.push({
        id: 'demo_' + i + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        ...summary,
        form: d.form,
        created: stamp,
        updated: stamp,
        demo: true
      });
      existingNames.add(savedName);
      added++;
    });
    if (added > 0 || removed > 0) persistSavedList();
    try { localStorage.setItem(SEED_FLAG, '1'); } catch (_) {}
    resyncDemoForms();
  }
  // When DEMO_DATA_VERSION bumps, overwrite the form payload of existing demo
  // records with the latest DEMO_STARTUPS values (matched by p-name) and rebuild
  // their summary. Non-demo (user-created) records are untouched.
  function resyncDemoForms() {
    let storedVersion = '';
    try { storedVersion = localStorage.getItem(DEMO_VERSION_KEY) || ''; } catch (_) {}
    if (storedVersion === DEMO_DATA_VERSION) return;
    const demoByName = new Map();
    DEMO_STARTUPS.forEach((d) => {
      const key = ((d.form && d.form['p-name']) || d.name || '').toLowerCase();
      if (key) demoByName.set(key, d);
    });
    let changed = 0;
    const stamp = new Date().toISOString();
    savedStartups = savedStartups.map((s) => {
      const key = (s.name || (s.form && s.form['p-name']) || '').toLowerCase();
      const isDemo = s.demo === true || demoByName.has(key);
      if (!isDemo) return s;
      const latest = demoByName.get(key);
      if (!latest) return s;
      const summary = summariseForm(latest.form);
      changed++;
      return { ...s, ...summary, form: latest.form, demo: true, updated: stamp };
    });
    if (changed > 0) persistSavedList();
    try { localStorage.setItem(DEMO_VERSION_KEY, DEMO_DATA_VERSION); } catch (_) {}
  }
  // Summarise a form object without mutating the current inputs.
  function summariseForm(form) {
    const originals = {};
    FIELD_IDS.forEach((id) => { const el = $(id); if (el) { originals[id] = el.value; if (form[id] !== undefined) el.value = form[id]; } });
    const s = summariseCurrent();
    FIELD_IDS.forEach((id) => { const el = $(id); if (el && originals[id] !== undefined) el.value = originals[id]; });
    return s;
  }
  function summariseCurrent() {
    const tot = totalScore();
    return {
      name: gs('p-name', 'Unnamed') || 'Unnamed',
      sector: SECTOR_LABELS[gs('p-sec', 'other')] || 'Other',
      total: tot,
      verdict: verdict(tot).lbl,
      decision: engagementDecision(),
      priority: priorityScore()
    };
  }
  function saveCurrent() {
    const form = snapshotForm();
    const summary = summariseCurrent();
    const stamp = new Date().toISOString();
    if (activeStartupId) {
      const idx = savedStartups.findIndex((s) => s.id === activeStartupId);
      if (idx >= 0) {
        const { demo: _demo, ...rest } = savedStartups[idx];
        savedStartups[idx] = { ...rest, ...summary, form, updated: stamp };
      }
      else { activeStartupId = null; }
    }
    if (!activeStartupId) {
      activeStartupId = 's_' + Date.now();
      savedStartups.unshift({ id: activeStartupId, ...summary, form, created: stamp, updated: stamp });
    }
    persistSavedList();
    renderSavedList();
    renderExportReminder();
    setStatus('Saved · ' + new Date().toLocaleTimeString());
  }
  function newStartup() {
    activeStartupId = null;
    FIELD_IDS.forEach((id) => {
      const el = $(id);
      if (!el) return;
      if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else if (el.type === 'range') el.value = el.defaultValue || el.value;
      else el.value = '';
    });
    document.querySelectorAll('input[type="range"][data-output]').forEach((el) => el.dispatchEvent(new Event('input')));
    renderSavedList();
    setStatus('New startup draft');
    showPage(0);
  }
  function deleteStartup(id) {
    const s = savedStartups.find((x) => x.id === id);
    if (!s) return;
    const ok = window.confirm(`Delete "${s.name || 'Unnamed'}"?\n\nIt will be moved to trash and can be restored.`);
    if (!ok) return;
    archivedStartups.unshift({ ...s, archivedAt: new Date().toISOString() });
    savedStartups = savedStartups.filter((x) => x.id !== id);
    if (activeStartupId === id) activeStartupId = null;
    armUndoFor(id);
    persistSavedList();
    persistArchivedList();
    renderSavedList();
    setStatus('Moved to trash · Undo available for 30 seconds');
  }
  function undoDelete() {
    const remain = getUndoRemainingMs();
    if (!undoDeleteState || remain <= 0) {
      clearUndoState();
      renderSavedList();
      setStatus('Undo window expired');
      return;
    }
    const idx = archivedStartups.findIndex((s) => s.id === undoDeleteState.id);
    if (idx < 0) {
      clearUndoState();
      renderSavedList();
      setStatus('Unable to undo (item not found in trash)');
      return;
    }
    const restored = archivedStartups.splice(idx, 1)[0];
    delete restored.archivedAt;
    if (savedStartups.some((s) => s.id === restored.id)) restored.id = 's_' + Date.now();
    savedStartups.unshift(restored);
    clearUndoState();
    persistSavedList();
    persistArchivedList();
    renderSavedList();
    setStatus('Delete undone: ' + (restored.name || 'Unnamed'));
  }
  function restoreMostRecentArchived() {
    purgeExpiredTrash();
    if (!archivedStartups.length) {
      setStatus('Trash is empty');
      return;
    }
    const restored = archivedStartups.shift();
    delete restored.archivedAt;
    // Avoid accidental ID collision in edge-cases.
    if (savedStartups.some((s) => s.id === restored.id)) restored.id = 's_' + Date.now();
    savedStartups.unshift(restored);
    persistSavedList();
    persistArchivedList();
    renderSavedList();
    setStatus('Restored: ' + (restored.name || 'Unnamed'));
  }
  function loadStartup(id) {
    const s = savedStartups.find((x) => x.id === id);
    if (!s) return;
    activeStartupId = id;
    restoreForm(s.form);
    renderSavedList();
    setStatus('Loaded: ' + (s.name || 'Unnamed'));
    showPage(0);
  }
  let _toastHideTimer = null;
  function setStatus(txt) {
    const el = $('toast-status');
    if (!el) return;
    el.textContent = txt;
    el.hidden = false;
    // Force reflow so the fade-in transition applies when messages arrive back-to-back.
    void el.offsetHeight;
    el.classList.add('show');
    if (_toastHideTimer) clearTimeout(_toastHideTimer);
    _toastHideTimer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => { if (!el.classList.contains('show')) el.hidden = true; }, 250);
    }, 7000);
  }
  function renderSavedList() {
    purgeExpiredTrash();
    const list = $('saved-list');
    if (!list) return;
    if (!savedStartups.length) { list.innerHTML = '<div style="font-size:11px;color:var(--text-tertiary)">No saved startups yet.</div>'; return; }
    const undoRemaining = getUndoRemainingMs();
    const showUndo = undoDeleteState && undoRemaining > 0;
    list.innerHTML = savedStartups.map((s) => `
      <div class="saved-item${s.id === activeStartupId ? ' active' : ''}">
        <div class="saved-item-header">
          <div>
            <div class="saved-item-title">${esc(s.name || 'Unnamed')}${s.demo ? ' <span class="small-badge" style="background:#eef4fb;color:#0c447c;margin-left:6px">Demo</span>' : ''}</div>
            <div class="saved-item-meta">${esc(s.sector)} · CRS ${s.total}/120 · ${esc(s.verdict)}</div>
          </div>
        </div>
        <div class="saved-item-actions">
          <button class="button" data-load="${s.id}">Load</button>
          <button class="button" data-delete="${s.id}">Delete</button>
          <button class="saved-item-export" data-export="${s.id}" title="Download this startup as JSON" aria-label="Export this startup">↓</button>
        </div>
      </div>
    `).join('') + `
      <div style="display:flex;justify-content:flex-end;margin-top:8px">
        ${showUndo ? `<button class="button" id="undo-delete-btn" style="margin-right:8px">Undo delete (${fmtRemaining(undoRemaining)})</button>` : ''}
        <button class="button" id="restore-last-deleted">Restore last deleted${archivedStartups.length ? ` (${archivedStartups.length})` : ''}</button>
      </div>
    `;
    list.querySelectorAll('[data-load]').forEach((b) => b.addEventListener('click', () => loadStartup(b.dataset.load)));
    list.querySelectorAll('[data-delete]').forEach((b) => b.addEventListener('click', () => deleteStartup(b.dataset.delete)));
    list.querySelectorAll('[data-export]').forEach((b) => b.addEventListener('click', () => exportSingleStartup(b.dataset.export)));
    const undoBtn = $('undo-delete-btn');
    if (undoBtn) undoBtn.addEventListener('click', undoDelete);
    const restoreBtn = $('restore-last-deleted');
    if (restoreBtn) restoreBtn.addEventListener('click', restoreMostRecentArchived);
  }

  /* ---------- sector multiples config UI ---------- */
  function buildSectorTable() {
    const t = $('sector-multiples-table');
    if (!t) return;
    t.innerHTML = Object.keys(SECTOR_MULTIPLES).map((k) =>
      `<div class="config-table-row">
         <label for="sec-mult-${k}">${esc(SECTOR_LABELS[k])}</label>
         <input id="sec-mult-${k}" type="number" min="0" step="0.5" value="${SECTOR_MULTIPLES[k]}" />
       </div>`
    ).join('');
  }

  /* ---------- JSON export / import (permanent backup path) ---------- */
  function triggerDownload(filename, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke on next tick so Safari has time to kick off the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportAllStartups() {
    const payload = {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      tool: 'engsui-codex',
      exportedAt: new Date().toISOString(),
      fieldIdsSnapshot: FIELD_IDS.slice(),
      savedStartups: savedStartups,
      archivedStartups: archivedStartups
    };
    const stamp = new Date().toISOString().slice(0, 10);
    triggerDownload(`engsui-startups-${stamp}.json`, JSON.stringify(payload, null, 2));
    try { localStorage.setItem(LAST_EXPORT_KEY, payload.exportedAt); } catch (_) {}
    renderExportReminder();
    setStatus('Exported ' + savedStartups.length + ' active · ' + archivedStartups.length + ' archived');
  }
  function exportSingleStartup(id) {
    const s = savedStartups.find((x) => x.id === id) || archivedStartups.find((x) => x.id === id);
    if (!s) return;
    const payload = {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      tool: 'engsui-codex',
      exportedAt: new Date().toISOString(),
      fieldIdsSnapshot: FIELD_IDS.slice(),
      savedStartups: [s],
      archivedStartups: []
    };
    const safeName = (s.name || 'startup').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40);
    triggerDownload(`engsui-${safeName}.json`, JSON.stringify(payload, null, 2));
    setStatus('Exported: ' + (s.name || 'Unnamed'));
  }
  function validateImportSchema(obj) {
    if (!obj || typeof obj !== 'object') return { ok: false, error: 'File is not a JSON object.' };
    if (obj.tool && obj.tool !== 'engsui-codex') return { ok: false, error: 'This file is not an DeepTechEval export.' };
    if (!Array.isArray(obj.savedStartups)) return { ok: false, error: 'Missing or invalid "savedStartups" array.' };
    if (obj.archivedStartups && !Array.isArray(obj.archivedStartups)) return { ok: false, error: 'Invalid "archivedStartups" field.' };
    const bad = obj.savedStartups.find((s) => !s || typeof s !== 'object' || !s.id || !s.form);
    if (bad) return { ok: false, error: 'One or more startups are missing required fields (id, form).' };
    return { ok: true };
  }
  function mergeById(existing, incoming) {
    const map = new Map();
    existing.forEach((s) => map.set(s.id, s));
    incoming.forEach((s) => {
      const cur = map.get(s.id);
      if (!cur) { map.set(s.id, s); return; }
      const curT = new Date(cur.updated || cur.created || 0).getTime();
      const newT = new Date(s.updated || s.created || 0).getTime();
      map.set(s.id, newT > curT ? s : cur);
    });
    return Array.from(map.values());
  }
  function applyImport(data, mode) {
    if (mode === 'replace') {
      savedStartups = Array.isArray(data.savedStartups) ? data.savedStartups.slice() : [];
      archivedStartups = Array.isArray(data.archivedStartups) ? data.archivedStartups.slice() : [];
    } else {
      savedStartups = mergeById(savedStartups, data.savedStartups || []);
      archivedStartups = mergeById(archivedStartups, data.archivedStartups || []);
    }
    persistSavedList();
    persistArchivedList();
    renderSavedList();
    hideImportPreview();
    setStatus((mode === 'replace' ? 'Replaced' : 'Merged') + ' · ' + savedStartups.length + ' active · ' + archivedStartups.length + ' archived');
  }
  function showImportPreview(data) {
    const holder = $('import-preview');
    if (!holder) return;
    const n = (data.savedStartups || []).length;
    const m = (data.archivedStartups || []).length;
    const when = data.exportedAt ? new Date(data.exportedAt).toLocaleString() : 'unknown date';
    holder.hidden = false;
    holder.classList.remove('error');
    holder.innerHTML = `
      <div class="import-preview-title">Import preview</div>
      <div>File exported ${esc(when)} · <strong>${n}</strong> active, <strong>${m}</strong> archived.</div>
      <div style="margin-top:6px;color:var(--text-tertiary);font-size:11px">Merge keeps your current data and adds new items (newer edits win on conflict). Replace wipes current data first.</div>
      <div class="import-preview-actions">
        <button class="button button-primary" id="import-merge">Merge</button>
        <button class="button" id="import-replace">Replace…</button>
        <button class="button" id="import-cancel">Cancel</button>
      </div>`;
    $('import-merge').addEventListener('click', () => applyImport(data, 'merge'));
    $('import-replace').addEventListener('click', () => {
      const ok = window.confirm('Replace will DELETE your current ' + savedStartups.length + ' active and ' + archivedStartups.length + ' archived startups, then load the file. Continue?');
      if (ok) applyImport(data, 'replace');
    });
    $('import-cancel').addEventListener('click', hideImportPreview);
  }
  function showImportError(msg) {
    const holder = $('import-preview');
    if (!holder) return;
    holder.hidden = false;
    holder.classList.add('error');
    holder.innerHTML = `
      <div class="import-preview-title">Import failed</div>
      <div>${esc(msg)}</div>
      <div class="import-preview-actions">
        <button class="button" id="import-cancel">Dismiss</button>
      </div>`;
    $('import-cancel').addEventListener('click', hideImportPreview);
  }
  function hideImportPreview() {
    const holder = $('import-preview');
    if (!holder) return;
    holder.hidden = true;
    holder.innerHTML = '';
    holder.classList.remove('error');
    const fi = $('import-startups-file');
    if (fi) fi.value = '';
  }
  function handleImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => showImportError('Could not read the file.');
    reader.onload = () => {
      let parsed;
      try { parsed = JSON.parse(reader.result); }
      catch (_) { showImportError('This file is not valid JSON.'); return; }
      const v = validateImportSchema(parsed);
      if (!v.ok) { showImportError(v.error); return; }
      showImportPreview(parsed);
    };
    reader.readAsText(file);
  }
  function renderExportReminder() {
    const holder = $('export-reminder');
    if (!holder) return;
    if (sessionStorage.getItem('engsui.reminderDismissed') === '1') { holder.hidden = true; return; }
    if (!savedStartups.length) { holder.hidden = true; return; }
    let last = null;
    try { last = localStorage.getItem(LAST_EXPORT_KEY); } catch (_) {}
    const now = Date.now();
    const lastT = last ? new Date(last).getTime() : 0;
    const days = lastT ? Math.floor((now - lastT) / 86400000) : null;
    let cls = '', msg = '';
    if (!lastT) {
      cls = 'red';
      msg = 'You have ' + savedStartups.length + ' saved startup' + (savedStartups.length === 1 ? '' : 's') + ' but no backup yet. Click <strong>Export all</strong> and save the file to OneDrive/Drive.';
    } else if (days >= REMINDER_RED_DAYS) {
      cls = 'red';
      msg = 'Last backup was <strong>' + days + ' days ago</strong>. Export now before you lose work.';
    } else if (days >= REMINDER_AMBER_DAYS) {
      cls = 'amber';
      msg = 'Last backup was ' + days + ' days ago — consider exporting again.';
    } else {
      holder.hidden = true; return;
    }
    holder.className = 'export-reminder ' + cls;
    holder.hidden = false;
    holder.innerHTML = '<button class="reminder-dismiss" title="Dismiss for this session" aria-label="Dismiss">×</button>' + msg;
    const dismiss = holder.querySelector('.reminder-dismiss');
    if (dismiss) dismiss.addEventListener('click', () => {
      try { sessionStorage.setItem('engsui.reminderDismissed', '1'); } catch (_) {}
      holder.hidden = true;
    });
  }

  /* ---------- PDF export ---------- */
  function exportPdf() {
    if (currentPage !== REPORT_PAGE) generateReport();
    // Browser print is the supported export path; users can save as PDF from the dialog.
    window.print();
  }

  /* ---------- boot ---------- */
  function bindNav() {
    document.querySelectorAll('.tab-button').forEach((t) => {
      t.addEventListener('click', () => {
        const p = parseInt(t.dataset.page, 10);
        // Block direct jump to Report tab — must reach via sequential Next flow.
        if (p === REPORT_PAGE && currentPage !== REPORT_PAGE) {
          setStatus('Complete the modules sequentially using Next → to unlock the report');
          return;
        }
        showPage(p);
      });
    });
    const prev = $('prev-page'), next = $('next-page');
    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
    const gen = $('generate-report'); if (gen) gen.addEventListener('click', requestReportGeneration);
    const ref = $('refresh-report'); if (ref) ref.addEventListener('click', requestReportGeneration);
    const pdf = $('export-pdf'); if (pdf) pdf.addEventListener('click', exportPdf);
    const save = $('save-startup'); if (save) save.addEventListener('click', saveCurrent);
    const fresh = $('new-startup'); if (fresh) fresh.addEventListener('click', newStartup);
    const expAll = $('export-all-startups'); if (expAll) expAll.addEventListener('click', exportAllStartups);
    const impBtn = $('import-startups-btn');
    const impFile = $('import-startups-file');
    if (impBtn && impFile) {
      impBtn.addEventListener('click', () => impFile.click());
      impFile.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) handleImportFile(f);
      });
    }
    const restoreDefaults = $('restore-valuation-defaults');
    if (restoreDefaults) restoreDefaults.addEventListener('click', restoreValuationDefaults);
  }

  function wireDialogs() {
    document.querySelectorAll('[data-dialog]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-dialog');
        const dlg = document.getElementById(id);
        if (!dlg) return;
        if (typeof dlg.showModal === 'function') dlg.showModal();
        else dlg.setAttribute('open', '');
      });
    });
    document.querySelectorAll('.app-dialog-close').forEach((x) => {
      x.addEventListener('click', () => {
        const dlg = x.closest('dialog');
        if (!dlg) return;
        if (typeof dlg.close === 'function') dlg.close();
        else dlg.removeAttribute('open');
      });
    });
    // Click-outside-to-close (native <dialog> receives clicks on its backdrop
    // with target === the dialog element itself).
    document.querySelectorAll('dialog.app-dialog').forEach((dlg) => {
      dlg.addEventListener('click', (e) => {
        if (e.target === dlg) dlg.close();
      });
    });
  }

  function init() {
    buildSectorTable();
    wireSliders();
    bindNav();
    loadSavedList();
    renderSavedList();
    renderExportReminder();
    showReportPlaceholder();
    wireDialogs();
    showPage(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose a couple of helpers for console debugging (not required).
  window.__engsui = { totalScore, techScore, ipScore, teamScore, marketScore, adoptScore, bizScore, eilScore, verdict, engagementDecision, priorityScore, dwcsAdjusted, generateReport };
})();
