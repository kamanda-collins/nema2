# 🚀 TESTING GUIDE & NEMA2 MAP EXPORT INTEGRATION

**Date:** October 3, 2025  
**Status:** API Ready for Testing + Map Export Enhancement Planned

---

## ✅ **HOW TO TEST THE API RIGHT NOW**

### Step 1: Interactive API Docs (EASIEST!)

**You should now have a browser window open with:** http://localhost:8000/docs

If not, open it manually: http://localhost:8000/docs

### Step 2: Test Health Check

1. In the API docs, find the **`GET /health`** endpoint
2. Click on it to expand
3. Click **"Try it out"** button (top right of the endpoint section)
4. Click **"Execute"** button
5. **Expected Result:**
   ```json
   {
     "status": "healthy",
     "wetlands_loaded": true,  // <-- Should be true!
     "version": "1.0.0",
     "features_enabled": {
       "compliance_check": true,
       "distance_calculation": true,
       ...
     }
   }
   ```
   
   **Key Check:** `wetlands_loaded: true` and status should show it loaded **26,650 wetlands** ✅

### Step 3: Test Compliance Check

1. Find the **`POST /api/v1/compliance/check`** endpoint
2. Click on it to expand
3. Click **"Try it out"**
4. **The request body is pre-filled with example data** (a test site near Kampala)
5. Click **"Execute"**
6. **Expected Result:**
   ```json
   {
     "in_wetland": false,  // or true depending on test site
     "wetland_names": ["..."],
     "min_distance_m": 450.5,  // distance in meters
     "risk_level": "LOW",  // or HIGH/CRITICAL
     "compliant": true,
     "message": "Site is 450.5m from nearest wetland",
     "recommendation": "No wetland compliance issues detected"
   }
   ```

### Step 4: Test Wetlands Search

1. Find **`POST /api/v1/wetlands/search`** endpoint
2. Try the example:
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
3. Should return GeoJSON of wetlands within 10km of that point

---

## 📊 **NEMA2 MAP EXPORT vs GeoShape Export**

### Current GeoShape Export (Basic)
- **Method:** Screenshot to PDF
- **Quality:** Screen resolution only
- **Features:** Just the map view as-is
- **Limitations:** 
  - No custom annotations
  - No scale bar
  - No north arrow
  - No metadata
  - Low quality for printing

### NEMA2 Map Export (Advanced) ⭐
- **Method:** Professional matplotlib rendering
- **Quality:** High-DPI (200-300 DPI) for printing
- **Features:**
  - ✅ **Satellite or Street Map view**
  - ✅ **Customizable site labels** (your own names)
  - ✅ **Wetlands overlay** (automatically filtered to view)
  - ✅ **Analysis buffer visualization** (200m, 500m, etc.)
  - ✅ **Scale bar** (automatic, accurate)
  - ✅ **North arrow**
  - ✅ **Coordinate grids** (UTM + Lat/Lon)
  - ✅ **Metadata box** (buffer distance, date, source)
  - ✅ **Context area** (shows surrounding features)
  - ✅ **Professional legend**
  - ✅ **Multiple basemap sources** with fallback
  - ✅ **Styled background** if no internet
  - ✅ **Clean, print-ready output**

### What NEMA2 Export Looks Like:

```
┌─────────────────────────────────────────────────────────────────┐
│  My Project Site                                    [N↑]        │
│  Satellite View | 0.3156°N, 32.5822°E                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐                                               │
│  │ Legend:     │      [Satellite/Street basemap]              │
│  │ 🔴 Site     │                                              │
│  │ 💧 Wetlands │      ● ← Your site marker                    │
│  │ ⭕ Buffer   │           with custom name                    │
│  └─────────────┘                                              │
│                        ~ wetlands shown in blue ~             │
│                        - buffer zone shown -                  │
│                                                                │
│  UTM: 584822E, 34567N    │─ 1km ─│    Analysis: 5km buffer   │
│  Lat/Lon: 0.3156°, 32.58°                Date: 2025-10-03     │
└─────────────────────────────────────────────────────────────────┘
```

**Output:** High-resolution PNG (200+ DPI) perfect for:
- NEMA submissions
- Professional reports
- Presentations
- Printing (A4/Letter size)
- Documentation

---

## 🎯 **INTEGRATION PLAN**

### Option 1: Add to NEMA API (Recommended)
Add a new endpoint: `POST /api/v1/map/export`

**Advantages:**
- ✅ Consistent with other NEMA features
- ✅ Python matplotlib already in nema2
- ✅ Can use loaded wetlands data
- ✅ Professional quality output

**Request:**
```json
{
  "site_geojson": {...},
  "buffer_m": 5000,
  "use_satellite": true,
  "site_label_text": "My Custom Site Name",
  "show_site_label": true,
  "dpi": 200
}
```

**Response:**
- PNG image (base64 encoded) or download URL
- High-resolution, print-ready
- All NEMA2 features included

### Option 2: Standalone Export Component
Keep it in React but enhance with:
- leaflet-image or html2canvas
- Custom overlays for scale/north arrow
- Client-side rendering

**Advantages:**
- ✅ No backend needed
- ✅ Faster for user
- ❌ Lower quality than Option 1
- ❌ More complex React code

### **RECOMMENDED: Option 1** (Add to API)

---

## 🚀 **WHAT I'LL DO NEXT**

### 1. Test API is Working ✅
- You're testing this now via http://localhost:8000/docs
- Verify wetlands loaded (26,650 features)
- Test compliance check endpoint

### 2. Add Map Export Endpoint to API
**File:** `nema-api/main.py`

**New endpoint:**
```python
@app.post("/api/v1/map/export")
async def export_map(request: MapExportRequest):
    """
    Export a professional high-resolution map with wetlands overlay
    """
    # Use NEMA2's export_static_map_png function
    # Return PNG as base64 or download
```

### 3. Add to Frontend
**New hook:** `useNEMAMapExport()`
```typescript
const { exportMap, loading } = useNEMAMapExport();

const handleExport = async () => {
  const pngData = await exportMap({
    site_geojson: siteData,
    buffer_m: 5000,
    use_satellite: true,
    site_label_text: "My Project Site",
    dpi: 200
  });
  
  // Download automatically
};
```

**Add button to map:**
```tsx
<Button onClick={handleExport}>
  <Download className="h-4 w-4" />
  Export Professional Map
</Button>
```

---

## 📋 **TESTING CHECKLIST**

### API Tests (Do These Now!)
- [ ] Open http://localhost:8000/docs
- [ ] Test `/health` endpoint
  - [ ] Verify `wetlands_loaded: true`
  - [ ] Check features are enabled
- [ ] Test `/api/v1/compliance/check`
  - [ ] Use pre-filled example
  - [ ] Verify response has risk_level, message, etc.
- [ ] Test `/api/v1/wetlands/search`
  - [ ] Search near Kampala (32.5, 0.3)
  - [ ] Verify GeoJSON returned

### After Map Export Added
- [ ] Test `/api/v1/map/export` endpoint
- [ ] Verify PNG is high quality
- [ ] Check scale bar, north arrow present
- [ ] Verify wetlands overlay works
- [ ] Test satellite vs street view
- [ ] Test custom site labels

---

## 🎨 **NEMA2 EXPORT FEATURES TO INTEGRATE**

From `static_map_export.py` (426 lines):

### Core Features:
1. **export_static_map_png()** - Main export function
   - Parameters:
     - `site_gdf` - Site geometry (GeoDataFrame)
     - `wetlands_gdf` - Wetlands (automatically loaded in API)
     - `buffer_m` - Analysis buffer (default: 5000m)
     - `dpi` - Image quality (default: 200)
     - `use_satellite` - Satellite vs street view
     - `site_label_text` - Custom site name
     - `show_site_label` - Show/hide marker

2. **Basemap Sources** (with fallback):
   - Esri WorldImagery (satellite)
   - CartoDB VoyagerNoLabels
   - OpenStreetMap Mapnik
   - Esri WorldTopoMap
   - CartoDB Positron
   - Styled background (no internet fallback)

3. **Map Elements:**
   - Scale bar (matplotlib-scalebar)
   - North arrow (custom FancyArrowPatch)
   - Coordinate info (UTM + Lat/Lon)
   - Metadata box (buffer, date, source)
   - Professional legend
   - Coordinate grid
   - Site marker with label
   - Buffer zone visualization
   - Wetlands overlay (filtered to view)

4. **Styling:**
   - Clean, print-ready layout
   - Custom colors (wetlands: lightblue, site: red)
   - Outlined text for readability
   - White borders on markers
   - Semi-transparent overlays
   - Professional shadows and effects

---

## 💡 **USER BENEFITS**

### For You:
- ✅ Professional maps for NEMA submissions
- ✅ Customizable site names/labels
- ✅ High-resolution output (printable)
- ✅ Satellite or street view options
- ✅ Automatic wetlands overlay
- ✅ One-click export from map interface

### For Reports:
- ✅ Print-ready quality (200+ DPI)
- ✅ Includes all necessary elements (scale, north, coords)
- ✅ Professional appearance
- ✅ Contextual information (buffer zones, metadata)
- ✅ No manual annotation needed

---

## 🔄 **NEXT STEPS**

### Immediate (While Testing):
1. **Test the API** via http://localhost:8000/docs
2. **Verify wetlands loaded** (should show 26,650 features)
3. **Test compliance check** with example data
4. **Let me know results** so I can proceed

### After Testing Confirms API Works:
1. **Add map export endpoint** to NEMA API
2. **Copy NEMA2 export logic** (already exists, just integrate)
3. **Add React hook** for map export
4. **Add "Export Map" button** to MapSection
5. **Test end-to-end** export functionality

---

## ❓ **QUESTIONS TO ANSWER**

1. **Did the API health check work?**
   - Open http://localhost:8000/docs
   - Test `/health` endpoint
   - Should show `wetlands_loaded: true` with 26,650 features

2. **Did compliance check work?**
   - Test the pre-filled example
   - Should return risk level and recommendations

3. **Map export preferences:**
   - Do you want satellite view by default? Or street view?
   - What default buffer size? (5km is NEMA2 default)
   - What DPI? (200 is good balance, 300 for highest quality)
   - Custom site names? (Yes, NEMA2 has this feature)

---

## 📖 **DOCUMENTATION REFERENCE**

- **API Docs:** `NEMA_API_TESTED_AND_INTEGRATED.md`
- **Quick Start:** `nema-api/QUICK_START.md`
- **Complete API Reference:** `nema-api/API_DOCUMENTATION.md`
- **NEMA2 Export Source:** `C:\Users\School\work\nema2\static_map_export.py`

---

**Status:** ✅ API Running (test at http://localhost:8000/docs)  
**Next:** Add Professional Map Export once API testing confirms working

**Test the API and let me know the results!** 🚀
