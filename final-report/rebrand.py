#!/usr/bin/env python3
"""
Rebrand EIL EngSUI → DeepTechEval.
Surgical replacements: brand mentions become generic investor-facing terms.
Demo-startup data inside app.js retained (still useful as examples).
Demo strings referencing EIL specifically are reframed as 'the investor'.
"""
import re
from pathlib import Path

ROOT = Path("/Users/priyanshudutta/Desktop/DevProjects/startupEvaluatorPlatform/deeptecheval")
FILES = [
    ROOT / "index.html",
    ROOT / "app.js",
    ROOT / "scoring-mechanism" / "index.html",
    ROOT / "scoring-mechanism" / "app.js",
    ROOT / "guide" / "index.html",
]

# Ordered substitutions — longest first to avoid partial matches
SUBS = [
    # Brand
    ("EIL EngSUI &mdash;", "DeepTechEval &mdash;"),
    ("EIL EngSUI —", "DeepTechEval —"),
    ("EIL EngSUI -", "DeepTechEval -"),
    ("EIL EngSUI", "DeepTechEval"),
    ("EngSUI Commercialisation Intelligence Tool", "DeepTechEval — Tech Commercialisation Intelligence Tool"),
    ("EngSUI Deep-Tech Portfolio", "Your deep-tech portfolio"),
    ("EngSUI deep-tech portfolio", "your deep-tech portfolio"),
    ("EngSUI portfolio", "your portfolio"),
    ("EngSUI startups", "your portfolio startups"),
    ("EngSUI startup", "portfolio startup"),
    ("EngSUI initiative", "investor initiative"),
    ("EngSUI", "DeepTechEval"),

    # Possessives & generic 'EIL'
    ("EIL's renewable / green EPCM mandate", "investor's renewable / green portfolio mandate"),
    ("EIL's renewable / green", "investor's green-energy"),
    ("EIL's licensing and equity routes", "the investor's licensing and equity routes"),
    ("EIL's deep-tech infrastructure investment thesis", "deep-tech infrastructure investment thesis"),
    ("EIL's licensing", "the investor's licensing"),
    ("EIL's", "the investor's"),

    # M7 sub-indicator labels
    ("Alignment with EIL core sectors", "Alignment with your core investment sectors"),
    ("Integrable in standard EIL projects", "Integrable with standard portfolio operations"),
    ("Transforms EIL's position", "Transforms investor's position"),
    ("Licensing revenue potential for EIL", "Licensing revenue potential for the investor"),
    ("EIL engagement ask from startup", "Engagement ask from startup"),
    ("no strategic role for EIL", "no strategic role for the investor"),
    ("Open to EIL as minority", "Open to investor as minority"),
    ("Wants EIL as technology partner", "Wants investor as technology partner"),
    ("Actively seeking EIL as EPCM anchor partner", "Actively seeking investor as anchor partner"),
    ("Wants EIL as anchor customer + co-investor + EPCM partner", "Wants investor as anchor customer + co-investor + integration partner"),

    # Module name (keep M7 short on tab)
    ("M7 · EIL Fit (10)", "M7 · Strategic Fit (10)"),
    ("M7 · EIL strategic fit", "M7 · Strategic fit"),
    ("M7 · EIL Strategic Fit", "M7 · Strategic Fit"),
    ("Module 7 · EIL strategic fit", "Module 7 · Strategic fit"),
    ("EIL strategic fit", "Investor strategic fit"),
    ("EIL Strategic Fit", "Investor Strategic Fit"),
    ("EIL Fit ≥", "Strategic Fit ≥"),
    ("EIL Fit &lt; 3", "Strategic Fit &lt; 3"),
    ("EIL fit &lt; 3", "Strategic fit &lt; 3"),
    ("EIL fit", "strategic fit"),
    ("EIL Fit", "Strategic Fit"),

    # Placeholders
    ("e.g. EIL interaction, pilot context, or diligence notes",
     "e.g. interaction notes, pilot context, or diligence findings"),
    ("e.g. EIL ", "e.g. "),

    # Long contextual phrases
    ("EIL relevance, EPC integration, national mission alignment, licensing potential, and startup engagement ask",
     "strategic relevance, integration potential, mission alignment, licensing potential, and startup engagement ask"),
    ("EIL has a specific mandate, not a general venture capital mandate",
     "your firm has a specific mandate, not a general venture capital mandate"),
    ("EIL has a specific mandate", "your firm has a specific mandate"),
    ("EIL R&amp;D", "the R&amp;D team"),
    ("EIL R&D", "the R&D team"),

    # Generic remaining mentions
    ("EIL will not engage without it", "your firm will not engage without it"),
    ("EIL portfolio", "the portfolio"),

    # Standalone EIL → "the investor" — applied last
    ("EIL ", "the investor "),
    (" EIL", " the investor"),
    ("EIL.", "the investor."),
    ("EIL,", "the investor,"),
    ("EIL)", "the investor)"),
]

for fp in FILES:
    if not fp.exists():
        print(f"skip (missing): {fp.name}")
        continue
    text = fp.read_text()
    before = sum(text.count(k) for k, _ in SUBS)
    for k, v in SUBS:
        text = text.replace(k, v)
    after_eil = text.count("EIL") + text.count("EngSUI")
    fp.write_text(text)
    print(f"{fp.name}: substitutions applied, {after_eil} brand mentions remaining")

print("\nReview remaining EIL/EngSUI manually:")
for fp in FILES:
    if not fp.exists(): continue
    lines = fp.read_text().split("\n")
    for i, ln in enumerate(lines, 1):
        if "EIL" in ln or "EngSUI" in ln:
            print(f"  {fp.name}:{i}: {ln.strip()[:120]}")
