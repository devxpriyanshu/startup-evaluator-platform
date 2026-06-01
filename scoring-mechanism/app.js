const D=[
  {id:'tech',name:'M1 · Technology readiness',pts:25,pct:21,c:'#185fa5',bg:'#e6f1fb',tc:'#0c447c',bc:'#b5d4f4',
   why:'Primary deep-tech failure cause: ~40% of hardware energy startups fail because the science does not work at scale (NESTA 2022). Technology weight must be high enough that a fundamentally unproven technology cannot be rescued by strong scores elsewhere.',
   fields:[
     {n:'TRL Level',max:8,type:'Continuous · formula: round(TRL÷9×8)',
      rows:[['TRL 1 — Basic scientific principles observed','0.9 → 1 pt'],['TRL 2 — Technology concept formulated','1.8 → 2 pts'],['TRL 3 — Analytical/experimental PoC','2.7 → 3 pts'],['TRL 4 — Component validation in lab','3.6 → 4 pts'],['TRL 5 — Technology validation in relevant env.','4.4 → 4 pts'],['TRL 6 — Demonstration in relevant environment','5.3 → 5 pts'],['TRL 7 — System prototype demonstrated','6.2 → 6 pts'],['TRL 8 — System complete and qualified','7.1 → 7 pts'],['TRL 9 — Actual system proven operationally','8 pts (max)']],note:'TRL feeds the valuation discount rate: TRL 1–3 adds +10% to WACC; TRL 4–5 adds +7%; TRL 6–7 adds +4%; TRL 8 adds +2%; TRL 9 adds 0%.'},
     {n:'Pilot / demonstration status',max:6,type:'Step-function · raw pilot score÷10×6',
      rows:[['No pilot — lab or simulation only','0 pts'],['Bench-scale PoC demonstrated (internal)','1 pt'],['Controlled lab pilot (internal team)','2 pts'],['Third-party validated field pilot','4 pts'],['Multi-site industrial pilot; paying clients','5 pts'],['Full commercial-scale deployment active','6 pts (max)']],note:'A startup claiming TRL 7+ but scoring 0 here is a red flag — the TRL claim should be scrutinised.'},
     {n:'Empirical data quality',max:3,type:'Continuous · (score−1)÷4×3',
      rows:[['1 — Internal simulations / modelling only','0 pts'],['2 — Internal lab measurements','0.75 → 1 pt'],['3 — Validated lab data; no third-party','1.5 → 2 pts'],['4 — Third-party validated; not published','2.25 → 2 pts'],['5 — Independent, published, peer-verified field data','3 pts (max)']],note:'PSU procurement requires BIS/IEC-grade certification. Without credible data, no ONGC/IOCL will approve procurement regardless of TRL.'},
     {n:'Technology uniqueness & differentiation',max:4,type:'Continuous · (score−1)÷4×4',
      rows:[['1 — Incremental improvement on existing tech','0 pts'],['2 — Moderate improvement; clear design-arounds','1 pt'],['3 — Significant advance; some differentiation','2 pts'],['4 — Strong differentiation; difficult to replicate','3 pts'],['5 — Breakthrough / world-first; no functional equivalent','4 pts (max)']],note:'Should be cross-checked against competitive intensity in Market module. High uniqueness score + low blue-ocean score is an inconsistency signal.'},
     {n:'Engineering scalability & architecture',max:3,type:'Continuous · (score−1)÷4×3',
      rows:[['1 — Bespoke: custom engineering per installation','0 pts'],['2 — Significant scale-up engineering challenges','0.75 → 1 pt'],['3 — Scalable with major capital investment','1.5 → 2 pts'],['4 — Modular: standard engineering replication','2.25 → 2 pts'],['5 — Plug-and-play: inherently scalable architecture','3 pts (max)']],note:'Repeatable engineering is a prerequisite for profitable EPC deployment. EIL cannot build a margin on bespoke installations.'},
     {n:'Reliability & failure risk',max:1,type:'Threshold bonus · score ≥4 → 1 pt; <4 → 0',
      rows:[['1 — Unproven; high probability of failure','0 pts'],['2 — Some evidence; failure risk remains high','0 pts'],['3 — Moderate evidence; controlled conditions only','0 pts'],['4 — Proven reliable; multiple operating environments','1 pt'],['5 — Consistently reliable across all conditions','1 pt (max)']],note:'Reweighted 2→1 and tightened to score ≥4 only. Freed 1 pt reallocated to the new Independent validation field below — avoids double-rewarding startups where reliability and third-party validation move together.'},
     {n:'Independent validation',max:1,type:'Binary · validated = 1 pt; internal-only = 0',
      rows:[['No — internal testing / self-reported only','0 pts'],['Yes — third-party or customer-site validation on record','1 pt (max)']],note:'NEW FIELD (was dead field pre-sync). Distinct from empirical data quality: that field scores data quality on a 1–5 continuum; this field is a binary gate on whether ANY independent party has validated performance. A TRL-8 claim without independent validation is a red flag.'}
   ]},
  {id:'ip',name:'M2 · IP & Patent Assessment',pts:15,pct:12.5,c:'#534ab7',bg:'#eeedfe',tc:'#3c3489',bc:'#afa9ec',
   why:'Without defensible IP, EIL\'s investment creates value that competitors can freely replicate. A non-patented technology becomes a commodity the day funding is announced. IP is also the primary lever for EIL to extract licensing revenue from its own project portfolio.',
   fields:[
     {n:'Patent filing status',max:7,type:'Step-function · direct integer score 0–7',
      rows:[['0 — No IP filed; no protection whatsoever','0 pts'],['1 — Trade secret / proprietary know-how only','1 pt'],['2 — Provisional application filed (India)','2 pts'],['3 — Complete patent application filed (India)','3 pts'],['4 — PCT application filed (international)','4 pts'],['5 — Patent granted — India','5 pts'],['6 — Patent granted — India + 1 major jurisdiction (US/EU)','6 pts'],['7 — Patent granted — multi-jurisdiction portfolio','7 pts (max)']],note:'Step-function (not continuous) because patent granted vs. patent filed are categorically different risk levels. A filed application can be rejected; a granted patent is a legal property right.'},
     {n:'Portfolio breadth — number of patents',max:4,type:'Linear · direct score 0–4',
      rows:[['0 — No patents','0 pts'],['1 — Single patent; very narrow claims','1 pt'],['2 — 2–3 patents covering core technology','2 pts'],['3 — 4–7 patents across core + adjacent areas','3 pts'],['4 — 8+ patents; continuation strategy in place','4 pts (max)']],note:'Breadth matters because a single patent can be designed around. A portfolio with continuation applications creates a "patent thicket" that is far harder to circumvent.'},
     {n:'Claim quality & defensibility',max:4,type:'Linear · direct score 0–4 (requires IP counsel input)',
      rows:[['0 — No claims or trivially narrow claims','0 pts'],['1 — Narrow method claims; easily designed around','1 pt'],['2 — Moderate scope; some design-around risk','2 pts'],['3 — Broad claims covering core inventive concept','3 pts'],['4 — Very broad claims; confirmed strong by IP counsel','4 pts (max)']],note:'IMPORTANT: This field should be scored by a qualified patent attorney, not the evaluator alone. EIL should build a standard IP counsel review into the due diligence process for any investment above ₹5 Cr.'},
     {n:'Freedom-to-operate (FTO) status',max:4,type:'Linear · direct score 0–4 (UI default: "Unknown" → 1 pt)',
      rows:[['0 — Declared: no FTO analysis conducted (acknowledged risk)','0 pts'],['1 — Unknown / not disclosed (UI default — conservative placeholder)','1 pt'],['2 — Basic FTO done; some potential conflicts identified','2 pts'],['3 — Independent FTO — clear with minor workarounds','3 pts'],['4 — Full FTO clearance from independent IP counsel','4 pts (max)']],note:'FTO is distinct from owning patents — a startup can have 10 patents and still infringe a dominant player\'s foundational patent. The UI defaults unknown FTO status to 1 (not 0) because "no data submitted" should not be scored identically to "FTO declared absent." Evaluators must actively downgrade to 0 when the startup acknowledges no FTO work has been done.'},
     {n:'Peer-reviewed publications',max:4,type:'Linear · direct score 0–4',
      rows:[['0 — No publications of any kind','0 pts'],['1 — 1–2 conference papers (non-peer-reviewed)','1 pt'],['2 — 1–2 peer-reviewed journal papers','2 pts'],['3 — 3–5 peer-reviewed; incl. high-impact journals','3 pts'],['4 — 6+ papers incl. Nature / Science / high-IF journals','4 pts (max)']],note:'Publications serve dual purpose: scientific validation of claims, and prior art documentation. IIT/IISc spin-outs with 10+ publications in Nature Energy carry credibility that shortens PSU procurement cycles.'},
     {n:'Trade secret depth & reverse-engineer resistance',max:2,type:'Threshold bonus · score≥4 → 2 pts; score=3 → 1 pt',
      rows:[['1 — Easily reverse-engineered from product','0 pts'],['2 — Some difficulty; basic process analysis sufficient','0 pts'],['3 — Moderate: requires significant R&D to replicate','1 pt'],['4 — Very hard; deep process know-how required','2 pts'],['5 — Near-impossible without original team','2 pts (max)']],note:'Trade secret depth is a secondary moat that protects value even if the patent expires or is invalidated. Particularly important in process technologies like biofuels and fermentation.'},
     {n:'Institutional IP origin clarity',max:4,type:'Linear · direct score 0–4',
      rows:[['0 — No clear institutional origin; disputed ownership','0 pts'],['1 — Founder-developed independently; clean ownership','1 pt'],['2 — Developed at IIT/IISc/NIT; clean IP assignment confirmed','2 pts'],['3 — Co-developed with industry; licensing terms clear','3 pts'],['4 — Developed under DST/BIRAC grant; commercialisation rights confirmed','4 pts (max)']],note:'IP assignment disputes (especially in IIT spin-outs where the institute holds partial rights) are a common deal-blocker in Indian deep-tech. EIL must verify IP ownership chain before any term sheet.'}
   ]},
  {id:'team',name:'M3 · Team & Leadership',pts:20,pct:16.7,c:'#1a6b38',bg:'#e8f5ec',tc:'#155724',bc:'#9fe1cb',
   why:'At early-stage deep-tech, the team is the most predictive variable. YC accepts ~3% of applications; their data shows team quality predicts outcome better than idea quality. A great team pivots; a weak team fails even with a great technology. At TRL 3–5, you are investing in people more than in the technology. Sub-weights have been rebalanced so that the raw sum of all fields equals the 20-pt module cap — preventing team from becoming over-subscribed when multiple strong dimensions combine.',
   fields:[
     {n:'Founder / CEO domain expertise',max:4,type:'Continuous · score−1 (scale 1–5)',
      rows:[['1 — General entrepreneur; no domain expertise','0 pts'],['2 — Basic: undergraduate / 2–3 yrs exposure','1 pt'],['3 — Solid: Masters degree / 5+ yrs industry experience','2 pts'],['4 — Deep: PhD in the field / 10+ yrs deep-tech','3 pts'],['5 — World-class: globally recognised / original inventor','4 pts (max)']],note:'Domain expertise is asymmetrically important in deep-tech hardware vs. software. A SaaS founder can hire technical expertise; a green hydrogen founder who does not understand electrolyser stack chemistry cannot credibly navigate R&D decisions.'},
     {n:'Commercial & business experience',max:3,type:'Continuous · round((score−1)÷4×3)',
      rows:[['1 — First-time founder; no business background','0 pts'],['2 — Business exposure (MBA / corporate role)','0.75 → 1 pt'],['3 — Prior startup experience (failed ventures count)','1.5 → 2 pts'],['4 — Serial entrepreneur / ex-Senior VP or GM','2.25 → 2 pts'],['5 — Proven exits or major commercial achievements','3 pts (max)']],note:'Reweighted from 4→3 to prevent team over-subscription. India\'s energy sector still requires boardroom-level credibility to close PSU sales; business experience remains important but no longer dominant within the module.'},
     {n:'Industry network & relationship capital',max:2,type:'Continuous · round((score−1)÷4×2)',
      rows:[['1 — No relevant industry connections','0 pts'],['2 — Limited; mostly academic network','0.5 → 1 pt'],['3 — Some industry contacts; no PSU relationships','1 pt'],['4 — Good industry contacts; some PSU exposure','1.5 → 2 pts'],['5 — Strong: ONGC / NTPC / IOCL / MNRE relationships','2 pts (max)']],note:'Reweighted from 3→2. EIL\'s own network partly substitutes for weak startup networks, so startup-side network capital is given a lower ceiling.'},
     {n:'Team completeness — functional roles filled',max:3,type:'Continuous · round((score−1)÷4×3)',
      rows:[['1 — Solo founder; all key functional roles vacant','0 pts'],['2 — 2 co-founders; missing CTO or commercial lead','0.75 → 1 pt'],['3 — Core team in place (tech + business); some gaps','1.5 → 2 pts'],['4 — Full team: technology + commercial + operations','2.25 → 2 pts'],['5 — Complete: senior engineering, sales, finance hires','3 pts (max)']],note:'Reweighted from 4→3. Functional gaps still predict execution failure at scale-up, but the capped re-weighting prevents a complete team from alone pushing the module into over-subscription.'},
     {n:'Institutional origin & academic pedigree',max:3,type:'Continuous · round((score−1)÷4×3)',
      rows:[['1 — No institutional affiliation','0 pts'],['2 — Tier-2/3 institution','0.75 → 1 pt'],['3 — IIT / NIT / BITS / top state university','1.5 → 2 pts'],['4 — IIT / IISc / IISER + active research collaboration','2.25 → 2 pts'],['5 — IIT/IISc/intl institution (MIT/Stanford/ETH) spin-out','3 pts (max)']],note:'Reweighted from 4→3. Institutional pedigree remains a credibility proxy with PSU clients but is now bounded so that pedigree alone cannot dominate the team score.'},
     {n:'Advisory board quality',max:2,type:'Capped direct · min(2, score)',
      rows:[['0 — No formal advisors','0 pts'],['1 — 1–2 informal advisors (personal network)','1 pt'],['2 — Formal advisors; incubated at IIT/IISc/CIIE/SINE','2 pts (max)'],['3 — Industry advisors + GOI programme (BIRAC/Startup India)','2 pts (capped)'],['4 — High-profile: ex-CMD / PSU director / known VC / IAS','2 pts (capped)']],note:'Reweighted from 4→2 with a min(2, ·) cap. A strong advisory board is valuable but is a leading indicator, not an execution output — the cap prevents over-rewarding an advisor-heavy company with a thin operating team.'},
     {n:'Execution track record — milestone delivery',max:1,type:'Threshold · 1 pt if score ≥ 3, else 0',
      rows:[['1 — Consistently missed committed milestones','0 pts'],['2 — Hit some milestones; significant delays on others','0 pts'],['3 — Mixed: hit major milestones; slipped on minor ones','1 pt'],['4 — Mostly delivered on time; minor slippages','1 pt'],['5 — Consistently delivered ahead of committed schedule','1 pt (max)']],note:'Reweighted from 2→1 and converted to threshold. Track record is signal, not differentiator — startups either clear the bar or they do not.'},
     {n:'Full-time commitment & equity vesting',max:1,type:'Capped · min(1, score)',
      rows:[['0 — Founders still in full-time employment elsewhere','0 pts'],['1 — 1 of N founders full-time; others moonlighting','1 pt'],['2 — All core founders full-time; equity vesting in place','1 pt (capped)'],['3 — Full-time, equity-vested, no moonlighting whatsoever','1 pt (capped)']],note:'Reweighted from 3→1 with a min(1, ·) cap. Part-time founders remain a hard red flag but full-time commitment is table-stakes for any equity investment, not a differentiator.'},
     {n:'Team diversity (tech · biz · ops)',max:1,type:'Threshold · 1 pt if score ≥ 3, else 0',
      rows:[['1 — All-technical or all-commercial; no functional balance','0 pts'],['2 — Partial spread; one dimension missing entirely','0 pts'],['3 — Minimum balance: tech + business covered','1 pt'],['4 — All three functions represented at founder/senior level','1 pt'],['5 — Deep coverage across tech, business, and operations','1 pt (max)']],note:'Replaces the previous Key-person dependency field (dead UI input pre-sync). Diversity across tech/biz/ops predicts execution better than raw headcount — a purely technical founding team routinely under-invests in GTM, and a purely commercial team under-invests in R&D discipline.'}
   ]},
  {id:'mkt',name:'M4 · Market Validation',pts:20,pct:16.7,c:'#ba7517',bg:'#faeeda',tc:'#633806',bc:'#fac775',
   why:'"No market need" is the primary startup failure cause — 35% of all failures (CB Insights 101 autopsies). For deep-tech energy specifically, the Indian PSU market is highly non-linear: one Mission program can create or destroy an entire sector. Market validation must capture both size and the quality of customer evidence.',
   fields:[
     {n:'TAM — Total Addressable Market (global, USD)',max:4,type:'Continuous · TAM score − 1',
      rows:[['1 — < $500M global market','0 pts'],['2 — $500M – $2B global market','1 pt'],['3 — $2B – $10B global market','2 pts'],['4 — $10B – $50B global market','3 pts'],['5 — > $50B global market','4 pts (max)']],note:'$500M global TAM can support a venture but limits EIL\'s strategic upside. Most meaningful deep-tech energy markets (green hydrogen, CCUS, storage) have TAMs above $10B, so this field tends to reward sectors rather than individual companies.'},
     {n:'SAM — Serviceable Market in India (₹ Crores)',max:2,type:'Continuous · (score−1)÷4×2',
      rows:[['1 — < ₹500 Crores India market','0 pts'],['2 — ₹500 – ₹2,000 Crores','0.5 → 1 pt'],['3 — ₹2,000 – ₹10,000 Crores','1 pt'],['4 — ₹10,000 – ₹50,000 Crores','1.5 → 2 pts'],['5 — > ₹50,000 Crores India addressable','2 pts (max)']],note:'Lower weight than TAM because EIL\'s primary deployment market is India. SAM is the actionable near-term number. A high TAM but low SAM signals that India market development is still early — important for timeline planning.'},
     {n:'Market CAGR (%)',max:2,type:'Capped continuous · min(2, CAGR÷20)',
      rows:[['0% CAGR','0 pts'],['10% CAGR','0.5 → 1 pt'],['20% CAGR','1 pt'],['40% CAGR','2 pts'],['> 40% CAGR','2 pts — capped, does not increase further']],note:'The 40% cap prevents extraordinary market research projections from inflating the score. Projections above 40% CAGR for energy markets are routinely found in bottom-up TAM reports that use optimistic adoption curves.'},
     {n:'Customer discovery depth',max:4,type:'Step-function · direct score 0–4',
      rows:[['0 — No customer conversations held whatsoever','0 pts'],['1 — 1–5 informal conversations','1 pt'],['2 — 5–15 structured discovery interviews','2 pts'],['3 — 15+ interviews + quantitative survey data','3 pts'],['4 — Primary research + confirmed paid pilot demand','4 pts (max)']],note:'Thresholds from Steve Blank\'s Customer Development methodology. Fewer than 5 conversations is insufficient for any market claim. The evaluator should ask for interview transcripts or notes — not just the founder\'s summary of what customers said.'},
     {n:'LOIs / MOUs signed',max:4,type:'Step-function · direct score 0–4',
      rows:[['0 — No formal or informal interest of any kind','0 pts'],['1 — Verbal expression of interest (PSU meetings / presentations)','1 pt'],['2 — 1–2 written LOIs or MOUs signed','2 pts'],['3 — 3–5 formal LOIs from credible organisations','3 pts'],['4 — 5+ LOIs or active paid pilot programmes underway','4 pts (max)']],note:'CRITICAL DISTINCTION: In India\'s PSU culture, verbal interest costs the buyer nothing and is routinely given to startups as encouragement. Only written LOIs or MOUs carry evidentiary weight. Evaluators should physically verify documents, not rely on founder descriptions.'},
     {n:'Industry use case clarity',max:3,type:'Continuous · (score−1)÷4×3',
      rows:[['1 — "The energy sector" — vague hypothesis','0 pts'],['2 — Industry identified but buyer undefined','0.75 → 1 pt'],['3 — Specific industry + rough buyer profile','1.5 → 2 pts'],['4 — Named buyer types with quantified problem','2.25 → 2 pts'],['5 — Named organisations + quantified cost-of-problem data','3 pts (max)']],note:'The interview test: ask the founder "Who is your first customer? Name them. What problem are you solving for them in quantitative terms?" A score of 4–5 requires being able to answer both questions without hesitation.'},
     {n:'Competitive intensity (5 = blue ocean)',max:3,type:'Continuous · (score−1)÷4×3 (inverse: low competition = high score)',
      rows:[['1 — Intense: multiple well-funded incumbents at scale','0 pts'],['2 — 4–5 strong competitors advancing rapidly','0.75 → 1 pt'],['3 — 2–3 competitors; 12–18 months behind','1.5 → 2 pts'],['4 — 1–2 early competitors; 2+ year technology lead','2.25 → 2 pts'],['5 — First-mover: no functional equivalent in market','3 pts (max)']],note:'Inverse scoring: high competition = low score. However, a COMPLETELY uncontested market can also be a red flag — it may mean incumbents tried and failed, the market is too small, or adoption barriers are insurmountable. Cross-check with adoption feasibility module.'},
     {n:'Policy & regulatory tailwind',max:4,type:'Continuous · score−1',
      rows:[['1 — Regulatory headwinds / actively hostile policy','0 pts'],['2 — Neutral; some minor supportive policies','1 pt'],['3 — Strong support: PLI / MNRE / MoPNG schemes','2 pts'],['4 — National mission-critical: NHM / Green Energy Corridor','3 pts'],['5 — INDC / 2070 Net Zero critical-path technology','4 pts (max)']],note:'Policy tailwind is uniquely important in India\'s energy sector because GOI policy creates or destroys entire markets. The National Hydrogen Mission created a ~₹20,000 Cr addressable market overnight. Score should be updated dynamically — policy environments shift.'}
   ]},
  {id:'adopt',name:'M5 · Adoption Feasibility',pts:15,pct:12.5,c:'#a32d2d',bg:'#fcebeb',tc:'#791f1f',bc:'#f09595',
   why:'Deep-tech energy has the largest gap between "proven in lab" and "deployed at industrial scale" of any sector. Regulatory complexity, CapEx requirements, and incumbent resistance have killed more promising technologies than scientific failure. This module captures barriers that do not appear in technology assessments.',
   fields:[
     {n:'Regulatory approvals required',max:5,type:'Continuous · (score−1)×1.2, rounded',
      rows:[['1 — Multiple complex multi-year approvals (CPCB + PESO + CEA + BIS + sector-specific)','0 pts'],['2 — Significant regulatory process; uncertain timeline','1 pt'],['3 — Standard approvals required; clear established pathway','2 pts'],['4 — Minimal approvals; technology-agnostic regulations','4 pts'],['5 — No sector-specific regulatory approval required','5 pts (max)']],note:'1.2× multiplier makes this field penalise regulatory complexity sharply. Regulatory timelines in India\'s energy sector can exceed 5 years — longer than most startup runways. The non-linear scoring (gap between 3→4→5) reflects that each tier reduction dramatically changes commercialisation timeline.'},
     {n:'Customer CapEx requirement per deployment',max:5,type:'Continuous · (score−1)×1.2, rounded',
      rows:[['1 — > ₹500 Crores: prohibitive; requires GOI financing','0 pts'],['2 — ₹100–500 Crores: high; strategic-level sign-off needed','1 pt'],['3 — ₹10–100 Crores: moderate; capital budgeting cycle','2 pts'],['4 — ₹1–10 Crores: manageable for mid-size industry','4 pts'],['5 — < ₹1 Crore: low; SaaS or service model','5 pts (max)']],note:'High CapEx extends sales cycles from months to years and limits buyer universe to large PSUs. EIL\'s EPC relationships can help structure financing (IREDA, VGF) to reduce effective CapEx for customers — this strategic lever should be noted in the evaluation.'},
     {n:'Integration complexity with existing infrastructure',max:3,type:'Continuous · (score−1)÷4×3',
      rows:[['1 — Requires complete plant redesign / greenfield only','0 pts'],['2 — Significant process modifications; 2–4 week shutdowns','0.75 → 1 pt'],['3 — Moderate: retrofit possible with engineering','1.5 → 2 pts'],['4 — Minor modifications; short (< 1 week) shutdown','2.25 → 2 pts'],['5 — True bolt-on: zero process disruption; parallel operation','3 pts (max)']],note:'For refineries and chemical plants, even a 2-week shutdown costs ₹20–100 Crores in lost production. Integration complexity is a genuine commercial barrier, not a technical footnote.'},
     {n:'Incumbent industry resistance',max:3,type:'Continuous · (score−1)÷4×3',
      rows:[['1 — Strong incumbent opposition; vested interests actively blocking','0 pts'],['2 — Significant resistance; PSU procurement bias toward known suppliers','0.75 → 1 pt'],['3 — Neutral: incumbents neither oppose nor support','1.5 → 2 pts'],['4 — Mild support: incumbents see complementary value','2.25 → 2 pts'],['5 — Incumbents are active partners / licensees','3 pts (max)']],note:'India\'s energy incumbents (ONGC, IOCL, NTPC) have powerful supplier relationships and risk-averse procurement processes. EIL\'s relationships with these organisations are a strategic lever that can directly shift a startup from score 2 to score 4 on this field.'},
     {n:'Supply chain & infrastructure readiness (India)',max:2,type:'Continuous · (score−1)÷4×2',
      rows:[['1 — Critical components absent; no domestic supply chain','0 pts'],['2 — Partial supply chain; major development required','0.5 → 1 pt'],['3 — Moderate gaps; addressable within 3–5 years','1 pt'],['4 — Largely available; minor gaps in specialised components','1.5 → 2 pts'],['5 — Full domestic supply chain and infrastructure available','2 pts (max)']],note:'India-specific scoring. An electrolyser stack may be globally mature but require imported platinum-group metal catalysts with no domestic supply chain — severely constraining commercial scale-up speed.'},
     {n:'Price competitiveness vs. incumbent solution',max:4,type:'Continuous · score−1',
      rows:[['1 — 2× or more expensive; no viable business case without subsidy','0 pts'],['2 — 20–100% cost premium; needs significant policy support','1 pt'],['3 — 0–20% premium; competitive with PLI or carbon pricing','2 pts'],['4 — Cost parity with incumbent today','3 pts'],['5 — Already cheaper than incumbent solution','4 pts (max)']],note:'Low weight (max 4pts) because current price competitiveness is rarely achieved in deep-tech early stages — solar was 5× coal cost in 2010 and is now cheaper. The scoring rewards the trajectory to parity, not the absolute current position.'}
   ]},
  {id:'biz',name:'M6 · Business Model',pts:15,pct:12.5,c:'#712b13',bg:'#fde8d8',tc:'#4a1b0c',bc:'#f0997b',
   why:'Revenue model ambiguity is the 2nd most common startup failure mode. At early-stage, business model assumptions are speculative — but the clarity and testedness of those assumptions is itself signal. Unit economics, GTM specificity, and runway predict whether the technology can sustain itself commercially after EIL\'s initial capital is deployed. Sub-weights have been rebalanced so that the raw sum of fields equals the 15-pt module cap — and a runway indicator has been added to capture financial resilience independently of revenue maturity.',
   fields:[
     {n:'Revenue model clarity',max:3,type:'Continuous · round((score−1)÷4×3)',
      rows:[['1 — No revenue model defined whatsoever','0 pts'],['2 — Concept identified; fully untested assumptions','0.75 → 1 pt'],['3 — Model defined with some validated assumptions','1.5 → 2 pts'],['4 — Paying customers demonstrating the model works','2.25 → 2 pts'],['5 — Proven, repeatable, growing revenue at scale','3 pts (max)']],note:'Reweighted from 8→3. Revenue model clarity remains a prerequisite for any equity commitment, but the previous 8-pt weight allowed a single field to dominate the module. The rebalanced weight aligns with the rest of the framework.'},
     {n:'Unit economics — gross margin outlook',max:3,type:'Continuous · round((score−1)÷4×3)',
      rows:[['1 — Negative gross margin; no path to profitability','0 pts'],['2 — Breakeven or marginal; highly volume-sensitive','0.75 → 1 pt'],['3 — Moderate gross margin: 20–40%; improving with scale','1.5 → 2 pts'],['4 — Strong gross margin: 40–65%','2.25 → 2 pts'],['5 — High gross margin: >65% — IP or software-enabled','3 pts (max)']],note:'Reweighted from 8→3. Gross margin bands still track energy industry benchmarks; the lower weight reflects that margin expansion is a function of scale and is partially already captured in the TRL and scalability scores.'},
     {n:'Customer acquisition strategy (GTM)',max:2,type:'Continuous · round((score−1)÷4×2)',
      rows:[['1 — No go-to-market plan; relies on word-of-mouth','0 pts'],['2 — Basic GTM concept; no channel strategy','0.5 → 1 pt'],['3 — GTM defined; channel not yet validated','1 pt'],['4 — GTM with identified channel partners','1.5 → 2 pts'],['5 — Validated sales playbook + channel partners (incl. EIL?)','2 pts (max)']],note:'Reweighted from 3→2. In India\'s energy sector, B2G (PSU) sales cycles are 18–36 months; EIL can serve as the channel partner which compresses this GTM risk externally.'},
     {n:'Operational scalability',max:3,type:'Continuous · clamp(0, ops−1, 3)',
      rows:[['1 — Highly labour-intensive; difficult to automate','0 pts'],['2 — Some automation potential; moderate scaling challenges','1 pt'],['3 — Scalable operations with moderate investment','2 pts'],['4 — Asset-light or platform model; scales efficiently','3 pts (max)']],note:'Weight unchanged at 3. Scale is 1–4 (not 1–5) because operational scalability is a binary-ish hardware-vs-software property — only four tiers are meaningfully distinguishable in practice.'},
     {n:'Current ARR — revenue validation bonus',max:2,type:'Threshold bonus on actual ₹ Crore revenue',
      rows:[['₹0 — Pre-revenue: technology concept only','0 pts'],['₹0–₹10 Crores — First commercial revenue; model proven','1 pt'],['> ₹10 Crores — Significant revenue; scaling demonstrated','2 pts (max)']],note:'Weight unchanged at 2. Pre-revenue is the normal state for deep-tech energy at TRL 5–7 — this is a bonus for startups that have crossed the commercial threshold, not a penalty for those that have not yet.'},
     {n:'Runway — months of operating runway at current burn',max:2,type:'Threshold · ≥12m→2 pts, 6–11m→1 pt, <6m→0',
      rows:[['< 6 months runway — survival pressure','0 pts'],['6 – 11 months runway — next raise is load-bearing','1 pt'],['≥ 12 months runway — operating headroom','2 pts (max)']],note:'NEW FIELD. Runway captures financial resilience independent of revenue maturity. A pre-revenue startup with 24 months runway can iterate; a revenue-stage startup with 4 months runway is distressed. Computed from reported burn rate and cash balance entered on the Profile page, so the evaluator cannot game the score without contradicting the balance sheet inputs.'}
   ]},
  {id:'eil',name:'M7 · EIL Strategic Fit',pts:10,pct:8.3,c:'#0c447c',bg:'#e6f1fb',tc:'#042c53',bc:'#85b7eb',
   why:'This overlay module converts a generic investment assessment into an EIL-specific decision. A startup scoring 90/120 on the general framework but with zero EPC relevance and no sector alignment should not receive EngSUI funds — EIL has a specific mandate, not a general venture capital mandate.',
   fields:[
     {n:'Alignment with EIL core sectors',max:3,type:'Continuous · (score−1)÷4×3',
      rows:[['1 — Outside EIL\'s sector scope entirely','0 pts'],['2 — Adjacent; loosely related to EIL work','0.75 → 1 pt'],['3 — Within EIL sectors but not a core area','1.5 → 2 pts'],['4 — Core EIL sector: hydrocarbons / renewables / water','2.25 → 2 pts'],['5 — Central to EIL\'s declared strategic priorities','3 pts (max)']],note:'EIL sectors: Hydrocarbons, Renewable Energy, Water, Biofuels, Waste-to-Energy, Industrial IIoT, Engineering Services. A technology falling squarely within these gets 3 pts. One outside this list — regardless of commercial merit — gets 0.'},
     {n:'EPC integration potential',max:4,type:'Continuous · score−1 (scale 1–5)',
      rows:[['1 — No EPC relevance; standalone consumer product','0 pts'],['2 — Peripheral; usable in a narrow set of project types','1 pt'],['3 — Integrable as component in standard EIL EPCM projects','2 pts'],['4 — Core technology for EIL\'s renewable/green EPCM mandate','3 pts'],['5 — Transforms EIL\'s competitive position in a major sector','4 pts (max)']],note:'HIGHEST WEIGHT field in Module 7 (4 pts) because EPC integration is EIL\'s unique structural advantage over financial investors. EIL can provide deployment opportunities that no VC can match. A technology with strong EPC potential is worth significantly more to EIL than to a pure financial investor.'},
     {n:'National energy program alignment',max:3,type:'Continuous · (score−1)÷4×3',
      rows:[['1 — Unrelated to India\'s declared energy transition priorities','0 pts'],['2 — Peripherally related','0.75 → 1 pt'],['3 — Supports India\'s 500 GW Renewable Energy target by 2030','1.5 → 2 pts'],['4 — Core to National Hydrogen Mission / Green Steel / CCUS','2.25 → 2 pts'],['5 — Critical-path to INDC commitments / 2070 Net Zero','3 pts (max)']],note:'National program alignment unlocks GOI financing (VGF, IREDA loans, PLI benefits) and assured off-take from PSUs under government mandate. This dramatically de-risks commercial deployment and improves EIL\'s risk-adjusted return.'},
     {n:'Technology licensing revenue potential for EIL',max:1,type:'Binary threshold · score≥3 → 1 pt; score<3 → 0',
      rows:[['1–2 — No identifiable licensing potential for EIL','0 pts'],['3 — Possible; EIL could license in specific project contexts','1 pt'],['4–5 — Significant licensing income across EIL project portfolio','1 pt (max)']],note:'Low weight (1pt) because licensing revenue is speculative at early stage. This is a directional signal, not a quantified projection. A startup with strong IP (Module 2 score ≥ 10) AND high licensing potential should receive special attention in the Strategic Value Adjustment section of the valuation.'},
     {n:'EIL engagement alignment — founder appetite',max:1,type:'Binary threshold · score≥3 → 1 pt; score<3 → 0',
      rows:[['1–2 — Founders want capital only; actively resist strategic PSU role for EIL','0 pts'],['3 — Open to EIL as strategic partner with right terms','1 pt'],['4–5 — Actively seeking EIL as anchor customer + EPCM + co-investor','1 pt (max)']],note:'A technically excellent startup whose founders do not want EIL involved beyond writing a cheque is not a good strategic fit. EIL\'s value-add (network, projects, PSU relationships) can only be realised if the startup welcomes EIL\'s active involvement.'}
   ]}
];

const colors = D.map(m => m.c);

function buildBar() {
  const bar = document.getElementById('wbar');
  const lgnd = document.getElementById('wlgnd');
  D.forEach(m => {
    const s = document.createElement('div');
    s.className = 'wseg';
    s.style.cssText = `flex:${m.pts};background:${m.c};opacity:0.85`;
    bar.appendChild(s);
    const l = document.createElement('div');
    l.className = 'wl';
    l.innerHTML = `<span class="wdot" style="background:${m.c}"></span>${m.name.replace('M1 · ', '').replace('M2 · ', '').replace('M3 · ', '').replace('M4 · ', '').replace('M5 · ', '').replace('M6 · ', '').replace('M7 · ', '')} <strong style="color:${m.c}">${m.pts}pt</strong>`;
    l.onclick = () => scrollTo(document.getElementById('mod-' + m.id));
    lgnd.appendChild(l);
  });
}

function scrollTo(el) { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

function pts(v, max) { return Math.round(v / max * 100); }

function buildMods() {
  const cont = document.getElementById('mods');
  D.forEach(m => {
    const div = document.createElement('div');
    div.className = 'mod';
    div.id = 'mod-' + m.id;
    div.style.borderColor = m.bc;

    let fieldsHTML = '';
    m.fields.forEach((f, fi) => {
      const maxPts = parseFloat(f.max);
      let rowsHTML = f.rows.map((r, ri) => {
        const rawVal = parseFloat(r[1]);
        const isNote = r[0].toLowerCase().startsWith('note');
        if (isNote) return `<div class="sr-row note-row" style="border:none"><span style="color:var(--color-text-tertiary);font-style:italic">Note: ${r[1]}</span></div>`;
        const pval = parseFloat(r[1]);
        const barW = maxPts > 0 ? Math.min(100, Math.round(pval / maxPts * 100)) : 0;
        const isMax = r[1].includes('(max)');
        return `<div class="sr-row">
          <div class="sr-inp">
            <div style="color:var(--color-text-secondary)">${r[0]}</div>
            <div class="sr-bar" style="width:${barW}%;background:${m.c};opacity:0.6;min-width:${barW > 0 ? 8 : 0}px"></div>
          </div>
          <div class="sr-pts" style="color:${isMax ? m.c : 'var(--color-text-primary)'}">${r[1]}</div>
        </div>`;
      }).join('');

      if (f.note) {
        rowsHTML += `<div class="sr-row note-row" style="border:none"><span style="color:var(--color-text-tertiary);font-style:italic">Evaluator note: ${f.note}</span></div>`;
      }

      fieldsHTML += `
        <div class="field">
          <div class="field-hdr">
            <div class="field-name">${f.n}</div>
            <div class="field-meta">
              <span class="fmax" style="color:${m.c}">max ${f.max} pts</span>
            </div>
          </div>
          <div style="padding:4px 14px 2px;background:var(--color-background-secondary);border-bottom:0.5px solid var(--color-border-tertiary)">
            <span class="ftype">${f.type}</span>
          </div>
          <div class="score-rows">${rowsHTML}</div>
        </div>`;
    });

    const totMaxInFields = m.fields.reduce((a, f) => a + parseFloat(f.max), 0);

    div.innerHTML = `
      <div class="mod-hdr" onclick="toggleMod('${m.id}')">
        <div class="mod-left">
          <div>
            <div style="font-size:13px;font-weight:500;color:${m.tc}">${m.name}</div>
            <div style="font-size:10px;color:var(--color-text-tertiary);margin-top:2px">${m.fields.length} sub-indicators · sum of fields: ${totMaxInFields} pts → capped at ${m.pts}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="text-align:right">
            <div class="mod-pts" style="color:${m.c}">${m.pts}</div>
            <div class="mod-ptsl">/ 120 pts (${Math.round(m.pts / 120 * 100)}%)</div>
          </div>
          <div class="mod-chevron" id="chev-${m.id}" style="color:${m.c}">▼</div>
        </div>
      </div>
      <div class="mod-why" id="why-${m.id}">${m.why}</div>
      <div class="mod-body" id="body-${m.id}">${fieldsHTML}</div>`;

    cont.appendChild(div);
  });
}

function toggleMod(id) {
  const body = document.getElementById('body-' + id);
  const why = document.getElementById('why-' + id);
  const chev = document.getElementById('chev-' + id);
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  why.style.display = isOpen ? 'none' : 'block';
  chev.classList.toggle('open', !isOpen);
}

function toggleAll(open) {
  D.forEach(m => {
    const body = document.getElementById('body-' + m.id);
    const why = document.getElementById('why-' + m.id);
    const chev = document.getElementById('chev-' + m.id);
    if (body) { body.style.display = open ? 'block' : 'none'; }
    if (why) { why.style.display = open ? 'block' : 'none'; }
    if (chev) { chev.classList.toggle('open', open); }
  });
}

buildBar();
buildMods();
