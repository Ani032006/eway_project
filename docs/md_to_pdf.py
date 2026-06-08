"""Convert AUTHENTICATION_SYSTEM_GUIDE.md to PDF (no pandoc required)."""
import re
from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).parent
MD_FILE = ROOT / "AUTHENTICATION_SYSTEM_GUIDE.md"
PDF_FILE = ROOT / "AUTHENTICATION_SYSTEM_GUIDE.pdf"


def clean(text: str) -> str:
    text = text.replace("\u2014", "-").replace("\u2013", "-")
    text = text.replace("\u2018", "'").replace("\u2019", "'")
    text = text.replace("\u201c", '"').replace("\u201d", '"')
    text = re.sub(r"[^\x00-\xFF]", "", text)  # strip unsupported unicode/emojis
    return text


def wrap_long_tokens(text: str, limit: int = 90) -> str:
    parts = []
    for token in text.split(" "):
        while len(token) > limit:
            parts.append(token[:limit])
            token = token[limit:]
        if token:
            parts.append(token)
    return " ".join(parts)


def write_cell(pdf: FPDF, text: str, h: float = 6) -> None:
    pdf.set_x(pdf.l_margin)
    safe = wrap_long_tokens(clean(text))
    if not safe.strip():
        return
    try:
        pdf.multi_cell(pdf.epw, h, safe)
    except Exception:
        pdf.multi_cell(pdf.epw, h, safe[:2000])


class GuidePDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(100, 100, 100)
            self.cell(0, 8, "E-Way Intelligence - Authentication System Guide", align="C")
            self.ln(10)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, f"Page {self.page_no()}", align="C")


def render_markdown(pdf: FPDF, lines: list[str]) -> None:
    in_code = False
    code_buffer: list[str] = []

    for raw in lines:
        line = raw.rstrip("\n")

        if line.strip().startswith("```"):
            if in_code:
                pdf.set_font("Courier", "", 8)
                pdf.set_fill_color(245, 245, 245)
                block = wrap_long_tokens(clean("\n".join(code_buffer)))
                pdf.set_x(pdf.l_margin)
                pdf.multi_cell(pdf.epw, 4.5, block, fill=True)
                pdf.ln(2)
                code_buffer = []
                in_code = False
            else:
                in_code = True
            continue

        if in_code:
            code_buffer.append(line)
            continue

        if not line.strip():
            pdf.ln(3)
            continue

        if line.startswith("# "):
            pdf.ln(4)
            pdf.set_font("Helvetica", "B", 18)
            pdf.set_text_color(0, 72, 72)
            write_cell(pdf, line[2:].strip(), 9)
            pdf.ln(2)
            continue

        if line.startswith("## "):
            pdf.ln(3)
            pdf.set_font("Helvetica", "B", 14)
            pdf.set_text_color(0, 95, 95)
            write_cell(pdf, line[3:].strip(), 8)
            pdf.ln(1)
            continue

        if line.startswith("### "):
            pdf.ln(2)
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(30, 30, 30)
            write_cell(pdf, line[4:].strip(), 7)
            pdf.ln(1)
            continue

        if line.startswith("---"):
            pdf.ln(2)
            pdf.set_draw_color(200, 200, 200)
            y = pdf.get_y()
            pdf.line(10, y, 200, y)
            pdf.ln(4)
            continue

        if line.startswith("|"):
            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(40, 40, 40)
            write_cell(pdf, line, 5)
            continue

        if line.startswith("> "):
            pdf.set_font("Helvetica", "I", 10)
            pdf.set_text_color(50, 50, 50)
            write_cell(pdf, line[2:].strip(), 6)
            pdf.ln(1)
            continue

        if re.match(r"^[-*] ", line):
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(30, 30, 30)
            write_cell(pdf, "  - " + line[2:].strip(), 6)
            continue

        if re.match(r"^\d+\. ", line):
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(30, 30, 30)
            write_cell(pdf, "  " + line.strip(), 6)
            continue

        # inline formatting stripped for PDF simplicity
        text = re.sub(r"\*\*(.+?)\*\*", r"\1", line)
        text = re.sub(r"`([^`]+)`", r"\1", text)
        text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)

        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(30, 30, 30)
        write_cell(pdf, text, 6)
        pdf.ln(1)


def main() -> None:
    if not MD_FILE.exists():
        raise SystemExit(f"Missing: {MD_FILE}")

    lines = MD_FILE.read_text(encoding="utf-8").splitlines()

    pdf = GuidePDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_margins(15, 15, 15)
    pdf.add_page()
    render_markdown(pdf, lines)
    pdf.output(str(PDF_FILE))
    print(f"Created: {PDF_FILE}")


if __name__ == "__main__":
    main()
