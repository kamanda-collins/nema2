"""
risk_score.py

Property Risk Scorecard engine (plan Phase 1.1):
- Translates proximity and intersection into a consumer-facing 0-100 property score
- Traffic-light bands: Safe (90-100), Caution (60-89), High Risk (0-59)
- Jurisdiction detection (Uganda / Kenya) and statutory buffer rules
- Standard statutory legal references and legal disclaimers
"""

from dataclasses import asdict, dataclass, field
from typing import List, Optional

DISCLAIMER = (
    "Preliminary advisory screening only: this report is not a land survey, title search, "
    "or formal environmental audit. Automated proximity calculations reflect mapped wetland "
    "and water features. An official NEMA clearance certificate and an on-site cadastral review "
    "by a registered surveyor must be obtained before concluding any land transaction."
)

_UGANDA_BOUNDS = {"min_lat": -1.5, "max_lat": 4.3, "min_lon": 29.5, "max_lon": 35.1}
_KENYA_BOUNDS = {"min_lat": -4.7, "max_lat": 5.5, "min_lon": 33.9, "max_lon": 42.0}


def detect_country(lat: Optional[float], lon: Optional[float]) -> str:
    """Detect whether coordinates lie in Uganda or Kenya."""
    if lat is None or lon is None:
        return "East Africa (unclassified)"

    in_uganda = (
        _UGANDA_BOUNDS["min_lat"] <= lat <= _UGANDA_BOUNDS["max_lat"]
        and _UGANDA_BOUNDS["min_lon"] <= lon <= _UGANDA_BOUNDS["max_lon"]
    )
    in_kenya = (
        _KENYA_BOUNDS["min_lat"] <= lat <= _KENYA_BOUNDS["max_lat"]
        and _KENYA_BOUNDS["min_lon"] <= lon <= _KENYA_BOUNDS["max_lon"]
    )

    if in_uganda and not in_kenya:
        return "Uganda"
    if in_kenya and not in_uganda:
        return "Kenya"
    if in_uganda and in_kenya:
        # Border area: Kampala longitude is ~32.5 (Uganda), Nairobi is ~36.8 (Kenya)
        return "Uganda" if lon < 34.2 else "Kenya"

    return "East Africa (unclassified)"


def statutory_buffer_m(country: str, feature_kind: str = "wetland") -> int:
    """Return the statutory buffer distance in meters according to national regulations."""
    kind = (feature_kind or "wetland").lower()
    c = (country or "").lower()

    if "uganda" in c:
        # Uganda National Environment Act 2019 / Wetland Regulations: 100m for major wetlands/lakes, 30m for streams
        if kind in ("waterway", "stream", "river"):
            return 30
        return 100

    if "kenya" in c:
        # Kenya EMCA / Water Act: 30m riparian reserve for rivers/streams
        return 30

    return 30


def legal_references(country: str) -> List[str]:
    """Return applicable statutory and regulatory citations for the jurisdiction."""
    c = (country or "").lower()
    if "uganda" in c:
        return [
            "The National Environment Act, 2019 (Act No. 5 of 2019).",
            "The National Environment (Wetlands, Riverbanks and Lake Shores Management) Regulations.",
            "Uganda Water Act, Cap 152.",
        ]
    if "kenya" in c:
        return [
            "Environmental Management and Co-ordination Act (EMCA), 1999 & Amendments.",
            "Water Act, 2016 & Water Resources Authority (WRA) Riparian Buffer Guidelines.",
            "Physical and Land Use Planning Act, 2019.",
        ]
    return [
        "National Environment Management Authority (NEMA) Guidelines.",
        "Applicable statutory environmental and riparian reserve regulations.",
    ]


@dataclass
class RiskAssessment:
    score: int
    band: str
    label: str
    color: str
    traffic_light: str
    is_restricted: bool
    flags: List[str]
    country: str
    statutory_buffer_m: int
    headline: str
    guidance: str
    legal_references: List[str]
    in_wetland: bool
    distance_m: Optional[float]
    feature_kind: str = "wetland"
    disclaimer: str = DISCLAIMER

    @property
    def emoji(self) -> str:
        if self.band == "Safe":
            return "🟢"
        if self.band == "Caution":
            return "🟡"
        return "🔴"

    def to_dict(self) -> dict:
        return asdict(self)


def assess_property_risk(
    in_wetland: bool,
    distance_m: Optional[float],
    feature_kind: str = "wetland",
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    country: Optional[str] = None,
) -> RiskAssessment:
    """Calculate the property compliance score and risk assessment."""
    if country is None:
        country = detect_country(lat, lon)

    buffer_m = statutory_buffer_m(country, feature_kind)
    flags: List[str] = []
    refs = legal_references(country)

    is_riparian_corridor = (feature_kind in ("waterway", "river", "stream")) and (distance_m is not None and distance_m <= 50.0)

    if in_wetland:
        score = 15
        band = "High Risk"
        label = "High Risk / Restricted"
        color = "#c62828"
        traffic_light = "red"
        is_restricted = True
        flags.append("INSIDE_MAPPED_WETLAND")
        headline = "🚫 Plot overlaps a mapped wetland or gazetted water body."
        guidance = (
            "Development inside wetlands is prohibited without explicit NEMA authorization. "
            "High probability of restoration orders or title encumbrances. Do not commit purchase funds."
        )
    elif distance_m is None:
        score = 75
        band = "Caution"
        label = "Caution / Distance Unknown"
        color = "#f57c00"
        traffic_light = "yellow"
        is_restricted = False
        flags.append("DISTANCE_UNKNOWN")
        headline = "⚠️ Distance to wetland could not be computed."
        guidance = "No mapped features were identified nearby. On-site verification recommended."
    elif distance_m < buffer_m or is_riparian_corridor:
        # Inside statutory buffer or riparian corridor
        ratio = max(0.0, distance_m / max(buffer_m, 50.0))
        score = int(20 + ratio * 25)
        score = max(0, min(45, score))
        band = "High Risk"
        label = "High Risk / Statutory Buffer Violation"
        color = "#c62828"
        traffic_light = "red"
        is_restricted = True
        if distance_m < buffer_m:
            flags.append("WITHIN_STATUTORY_BUFFER")
        if feature_kind in ("waterway", "river", "stream"):
            flags.append("RIPARIAN_CORRIDOR")
        
        if distance_m < buffer_m:
            headline = f"🟠 Plot is within the {buffer_m} m statutory buffer ({distance_m:.1f} m from edge)."
        else:
            headline = f"🟠 Plot is within a sensitive riparian corridor ({distance_m:.1f} m from waterway)."
        guidance = (
            f"Statutory regulations require a minimum setback buffer from this water feature. "
            "Building within this corridor is restricted and subject to demolition. Consult NEMA before proceeding."
        )
    elif distance_m < 500:
        # Buffer zone: 100m to 500m -> Caution (score 60 to 89)
        ratio = (distance_m - buffer_m) / max(1.0, (500 - buffer_m))
        score = int(60 + min(1.0, max(0.0, ratio)) * 29)
        score = max(60, min(89, score))
        band = "Caution"
        label = "Moderate Risk / Buffer Zone"
        color = "#f57c00"
        traffic_light = "yellow"
        is_restricted = False
        flags.append("NEAR_WETLAND_BUFFER")
        if feature_kind in ("waterway", "river", "stream"):
            flags.append("RIPARIAN_PROXIMITY")
        headline = f"🟡 Plot is near a mapped water feature ({distance_m:.1f} m away)."
        guidance = (
            "Outside the immediate statutory buffer, but close enough to warrant inspection "
            "for seasonal flooding, drainage pathways, and potential EIA screening requirements."
        )
    else:
        # Safe: 500m or further -> Safe (score 90 to 100)
        extra = min(10, int((distance_m - 500) / 200))
        score = min(100, 90 + extra)
        band = "Safe"
        label = "Safe / Low Environmental Exposure"
        color = "#2e7d32"
        traffic_light = "green"
        is_restricted = False
        flags.append("CLEAR_OF_STATUTORY_BUFFERS")
        headline = f"🟢 Low wetland exposure: Nearest feature is {distance_m:.1f} m away."
        guidance = (
            "The property is well outside statutory wetland and riparian buffers. "
            "Standard real estate due diligence (title search, physical survey) applies."
        )

    return RiskAssessment(
        score=score,
        band=band,
        label=label,
        color=color,
        traffic_light=traffic_light,
        is_restricted=is_restricted,
        flags=flags,
        country=country,
        statutory_buffer_m=buffer_m,
        headline=headline,
        guidance=guidance,
        legal_references=refs,
        in_wetland=in_wetland,
        distance_m=distance_m,
        feature_kind=feature_kind,
        disclaimer=DISCLAIMER,
    )