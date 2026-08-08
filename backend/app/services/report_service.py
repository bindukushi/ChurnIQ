import io
from datetime import datetime

import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet


def records_to_dataframe(records: list[dict]) -> pd.DataFrame:
    return pd.DataFrame(records)


def build_csv(records: list[dict]) -> bytes:
    df = records_to_dataframe(records)
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    return buf.getvalue().encode("utf-8")


def build_excel(records: list[dict], sheet_name: str = "Report") -> bytes:
    df = records_to_dataframe(records)
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name=sheet_name)
        ws = writer.sheets[sheet_name]
        for i, col in enumerate(df.columns, start=1):
            max_len = max(df[col].astype(str).map(len).max() if len(df) else 0, len(col)) + 2
            ws.column_dimensions[ws.cell(row=1, column=i).column_letter].width = min(max_len, 40)
    return buf.getvalue()


def build_pdf_report(title: str, kpis: dict, records: list[dict]) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph(title, styles["Title"]),
        Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]),
        Spacer(1, 0.5 * cm),
    ]

    if kpis:
        elements.append(Paragraph("Key Metrics", styles["Heading2"]))
        kpi_rows = [[k.replace("_", " ").title(), str(v)] for k, v in kpis.items()]
        kpi_table = Table([["Metric", "Value"]] + kpi_rows, colWidths=[8 * cm, 8 * cm])
        kpi_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
        ]))
        elements += [kpi_table, Spacer(1, 0.8 * cm)]

    if records:
        elements.append(Paragraph("Records", styles["Heading2"]))
        cols = list(records[0].keys())
        data = [cols] + [[str(r.get(c, "")) for c in cols] for r in records[:200]]
        record_table = Table(data, repeatRows=1)
        record_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
        ]))
        elements.append(record_table)

    doc.build(elements)
    return buf.getvalue()
