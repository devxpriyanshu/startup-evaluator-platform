#!/usr/bin/env python3
"""
EIL/EngSUI internship CV bullets — IIM CV guidelines:
- STAR (Situation, Task, Action, Result)
- Quantified (₹, %, count, time)
- Power verb start (Spearheaded, Architected, Calibrated...)
- Third person, no I/me/my
- Each line target 113-115 chars w/ spaces
- All claims audit-verifiable (Vijay Thakare sign-off)
"""

bullets = [
    # FRAMEWORK DESIGN — situation/action/result
    "Spearheaded design of 7-module 120-point startup-evaluation framework for EIL EngSUI ₹5 Cr+ deep-tech equity calls",
    "Architected stage-aware 6-method valuation engine standardising deal screen across 31-startup deep-tech portfolio",
    "Engineered dynamic weight-calibration model adjusting weights by 6 stage variables for deep-tech PSU equity mandate",
    # PLATFORM / DELIVERY
    "Launched live browser-based 11-module evaluation platform cutting analyst per-startup screen from 4 days to 4 hours",
    "Delivered 62-page report, 23-page scoring map, live web tool & calibration corpus within 8-week SIP at EIL Gurugram",
    # PRIMARY RESEARCH
    "Conducted 32-question structured interviews with 6 founders across biotech, water, CCUS, AWG, wind and nano sectors",
    "Synthesised cross-portfolio insight: 6/6 founders rated EIL EPC-network access above capital, reshaping deal thesis",
    # CALIBRATION & VALIDATION
    "Calibrated framework against 8 live deals worth ₹6,900 Cr aggregate market valuation; 5/8 hit <=20% variance band",
    "Quantified variance via 3 sector-multiple recalibrations tightening tool error from 81% to ~4% on Alt Carbon case",
    "Validated EIL reject-gate via Miko Technologies (₹4,600 Cr Series D) — non-EIL strategic filter works as designed",
    "Backtested Log9 Materials (₹1,899 Cr Series B) inputs; framework flagged adoption + unit-economics risk pre-funding",
    # STRATEGIC OUTPUT
    "Authored EIL Role Matrix mapping 8 startups to 4 engagement pathways (Equity, Licence, EPC, Reject) for IC briefing",
    "Recommended 5 PSU governance reforms (DPIIT-gate, IP-counsel, MCA21 API) projected to cut due-diligence cycle ~40%",
    "Pioneered 0.59x conservative-valuation discipline excluding narrative premium for audit-defensible PSU equity calls",
    "Streamlined investment-committee flow via 5 hard-floor auto-reject gates eliminating mandate-misaligned applicants",
]

print(f"{'#':>2}  {'LEN':>3}  STATUS  BULLET")
print("-" * 135)
for i, b in enumerate(bullets, 1):
    ln = len(b)
    if 113 <= ln <= 115:
        st = "  OK"
    elif ln > 115:
        st = "OVER"
    else:
        st = " PAD"
    print(f"{i:>2}  {ln:>3}  [{st:>4}] {b}")
print("-" * 135)
over = [(i, len(b)) for i, b in enumerate(bullets, 1) if len(b) > 115]
under = [(i, len(b)) for i, b in enumerate(bullets, 1) if len(b) < 113]
print(f"OVER 115: {over}")
print(f"UNDER 113: {under}")


ROLE: Strategy & Innovation Intern — Technology Commercialisation
COMPANY: Engineers India Limited (EIL), Gurugram | Apr–Jun 2026

 1 [115] Designed 7-module 120-pt Commercialisation Readiness Scorecard for EIL EngSUI deep-tech equity investment decisions
 2 [115] Engineered Dynamic Weight Calibration System adjusting 7 module weights by TRL stage — original valuation framework
 3 [113] Built stage-aware valuation engine selecting Berkus, Scorecard, VC Method or DCF by CRS score band and TRL levels
 4 [114] Launched 11-tab browser-based evaluation platform (React) reducing analyst per-startup assessment time by over 80%
 5 [114] Calibrated framework against 8 live deep-tech deals; 5 of 8 within 20% variance band after targeted multiplier fix
 6 [114] Recalibrated 3 sector multiples (CCUS, nanotech, wind) reducing Alt Carbon valuation error from 81% to 4% post-fix
 7 [114] Conducted 32-question structured interviews with 6 EngSUI founders across biotech, water, CCUS, AWG, wind and nano
 8 [114] Stress-tested EIL reject gate on Miko Technologies (Rs.4,600 Cr); non-EIL sector hard-floor module fired correctly
 9 [115] Backtested Log9 Materials at Series B; framework flagged adoption and unit-economics risk well ahead of its failure
10 [115] Authored Role Matrix mapping 8 EngSUI portfolio startups to four engagement pathways — Equity, Licence, EPC, Reject
11 [113] Pioneered 0.59x conservative valuation discipline excluding narrative premium for audit-defensible PSU investment
12 [114] Drafted 5 PSU-governance reforms including DPIIT prerequisite gate, IP-counsel review and MCA21 API for EIL EngSUI
13 [114] Delivered 62-page final report, 23-page scoring hierarchy, live React evaluation platform within 8-week SIP sprint
14 [114] Presented platform to EIL GM-level expert (PhD, R&D) who validated framework and requested second review with data
15 [114] Developed 5-band engagement gate (Equity/Licence/EPC Partner/Watch/Reject) with hard-floor module score thresholds


FOR TECH STRATEGY / CONSULTING (ZS, Accenture, Deloitte):
Use: 1, 2, 5, 9, 10, 14
These show: Framework design, calibration rigour,
            failure prediction, GM validation

FOR PRODUCT MANAGEMENT (Walmart Tech, Amazon):
Use: 1, 3, 4, 7, 13, 14
These show: Platform built, user research,
            delivery within timeline, validation

FOR INVESTMENT / PE / VC:
Use: 1, 2, 5, 6, 9, 11, 12
These show: Valuation methodology, calibration,
            conservative PSU discipline, governance