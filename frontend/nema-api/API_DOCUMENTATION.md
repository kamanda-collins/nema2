# NEMA Compliance API - Complete Setup & Integration Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [API Endpoints](#api-endpoints)
6. [Frontend Integration](#frontend-integration)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The NEMA Compliance API is a FastAPI-based REST service that wraps the NEMA2 Python backend, providing modular endpoints for environmental compliance checking. It allows selective feature extraction through feature flags.

### Key Features
- ✅ **Modular Design** - Enable/disable features via configuration
- ✅ **Spatial Accuracy** - Uses UTM Zone 36N for East Africa
- ✅ **Batch Processing** - Check up to 100 sites simultaneously
- ✅ **CORS Enabled** - Ready for frontend integration
- ✅ **Comprehensive Validation** - Pydantic models with error handling

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   React Frontend                             │
│            (geo-shape-capture-portal/src)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  FastAPI Server                              │
│                  (nema-api/main.py)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Endpoints (Feature Flag Controlled)                 │  │
│  │  - /api/v1/compliance/check                          │  │
│  │  - /api/v1/compliance/batch                          │  │
│  │  - /api/v1/wetlands/search                           │  │
│  │  - /api/v1/report/generate                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Core Functions (core.py)                            │  │
│  │  - check_compliance()                                │  │
│  │  - calculate_min_distance()                          │  │
│  │  - assess_compliance_risk()                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  NEMA2 Backend                               │
│          (Original Python Codebase)                          │
│                                                              │
│  - report_logic.py (Core compliance functions)              │
│  - data_sources.py (Wetland data loading)                   │
│  - batch_processing.py (Batch operations)                   │
│  - data/shapefiles/uganda_wetlands.shp                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Installation

### Prerequisites
- Python 3.8+
- pip or conda
- Virtual environment (recommended)

### Step 1: Navigate to API Directory
```powershell
cd C:\Users\School\work\geo-shape-capture-portal\nema-api
```

### Step 2: Create Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\activate
```

### Step 3: Install Dependencies
```powershell
pip install -r requirements.txt
```

### Step 4: Verify Installation
```powershell
python -c "import fastapi, geopandas, shapely; print('✅ All dependencies installed')"
```

---

## Configuration

### Environment Variables (`.env`)

Copy `.env.example` to `.env`:
```powershell
copy .env.example .env
```

Key configuration options:

```env
# Feature Flags - Enable/Disable Specific Features
ENABLE_COMPLIANCE_CHECK=true
ENABLE_DISTANCE_CALCULATION=true
ENABLE_REPORT_GENERATION=true
ENABLE_BATCH_PROCESSING=true
ENABLE_WETLANDS_SEARCH=true
ENABLE_MAP_VISUALIZATION=true

# Data Paths (relative to nema-api directory)
WETLANDS_DATA_PATH=../nema2/data/shapefiles/uganda_wetlands.shp
REPORT_TEMPLATE_PATH=../nema2/report_template.md.j2

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Feature Flags Explained

| Flag | Purpose | When to Disable |
|------|---------|----------------|
| `ENABLE_COMPLIANCE_CHECK` | Core compliance checking | Never (required) |
| `ENABLE_DISTANCE_CALCULATION` | Calculate distance to wetlands | If only intersection check needed |
| `ENABLE_REPORT_GENERATION` | Generate compliance reports | If using external reporting |
| `ENABLE_BATCH_PROCESSING` | Process multiple sites | If only single-site checks needed |
| `ENABLE_WETLANDS_SEARCH` | Search/query wetlands | If not using map features |
| `ENABLE_MAP_VISUALIZATION` | Map integration features | If no map display needed |

---

## API Endpoints

### 1. Health Check
**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "features_enabled": {
    "compliance_check": true,
    "distance_calculation": true,
    "report_generation": true,
    "batch_processing": true,
    "wetlands_search": true,
    "map_visualization": true
  },
  "wetlands_loaded": true
}
```

---

### 2. Compliance Check (Single Site)
**Endpoint:** `POST /api/v1/compliance/check`

**Request Body:**
```json
{
  "site_geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[32.5, 0.3], [32.51, 0.3], [32.51, 0.31], [32.5, 0.31], [32.5, 0.3]]]
        },
        "properties": {
          "name": "Proposed Site"
        }
      }
    ]
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

**Risk Levels:**
- `CRITICAL` - Site within wetland (distance = 0)
- `HIGH` - Site within buffer zone (0 < distance < buffer_zone_m)
- `LOW` - Site outside buffer zone (compliant)
- `UNKNOWN` - Distance calculation failed

---

### 3. Batch Compliance Check
**Endpoint:** `POST /api/v1/compliance/batch`

**Request Body:**
```json
{
  "sites": [
    {
      "name": "Site A",
      "geojson": {
        "type": "FeatureCollection",
        "features": [...]
      }
    },
    {
      "name": "Site B",
      "geojson": {
        "type": "FeatureCollection",
        "features": [...]
      }
    }
  ],
  "buffer_zone_m": 200.0,
  "include_distance": true
}
```

**Response:**
```json
{
  "results": [
    {
      "site_name": "Site A",
      "in_wetland": false,
      "min_distance_m": 450.5,
      "risk_level": "LOW",
      "compliant": true,
      "message": "Site is 450.5m from nearest wetland",
      "recommendation": "No wetland compliance issues detected"
    },
    {
      "site_name": "Site B",
      "in_wetland": true,
      "wetland_names": ["Lake Victoria Wetland"],
      "risk_level": "CRITICAL",
      "compliant": false,
      "message": "Site is located within a protected wetland area",
      "recommendation": "Relocation required"
    }
  ],
  "total_sites": 2,
  "compliant_sites": 1,
  "non_compliant_sites": 1,
  "processing_time_s": 0.523,
  "processed_at": "2024-01-15T10:30:00Z"
}
```

**Limits:**
- Maximum 100 sites per batch
- Recommended: 10-20 sites for optimal performance

---

### 4. Wetlands Search
**Endpoint:** `POST /api/v1/wetlands/search`

**Request Body (Bounding Box):**
```json
{
  "bounds": [32.0, 0.0, 33.0, 1.0],
  "limit": 100
}
```

**Request Body (Point + Radius):**
```json
{
  "point": {
    "lon": 32.5,
    "lat": 0.3,
    "radius_km": 10
  },
  "limit": 50
}
```

**Response:**
```json
{
  "wetlands": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {...},
        "properties": {
          "NAME": "Nakivubo Wetland",
          "AREA_KM2": 5.2
        }
      }
    ]
  },
  "count": 12,
  "searched_at": "2024-01-15T10:30:00Z"
}
```

---

### 5. Report Generation
**Endpoint:** `POST /api/v1/report/generate`

**Request Body:**
```json
{
  "site_name": "Proposed Development Site",
  "site_geojson": {...},
  "compliance_result": {
    "in_wetland": false,
    "min_distance_m": 450.5,
    "risk_level": "LOW",
    "compliant": true,
    "message": "Site is 450.5m from nearest wetland",
    "recommendation": "No wetland compliance issues detected",
    "buffer_violation": false,
    "checked_at": "2024-01-15T10:30:00Z"
  },
  "applicant_info": {
    "name": "John Doe",
    "email": "john@example.com",
    "organization": "Development Company Ltd"
  },
  "format": "markdown"
}
```

**Response:**
```json
{
  "report_content": "# NEMA Compliance Report\n\n**Site Name:** Proposed Development Site\n...",
  "format": "markdown",
  "generated_at": "2024-01-15T10:30:00Z",
  "download_url": null
}
```

**Supported Formats:**
- `markdown` - Markdown format
- `html` - HTML format (future)
- `pdf` - PDF format (future)

---

## Frontend Integration

### React/TypeScript Integration

#### 1. Create API Service (`src/services/nemaApi.ts`)

```typescript
const API_BASE_URL = import.meta.env.VITE_NEMA_API_URL || 'http://localhost:8000';

export interface ComplianceCheckRequest {
  site_geojson: any; // GeoJSON FeatureCollection
  buffer_zone_m?: number;
  include_distance?: boolean;
  include_wetland_names?: boolean;
}

export interface ComplianceResult {
  in_wetland: boolean;
  wetland_names: string[];
  min_distance_m: number | null;
  risk_level: 'CRITICAL' | 'HIGH' | 'LOW' | 'UNKNOWN';
  compliant: boolean;
  message: string;
  recommendation: string;
  buffer_violation: boolean;
  checked_at: string;
}

export class NEMAApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  }

  async checkCompliance(request: ComplianceCheckRequest): Promise<ComplianceResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/compliance/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Compliance check failed');
    }

    return response.json();
  }

  async batchCheck(sites: Array<{ name: string; geojson: any }>, bufferZone: number = 200): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/compliance/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sites,
        buffer_zone_m: bufferZone,
        include_distance: true,
      }),
    });

    if (!response.ok) throw new Error('Batch check failed');
    return response.json();
  }

  async searchWetlands(bounds?: number[], point?: { lon: number; lat: number; radius_km?: number }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/wetlands/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bounds, point, limit: 100 }),
    });

    if (!response.ok) throw new Error('Wetlands search failed');
    return response.json();
  }

  async generateReport(siteData: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/report/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteData),
    });

    if (!response.ok) throw new Error('Report generation failed');
    return response.json();
  }
}

export const nemaApi = new NEMAApiService();
```

#### 2. Environment Configuration (`.env`)

```env
VITE_NEMA_API_URL=http://localhost:8000
```

#### 3. React Hook Usage

```typescript
import { useState } from 'react';
import { nemaApi, ComplianceResult } from '@/services/nemaApi';

export function useNEMACompliance() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkCompliance = async (siteGeoJSON: any, bufferZone: number = 200) => {
    setLoading(true);
    setError(null);

    try {
      const result = await nemaApi.checkCompliance({
        site_geojson: siteGeoJSON,
        buffer_zone_m: bufferZone,
        include_distance: true,
        include_wetland_names: true,
      });

      setResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Compliance check failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { checkCompliance, loading, result, error };
}
```

#### 4. Component Example

```typescript
import { useNEMACompliance } from '@/hooks/useNEMACompliance';

export function NEMAComplianceChecker() {
  const { checkCompliance, loading, result, error } = useNEMACompliance();

  const handleCheckCompliance = async () => {
    // Get GeoJSON from map or drawing tool
    const siteGeoJSON = {
      type: "FeatureCollection",
      features: [/* your drawn features */]
    };

    try {
      await checkCompliance(siteGeoJSON, 200);
    } catch (err) {
      console.error('Compliance check failed:', err);
    }
  };

  return (
    <div className="p-4">
      <button 
        onClick={handleCheckCompliance} 
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Checking...' : 'Check Compliance'}
      </button>

      {error && (
        <div className="alert alert-error mt-4">
          {error}
        </div>
      )}

      {result && (
        <div className={`alert mt-4 ${
          result.risk_level === 'CRITICAL' ? 'alert-error' :
          result.risk_level === 'HIGH' ? 'alert-warning' :
          'alert-success'
        }`}>
          <h3>{result.risk_level}</h3>
          <p>{result.message}</p>
          <p className="text-sm">{result.recommendation}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Deployment

### Local Development

```powershell
# Activate virtual environment
.\venv\Scripts\activate

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Access API at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Production Deployment

#### Option 1: Docker
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Option 2: Systemd Service
```ini
[Unit]
Description=NEMA Compliance API
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/nema-api
ExecStart=/opt/nema-api/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

#### Option 3: Cloud Platforms
- **Heroku**: `Procfile` with `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- **AWS Lambda**: Use Mangum adapter
- **Google Cloud Run**: Container deployment
- **Railway**: Direct Python deployment

---

## Troubleshooting

### Common Issues

#### 1. Wetlands Data Not Loading
```
⚠️  Wetlands data not found at ../nema2/data/shapefiles/uganda_wetlands.shp
```

**Solution:**
- Verify `WETLANDS_DATA_PATH` in `.env`
- Check that the shapefile exists and is readable
- Ensure all shapefile components (.shp, .shx, .dbf, .prj) are present

#### 2. CORS Errors
```
Access to fetch at 'http://localhost:8000' blocked by CORS policy
```

**Solution:**
- Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
- Restart the API server after changing CORS settings

#### 3. Distance Calculation Fails
```
Distance calculation error: Invalid CRS
```

**Solution:**
- Ensure GeoJSON has valid coordinates
- Check that site geometry is valid (no self-intersections)
- Verify shapefile has proper CRS definition

#### 4. Import Errors
```
ModuleNotFoundError: No module named 'geopandas'
```

**Solution:**
```powershell
pip install -r requirements.txt --force-reinstall
```

#### 5. Port Already in Use
```
ERROR: [Errno 10048] error while attempting to bind on address
```

**Solution:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or use different port
uvicorn main:app --reload --port 8001
```

---

## Testing

### Run Test Suite
```powershell
python test_api.py
```

### Manual Testing with curl
```powershell
# Health check
curl http://localhost:8000/health

# Compliance check
curl -X POST http://localhost:8000/api/v1/compliance/check `
  -H "Content-Type: application/json" `
  -d @test_site.json
```

---

## Performance Considerations

- **Wetlands data cached in memory** (loaded once on startup)
- **Batch processing** optimized for 10-20 sites
- **Distance calculations** use UTM projection for accuracy
- **Geometry validation** prevents invalid inputs

---

## Security Best Practices

1. **CORS Configuration** - Restrict to known origins in production
2. **Input Validation** - All inputs validated via Pydantic
3. **File Size Limits** - 10MB default, configurable
4. **Rate Limiting** - Implement for production (not included by default)

---

## Next Steps

1. ✅ **Test the API** - Run `python test_api.py`
2. ✅ **Integrate with Frontend** - Create React components
3. ⏭️ **Deploy to Production** - Choose deployment method
4. ⏭️ **Monitor & Scale** - Set up logging and monitoring

---

## Support

For issues or questions:
1. Check this documentation
2. Review API docs at `/docs`
3. Check test suite for examples
4. Create GitHub issue

---

**Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**Maintained by:** GeoShape Development Team
