# -*- coding: utf-8 -*-
"""Generate a clean, professional PDF of the överklagande for mål nr UM 4916-26."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame,
    Paragraph, Spacer, HRFlowable, KeepTogether, Table, TableStyle,
)

OUTPUT = "Overklagande_UM_4916-26.pdf"

# ---- Fonts ---------------------------------------------------------------
FONT_REGULAR = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
FONT_ITALIC = "Helvetica-Oblique"

for regular, bold, italic in [
    (r"C:\Windows\Fonts\georgia.ttf",
     r"C:\Windows\Fonts\georgiab.ttf",
     r"C:\Windows\Fonts\georgiai.ttf"),
    (r"C:\Windows\Fonts\calibri.ttf",
     r"C:\Windows\Fonts\calibrib.ttf",
     r"C:\Windows\Fonts\calibrii.ttf"),
    (r"C:\Windows\Fonts\arial.ttf",
     r"C:\Windows\Fonts\arialbd.ttf",
     r"C:\Windows\Fonts\ariali.ttf"),
]:
    try:
        pdfmetrics.registerFont(TTFont("BodyFont", regular))
        pdfmetrics.registerFont(TTFont("BodyFont-Bold", bold))
        pdfmetrics.registerFont(TTFont("BodyFont-Italic", italic))
        FONT_REGULAR = "BodyFont"
        FONT_BOLD = "BodyFont-Bold"
        FONT_ITALIC = "BodyFont-Italic"
        break
    except Exception:
        continue

# Register a sans font for headings if we got a serif body.
FONT_SANS = FONT_REGULAR
FONT_SANS_BOLD = FONT_BOLD
try:
    pdfmetrics.registerFont(TTFont("SansFont", r"C:\Windows\Fonts\arial.ttf"))
    pdfmetrics.registerFont(TTFont("SansFont-Bold", r"C:\Windows\Fonts\arialbd.ttf"))
    FONT_SANS = "SansFont"
    FONT_SANS_BOLD = "SansFont-Bold"
except Exception:
    pass

# ---- Colors --------------------------------------------------------------
INK = HexColor("#1a1a1a")
MUTED = HexColor("#555555")
ACCENT = HexColor("#1f3a5f")
RULE = HexColor("#cccccc")
SOFT_BG = HexColor("#f4f4f4")

# ---- Styles --------------------------------------------------------------
styles = {
    "body": ParagraphStyle(
        "body", fontName=FONT_REGULAR, fontSize=10.5, leading=15,
        alignment=TA_JUSTIFY, spaceAfter=6, textColor=INK,
    ),
    "body_left": ParagraphStyle(
        "body_left", fontName=FONT_REGULAR, fontSize=10.5, leading=15,
        alignment=TA_LEFT, spaceAfter=6, textColor=INK,
    ),
    "addressee": ParagraphStyle(
        "addressee", fontName=FONT_REGULAR, fontSize=10.5, leading=14,
        alignment=TA_LEFT, spaceAfter=2, textColor=INK,
    ),
    "title": ParagraphStyle(
        "title", fontName=FONT_SANS_BOLD, fontSize=16, leading=20,
        alignment=TA_LEFT, textColor=ACCENT, spaceAfter=2,
    ),
    "subtitle": ParagraphStyle(
        "subtitle", fontName=FONT_SANS, fontSize=11, leading=14,
        alignment=TA_LEFT, textColor=MUTED, spaceAfter=10,
    ),
    "h2": ParagraphStyle(
        "h2", fontName=FONT_SANS_BOLD, fontSize=11, leading=14,
        alignment=TA_LEFT, textColor=ACCENT, spaceBefore=12, spaceAfter=6,
    ),
    "label": ParagraphStyle(
        "label", fontName=FONT_SANS_BOLD, fontSize=9, leading=12,
        alignment=TA_LEFT, textColor=MUTED, spaceAfter=2,
    ),
    "field": ParagraphStyle(
        "field", fontName=FONT_REGULAR, fontSize=10.5, leading=14,
        alignment=TA_LEFT, spaceAfter=0, textColor=INK,
    ),
    "list_item": ParagraphStyle(
        "list_item", fontName=FONT_REGULAR, fontSize=10.5, leading=15,
        alignment=TA_LEFT, spaceAfter=4, leftIndent=14, firstLineIndent=-14,
        textColor=INK,
    ),
    "sub_item": ParagraphStyle(
        "sub_item", fontName=FONT_REGULAR, fontSize=10.5, leading=15,
        alignment=TA_JUSTIFY, spaceAfter=4, leftIndent=22, firstLineIndent=-22,
        textColor=INK,
    ),
    "footer": ParagraphStyle(
        "footer", fontName=FONT_SANS, fontSize=8, leading=10,
        alignment=TA_LEFT, textColor=MUTED,
    ),
    "footer_r": ParagraphStyle(
        "footer_r", fontName=FONT_SANS, fontSize=8, leading=10,
        alignment=TA_RIGHT, textColor=MUTED,
    ),
}


def P(text, style="body"):
    return Paragraph(text, styles[style])


def thin_rule(color=RULE, thickness=0.5, space_before=2, space_after=8):
    return HRFlowable(width="100%", thickness=thickness, color=color,
                      spaceBefore=space_before, spaceAfter=space_after)


# ---- Page frame with footer ---------------------------------------------
def on_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    # Top rule under margin
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1.2)
    canvas.line(2.2 * cm, h - 1.6 * cm, w - 2.2 * cm, h - 1.6 * cm)

    # Footer rule
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.5)
    canvas.line(2.2 * cm, 1.6 * cm, w - 2.2 * cm, 1.6 * cm)

    # Footer text
    canvas.setFont(FONT_SANS, 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(2.2 * cm, 1.15 * cm,
                      "Överklagande – Mål nr UM 4916-26 – Murtadha Ibrahim")
    canvas.drawRightString(w - 2.2 * cm, 1.15 * cm,
                           f"Sida {doc.page}")
    canvas.restoreState()


# ---- Document setup ------------------------------------------------------
doc = BaseDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=2.2 * cm, rightMargin=2.2 * cm,
    topMargin=2.0 * cm, bottomMargin=2.0 * cm,
    title="Överklagande – Mål nr UM 4916-26",
    author="Murtadha Ibrahim",
)

frame = Frame(
    doc.leftMargin, doc.bottomMargin + 0.4 * cm,
    doc.width, doc.height - 0.4 * cm,
    id="main", showBoundary=0,
)
doc.addPageTemplates([PageTemplate(id="default", frames=[frame], onPage=on_page)])

story = []

# ---- Header: title left, addressee right ---------------------------------
header_left = [
    P("ÖVERKLAGANDE", "title"),
    P("Mål nr UM 4916-26", "subtitle"),
]
header_right = [
    P("<b>Till</b> Migrationsöverdomstolen", "addressee"),
    P("via Förvaltningsrätten i Göteborg,", "addressee"),
    P("Migrationsdomstolen", "addressee"),
    Spacer(1, 2),
    P("Box 53197", "addressee"),
    P("400 15 Göteborg", "addressee"),
]

header_table = Table(
    [[header_left, header_right]],
    colWidths=[doc.width * 0.48, doc.width * 0.52],
)
header_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ("TOPPADDING", (0, 0), (-1, -1), 0),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
]))
story.append(header_table)
story.append(Spacer(1, 6))
story.append(thin_rule(color=ACCENT, thickness=0.8, space_before=2, space_after=14))

# ---- Parties block in a 2-column table -----------------------------------
def field_cell(label, value):
    return [P(label, "label"), P(value, "field")]


parties = Table(
    [
        [field_cell("KLAGANDE",
                    "Murtadha Ibrahim<br/>"
                    "Personnummer: 20010221-5357<br/>"
                    "Individnummer: 51234731"),
         field_cell("MOTPART", "Migrationsverket")],
        [field_cell("KONTAKTUPPGIFTER",
                    "Adress: Mellangården 1 lgh 1201,<br/>"
                    "586 43 Linköping<br/>"
                    "Telefon: 0708-91 01 07<br/>"
                    "E-post: murtavaa@gmail.com"),
         field_cell("ÖVERKLAGAT AVGÖRANDE",
                    "Förvaltningsrätten i Göteborg,<br/>"
                    "migrationsdomstolens dom<br/>"
                    "den 10 april 2026 i mål UM 4916-26")],
    ],
    colWidths=[doc.width * 0.50, doc.width * 0.50],
)
parties.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ("BACKGROUND", (0, 0), (-1, -1), SOFT_BG),
    ("BOX", (0, 0), (-1, -1), 0.4, RULE),
    ("INNERGRID", (0, 0), (-1, -1), 0.4, RULE),
]))
story.append(parties)
story.append(Spacer(1, 6))

saken = Table(
    [[P("<font name='%s' color='#555555' size='9'>SAKEN</font>" % FONT_SANS_BOLD),
      P("Ny prövning enligt 12 kap. 19 § utlänningslagen (2005:716)")]],
    colWidths=[3.4 * cm, doc.width - 3.4 * cm],
)
saken.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("BACKGROUND", (0, 0), (0, 0), HexColor("#e8edf3")),
    ("BOX", (0, 0), (-1, -1), 0.4, RULE),
]))
story.append(saken)

# ---- Yrkanden ------------------------------------------------------------
story += [
    P("YRKANDEN", "h2"),
    P("1.&nbsp;&nbsp; Prövningstillstånd meddelas.", "list_item"),
    P("2.&nbsp;&nbsp; Att målet, med ändring av migrationsdomstolens dom, tas "
      "upp till ny prövning enligt 12 kap. 19 § utlänningslagen.", "list_item"),
    P("3.&nbsp;&nbsp; I andra hand: att målet återförvisas till Migrationsverket "
      "för ny prövning.", "list_item"),
]

# ---- Grunder -------------------------------------------------------------
story += [
    P("GRUNDER", "h2"),
    P(
        "Migrationsdomstolen har <b>godtagit</b> att följande är nya "
        "omständigheter: min bror är homosexuell och har uppehållstillstånd i "
        "Sverige på denna grund sedan 2018, och jag lever inte enligt de "
        "normer som råder i Irak."
    ),
    P(
        "Domstolen har dock i en enda mening avslagit överklagandet, utan att "
        "analysera:"
    ),
    P(
        "<b>(a)</b>&nbsp; Den irakiska lagen från april 2024 som kriminaliserar "
        "samkönade relationer (10–15 års fängelse) och ”främjande” av "
        "homosexualitet (minst 7 år).", "sub_item"
    ),
    P(
        "<b>(b)</b>&nbsp; Att hedersvåld i Irak enligt EUAA Country Guidance "
        "(2024) drabbar hela familjen kollektivt.", "sub_item"
    ),
    P(
        "<b>(c)</b>&nbsp; Min morbror Khaled, som i min brors asylärende hos "
        "Migrationsverket redan är namngiven som hotaktör mot familjen.",
        "sub_item"
    ),
    P(
        "<b>(d)</b>&nbsp; Frånvaron av effektivt statligt skydd mot hedersvåld.",
        "sub_item"
    ),
]

# ---- Prövningstillstånd --------------------------------------------------
story += [
    P("SKÄL FÖR PRÖVNINGSTILLSTÅND", "h2"),
    P(
        "<b>Prejudikatskäl.</b> Migrationsöverdomstolen har inte prövat hur "
        "12 kap. 1–3 §§ utlänningslagen ska tillämpas på manliga familjemedlemmar "
        "till homosexuella personer från Irak efter 2024 års kriminaliseringslag. "
        "Rättsläget är oklart och frågan berör en växande grupp ärenden."
    ),
    P(
        "<b>Synnerliga skäl.</b> Migrationsdomstolens prövning saknar analys "
        "av aktuell landinformation och riskerar därmed att stå i strid med "
        "artikel 3 Europakonventionen."
    ),
]

# ---- Giltig ursäkt -------------------------------------------------------
story += [
    P("GILTIG URSÄKT", "h2"),
    P(
        "Mitt ärende prövades tidigare i en anknytningskontext, inte som "
        "asylärende. Min personliga risk som bror till en öppet homosexuell "
        "person har därför aldrig individuellt prövats. 2024 års irakiska lag "
        "och den landinformation som dokumenterar dess konsekvenser (EUAA 2024, "
        "UK Home Office juli 2024, HRW World Report 2025) blev tillgänglig "
        "först efter det ursprungliga beslutet."
    ),
]

# ---- Bevisning -----------------------------------------------------------
story += [
    P("BEVISNING", "h2"),
    P(
        "<b>1.</b>&nbsp; Min brors asylärende hos Migrationsverket, åberopas "
        "i relevanta delar – särskilt uppgifterna om morbror Khaled som "
        "namngiven hotaktör mot familjen.<br/>"
        "Broderns namn: Mustafa Ibrahim &nbsp;&nbsp; "
        "Personnummer: 19990813-0199", "list_item"
    ),
    P("<b>2.</b>&nbsp; Skriftligt intyg från min bror Mustafa Ibrahim "
      "(bifogas).", "list_item"),
    P("<b>3.</b>&nbsp; EUAA, <i>Country of Origin Information Report – Iraq</i> "
      "(2024), avsnitt 2.8 (LGBTIQ) och 2.9 (hedersbrott).", "list_item"),
    P("<b>4.</b>&nbsp; EUAA, <i>Country Guidance: Iraq</i> (2024).", "list_item"),
    P("<b>5.</b>&nbsp; UK Home Office, <i>CPIN: Iraq – Blood feuds, honour "
      "crimes and tribal violence</i> (juli 2024).", "list_item"),
    P("<b>6.</b>&nbsp; Human Rights Watch, <i>World Report 2025 – Iraq</i>.",
      "list_item"),
    Spacer(1, 4),
    P("Skriftligt intyg från min bror Mustafa Ibrahim bifogas detta "
      "överklagande."),
]

# ---- Övrigt --------------------------------------------------------------
story += [
    P("ÖVRIGT", "h2"),
    P("Jag har inget ombud i målet. All kommunikation kan ske till "
      "kontaktuppgifterna ovan."),
]

# ---- Signature -----------------------------------------------------------
sig_table = Table(
    [
        [P("<b>Ort:</b> Linköping", "field"),
         P("<b>Datum:</b> 2026-05-02", "field")],
    ],
    colWidths=[doc.width / 2, doc.width / 2],
)
sig_table.setStyle(TableStyle([
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ("TOPPADDING", (0, 0), (-1, -1), 0),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
]))

sig_block = [
    Spacer(1, 24),
    sig_table,
    Spacer(1, 36),
    HRFlowable(width="45%", thickness=0.6, color=INK, hAlign="LEFT",
               spaceBefore=0, spaceAfter=4),
    P("<b>Murtadha Ibrahim</b>", "field"),
]
story += [KeepTogether(sig_block)]

doc.build(story)
print(f"PDF skapad: {OUTPUT}")
