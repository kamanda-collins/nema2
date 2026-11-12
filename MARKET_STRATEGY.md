# Plot Screener — Market Strategy (Nov 2026)

> This document **rewires the product plan** (`plan.md`) to what the market research
> (`C:\Users\School\plot-screener-market-research.md`, Nov 2026) actually found.
> Where it disagrees with `plan.md`, this document wins.

## 0. One-line synthesis

The problem (land fraud + wetland/riparian demolitions) is real and worsening on both
sides of the border; diaspora money is at record highs; incumbents sell **time and
trust, not data**. An instant, WhatsApp-delivered, report-backed screen — **title-fraud
signals as the headline, wetland/riparian/flood as the differentiator** — prices into
the global benchmark band and undercuts every human intermediary.

## 1. What the research changed

| plan.md assumed | Research found | Rewire |
| --- | --- | --- |
| Wetland proximity is the headline risk | Title fraud is the bigger, faster-growing fear: 663 land-fraud cases in Uganda in 2025 (+67% YoY); every diaspora-scam story leads with fake titles | Lead with a **Plot Safety Report**: title status + fraud/encumbrance flags first, wetland/riparian/flood second |
| Buy-side risk only | Agents/developers also need trust signals to sell to diaspora | Add a seller-side certificate ("clear title & flood-safe") tier |
| Kenya + Uganda symmetric | Uganda's UgNLIS search is open (UGX 10k); Kenya's Ardhisasa needs the **registered owner's consent** online | Uganda-first consumer self-service; Kenya via coordinate-first checks + a guided consent workflow (this friction is the wedge) |
| Freemium web funnel | Real-estate commerce is **WhatsApp-first**; Kenya mobile-money penetration 91% | WhatsApp-native delivery of paid reports; web app is the workbench, WhatsApp is the channel |
| Phase 4 = B2B portals/banks first | Highest WTP is diaspora buyers mid-transaction; banks later | Reorder phases: diaspora → agents → law firms → banks |
| Pricing table fixed | $7 sits inside the global band (£4–$70), 2–8× the official search, ~1/5000th of conveyancing fees | Keep $7 anchor; add diaspora SKU; bundle the official search fee |

## 2. Positioning

**Plot Screener — "Know the plot before you pay."**

A Plot Safety Report combines, per plot:

1. **Title & fraud signals** (headline): registry status pull-through (UgNLIS now;
   Ardhisasa with owner consent), caveat/encumbrance flags, duplicate-sale risk signals.
2. **Environmental risk** (differentiator, already built): mapped wetland/riparian
   proximity vs statutory buffers, flood susceptibility from Copernicus DEM.
3. **Verdict + evidence**: traffic-light verdict, statutory buffer meter, map with
   buffer rings, methodology and data-confidence statement, verification ID.

The report is **screening, not clearance** — that legal position is unchanged and is a
feature (it is what makes it credible and cheap).

## 3. Segment ladder (reordered)

1. **Diaspora buyers mid-transaction** — via WhatsApp/Telegram/Facebook diaspora
   groups, diaspora media (Diaspora Messenger, khusoko), SACCOs. Pays in USD by card.
   Highest WTP, highest pain (remote due diligence).
2. **Agents & developers selling to diaspora** — seller-side branded "flood-safe /
   title-checked" certificates as a sales trust signal (white-label already built).
3. **Lawyers, valuers, surveyors** — white-label the screen inside the 2–5%
   conveyancing fee; batch screening for portfolios (built).
4. **Banks & SACCOs** — collateral-risk API, only after a signed pilot.

## 4. Pricing (revised)

| Tier | Price | Change vs plan.md | Why |
| --- | --- | --- | --- |
| Free preview | Free | unchanged | Land the funnel |
| **Instant Plot Safety Report** | UGX 25,000 / KES 650 (~$7) | unchanged anchor; now includes the bundled official search fee where pull-through is live | 2–8× the DIY search, trivial vs the 2–5% lawyer fee |
| **Diaspora Express** (new) | **$9.99** | new SKU: card/PayPal checkout, instant PDF + WhatsApp delivery | Diaspora pays USD; removes mobile-money friction |
| Pro Realtor Pass | UGX 150,000 / KES 4,500/mo (~$45) | unchanged price; add per-report credits ~KES 3–5k/report, white-label + WhatsApp share kit | Agents are the distribution |
| Law Firm / Surveyor Pack | UGX 450,000 (~$120)/mo | add evidence annexes (DEM cross-sections, polygon excerpts) | Still below UK Enviroreport-class reports |

## 5. Feature rewiring

**Add (priority order):**

1. **UgNLIS title-search pull-through** — the single highest-value feature; Uganda is
   open for it today (portal + mobile app, UGX 10k fee).
2. **Fraud/encumbrance flag set** — caveats, multiple-sales signals, seller-identity
   cross-checks surfaced as report flags (headline section).
3. **Ardhisasa guided consent workflow** (Kenya) — coordinate-first pre-purchase check
   + consent request; solves the biggest documented pre-purchase friction.
4. **WhatsApp-native delivery** — report PDF + verdict summary card shared straight
   into a chat (share loop already stubbed in the UI).
5. **Water Act riparian buffers** (Kenya 6–30 m by river class) + NEMA wetland polygon
   measurement as separate named distances — already half-built via `statutory_buffer_m`.
6. **DEM elevation-vs-river statement** — "plot sits N m above/below the nearest
   mapped river" (flood_risk.py gives the ingredients).
7. **Surveyor physical-verification add-on** (UGX 150,000–500,000 upsell) via partner
   network; **partner-lawyer/escrow referral** at report foot.

**Cut / defer:**

- EIA productization (different buyer, project-approval product).
- Property-portal API badges (Phase 4.3) until a portal or bank signs.
- PostGIS/Redis scale-out until volume demands it (graceful degradation already built).
- Anything that widens scope beyond a screening-grade check.

**Data risks to manage:** wetland boundaries are not yet uniformly gazetted at parcel
resolution (NWIS is live but incomplete) → publish methodology + confidence per report
(provenance block already does this); keep re-screen pricing low as gazettals land;
monitor 2026 Ugandan search/transfer fee changes; label DEM results "indicative, not a
survey" (done in UI).

## 6. Roadmap (rewired)

| Phase | Was (plan.md) | Now |
| --- | --- | --- |
| P1 | UI + data + certificate | **UgNLIS pull-through + fraud flags + diaspora SKU** (core report) |
| P2 | Decoupled architecture | shipped; maintain |
| P3 | Payments + flood | **WhatsApp delivery + card/diaspora checkout live** (payment rails already integrated) |
| P4 | B2B portals/banks | **Seller-side agent certificates + surveyor add-on referral**, then banks |

## 7. First experiments (validate before building further)

1. Distribute the free screen in 3 diaspora WhatsApp/Facebook groups; measure
   free→paid conversion on the $9.99 SKU.
2. Offer 10 agents the white-label certificate; measure report credits consumed.
3. Ship UgNLIS pull-through to 20 Uganda buyers; measure title-flag hit rate and
   support load before Kenya consent-workflow investment.

## 8. Research caveats

- The search tool inside the research session returned no results; findings come from
  a DuckDuckGo + source-fetch pass with ~20 sources (see the research file).
- Figures marked "≈/uncertain" (remittance-to-real-estate share, US flood-cert
  pricing, aggregate demolition losses) must be re-verified before investor use.
