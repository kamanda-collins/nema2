# NEMA Map Export - How It Works

## ✅ Correctly Integrated with GeoShape Portal

The NEMA professional map export now works seamlessly with your **existing GeoShape capture workflow**:

### The Correct Flow:

1. **Capture Your Site** (existing workflow)
   - Use drawing tools on the map
   - Upload a shapefile
   - Import GeoJSON
   - Use any existing capture method in GeoShape

2. **Export to NEMA Format** (new feature)
   - Click the green "NEMA Export" button
   - Configure settings (buffer, DPI, basemap, label)
   - Generate professional map
   - Download high-quality PNG

### What Changed (Fixed):

**❌ BEFORE (Wrong)**:
- Required drawing a NEW shape just for export
- Didn't use existing captured shapes
- Disconnected from GeoShape workflow

**✅ NOW (Correct)**:
- Uses `currentShape` from GeoShape portal
- Works with ANY captured shape (draw, upload, import)
- Fully integrated with existing workflow
- No duplicate drawing needed

---

## How It Works Technically

### Data Flow:

```
GeoShape Portal Capture
    ↓
currentShape (GeoJSON)
    ↓
NEMAMapExportDialog receives currentShape
    ↓
Converts to proper format
    ↓
Sends to NEMA API
    ↓
Professional map generated
    ↓
Download PNG
```

### Supported Shape Formats:

The dialog automatically handles multiple GeoJSON formats:

1. **FeatureCollection** (from shapefile uploads)
   ```json
   {
     "type": "FeatureCollection",
     "features": [...]
   }
   ```

2. **Single Feature** (from drawing tools)
   ```json
   {
     "type": "Feature",
     "geometry": {...},
     "properties": {...}
   }
   ```

3. **Geometry Object** (from simple draws)
   ```json
   {
     "geometry": {
       "type": "Point",
       "coordinates": [lng, lat]
     }
   }
   ```

All formats are automatically normalized to the NEMA API's expected format.

---

## Usage Examples

### Example 1: Draw a Site
1. Click "Draw Polygon" tool
2. Draw your site boundary on map
3. Site is captured → stored in `currentShape`
4. Click "NEMA Export" button
5. Configure and generate map

### Example 2: Upload Shapefile
1. Click "Upload" button
2. Select your shapefile
3. Shape is imported → stored in `currentShape`
4. Click "NEMA Export" button
5. Configure and generate map

### Example 3: Import GeoJSON
1. Paste GeoJSON in import dialog
2. Shape is parsed → stored in `currentShape`
3. Click "NEMA Export" button
4. Configure and generate map

**All methods work identically** - the export dialog receives whatever shape is in `currentShape`.

---

## Configuration Options

When you click "NEMA Export", you can configure:

### Site Label
- Enter a descriptive name for your site
- Example: "Kampala Development Site"
- Toggle to show/hide label on map

### Basemap Style
- **Satellite**: Esri WorldImagery (high-res satellite)
- **Street**: CartoDB Positron (clean street map)

### Buffer Distance
- Range: 100m - 50km
- Default: 5km
- Shows area around site to include

### Output Quality (DPI)
- **72 DPI**: Quick preview (screen quality)
- **150 DPI**: Standard reports
- **200 DPI**: Recommended (high quality)
- **300 DPI**: Publication/print quality

---

## What Gets Exported

The generated professional map includes:

### Visual Elements:
- ✅ High-resolution basemap (satellite or street)
- ✅ Your site location (red star marker)
- ✅ Custom site label (if provided)
- ✅ Buffer zone (light blue circle)
- ✅ Nearby wetlands (blue polygons with hatching)

### Professional Elements:
- ✅ Scale bar (accurate distances in km/m)
- ✅ North arrow (top right corner)
- ✅ Coordinate information (UTM + Lat/Lon)
- ✅ Legend (all layer symbols explained)
- ✅ Metadata box (buffer, date, source)

### Technical Specs:
- Format: PNG
- Size: 12" × 10" (configurable DPI)
- Projection: UTM Zone 36N (accurate for East Africa)
- Quality: 72-300 DPI
- File size: ~200KB-2MB (depends on DPI and complexity)

---

## Integration Points

### Props Flow:

```typescript
MapSection
  ├─ currentShape (state) ← Captured site GeoJSON
  ├─ setCurrentShape (setter) ← Updates when shape captured
  │
  └─ NEMAMapExportDialog
      └─ currentShape (prop) ← Receives the captured shape
```

### Component Communication:

1. **Drawing Tools** → Update `currentShape`
2. **File Upload** → Update `currentShape`
3. **Import Dialog** → Update `currentShape`
4. **NEMA Dialog** → Reads `currentShape`

No intermediate state needed - direct connection to the source of truth.

---

## Error Handling

### No Shape Captured:
```
Alert: "Please capture a site shape first using 
the drawing tools or file upload."
```
Button is disabled until a valid shape exists.

### Invalid Shape Format:
```
Error: "Invalid shape format"
```
Shape doesn't match any expected GeoJSON structure.

### API Connection Failed:
```
Error: "Map export failed"
Toast: "Map Export Failed - [error details]"
```
API server not running or network issue.

### Export Timeout:
```
Progress: "Fetching basemap and wetlands data..."
```
Large buffer areas may take 10-15 seconds.

---

## Benefits of This Approach

### For Users:
- ✅ No duplicate work (use existing shapes)
- ✅ Consistent with GeoShape workflow
- ✅ Works with all capture methods
- ✅ Single source of truth for shapes

### For Developers:
- ✅ Simpler integration (no layer tracking)
- ✅ Reuses existing state management
- ✅ Automatic format handling
- ✅ No dependency on Leaflet internals

### For NEMA Submissions:
- ✅ Professional quality maps
- ✅ Accurate wetlands overlay
- ✅ Print-ready output
- ✅ All required map elements included

---

## Testing Checklist

Test with different capture methods:

- [ ] Draw a point → Export works
- [ ] Draw a polygon → Export works
- [ ] Draw a circle → Export works
- [ ] Upload shapefile → Export works
- [ ] Import GeoJSON → Export works
- [ ] No shape captured → Button disabled with alert
- [ ] Change basemap style → Both work
- [ ] Adjust buffer → Map updates accordingly
- [ ] Change DPI → File size changes
- [ ] Download → PNG file saved correctly

---

## Summary

The NEMA map export is now **properly integrated** with the GeoShape portal:

- ✅ Uses existing `currentShape` state
- ✅ Works with all capture methods
- ✅ No duplicate drawing required
- ✅ Automatic format detection
- ✅ Professional map generation
- ✅ One-click download

**The workflow is seamless**: Capture your site using any method, then click "NEMA Export" to generate a professional map for NEMA submissions.
