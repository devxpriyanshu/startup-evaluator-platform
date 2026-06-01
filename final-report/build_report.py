#!/usr/bin/env python3
"""
Build final PDF by rendering 3 segments separately (each w/ own page counter),
then concatenating with pypdf.

Segments:
  1. Title + Front-matter (Cert, Ack, Abstract, TOC, LoT)  → title=no#, then Roman i..
  2. Main body (Chapters 1-8)                              → Arabic 1..
  3. Appendix (A-D) + References                           → Roman i..
"""
import os, re, subprocess, sys
os.environ["DYLD_LIBRARY_PATH"] = "/opt/homebrew/lib:" + os.environ.get("DYLD_LIBRARY_PATH", "")

from pathlib import Path
from weasyprint import HTML, CSS
from pypdf import PdfWriter, PdfReader

ROOT  = Path("/Users/priyanshudutta/Desktop/DevProjects/startupEvaluatorPlatform/final-report")
SRC   = ROOT / "final_report.html"
OUT   = ROOT / "Priyanshu_Dutta_IIM_Nagpur_SIP_Final_Report.pdf"

raw = SRC.read_text()

# Extract style block + body content
head_match = re.search(r"<head>(.*?)</head>", raw, re.S)
head = head_match.group(1) if head_match else ""

# Pull body inner
body_inner = re.search(r"<body>(.*)</body>", raw, re.S).group(1)

# Find segment boundaries via stable anchors in the HTML.
# Segment 1 ends at <!-- /front-matter --> close.
# Segment 2 ends just before the appendix-block <div>.
# Segment 3 ends at end of body.

m_end_front  = body_inner.find('</div><!-- /front-matter -->')
m_app_start  = body_inner.find('<div class="appendix-block"')
m_app_end    = body_inner.rfind('</div><!-- /appendix-block -->')

assert m_end_front > 0 and m_app_start > 0 and m_app_end > 0, "Markers not found"

seg1 = body_inner[:m_end_front + len('</div><!-- /front-matter -->')]
seg2 = body_inner[m_end_front + len('</div><!-- /front-matter -->'):m_app_start]
seg3 = body_inner[m_app_start:m_app_end + len('</div><!-- /appendix-block -->')]

def wrap(body, page_css):
    return f"""<!DOCTYPE html><html><head>{head}<style>{page_css}</style></head><body>{body}</body></html>"""

# Per-segment @page overrides (override the global @page rule already in <head>).
# Title page (seg1) keeps Roman from i; title has its own :first {{ content: '' }}.
SEG1_CSS = """
  @page { @bottom-center { content: counter(page, lower-roman); font-family: 'Times New Roman', serif; font-size: 10pt; } }
  @page :first { @bottom-center { content: ''; } }
"""
SEG2_CSS = """
  @page { @bottom-center { content: counter(page, decimal); font-family: 'Times New Roman', serif; font-size: 10pt; } }
  @page :first { @bottom-center { content: counter(page, decimal); font-family: 'Times New Roman', serif; font-size: 10pt; } }
"""
SEG3_CSS = """
  @page { @bottom-center { content: counter(page, lower-roman); font-family: 'Times New Roman', serif; font-size: 10pt; } }
  @page :first { @bottom-center { content: counter(page, lower-roman); font-family: 'Times New Roman', serif; font-size: 10pt; } }
"""

tmp_pdfs = []
for i, (body, css) in enumerate([(seg1, SEG1_CSS), (seg2, SEG2_CSS), (seg3, SEG3_CSS)], 1):
    html = wrap(body, css)
    tmp_html = ROOT / f"_seg{i}.html"
    tmp_pdf  = ROOT / f"_seg{i}.pdf"
    tmp_html.write_text(html)
    HTML(filename=str(tmp_html)).write_pdf(str(tmp_pdf))
    tmp_pdfs.append(tmp_pdf)
    print(f"seg{i}: {tmp_pdf.name} → {PdfReader(str(tmp_pdf)).pages.__len__()} pages")

# Concatenate
writer = PdfWriter()
for p in tmp_pdfs:
    for page in PdfReader(str(p)).pages:
        writer.add_page(page)
with open(OUT, "wb") as f:
    writer.write(f)

# Cleanup temp
for p in tmp_pdfs:
    p.unlink()
for i in range(1, 4):
    f = ROOT / f"_seg{i}.html"
    if f.exists(): f.unlink()

total = PdfReader(str(OUT)).pages.__len__()
print(f"\nFinal: {OUT.name} ({OUT.stat().st_size:,} bytes, {total} pages)")
