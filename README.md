# NEMA Wetlands Compliance Checker

A Streamlit web application for wetland & water risk checks on land in Uganda and Kenya — **built for real estate**: plot buyers, sellers, agents, developers and investors. Pick any plot and the app automatically fetches mapped wetlands, lakes, rivers and streams around it from OpenStreetMap (no GIS files needed), then tells you what the proximity means for your purchase or development decision — including NEMA compliance implications.

It remains useful for environmental consultants and regulators doing rapid NEMA screening of development sites near sensitive wetland ecosystems.

## Repository Layout

The project now ships three coordinated surfaces on top of one shared analysis core:

| Path | Surface | Purpose |
| --- | --- | --- |
| `app.py` | Streamlit | The original interactive desktop/analyst experience |
| `main.py`, `api/` | FastAPI | Headless REST API — plot screening, PDF certificates, billing, payments |
| `webapp/` | Next.js 14 | Mobile-first due-diligence app (MapLibre GL, no iframe) |
| `public/` | Static | Legacy embed/hosted landing page |

Shared analysis modules used by all three: `risk_score.py` (0-100 traffic-light
scorecard), `location_input.py` (landmark / map-link / DMS / coordinate parsing),
`certificate.py` (2-page stamped PDF with QR + buffer-ring map), `storage.py`
(SQLite), `wetland_cache.py` (indexed GeoPackage), `spatial_db.py` (optional
PostGIS), `osm_data.py` (Overpass), `flood_risk.py` (Copernicus DEM),
`branding.py` (white-label), `cadastral.py` (block/plot registry).

### Running the full stack

```bash
# 1. Backend API (screening, certificates, billing)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. Web app
cd webapp && npm install && npm run dev      # http://localhost:3000

# 3. Original Streamlit app (optional)
streamlit run app.py
```

Optional infrastructure — Redis (Celery worker/scheduler), PostGIS (faster
spatial queries) and payment gateway credentials — is **optional by design**:
without it the API degrades gracefully (`DISABLE_POSTGIS=1`, `not_configured`,
`unavailable`) instead of failing.

### Validation

```bash
python -m pytest tests/ -q                    # 208 tests
node tools/check_webapp_syntax.mjs            # TypeScript syntax for webapp/
python tools/verify_webapp_contract.py        # frontend <-> backend contract
```

## 🌍 What This App Does

### Core Functionality
- **Live OpenStreetMap Data (default)**: Wetlands, water bodies and waterways are fetched automatically around your plot via the Overpass API — zero file preparation
- **Wetland Proximity Analysis**: Automatically detects wetlands within specified buffer zones around project sites
- **Environmental Impact Assessment**: Analyzes potential impacts based on proximity, wetland types, and project characteristics
- **Compliance Reporting**: Generates detailed compliance reports with recommendations and regulatory requirements
- **Interactive Mapping**: Provides interactive maps showing project sites, nearby wetlands, and analysis areas
- **Static Map Export**: Creates high-quality PNG maps for reports and documentation
- **Batch Processing**: Handles multiple project sites simultaneously for efficiency

### Key Features
- **Multi-Source Data Integration**: Combines OpenStreetMap wetland data with local GIS datasets
- **Regulatory Compliance**: Aligned with NEMA (National Environment Management Authority) guidelines
- **Risk Assessment**: Categorizes environmental risk levels (Low, Medium, High, Critical)
- **Professional Reporting**: Generates formatted reports in multiple formats (Markdown, Word, PDF)
- **Mobile-Optimized**: Responsive design works on desktop, tablet, and mobile devices
- **Memory Efficient**: Optimized for cloud deployment with intelligent batch processing

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Internet connection (for basemap tiles and data sources)
- Modern web browser

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd nema2

# Install dependencies
pip install -r requirements.txt

# Run the application
streamlit run app.py
```

### Quick Start
1. **Select Input Method**: Choose between manual coordinate entry or batch file upload
2. **Define Project Site**: Enter coordinates or upload site geometries
3. **Set Analysis Parameters**: Choose buffer distance (typically 100m-5km)
4. **Run Analysis**: Generate wetland proximity analysis
5. **Review Results**: Examine interactive maps and compliance assessment
6. **Export Reports**: Download detailed reports and maps

## 📋 General Best Practices

### Data Input Guidelines
- **Coordinate Format**: Use decimal degrees (e.g., 0.3476, 32.5825) or UTM coordinates
- **Site Boundaries**: Provide accurate project boundaries for precise analysis
- **Batch Processing**: For multiple sites, use CSV format with required columns (lat, lon, name)
- **Data Quality**: Verify coordinates are within Uganda/Kenya boundaries

### Analysis Parameters
- **Buffer Distances**:
  - **100m**: Immediate impact zone (required for most projects)
  - **500m**: Direct impact assessment
  - **1-2km**: Indirect impact evaluation
  - **5km**: Regional context analysis
- **Site Types**: Accurately categorize your project (residential, industrial, infrastructure, etc.)
- **Sensitivity**: Use appropriate sensitivity settings based on project scale

### Compliance Assessment
- **Risk Categories**:
  - **Low**: >2km from wetlands, minimal environmental controls needed
  - **Medium**: 500m-2km from wetlands, standard mitigation measures required
  - **High**: 100-500m from wetlands, comprehensive EIA and mitigation required
  - **Critical**: <100m from wetlands, special permits and extensive mitigation required

### Report Generation
- **Documentation**: Always generate reports for regulatory submission
- **Map Quality**: Use high DPI (300) for official documents, medium (200) for digital sharing
- **Custom Labels**: Add meaningful site names and project descriptions
- **Version Control**: Include generation dates and parameters in reports

### Technical Best Practices
- **Memory Management**: For large batch processing, use smaller batch sizes (10-20 sites)
- **Network Issues**: If basemap loading fails, try switching map types or reducing quality
- **Data Updates**: Wetland data is periodically updated; re-run analysis for time-sensitive projects
- **Backup**: Save generated reports and data locally as backups

## 🏗️ Use Cases

### Real Estate Agents, Buyers & Investors
- Pre-purchase due diligence: is the plot inside or near a wetland?
- Understand flooding exposure and development restrictions before committing funds
- Generate professional risk reports for clients and negotiations
- Batch-screen multiple plots/portfolios at once

### Environmental Consultants
- Pre-screening project sites for environmental sensitivity
- Generating preliminary impact assessments
- Creating professional maps for client presentations
- Batch processing multiple potential sites

### Developers and Planners
- Site selection and feasibility studies
- Understanding regulatory requirements early in planning
- Identifying potential environmental constraints
- Preparing for formal EIA submissions

### Regulatory Bodies
- Rapid screening of development applications
- Standardized assessment criteria
- Quality control for submitted environmental reports
- Training and capacity building

### Academic and Research
- Environmental impact studies
- Wetland conservation research
- GIS and remote sensing applications
- Student training in environmental assessment

## 📊 Technical Specifications

### Data Sources
- **Wetlands**: Live OpenStreetMap (Overpass API) wetlands, water bodies & waterways — plus optional local shapefiles, OGC WFS and ArcGIS REST
- **Basemaps**: Esri WorldImagery, CartoDB, OpenStreetMap
- **Projections**: Automatic UTM zone selection (36N/37N or southern equivalents) for meter-accurate distances and buffers; EPSG:32636 fallback
- **Coverage**: Uganda, Kenya, and surrounding regions

### Performance
- **Processing Speed**: 1-5 seconds per site (depending on complexity)
- **Batch Capacity**: Up to 100 sites per batch (memory dependent)
- **Map Resolution**: Up to 300 DPI for professional quality
- **File Formats**: PNG, PDF, DOCX, Markdown, CSV, Excel

### Deployment
- **Platform**: Streamlit Cloud, Railway, Heroku, local deployment
- **Memory**: Optimized for 1GB RAM environments
- **Storage**: Minimal persistent storage required
- **Scaling**: Horizontal scaling supported for high-volume usage

## 🔧 Troubleshooting

### Common Issues
- **Map Loading Failures**: Switch between satellite and street map views
- **Memory Errors**: Reduce batch size or buffer distance
- **Coordinate Errors**: Verify coordinates are in decimal degrees format
- **Network Issues**: Check internet connection for basemap tiles

### Performance Optimization
- Use smaller buffer distances for faster processing
- Process large batches in smaller chunks
- Clear browser cache if interface becomes slow
- Monitor memory usage during batch processing

## 🛠️ Development

### Running Tests

The core compliance logic (wetland intersection detection, distance calculations,
report rendering, UTM zone selection) is covered by a headless pytest suite:

```bash
pip install -r requirements-dev.txt
python -m pytest tests/ -v
```

### Project Layout (core Python modules)

```
├── app.py                  # Streamlit application (UI, map, report downloads)
├── report_logic.py         # Compliance engine: intersection check, distances, report render
├── geo_utils.py            # GIS helpers: geopandas version compat, automatic UTM zone selection
├── data_sources.py         # Wetlands loaders (local file, OGC WFS, ArcGIS REST)
├── batch_processing.py     # Multi-site batch checking + CSV/report generation
├── static_map_export.py    # High-quality PNG map export (used by the app)
├── interactive_input.py    # Draw-your-site map with search (Uganda & Kenya)
├── memory_monitor.py       # Memory usage monitoring for constrained hosts
├── report_template.md.j2   # Jinja2 template for the compliance report
└── tests/                  # Headless pytest suite
```

### Key Behaviors
- **Distances** are measured from the **site boundary** (not its centroid) to match NEMA buffer guidance.
- **UTM zones** are selected automatically per site (Uganda: 36N; Kenya: 36N/37N, southern hemisphere zones handled).
- The compliance check is **fail-safe**: empty or CRS-less uploads return "not in wetland" with a warning instead of crashing.

## 📞 Support and Documentation

### Getting Help
- Check error messages for specific guidance
- Review coordinate format requirements
- Verify internet connectivity for map tiles
- Contact technical support for persistent issues

### Updates and Maintenance
- Application is regularly updated with latest wetland data
- New features and improvements are deployed automatically
- User feedback drives feature development priorities

## 📜 License and Compliance

This application is designed to support environmental compliance and conservation efforts. Users are responsible for:
- Verifying data accuracy for official submissions
- Following local regulatory requirements
- Conducting appropriate field verification
- Using results as preliminary assessment only

**Note**: This tool provides preliminary environmental screening. Official Environmental Impact Assessments should include field surveys, stakeholder consultation, and comprehensive analysis by qualified environmental professionals.
