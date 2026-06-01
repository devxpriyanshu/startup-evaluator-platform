#!/usr/bin/env python3
"""Render final_report.html → PDF using WeasyPrint (proper paged media support)."""
import os
os.environ["DYLD_LIBRARY_PATH"] = "/opt/homebrew/lib:" + os.environ.get("DYLD_LIBRARY_PATH", "")

from weasyprint import HTML
from pathlib import Path

SRC = Path("/Users/priyanshudutta/Desktop/DevProjects/startupEvaluatorPlatform/final-report/final_report.html")
OUT = Path("/Users/priyanshudutta/Desktop/DevProjects/startupEvaluatorPlatform/final-report/Priyanshu_Dutta_IIM_Nagpur_SIP_Final_Report.pdf")

HTML(filename=str(SRC)).write_pdf(str(OUT))
print(f"Wrote: {OUT} ({OUT.stat().st_size:,} bytes)")

from pypdf import PdfReader
r = PdfReader(str(OUT))
print(f"Pages: {len(r.pages)}")
