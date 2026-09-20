# 🧪 NEMA Export - Live Testing Guide

## ✅ Both Servers Running

- **Backend API**: http://localhost:8000 (26,650 wetlands loaded)
- **Frontend**: http://localhost:8081 (Hot reload enabled)

---

## 📋 Test Steps

### Step 1: Navigate to Map Section
1. Open http://localhost:8081 (should be open in Simple Browser)
2. Look for the Map tab/section
3. You should see the map interface

### Step 2: Capture a Test Shape

**Option A: Draw a Shape**
1. Look for drawing tools (polygon, marker, circle buttons)
2. Click "Draw Polygon" or similar
3. Click points on the map to create a shape
4. Complete the shape (double-click or click start point)
5. **Watch console**: Should log "Shape created: [GeoJSON]"

**Option B: Use Test Coordinates (Kampala, Uganda)**
If you have a coordinate input or import feature:
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [32.5825, 0.3476]
  },
  "properties": {
    "name": "Kampala Test Site"
  }
}
```

**Option C: Upload a File**
If you have file upload enabled, use any GeoJSON or shapefile.

### Step 3: Locate the NEMA Export Button

**Where to look**:
- Top of map section
- Next to existing export button
- Green gradient button
- Has a Shield icon
- Text: "NEMA Export"

**What you should see**:
```
[ Map View: OpenStreetMap ▼ ]  [ Export ]  [ 🛡️ NEMA Export ]
                                  ↑            ↑
                            Old button    New button
```

### Step 4: Test Button States

**Before capturing shape**:
- Button should be clickable
- Click it → Dialog opens
- Should show alert: "Please capture a site shape first..."
- Generate button should be DISABLED

**After capturing shape**:
- Button should still be clickable
- Click it → Dialog opens
- Should NOT show alert
- Generate button should be ENABLED

### Step 5: Configure Export Settings

In the dialog:

1. **Site Label** (optional):
   - Enter: "Test Development Site"
   - Toggle "Show label on map" ON

2. **Basemap Style**:
   - Try: Satellite View (default)
   - Shows: "Satellite View (Esri WorldImagery)"

3. **Buffer Distance**:
   - Move slider to: 5.0 km
   - Range shows: 100m - 50km

4. **Output Quality**:
   - Select: "High (200 DPI) - Recommended"

### Step 6: Generate Map

1. Click **"Generate Map"** button
2. Watch for progress:
   - Button changes to "Generating..." with spinner
   - Progress alert appears
   - Shows: "Generating map..."
   - Then: "Fetching basemap and wetlands data..."

3. **Expected timing**:
   - Small buffer (1-3km): 3-5 seconds
   - Medium buffer (5-10km): 5-8 seconds
   - Large buffer (20km+): 8-15 seconds

4. **Wait for completion**:
   - Progress message: "Map generated successfully!"
   - Result box appears with metadata
   - "Download Map" button appears

### Step 7: Check Result Metadata

In the result box, verify:
- ✅ **Dimensions**: Should show something like "2400 × 2000px"
- ✅ **DPI**: Should show "200"
- ✅ **File Size**: Should show size in KB (e.g., "450.2 KB")
- ✅ **Wetlands**: Should show count (e.g., "12" wetlands found)

### Step 8: Download the Map

1. Click **"Download Map"** button
2. File should download automatically
3. **Filename format**: `nema-map-test-development-site-2025-10-04.png`

### Step 9: Verify the Downloaded Map

Open the PNG file and check for:

**Required Elements** (MUST have all):
- ✅ Background: Satellite imagery or street map
- ✅ Your site: Red star marker
- ✅ Site label: "Test Development Site" (if you entered one)
- ✅ Buffer zone: Light blue circle around site
- ✅ Wetlands: Blue polygons with diagonal hatching
- ✅ Scale bar: Bottom or side, showing distances
- ✅ North arrow: Top right corner
- ✅ Coordinates: Bottom right, showing UTM and Lat/Lon
- ✅ Legend: Top left, explaining all symbols

**Quality Checks**:
- ✅ Image is sharp and clear (200 DPI)
- ✅ Text is readable
- ✅ Colors are correct
- ✅ No artifacts or errors
- ✅ Professional appearance

---

## 🐛 Troubleshooting

### Issue 1: "NEMA Export" Button Not Visible

**Possible causes**:
- Window too narrow (button hidden on mobile)
- Component not rendered
- CSS issue

**Debug**:
1. Check browser console for errors
2. Try widening window
3. Check if map section loaded
4. Inspect element to see if button exists

### Issue 2: Button Visible But Dialog Won't Open

**Possible causes**:
- JavaScript error
- Dialog component not imported
- Click handler not attached

**Debug**:
1. Open browser console (F12)
2. Click button
3. Check for errors
4. Verify imports in MapSection.tsx

### Issue 3: Dialog Opens But "Generate Map" Disabled

**Expected behavior** if no shape captured:
- Alert shows: "Please capture a site shape first..."
- This is CORRECT - you need to capture a shape first

**If shape IS captured but still disabled**:
- Check: Does `currentShape` have data?
- Open console and log: `console.log(currentShape)`
- Should see GeoJSON object

### Issue 4: "Generate Map" Takes Too Long

**Normal timing**:
- 3-15 seconds depending on buffer size

**If > 30 seconds**:
- Check internet connection (basemap download)
- Check API server is running (http://localhost:8000/health)
- Try smaller buffer distance
- Try street view instead of satellite

### Issue 5: Export Fails With Error

**Check API Server**:
```bash
# In terminal, check if API is running
curl http://localhost:8000/health
# Should return: {"status": "healthy", "wetlands_loaded": true, ...}
```

**Common errors**:

1. **"Map export failed"**
   - API not running → Start API server
   - Network issue → Check localhost:8000

2. **"Invalid shape format"**
   - Shape data corrupted → Recapture shape
   - Wrong format → Check console logs

3. **"Basemap download failed"**
   - Internet issue → Will use styled background instead
   - Try street view → Less bandwidth needed

### Issue 6: Map Downloads But Looks Wrong

**No basemap visible**:
- Internet connection issue
- Basemap server down
- Should still have styled background

**No wetlands showing**:
- Buffer too small (increase to 5km+)
- Area has no wetlands (try different location)
- Try Kampala test coordinates (known to have wetlands)

**Labels missing**:
- Check "Show label on map" toggle
- Ensure you entered text in "Site Label" field

**Low quality**:
- Try higher DPI (300 instead of 200)
- Check downloaded file wasn't compressed

---

## ✅ Success Criteria

### Minimum Viable Test:
- [ ] Button visible in map section
- [ ] Dialog opens when clicked
- [ ] Can enter site label
- [ ] Can select basemap and DPI
- [ ] "Generate Map" button works
- [ ] Map downloads as PNG
- [ ] PNG contains site marker and basic elements

### Full Feature Test:
- [ ] All capture methods work (draw, upload, import)
- [ ] Dialog shows correct validation states
- [ ] Progress updates display during generation
- [ ] Metadata shows correct values
- [ ] Downloaded map has ALL required elements
- [ ] Multiple exports work (change settings, export again)
- [ ] Error handling works gracefully

---

## 📊 Expected Test Results

### Test 1: Point Site (Kampala)
- **Coordinates**: [32.5825, 0.3476]
- **Buffer**: 5km
- **Expected wetlands**: 10-20 nearby
- **Time**: ~5 seconds
- **File size**: ~400-600 KB at 200 DPI

### Test 2: Polygon Site
- **Shape**: Any polygon you draw
- **Buffer**: 3km
- **Expected**: Shows polygon boundary clearly
- **Time**: ~4-6 seconds
- **File size**: ~350-500 KB at 200 DPI

### Test 3: Large Buffer
- **Site**: Any
- **Buffer**: 20km
- **Expected**: Many wetlands (50+)
- **Time**: ~10-15 seconds
- **File size**: ~800KB-1.5MB at 200 DPI

---

## 🎯 What to Report

After testing, please confirm:

1. **Did the button appear?** Yes/No
2. **Did dialog open?** Yes/No
3. **Did shape validation work?** Yes/No (disabled when no shape, enabled with shape)
4. **Did map generate?** Yes/No
5. **How long did it take?** Seconds
6. **Did file download?** Yes/No
7. **Does map look professional?** Yes/No
8. **Are all elements present?** List any missing
9. **Any errors?** Copy error messages

---

## 🚀 Next Steps After Testing

### If Everything Works:
✅ **Step 2 COMPLETE!**
- Move to Step 3: Build compliance checker
- Or Step 4: Batch processing dashboard
- Or Step 5: Interactive wetlands map

### If Issues Found:
- Report specific errors
- Share console logs
- Provide screenshots if possible
- We'll debug and fix together

---

## 📝 Quick Test Command List

```javascript
// Open browser console (F12) and try these:

// 1. Check if component loaded
document.querySelector('button:contains("NEMA Export")')

// 2. Check current shape state (if you can access React devtools)
// Should see GeoJSON object after drawing

// 3. Check API health
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(console.log)

// 4. Test export manually (with valid GeoJSON)
fetch('http://localhost:8000/api/v1/map/export', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    site_geojson: {
      type: 'Feature',
      geometry: {type: 'Point', coordinates: [32.5825, 0.3476]},
      properties: {name: 'Test'}
    },
    buffer_m: 5000,
    use_satellite: true,
    dpi: 200
  })
}).then(r => r.json()).then(console.log)
```

---

Ready to test! 🎉

The app is open at http://localhost:8081 - go ahead and try capturing a shape, then click the green "NEMA Export" button!
