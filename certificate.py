"""
certificate.py

Indicative preliminary-screening PDF and buffer-ring map generation:
- Stable verification ID generation and digital lookup URL
- Matplotlib-based static buffer-ring map with site footprint and wetlands
- Multi-page branded PDF certificate via ReportLab with risk gauges, statutory breakdown,
  site map, legal citations, and verification seal.
"""

import hashlib
import io
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union

import geopandas as gpd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from shapely.geometry import Point

from geo_utils import estimate_utm_crs_for, union_all_geoseries
from risk_score import DISCLAIMER, RiskAssessment, assess_property_risk, detect_country

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def generate_verification_id(
    lat: Optional[float],
    lon: Optional[float],
    band: str,
    timestamp: Optional[str] = None,
) -> str:
    """Generate a stable, unique verification ID in format NEMA-YYYYMMDD-XXXXXX."""
    if not timestamp:
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    date_str = ""
    try:
        cleaned = timestamp.replace("Z", "+00:00")
        dt = datetime.fromisoformat(cleaned)
        date_str = dt.strftime("%Y%m%d")
    except Exception:
        pass
    if not date_str:
        date_str = datetime.now(timezone.utc).strftime("%Y%m%d")

    lat_str = f"{lat:.6f}" if lat is not None else "none"
    lon_str = f"{lon:.6f}" if lon is not None else "none"
    raw = f"{lat_str}:{lon_str}:{band}:{timestamp}"
    token = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:6].upper()
    return f"NEMA-{date_str}-{token}"


def verification_url(certificate_id: str) -> str:
    """Return the online verification URL for this certificate."""
    base_url = os.getenv("PUBLIC_WEB_URL", "http://localhost:3000").rstrip("/")
    return f"{base_url}/verify/{certificate_id}"


def render_site_map_png(
    site_gdf: Optional[gpd.GeoDataFrame],
    wetlands_gdf: Optional[gpd.GeoDataFrame] = None,
    buffer_m: int = 500,
    use_basemap: bool = False,
) -> Optional[bytes]:
    """Render a static PNG map highlighting the site footprint, buffer rings, and nearby wetlands."""
    if site_gdf is None or site_gdf.empty:
        return None

    try:
        utm_crs = estimate_utm_crs_for(site_gdf)
        site_proj = site_gdf.to_crs(utm_crs)
        site_geom = union_all_geoseries(site_proj.geometry)

        fig, ax = plt.subplots(figsize=(7, 5), dpi=150)
        fig.patch.set_facecolor("#ffffff")
        ax.set_facecolor("#f8f9fa")

        # Buffer rings: 500m, 100m, 30m
        r500 = site_geom.buffer(500)
        r100 = site_geom.buffer(100)
        r30 = site_geom.buffer(30)

        gpd.GeoSeries([r500]).plot(ax=ax, color="#e8f5e9", alpha=0.5, edgecolor="#81c784", linewidth=1, linestyle="--", label="500 m Caution Zone")
        gpd.GeoSeries([r100]).plot(ax=ax, color="#fff3e0", alpha=0.5, edgecolor="#ffb74d", linewidth=1.2, linestyle="-.", label="100 m Wetland Buffer")
        gpd.GeoSeries([r30]).plot(ax=ax, color="#ffebee", alpha=0.5, edgecolor="#e57373", linewidth=1.5, linestyle=":", label="30 m Riparian Buffer")

        # Wetlands overlay if present
        if wetlands_gdf is not None and not wetlands_gdf.empty:
            wetlands_proj = wetlands_gdf.to_crs(utm_crs)
            # Clip to 1km bounding context
            context_bound = site_geom.buffer(max(buffer_m, 1000))
            nearby_wetlands = wetlands_proj[wetlands_proj.intersects(context_bound)]
            if not nearby_wetlands.empty:
                nearby_wetlands.plot(ax=ax, color="#1976d2", alpha=0.45, edgecolor="#0d47a1", linewidth=0.8, label="Mapped Wetlands / Water")

        # Plot site boundary / footprint
        site_proj.plot(ax=ax, color="#d32f2f", alpha=0.3, edgecolor="#b71c1c", linewidth=2.5, label="Plot Footprint")

        # Add centroid marker
        centroid = site_geom.centroid
        ax.plot(centroid.x, centroid.y, marker="o", color="#b71c1c", markersize=7)

        # Set bounds with 20% margin around 500m buffer
        minx, miny, maxx, maxy = r500.bounds
        dx, dy = (maxx - minx) * 0.15, (maxy - miny) * 0.15
        ax.set_xlim(minx - dx, maxx + dx)
        ax.set_ylim(miny - dy, maxy + dy)

        ax.set_title("Property Location & Statutory Setback Buffers", fontsize=11, fontweight="bold", pad=10, color="#212121")
        ax.set_xticks([])
        ax.set_yticks([])

        # Clean legend
        handles, labels = ax.get_legend_handles_labels()
        # Deduplicate
        by_label = dict(zip(labels, handles))
        ax.legend(by_label.values(), by_label.keys(), loc="lower right", fontsize=7.5, framealpha=0.9)

        plt.tight_layout()
        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=150, bbox_inches="tight")
        plt.close(fig)
        buf.seek(0)
        return buf.getvalue()
    except Exception:
        plt.close("all")
        return None


def build_certificate_pdf(
    risk: Union[RiskAssessment, Dict[str, Any]],
    site_label: str = "Subject Property",
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    distance_m: Optional[float] = None,
    wetland_names: Optional[List[str]] = None,
    feature_kind: str = "wetland",
    site_gdf: Optional[gpd.GeoDataFrame] = None,
    wetlands_gdf: Optional[gpd.GeoDataFrame] = None,
    provenance: Optional[Dict[str, Any]] = None,
    certificate_id: Optional[str] = None,
    include_map: bool = True,
    branding: Optional[Dict[str, Any]] = None,
) -> bytes:
    """Generate an indicative preliminary-screening PDF for professional review."""
    from branding import AgencyBranding, validate_branding

    brand: AgencyBranding = validate_branding(branding)
    risk_dict = risk.to_dict() if isinstance(risk, RiskAssessment) else dict(risk)

    if lat is None and "lat" in risk_dict and risk_dict["lat"] is not None:
        lat = float(risk_dict["lat"])
    if lon is None and "lon" in risk_dict and risk_dict["lon"] is not None:
        lon = float(risk_dict["lon"])

    if (lat is None or lon is None) and (site_gdf is not None and not site_gdf.empty):
        try:
            centroid = site_gdf.to_crs("EPSG:4326").geometry.iloc[0].centroid
            if lat is None:
                lat = float(centroid.y)
            if lon is None:
                lon = float(centroid.x)
        except Exception:
            pass

    score = risk_dict.get("score", 70)
    band = risk_dict.get("band", "Caution")
    color_hex = risk_dict.get("color", "#f57c00")
    country = risk_dict.get("country", detect_country(lat, lon))
    buffer_m = risk_dict.get("statutory_buffer_m", 100)
    headline = risk_dict.get("headline", "Property Due Diligence Assessment")
    guidance = risk_dict.get("guidance", "")
    refs = risk_dict.get("legal_references", [])
    in_wetland = risk_dict.get("in_wetland", False)

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    issue_date = datetime.now(timezone.utc).strftime("%B %d, %Y")

    if not certificate_id:
        certificate_id = generate_verification_id(lat, lon, band, now_iso)

    verify_url = verification_url(certificate_id)

    # Set up ReportLab Document
    from branding import make_page_watermark

    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )
    page_decor = make_page_watermark(brand)

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CertTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=colors.HexColor("#0d47a1"),
        alignment=1,
    )
    subtitle_style = ParagraphStyle(
        "CertSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#555555"),
        alignment=1,
    )
    section_h1 = ParagraphStyle(
        "CertSectionH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=13,
        textColor=colors.HexColor("#1b5e20"),
        spaceBefore=6,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "CertBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#263238"),
    )
    callout_style = ParagraphStyle(
        "CertCallout",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#212121"),
    )

    elements = []

    # --- PAGE 1: HEADER & SCORECARD ---
    header_table_data = [
        [
            Paragraph("<b>🌿 NEMA COMPLIANCE & PROPERTY DUE DILIGENCE</b>", title_style),
        ],
        [
            Paragraph("INDICATIVE MAPPED-DATA SCREENING — NOT CLEARANCE OR A SURVEY", subtitle_style),
        ],
    ]
    header_table = Table(header_table_data, colWidths=[174 * mm])
    header_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0f4f8")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#bbdefb")),
                ("PADDING", (0, 0), (-1, -1), 6),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]
        )
    )
    elements.append(header_table)
    elements.append(Spacer(1, 3 * mm))

    # Certificate Meta Bar
    meta_data = [
        [
            Paragraph(f"<b>Certificate ID:</b> {certificate_id}", body_style),
            Paragraph(f"<b>Issued Date:</b> {issue_date}", body_style),
            Paragraph(f"<b>Jurisdiction:</b> {country}", body_style),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[65 * mm, 55 * mm, 54 * mm])
    meta_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ffffff")),
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#cfd8dc")),
                ("PADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    elements.append(meta_table)
    elements.append(Spacer(1, 3 * mm))

    # Score Box
    score_color = colors.HexColor(color_hex)
    score_table_data = [
        [
            Paragraph(f"<font size='22'><b>{score}</b></font><font size='10'>/100</font><br/><b>{band.upper()}</b>", ParagraphStyle("ScoreP", parent=body_style, alignment=1, textColor=score_color)),
            Paragraph(f"<b>{headline}</b><br/>{guidance}", callout_style),
        ]
    ]
    score_table = Table(score_table_data, colWidths=[42 * mm, 132 * mm])
    score_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#f9fbe7") if band == "Safe" else (colors.HexColor("#fffde7") if band == "Caution" else colors.HexColor("#ffebee"))),
                ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#fafafa")),
                ("BOX", (0, 0), (-1, -1), 1.2, score_color),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(score_table)
    elements.append(Spacer(1, 4 * mm))

    # Subject Property Particulars Table
    lat_str = f"{lat:.6f}°" if lat is not None else "N/A"
    lon_str = f"{lon:.6f}°" if lon is not None else "N/A"
    dist_str = f"{distance_m:,.1f} meters" if distance_m is not None else ("0.0 meters (Inside)" if in_wetland else "N/A")
    names_str = ", ".join(wetland_names) if wetland_names else "None mapped nearby"

    prop_data = [
        [Paragraph("<b>Parameter</b>", body_style), Paragraph("<b>Property Specification</b>", body_style)],
        [Paragraph("Site Identifier / Label", body_style), Paragraph(str(site_label), body_style)],
        [Paragraph("GPS Coordinates (WGS84)", body_style), Paragraph(f"Latitude: {lat_str} | Longitude: {lon_str}", body_style)],
        [Paragraph("Nearest Water / Wetland", body_style), Paragraph(names_str, body_style)],
        [Paragraph("Distance from Site Edge", body_style), Paragraph(f"<b>{dist_str}</b>", body_style)],
        [Paragraph("Reference Buffer", body_style), Paragraph(f"<b>{buffer_m} meters</b> (confirm with the responsible authority)", body_style)],
    ]
    prop_table = Table(prop_data, colWidths=[60 * mm, 114 * mm])
    prop_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eceff1")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#90a4ae")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cfd8dc")),
                ("PADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(Paragraph("<b>1. Property Specifications</b>", section_h1))
    elements.append(prop_table)
    elements.append(Spacer(1, 4 * mm))

    # Satellite / Map section on Page 1
    if include_map:
        elements.append(Paragraph("<b>2. Mapped Feature Context Map</b>", section_h1))
        # If site_gdf is None but lat/lon provided, create a dummy point gdf
        effective_site = site_gdf
        if (effective_site is None or effective_site.empty) and (lat is not None and lon is not None):
            effective_site = gpd.GeoDataFrame({"name": [site_label]}, geometry=[Point(lon, lat)], crs="EPSG:4326")

        png_bytes = render_site_map_png(effective_site, wetlands_gdf, buffer_m=500, use_basemap=False)
        if png_bytes:
            img_buf = io.BytesIO(png_bytes)
            img = Image(img_buf, width=170 * mm, height=88 * mm)
            elements.append(img)
        else:
            elements.append(Paragraph("<i>Map rendering not available for the specified coordinates.</i>", body_style))

    # --- PAGE 2: STATUTORY ANALYSIS & RECOMMENDATIONS ---
    elements.append(PageBreak())

    elements.append(Paragraph("<b>3. Preliminary Regulatory Considerations</b>", section_h1))

    # Compliance matrix
    in_buffer = in_wetland or (distance_m is not None and distance_m < buffer_m)
    matrix_data = [
        [Paragraph("<b>Regulatory Mandate</b>", body_style), Paragraph("<b>Status</b>", body_style), Paragraph("<b>Statutory Consequence</b>", body_style)],
        [
            Paragraph("Direct Wetland Encroachment", body_style),
            Paragraph("<font color='red'><b>VIOLATION</b></font>" if in_wetland else "<font color='green'><b>CLEAR</b></font>", body_style),
            Paragraph("Strictly prohibited under national law; immediate demolition/eviction risk.", body_style),
        ],
        [
            Paragraph(f"Statutory {buffer_m} m Setback Buffer", body_style),
            Paragraph("<font color='red'><b>ENCROACHMENT</b></font>" if in_buffer else "<font color='green'><b>COMPLIANT</b></font>", body_style),
            Paragraph(f"Mandatory {buffer_m} m green belt reserve; no permanent habitable structures allowed.", body_style),
        ],
        [
            Paragraph("500 m EIA Screening Radius", body_style),
            Paragraph("<font color='#f57c00'><b>TRIGGERED</b></font>" if (distance_m is not None and distance_m < 500) else "<font color='green'><b>CLEAR</b></font>", body_style),
            Paragraph("Environmental Project Brief (EPB) or screening audit may be mandated.", body_style),
        ],
    ]
    matrix_table = Table(matrix_data, colWidths=[55 * mm, 35 * mm, 84 * mm])
    matrix_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eceff1")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#90a4ae")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cfd8dc")),
                ("PADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(matrix_table)
    elements.append(Spacer(1, 4 * mm))

    # Action Checklist
    elements.append(Paragraph("<b>4. Mandatory Buyer Due-Diligence Checklist</b>", section_h1))
    checklist_text = (
        "• <b>Independent Cadastral Ground Check:</b> Verify exact boundary beacons with a registered land surveyor before paying land purchase deposits.<br/>"
        "• <b>Wetland Demarcation Verification:</b> Cross-reference plot boundaries against the Ministry of Water & Environment / NEMA gazette map.<br/>"
        "• <b>Title Verification:</b> Inspect the deed registry for conditional encumbrances or historical leasehold restrictions over drainage reserves.<br/>"
        "• <b>Rainy Season Inspection:</b> Visually inspect terrain during peak rainy months to verify natural drainage basins and flood water levels."
    )
    elements.append(Paragraph(checklist_text, body_style))
    elements.append(Spacer(1, 4 * mm))

    # Legal framework citations
    elements.append(Paragraph("<b>5. Applicable Statutory References</b>", section_h1))
    ref_lines = "<br/>".join([f"• {r}" for r in refs]) if refs else "• Applicable national environmental regulations."
    elements.append(Paragraph(ref_lines, body_style))
    elements.append(Spacer(1, 4 * mm))

    # Digital record box; it verifies report issuance, not a legal clearance.
    qr_placeholder_text = f"<b>DIGITAL RECORD</b><br/>Report ID: {certificate_id}<br/>Scan or visit: {verify_url}<br/>Preliminary screen only"
    stamp_line2 = brand.agency_tagline or "Preliminary mapped-data screening"
    stamp_text = (
        f"<b>{brand.agency_name.upper()}</b><br/><i>{stamp_line2}</i><br/>"
        "This record is not an authority clearance; field verification is required."
    )
    if brand.disclaimer_extra:
        stamp_text += f"<br/>{brand.disclaimer_extra}"
    footer_data = [
        [
            Paragraph(qr_placeholder_text, ParagraphStyle("QRText", parent=body_style, fontSize=7.5)),
            Paragraph(stamp_text, ParagraphStyle("Stamp", parent=body_style, alignment=2, fontSize=7.5)),
        ]
    ]
    footer_table = Table(footer_data, colWidths=[110 * mm, 64 * mm])
    footer_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0f4f8")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#90caf9")),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(footer_table)
    elements.append(Spacer(1, 3 * mm))

    # Legal Disclaimer
    elements.append(Paragraph(f"<b>Legal Notice & Disclaimer:</b> {DISCLAIMER}", ParagraphStyle("Disclaimer", parent=body_style, fontSize=6.5, leading=8.5, textColor=colors.HexColor("#78909c"))))

    # Build the PDF
    doc.build(elements, onFirstPage=page_decor, onLaterPages=page_decor)
    pdf_buffer.seek(0)
    return pdf_buffer.getvalue()
