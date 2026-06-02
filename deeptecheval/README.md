# DeepTechEval

Live: **https://deeptecheval.com** (pending domain DNS)
Beta URL: **https://deeptecheval.netlify.app** (pending Netlify site create)

Free deep-tech startup evaluation framework + auto-valuation engine for VC analysts, accelerators, and corporate venture teams.

## What it does

- **7-module 120-point Commercial Readiness Score (CRS)** — Tech, IP, Team, Market, Adoption, Business Model, Strategic Fit
- **Dynamic Weight Calibration System (DWCS)** — adjusts module weights by TRL stage, sector, policy
- **Auto-valuation** — selects from 6 methods (Berkus, Scorecard, VC Method, Risk-adj DCF, Revenue Multiple, Peer Multiple)
- **Bull / Base / Bear scenario engine**
- **Calibration corpus** — 8 live deep-tech transactions across CCUS, water, biotech, storage, wind, nano, AWG

## Tiers

| Tier | Price | Features |
|---|---|---|
| **Free** | $0 | Single-startup eval, localStorage, JSON export |
| **Pro** | $29/mo | Multi-portfolio, PDF report export, cloud sync, multi-user |
| **Fund** | $199/mo | Team seats, custom sector packs, white-label, API |

## Stack

Pure HTML/CSS/JS. No build step. No backend. Netlify-hosted with Netlify Forms for waitlist capture.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

```sh
netlify deploy --prod --dir=.
```

## Roadmap

- Q3 2026: Auth (Clerk) + Supabase persistence → Pro tier launch
- Q4 2026: Sector packs (climate, hydrogen, CCUS, biotech)
- Q1 2027: Stripe billing + Fund tier API

## Author

**Priyanshu Dutta** · MBA 2025–27, IIM Nagpur
[LinkedIn](https://www.linkedin.com/in/priyanshudutta) · priyanshudutta248@gmail.com
