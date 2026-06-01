# EngSUI Tech Commercialisation Intelligence Tool

Live: **https://engsui-evaluator.netlify.app**

Static browser-based platform for evaluating deep-tech startups. Built during Summer Internship at Engineers India Limited (EIL), April–June 2026, as part of the MBA programme at IIM Nagpur.

## What it does

Operationalises a three-layer commercialisation framework:

1. **Commercialisation Readiness Scorecard (CRS)** — 7 modules, 120 points, 40+ sub-indicators
2. **Dynamic Weight Calibration System (DWCS)** — adjusts module weights by TRL stage, sector, IP, policy, team, competition
3. **Scenario Valuation Model** — auto-selects among Berkus, Scorecard, VC Method, Risk-adjusted DCF, Revenue Multiple, Peer Multiple; renders Bull / Base / Bear

Calibrated against 8 live transactions (Log9 Materials, Miko Technologies, Alt Carbon, E-Spin Nanotech, Aquafront, Fermentech, VayuJal, Powerzest Energy). 5 of 8 inside ±20% variance band.

## Repo layout

| Path | Purpose |
|---|---|
| `new-engsui-platform/` | Main evaluation tool — HTML/CSS/JS, no build step |
| `scoring-mechanism/` | Standalone 120-pt scoring hierarchy reference |
| `platform-functioning-guide.html` | User-facing functioning guide |
| `final-report/` | SIP final report (HTML source + PDF) + CV bullets |
| `Calibration Stage.csv` | 8-startup actual-vs-tool valuation calibration |

## Live URLs

- Main platform: <https://engsui-evaluator.netlify.app>
- Scoring hierarchy: <https://engsui-evaluator.netlify.app/scoring-mechanism/>
- Functioning guide: <https://engsui-evaluator.netlify.app/guide/>

## Run locally

```sh
cd new-engsui-platform
python3 -m http.server 8000
# open http://localhost:8000
```

Pure HTML/CSS/JS — no backend, no build, no API keys. All state persists in `localStorage`.

## Deploy

```sh
cd new-engsui-platform
netlify deploy --prod --dir=.
```

## Author

**Priyanshu Dutta** · MBA 2025–27, IIM Nagpur
[LinkedIn](https://www.linkedin.com/in/priyanshudutta) · priyanshudutta248@gmail.com
