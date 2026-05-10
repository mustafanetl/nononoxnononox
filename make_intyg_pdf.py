# -*- coding: utf-8 -*-
"""Generate the brother's intyg (witness statement) PDF for mål UM 4916-26."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame,
    Paragraph, Spacer, HRFlowable, KeepTogether, Table, TableStyle,
)

OUTPUT = "Intyg_Mustafa_Ibrahim.pdf"

FONT_REGULAR = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
FONT_ITALIC = "Helvetica-Oblique"
for regular, bold, italic in [
    (r"C:\Windows\Fonts\georgia.ttf", r"C:\Windows\Fonts\georgiab.ttf", r"C:\Windows\Fonts\georgiai.ttf"),
    (r"C:\Windows\Fonts\calibri.ttf", r"C:\Windows\Fonts\calibrib.ttf", r"C:\Windows\Fonts\calibrii.ttf"),
    (r"C:\Windows\Fonts\arial.ttf", r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\ariali.ttf"),
]:
    try:
        pdfmetrics.registerFont(TTFont("BodyFont", regular))
        pdfmetrics.registerFont(TTFont("BodyFont-Bold", bold))
        pdfmetrics.registerFont(TTFont("BodyFont-Italic", italic))
        FONT_REGULAR, FONT_BOLD, FONT_ITALIC = "BodyFont", "BodyFont-Bold", "BodyFont-Italic"
        break
    except Exception:
        continue

FONT_SANS = FONT_REGULAR
FONT_SANS_BOLD = FONT_BOLD
try:
    pdfmetrics.registerFont(TTFont("SansFont", r"C:\Windows\Fonts\arial.ttf"))
    pdfmetrics.registerFont(TTFont("SansFont-Bold", r"C:\Windows\Fonts\arialbd.ttf"))
    FONT_SANS, FONT_SANS_BOLD = "SansFont", "SansFont-Bold"
except Exception:
    pass

INK = HexColor("#1a1a1a")
MUTED = HexColor("#555555")
ACCENT = HexColor("#1f3a5f")
RULE = HexColor("#cccccc")
SOFT_BG = HexColor("#f4f4f4")

styles = {
    "body": ParagraphStyle("body", fontName=FONT_REGULAR, fontSize=10.5, leading=15,
                            alignment=TA_JUSTIFY, spaceAfter=8, textColor=INK),
    "body_left": ParagraphStyle("body_left", fontName=FONT_REGULAR, fontSize=10.5, leading=15,
                                 alignment=TA_LEFT, spaceAfter=6, textColor=INK),
    "title": ParagraphStyle("title", fontName=FONT_SANS_BOLD, fontSize=16, leading=20,
                             alignment=TA_LEFT, textColor=ACCENT, spaceAfter=2),
    "subtitle": ParagraphStyle("subtitle", fontName=FONT_SANS, fontSize=11, leading=14,
                                alignment=TA_LEFT, textColor=MUTED, spaceAfter=10),
    "h2": ParagraphStyle("h2", fontName=FONT_SANS_BOLD, fontSize=11, leading=14,
                          alignment=TA_LEFT, textColor=ACCENT, spaceBefore=12, spaceAfter=6),
    "label": ParagraphStyle("label", fontName=FONT_SANS_BOLD, fontSize=9, leading=12,
                             alignment=TA_LEFT, textColor=MUTED, spaceAfter=2),
    "field": ParagraphStyle("field", fontName=FONT_REGULAR, fontSize=10.5, leading=14,
                             alignment=TA_LEFT, spaceAfter=0, textColor=INK),
    "list_item": ParagraphStyle("list_item", fontName=FONT_REGULAR, fontSize=10.5, leading=15,
                                 alignment=TA_JUSTIFY, spaceAfter=6, leftIndent=16,
                                 firstLineIndent=-16, textColor=INK),
}


def P(text, style="body"):
    return Paragraph(text, styles[style])


def on_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1.2)
    canvas.line(2.2 * cm, h - 1.6 * cm, w - 2.2 * cm, h - 1.6 * cm)
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.5)
    canvas.line(2.2 * cm, 1.6 * cm, w - 2.2 * cm, 1.6 * cm)
    canvas.setFont(FONT_SANS, 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(2.2 * cm, 1.15 * cm,
                      "Intyg – Mål nr UM 4916-26 – Mustafa Ibrahim")
    canvas.drawRightString(w - 2.2 * cm, 1.15 * cm, f"Sida {doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=2.2 * cm, rightMargin=2.2 * cm,
    topMargin=2.0 * cm, bottomMargin=2.0 * cm,
    title="Intyg – Mustafa Ibrahim",
    author="Mustafa Ibrahim",
)
frame = Frame(doc.leftMargin, doc.bottomMargin + 0.4 * cm,
              doc.width, doc.height - 0.4 * cm, id="main", showBoundary=0)
doc.addPageTemplates([PageTemplate(id="default", frames=[frame], onPage=on_page)])

story = []

# Header
header_left = [P("INTYG", "title"), P("Bilaga till överklagande i mål UM 4916-26", "subtitle")]
header_right = [
    P("<b>Till</b> Migrationsöverdomstolen", "field"),
    P("via Förvaltningsrätten i Göteborg,", "field"),
    P("Migrationsdomstolen", "field"),
    Spacer(1, 2),
    P("Box 53197, 400 15 Göteborg", "field"),
]
header_table = Table([[header_left, header_right]],
                     colWidths=[doc.width * 0.48, doc.width * 0.52])
header_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ("TOPPADDING", (0, 0), (-1, -1), 0),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
]))
story.append(header_table)
story.append(Spacer(1, 6))
story.append(HRFlowable(width="100%", thickness=0.8, color=ACCENT,
                         spaceBefore=2, spaceAfter=14))


def field_cell(label, value):
    return [P(label, "label"), P(value, "field")]


# Parties
parties = Table(
    [
        [field_cell("INTYGSGIVARE",
                    "Mustafa Ibrahim<br/>"
                    "Personnummer: 19990813-0199<br/>"
                    "Uppehållstillstånd i Sverige sedan 2018"),
         field_cell("AVSER",
                    "Min bror<br/>"
                    "Murtadha Ibrahim<br/>"
                    "Personnummer: 20010221-5357<br/>"
                    "Mål nr UM 4916-26")],
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
story.append(Spacer(1, 4))

# Body
story += [
    P("BAKGRUND", "h2"),
    P(
        "Jag heter Mustafa Ibrahim och är bror till Murtadha Ibrahim, som är "
        "klagande i mål nr UM 4916-26 vid Migrationsöverdomstolen. "
        "Jag beviljades uppehållstillstånd i Sverige år 2018 efter att jag "
        "åberopat min sexuella läggning som asylskäl. Det är genom mig som "
        "min bror Murtadha, vår mor och våra systrar senare har kommit till "
        "Sverige."
    ),
    P("MIN SEXUELLA LÄGGNING OCH FAMILJENS KÄNNEDOM", "h2"),
    P(
        "Jag är homosexuell. Detta är känt i vår familj och i vår släkt i "
        "Irak. Uppgifterna om min läggning finns också dokumenterade i mitt "
        "asylärende hos Migrationsverket. Min familj i Irak har reagerat "
        "starkt negativt på min sexuella läggning och betraktar den som en "
        "skam för hela familjen."
    ),
    P("FARBROR KHALES SOM HOTAKTÖR", "h2"),
    P(
        "I min egen asylutredning hos Migrationsverket har jag namngivit min "
        "farbror Khales som en av de personer som utgör en konkret hotbild "
        "mot mig och mot vår familj. Han är starkt religiös och har uttryckt "
        "att familjens heder måste återupprättas. Hans inställning och hot "
        "riktar sig inte enbart mot mig, utan mot hela den manliga delen av "
        "släkten – eftersom hedersnormen i vår kultur innebär att ansvaret "
        "för att ”återställa” familjens heder vilar på alla manliga "
        "släktingar."
    ),
    P("RISKEN FÖR MIN BROR MURTADHA", "h2"),
    P(
        "Min bror Murtadha är inte homosexuell. Risken mot honom i Irak "
        "grundar sig dock direkt på min sexuella läggning. I vår familjs och "
        "släkts ögon är han medskyldig så länge han inte ingriper mot mig "
        "eller tar avstånd från mig på ett sätt som uppfattas som "
        "tillräckligt. Skammen som tillskrivs vår familj drabbar därför "
        "honom lika mycket som mig."
    ),
    P(
        "Farbror Khales känner till att Murtadha är min bror, att vi har "
        "haft nära kontakt och att han har följt med mig till Sverige. "
        "Vid ett återvändande till Irak är jag övertygad om att Murtadha "
        "kommer att utsättas för allvarliga repressalier från farbror "
        "Khales och från den vidare släkten. Irakiska myndigheter kan "
        "eller vill enligt min erfarenhet inte erbjuda skydd i den här "
        "typen av situationer."
    ),
    P("MEDGIVANDE ATT ÅBEROPA MITT ASYLÄRENDE", "h2"),
    P(
        "Jag samtycker till att relevanta delar av mitt asylärende hos "
        "Migrationsverket – särskilt uppgifterna om min sexuella läggning "
        "och om farbror Khales som namngiven hotaktör – åberopas som "
        "bevisning i min bror Murtadhas mål UM 4916-26."
    ),
    P("FÖRSÄKRAN", "h2"),
    P(
        "Jag försäkrar på heder och samvete att de uppgifter jag har lämnat "
        "ovan är sanna och att intyget är skrivet av fri vilja."
    ),
]

# Signature
sig_table = Table(
    [
        [P("<b>Ort:</b> [FYLL I]", "field"),
         P("<b>Datum:</b> [FYLL I]", "field")],
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
    P("<b>Mustafa Ibrahim</b>", "field"),
    P("Personnummer: 19990813-0199", "field"),
]
story += [KeepTogether(sig_block)]

doc.build(story)
print(f"PDF skapad: {OUTPUT}")
