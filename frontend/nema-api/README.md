# NEMA Compliance API

FastAPI-based REST API for NEMA environmental compliance checking. Provides modular endpoints for wetland compliance verification, distance calculations, batch processing, and report generation.

## 🚀 Features

### Core Features (Configurable via Feature Flags)
- ✅ **Compliance Check** - Verify if sites intersect protected wetlands
- ✅ **Distance Calculation** - Calculate minimum distance to wetlands (UTM accuracy)
- ✅ **Risk Assessment** - Automated compliance risk evaluation
- ✅ **Batch Processing** - Check up to 100 sites simultaneously
- ✅ **Wetlands Search** - Query wetlands by bounding box or radius
- ✅ **Report Generation** - Create compliance reports (Markdown/HTML/PDF)

### Key Benefits
- **Modular Design** - Enable/disable features via configuration
- **Spatial Accuracy** - Uses UTM Zone 36N (EPSG:32636) for East Africa
- **CORS Enabled** - Ready for frontend integration
- **Input Validation** - Pydantic models with comprehensive validation
- **Error Handling** - Detailed error responses with HTTP status codes

## 📋 Requirements

```bash
Python 3.8+
FastAPI 0.109.0+
GeoPandas 0.14.2+
Shapely 2.0.2+
```

See `requirements.txt` for full dependencies.

## 🛠️ Installation

1. **Create Virtual Environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install Dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure Environment**
Create `.env` file:
```env
# Feature Flags
ENABLE_COMPLIANCE_CHECK=true
ENABLE_DISTANCE_CALCULATION=true
ENABLE_REPORT_GENERATION=true
ENABLE_BATCH_PROCESSING=true
ENABLE_WETLANDS_SEARCH=true
ENABLE_MAP_VISUALIZATION=true

# Data Paths
WETLANDS_DATA_PATH=../nema2/data/shapefiles/uganda_wetlands.shp
REPORT_TEMPLATE_PATH=../nema2/report_template.md.j2

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

4. **Run Development Server**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at: http://localhost:8000

## 📚 API Documentation

Interactive API docs available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔌 Endpoints

### Health Check
```http
GET /health
```
Returns API status, enabled features, and wetlands data status.

### Compliance Check (Single Site)
```http
POST /api/v1/compliance/check
Content-Type: application/json

{
  "site_geojson": {
    "type": "FeatureCollection",
    "features": [...]
  },
  "buffer_zone_m": 200.0,
  "include_distance": true,
  "include_wetland_names": true
}
```

**Response:**
```json
{
  "in_wetland": false,
  "wetland_names": [],
  "min_distance_m": 450.5,
  "risk_level": "LOW",
  "compliant": true,
  "message": "Site is 450.5m from nearest wetland",
  "recommendation": "No wetland compliance issues detected",
  "buffer_violation": false,
  "checked_at": "2024-01-15T10:30:00Z"
}
```

### Batch Compliance Check
```http
POST /api/v1/compliance/batch
Content-Type: application/json

{
  "sites": [
    {
      "name": "Site A",
      "geojson": {...}
    },
    {
      "name": "Site B",
      "geojson": {...}
    }
  ],
  "buffer_zone_m": 200.0,
  "include_distance": true
}
```

**Response:**
```json
{
  "results": [...],
  "total_sites": 2,
  "compliant_sites": 1,
  "non_compliant_sites": 1,
  "processing_time_s": 0.523,
  "processed_at": "2024-01-15T10:30:00Z"
}
```

### Wetlands Search
```http
POST /api/v1/wetlands/search
Content-Type: application/json

{
  "bounds": [32.0, 0.0, 33.0, 1.0],  // [min_lon, min_lat, max_lon, max_lat]
  "limit": 100
}
```

Or search by point + radius:
```json
{
  "point": {
    "lon": 32.5,
    "lat": 0.5,
    "radius_km": 10
  },
  "limit": 50
}
```

### Report Generation
```http
POST /api/v1/report/generate
Content-Type: application/json

{
  "site_name": "Proposed Development Site",
  "site_geojson": {...},
  "compliance_result": {...},
  "applicant_info": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "format": "markdown"
}
```

## 🎛️ Configuration

### Feature Flags (`config.py`)
Enable/disable features without code changes:

```python
ENABLE_COMPLIANCE_CHECK = True
ENABLE_DISTANCE_CALCULATION = True
ENABLE_REPORT_GENERATION = True
ENABLE_BATCH_PROCESSING = True
ENABLE_WETLANDS_SEARCH = True
ENABLE_MAP_VISUALIZATION = True
```

### Processing Settings
```python
DEFAULT_CRS = "EPSG:4326"  # WGS84
UTM_CRS = "EPSG:32636"  # UTM Zone 36N for Uganda
MAX_BATCH_SIZE = 100
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
```

## 🧪 Testing

Test the API with curl:

```bash
# Health check
curl http://localhost:8000/health

# Compliance check
curl -X POST http://localhost:8000/api/v1/compliance/check \
  -H "Content-Type: application/json" \
  -d @test_site.json
```

## 🔐 Security Considerations

- CORS origins are configurable (default: localhost only)
- Input validation via Pydantic models
- File size limits enforced (10MB default)
- Maximum batch size limits (100 sites default)
- Geometry validation before processing

## 📦 Integration with Frontend

The API is designed to integrate with the React frontend in `geo-shape-capture-portal`. Example usage:

```typescript
// Check single site compliance
const checkCompliance = async (siteGeoJSON: any) => {
  const response = await fetch('http://localhost:8000/api/v1/compliance/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      site_geojson: siteGeoJSON,
      buffer_zone_m: 200,
      include_distance: true,
      include_wetland_names: true
    })
  });
  return await response.json();
};
```

## 🐛 Troubleshooting

### Wetlands Data Not Loading
- Check `WETLANDS_DATA_PATH` in `.env`
- Ensure shapefile exists and is readable
- Check console output on startup

### CORS Errors
- Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
- Restart the API after changing CORS settings

### Distance Calculation Fails
- Ensure site and wetlands have valid CRS
- Check that geometries are valid (not self-intersecting)

## 📝 License

MIT License - See LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions, please create a GitHub issue.
