# Map Export Testing Guide

## Quick Test Using API Docs

1. **Open API Docs**: http://localhost:8000/docs
2. **Find the endpoint**: POST `/api/v1/map/export`
3. **Click "Try it out"**
4. **Use this test payload**:

```json
{
  "site_geojson": {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [32.5825, 0.3476]
    },
    "properties": {
      "name": "Test Site - Kampala"
    }
  },
  "buffer_m": 5000,
  "use_satellite": true,
  "site_label_text": "Test Site - Kampala",
  "show_site_label": true,
  "dpi": 200
}
```

5. **Click "Execute"**
6. **Check the response** - you should see:
   - `image_base64`: Long base64 string (the PNG image)
   - `format`: "png"
   - `width_px`, `height_px`: Image dimensions
   - `dpi`: 200
   - `file_size_kb`: File size
   - `metadata`: Coordinates, wetlands count, basemap status

## Viewing the Generated Map

### Option 1: Save to File (PowerShell)
```powershell
# Copy the base64 string from the response
$base64 = "iVBORw0KGgoAAAANS..." # Your base64 string here
$bytes = [Convert]::FromBase64String($base64)
[IO.File]::WriteAllBytes("C:\Users\School\Downloads\test_map.png", $bytes)
```

### Option 2: Online Base64 to Image Converter
1. Copy the `image_base64` value
2. Go to: https://base64.guru/converter/decode/image
3. Paste and decode to view/download

## What You Should See

The exported map should include:
- ✅ High-resolution satellite or street view basemap
- ✅ Your site location (red marker with star)
- ✅ 5km buffer zone (light blue circle)
- ✅ Nearby wetlands (blue polygons with diagonal hatching)
- ✅ Site label "Test Site - Kampala"
- ✅ Scale bar (showing distance in km)
- ✅ North arrow (top right)
- ✅ Coordinate information box (bottom right)
- ✅ Legend (top left)
- ✅ Professional layout at 200 DPI

## Test Different Configurations

### Test 1: Street Map View
```json
{
  "site_geojson": {...},
  "buffer_m": 5000,
  "use_satellite": false,  // Street map instead
  "show_site_label": true,
  "dpi": 150
}
```

### Test 2: Large Buffer
```json
{
  "site_geojson": {...},
  "buffer_m": 20000,  // 20km buffer
  "use_satellite": true,
  "show_site_label": true,
  "dpi": 200
}
```

### Test 3: Polygon Site
```json
{
  "site_geojson": {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [32.5825, 0.3476],
        [32.5925, 0.3476],
        [32.5925, 0.3576],
        [32.5825, 0.3576],
        [32.5825, 0.3476]
      ]]
    },
    "properties": {
      "name": "Test Polygon Site"
    }
  },
  "buffer_m": 3000,
  "use_satellite": true,
  "site_label_text": "Polygon Development Site",
  "show_site_label": true,
  "dpi": 200
}
```

### Test 4: High DPI for Print
```json
{
  "site_geojson": {...},
  "buffer_m": 5000,
  "use_satellite": true,
  "show_site_label": true,
  "dpi": 300  // Maximum quality for print
}
```

## Expected Performance

- **Small buffer (100m-1km)**: 2-5 seconds
- **Medium buffer (1km-10km)**: 3-8 seconds
- **Large buffer (10km-50km)**: 5-15 seconds

Time varies based on:
- Number of wetlands in view
- Basemap download speed
- DPI setting
- Server resources

## Troubleshooting

### "Wetlands data not loaded"
- Check API health: http://localhost:8000/health
- Should show `wetlands_loaded: true`
- Restart API if needed

### "Basemap download failed"
- Map will use styled background instead
- Check internet connection
- Try `use_satellite: false` for CartoDB basemap

### "Invalid site geometry"
- Ensure coordinates are [longitude, latitude]
- Uganda bounds: lng ~29-35°E, lat ~-1.5-4.5°N
- Use valid GeoJSON format

### Image not generating
- Check DPI (72-300 range)
- Check buffer (100-50000m range)
- Look for errors in API terminal

## Next Steps

Once testing confirms the endpoint works:
1. Add frontend React hook (`useNEMAMapExport`)
2. Create "Export Professional Map" button in `MapSection.tsx`
3. Handle base64 to PNG download in browser
4. Add loading states and progress indicators
5. Show preview modal before download
