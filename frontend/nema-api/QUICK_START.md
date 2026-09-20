# 🚀 NEMA API - Quick Start Guide

Get the NEMA Compliance API running in under 5 minutes!

---

## ⚡ Quick Start (3 Steps)

### 1️⃣ Setup Environment

```powershell
# Navigate to API directory
cd C:\Users\School\work\geo-shape-capture-portal\nema-api

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2️⃣ Configure (if needed)

The `.env` file is already configured. Only change if needed:

```env
# Default configuration (already set)
ENABLE_COMPLIANCE_CHECK=true
ENABLE_DISTANCE_CALCULATION=true
ENABLE_REPORT_GENERATION=true
ENABLE_BATCH_PROCESSING=true
ENABLE_WETLANDS_SEARCH=true
ENABLE_MAP_VISUALIZATION=true

# IMPORTANT: Update this path if your nema2 folder is elsewhere
WETLANDS_DATA_PATH=../nema2/data/shapefiles/uganda_wetlands.shp
```

### 3️⃣ Run the API

```powershell
# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**✅ Done!** API is now running at:
- **API:** http://localhost:8000
- **Interactive Docs:** http://localhost:8000/docs ⭐ Try this first!
- **ReDoc:** http://localhost:8000/redoc

---

## 🧪 Test the API

### Option 1: Interactive Docs (Easiest)
1. Open http://localhost:8000/docs
2. Click on any endpoint (e.g., `/health`)
3. Click "Try it out"
4. Click "Execute"
5. See the response!

### Option 2: Test Script
```powershell
# Run automated tests
python test_api.py
```

Expected output:
```
🧪 NEMA Compliance API Test Suite
====================================
🏥 Testing Health Check...
Status: 200
✅ PASS - Health Check

✅ Testing Compliance Check...
Status: 200
🎯 Result: LOW - Site is 450.5m from nearest wetland
✅ PASS - Compliance Check

📊 Test Results Summary
5/5 tests passed
```

### Option 3: curl
```powershell
# Health check
curl http://localhost:8000/health

# Compliance check (requires JSON file)
curl -X POST http://localhost:8000/api/v1/compliance/check `
  -H "Content-Type: application/json" `
  -d '{
    "site_geojson": {
      "type": "FeatureCollection",
      "features": [{
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [32.5, 0.3]
        }
      }]
    },
    "buffer_zone_m": 200
  }'
```

---

## 📚 What Can I Do With This API?

### 1. Check Single Site Compliance
**Endpoint:** `POST /api/v1/compliance/check`

Check if a proposed development site complies with NEMA wetland regulations:
- ✅ Detects if site is within wetland
- ✅ Calculates distance to nearest wetland
- ✅ Assesses compliance risk (CRITICAL/HIGH/LOW)
- ✅ Provides recommendations

### 2. Batch Process Multiple Sites
**Endpoint:** `POST /api/v1/compliance/batch`

Check up to 100 sites at once:
- ✅ Parallel processing
- ✅ Summary statistics (compliant/non-compliant counts)
- ✅ Processing time metrics

### 3. Search for Wetlands
**Endpoint:** `POST /api/v1/wetlands/search`

Query wetlands database:
- ✅ Search by bounding box
- ✅ Search by point + radius
- ✅ Returns GeoJSON for map display

### 4. Generate Compliance Reports
**Endpoint:** `POST /api/v1/report/generate`

Create professional reports:
- ✅ Markdown format
- ✅ HTML format (future)
- ✅ PDF format (future)

---

## 🎯 Next Steps

### For Testing:
1. ✅ Open http://localhost:8000/docs
2. ✅ Try the `/health` endpoint
3. ✅ Try the `/api/v1/compliance/check` endpoint
4. ✅ Run `python test_api.py`

### For Development:
1. 📖 Read `API_DOCUMENTATION.md` for complete details
2. 🔧 Modify `.env` to enable/disable features
3. 🧪 Create your own test cases
4. 🚀 Integrate with frontend (see docs for React examples)

### For Production:
1. 📦 Review deployment options in `API_DOCUMENTATION.md`
2. 🔐 Configure production CORS origins
3. 📊 Set up monitoring and logging
4. 🐳 Consider Docker deployment

---

## ❓ Common Issues

### "Wetlands data not found"
**Problem:** API can't find the wetlands shapefile.

**Solution:**
1. Check that `nema2` folder exists
2. Verify path in `.env`: `WETLANDS_DATA_PATH=../nema2/data/shapefiles/uganda_wetlands.shp`
3. Update path if your folder structure is different

### "Port 8000 already in use"
**Problem:** Another process is using port 8000.

**Solution:**
```powershell
# Option 1: Use different port
uvicorn main:app --reload --port 8001

# Option 2: Find and kill process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### "Module not found"
**Problem:** Dependencies not installed.

**Solution:**
```powershell
# Make sure virtual environment is activated
.\venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### CORS errors from frontend
**Problem:** Frontend can't access API.

**Solution:**
Add your frontend URL to `.env`:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:5174
```
Then restart the API.

---

## 📖 Documentation

- **Quick Start:** This file
- **API Reference:** `API_DOCUMENTATION.md` (600+ lines)
- **Interactive Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Phase Summary:** `PHASE_3_1_API_SETUP_COMPLETE.md`

---

## 🆘 Need Help?

1. Check `API_DOCUMENTATION.md` for detailed guides
2. Review test examples in `test_api.py`
3. Try the interactive docs at `/docs`
4. Check the troubleshooting section in main docs

---

## ✨ Features at a Glance

| Feature | Status | Description |
|---------|--------|-------------|
| Compliance Check | ✅ | Single site wetland compliance |
| Batch Processing | ✅ | Up to 100 sites at once |
| Wetlands Search | ✅ | Query wetlands database |
| Report Generation | ✅ | Markdown reports |
| Distance Calculation | ✅ | UTM-accurate distances |
| Risk Assessment | ✅ | Automated risk levels |
| CORS Support | ✅ | Frontend integration ready |
| Input Validation | ✅ | Pydantic models |
| Error Handling | ✅ | Detailed error responses |
| Feature Flags | ✅ | Modular configuration |

---

**Ready to build?** Start with http://localhost:8000/docs! 🚀
