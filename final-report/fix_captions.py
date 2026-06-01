#!/usr/bin/env python3
"""Convert table captions to spec format: bold Table X.Y, rest sentence case."""
import re
from pathlib import Path

FILE = Path("/Users/priyanshudutta/Desktop/DevProjects/startupEvaluatorPlatform/final-report/final_report.html")

# Preserve these tokens (proper nouns, acronyms) in their original case
PRESERVE = {
    "EIL", "EngSUI", "CRS", "DWCS", "TRL", "MBA", "SIP",
    "Eight", "Six", "Calibrated", "Internship",
    "EngSUI", "EngSUI's", "EngSUI'", "VC", "DCF", "IP",
    "Bull/Base/Bear",
}

def to_sentence_case(text):
    """Lowercase non-acronym words; keep first word capitalised."""
    words = re.split(r"(\s+|[—\(\),])", text)
    out = []
    first = True
    for w in words:
        if not w.strip() or re.match(r"^[\s—\(\),]+$", w):
            out.append(w)
            continue
        if w in PRESERVE:
            out.append(w)
        elif w.isupper() and len(w) >= 2:
            out.append(w)  # acronym
        elif first:
            out.append(w[0].upper() + w[1:].lower())
        else:
            out.append(w.lower())
        if w.strip():
            first = False
    return "".join(out)

def rewrite_caption(m):
    idx = m.group(1)      # "Table 5.1" or "Appendix C.1"
    title = m.group(2).strip().lstrip("—").strip()
    # Manual sentence-case overrides for known captions
    overrides = {
        "EngSUI Funding Tracks and Eligibility": "EngSUI funding tracks and eligibility",
        "EngSUI Host Institution Network (selected, 2017–2026)": "EngSUI host institution network (selected, 2017–2026)",
        "Key Stakeholders for the Project": "Key stakeholders for the project",
        "CRS Module Overview": "CRS module overview",
        "CRS Score Bands and Engagement Recommendation": "CRS score bands and engagement recommendation",
        "Engagement Decision Gates": "Engagement decision gates",
        "DWCS Multiplier Matrix by TRL Stage": "DWCS multiplier matrix by TRL stage",
        "Stage-to-Method Bridge for Valuation": "Stage-to-method bridge for valuation",
        "Sector-Specific Exit Multiples (Calibrated)": "Sector-specific exit multiples (calibrated)",
        "Founder Interview Coverage (Six Startups)": "Founder interview coverage (six startups)",
        "Calibration Summary (Eight Startups, June 2026)": "Calibration summary (eight startups, June 2026)",
        "Variance Diagnosis and Parameter Adjustments": "Variance diagnosis and parameter adjustments",
        "Portfolio EIL Role Matrix": "Portfolio EIL role matrix",
        "Internship Work Plan and Actual Progress": "Internship work plan and actual progress",
        "MBA Subject-to-Framework Mapping": "MBA subject-to-framework mapping",
        "Per-Startup Calibration Detail": "Per-startup calibration detail",
    }
    new_title = overrides.get(title, title)
    return f'<caption><span class="tnum">{idx}</span> {new_title}</caption>'

text = FILE.read_text()
new = re.sub(
    r'<caption>(Table \d+\.\d+|Appendix [A-Z]\.\d+)\s*(—[^<]*)</caption>',
    rewrite_caption,
    text,
)
changed = text.count("<caption>") == new.count("<caption>") and text != new
FILE.write_text(new)
print(f"Captions updated: {text.count('<caption>')} found, file rewritten.")
