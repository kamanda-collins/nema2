
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// OpenStreetMap tile fetcher
const fetchOSMTiles = async (centerPoint: [number, number], zoomLevel: number, width: number, height: number) => {
  const tileSize = 256
  const lat = centerPoint[0]
  const lng = centerPoint[1]
  
  // Calculate tile coordinates for the center
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoomLevel))
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoomLevel))
  
  // Calculate how many tiles we need
  const tilesX = Math.ceil(width / tileSize) + 1
  const tilesY = Math.ceil(height / tileSize) + 1
  
  const tiles = []
  
  for (let i = -Math.floor(tilesX/2); i <= Math.floor(tilesX/2); i++) {
    for (let j = -Math.floor(tilesY/2); j <= Math.floor(tilesY/2); j++) {
      const tileX = x + i
      const tileY = y + j
      
      if (tileX >= 0 && tileY >= 0 && tileX < Math.pow(2, zoomLevel) && tileY < Math.pow(2, zoomLevel)) {
        tiles.push({
          x: tileX,
          y: tileY,
          url: `https://tile.openstreetmap.org/${zoomLevel}/${tileX}/${tileY}.png`,
          offsetX: i * tileSize,
          offsetY: j * tileSize
        })
      }
    }
  }
  
  return {
    tiles,
    centerTile: { x, y },
    bounds: {
      north: lat + 0.01,
      south: lat - 0.01,
      east: lng + 0.01,
      west: lng - 0.01
    }
  }
}

const generateMapTile = async (centerPoint: [number, number], zoomLevel: number, styleConfig: any) => {
  const mapData = {
    center: centerPoint,
    zoom: zoomLevel,
    bounds: {
      north: centerPoint[0] + 0.01,
      south: centerPoint[0] - 0.01,
      east: centerPoint[1] + 0.01,
      west: centerPoint[1] - 0.01
    },
    layers: [
      {
        type: 'base',
        style: styleConfig.base_layer || 'openstreetmap'
      }
    ],
    metadata: {
      generated_at: new Date().toISOString(),
      style_config: styleConfig
    }
  }
  
  return mapData
}

// Generate a professional SVG map representation with OpenStreetMap basemap and highlighted polygons
const generateSVGMap = async (mapData: any, styleConfig: any, features: any[] = [], boundary: any = null) => {
  const width = 800
  const height = 600
  const mapArea = { x: 50, y: 80, width: 700, height: 450 }
  
  // Fetch OpenStreetMap tiles for the basemap
  const osmData = await fetchOSMTiles(mapData.center, mapData.zoom, mapArea.width, mapArea.height)
  
  // Generate basemap using OpenStreetMap tiles
  const basemapElements = osmData.tiles.map((tile, index) => {
    const x = mapArea.x + mapArea.width/2 + tile.offsetX - 128 // Center the tiles
    const y = mapArea.y + mapArea.height/2 + tile.offsetY - 128
    
    return `<image x="${x}" y="${y}" width="256" height="256" 
                   href="${tile.url}" 
                   opacity="0.8"
                   onload="console.log('Tile loaded: ${tile.url}')"
                   onerror="console.error('Failed to load tile: ${tile.url}')"/>`
  }).join('\n  ')
  
  // Fallback pattern for areas not covered by tiles
  const fallbackPattern = generateOpenStreetMapPattern()
  
  // Generate highlighted polygon if boundary exists
  const highlightedPolygon = boundary ? generateHighlightedPolygon(boundary, mapArea, mapData.center) : ''
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; }
      .subtitle { font-family: Arial, sans-serif; font-size: 14px; }
      .coordinates { font-family: Arial, sans-serif; font-size: 12px; }
      .legend { font-family: Arial, sans-serif; font-size: 10px; }
      .highlight-polygon { fill: rgba(255, 152, 0, 0.3); stroke: #ff9800; stroke-width: 3; stroke-dasharray: 10,5; }
    </style>
    ${fallbackPattern}
    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    </pattern>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="#f8f9fa"/>
  
  <!-- Basemap area with OpenStreetMap tiles -->
  <rect x="${mapArea.x}" y="${mapArea.y}" width="${mapArea.width}" height="${mapArea.height}" 
        fill="url(#fallback)" stroke="#333" stroke-width="2"/>
  
  <!-- Clip path for map area -->
  <defs>
    <clipPath id="mapClip">
      <rect x="${mapArea.x}" y="${mapArea.y}" width="${mapArea.width}" height="${mapArea.height}"/>
    </clipPath>
  </defs>
  
  <!-- OpenStreetMap tiles -->
  <g clip-path="url(#mapClip)">
    ${basemapElements}
  </g>
  
  <!-- Grid overlay -->
  <rect x="${mapArea.x}" y="${mapArea.y}" width="${mapArea.width}" height="${mapArea.height}" fill="url(#grid)"/>
  
  <!-- Highlighted boundary polygon -->
  ${highlightedPolygon}
  
  <!-- Feature points -->
  ${features.map((feature, index) => {
    const x = mapArea.x + (index * 80) % (mapArea.width - 100) + 50
    const y = mapArea.y + Math.floor(index / 8) * 60 + 100
    return `<circle cx="${x}" cy="${y}" r="6" fill="#2196f3" stroke="white" stroke-width="2"/>
            <text x="${x}" y="${y + 20}" text-anchor="middle" class="legend" fill="#333">${feature.name?.substring(0, 8) || 'Point'}</text>`
  }).join('\n  ')}
  
  <!-- Center point marker -->
  <circle cx="400" cy="305" r="8" fill="#d32f2f" stroke="white" stroke-width="2"/>
  
  <!-- Title -->
  <text x="400" y="40" text-anchor="middle" class="title">${styleConfig.title || 'Professional Map'}</text>
  <text x="400" y="60" text-anchor="middle" class="subtitle">${styleConfig.subtitle || 'Generated by Geo-Labs'}</text>
  
  <!-- Coordinates -->
  <text x="60" y="560" class="coordinates">Center: ${mapData.center[0].toFixed(4)}, ${mapData.center[1].toFixed(4)}</text>
  <text x="60" y="580" class="coordinates">Zoom Level: ${mapData.zoom}</text>
  
  <!-- Scale bar -->
  ${styleConfig.scale_bar !== false ? `
  <g transform="translate(60, 500)">
    <rect width="100" height="20" fill="white" stroke="black" stroke-width="1"/>
    <rect width="50" height="20" fill="black"/>
    <text x="50" y="35" text-anchor="middle" class="legend">1 km</text>
  </g>
  ` : ''}
  
  <!-- North arrow -->
  ${styleConfig.north_arrow !== false ? `
  <g transform="translate(720, 100)">
    <polygon points="0,-20 10,10 0,5 -10,10" fill="black"/>
    <text x="0" y="25" text-anchor="middle" class="legend">N</text>
  </g>
  ` : ''}
  
  <!-- Legend -->
  <g transform="translate(580, 400)">
    <rect width="180" height="120" fill="white" stroke="black" stroke-width="1" fill-opacity="0.95"/>
    <text x="10" y="20" class="legend" font-weight="bold">Legend</text>
    <circle cx="20" cy="35" r="4" fill="#d32f2f"/>
    <text x="30" y="40" class="legend">Center Point</text>
    <circle cx="20" cy="55" r="4" fill="#2196f3"/>
    <text x="30" y="60" class="legend">Features</text>
    ${boundary ? `
    <rect x="15" y="70" width="10" height="10" class="highlight-polygon"/>
    <text x="30" y="80" class="legend">Study Area</text>
    ` : ''}
    <rect x="15" y="${boundary ? '90' : '70'}" width="10" height="10" fill="url(#fallback)"/>
    <text x="30" y="${boundary ? '100' : '80'}" class="legend">OpenStreetMap</text>
  </g>
</svg>`
  
  return svg
}

// Generate OpenStreetMap-style fallback pattern
const generateOpenStreetMapPattern = () => `
  <pattern id="fallback" patternUnits="userSpaceOnUse" width="100" height="100">
    <rect width="100" height="100" fill="#f2efe9"/>
    <path d="M10,10 L90,10 L90,90 L10,90 Z" fill="none" stroke="#d3d3d3" stroke-width="0.5"/>
    <circle cx="30" cy="25" r="8" fill="#aed6f1"/>
    <circle cx="70" cy="60" r="12" fill="#aed6f1"/>
    <rect x="15" y="40" width="25" height="15" fill="#c8e6c9"/>
    <rect x="60" y="20" width="20" height="10" fill="#c8e6c9"/>
    <path d="M20,70 Q40,60 60,70 Q80,80 90,75" fill="none" stroke="#81c784" stroke-width="2"/>
    <rect x="25" y="75" width="6" height="6" fill="#ffcc80"/>
    <rect x="65" y="35" width="4" height="4" fill="#ffcc80"/>
  </pattern>
`

// Generate highlighted polygon SVG
const generateHighlightedPolygon = (boundary: any, mapArea: any, center: [number, number]) => {
  try {
    let coordinates: number[][]
    
    // Handle different boundary formats
    if (boundary.geometry?.type === 'Polygon') {
      coordinates = boundary.geometry.coordinates[0]
    } else if (boundary.coordinates) {
      coordinates = boundary.coordinates
    } else {
      // Default polygon around center
      const centerX = mapArea.x + mapArea.width / 2
      const centerY = mapArea.y + mapArea.height / 2
      const radius = Math.min(mapArea.width, mapArea.height) * 0.2
      
      coordinates = []
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * 2 * Math.PI
        coordinates.push([
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius
        ])
      }
    }
    
    if (coordinates && coordinates.length > 0) {
      // Convert geographic coordinates to SVG coordinates if needed
      const svgCoords = coordinates.map(coord => {
        if (Array.isArray(coord) && coord.length >= 2) {
          // If these look like geographic coordinates, convert them
          if (Math.abs(coord[0]) <= 180 && Math.abs(coord[1]) <= 90) {
            return [
              mapArea.x + ((coord[0] - center[1] + 0.02) / 0.04) * mapArea.width,
              mapArea.y + mapArea.height - ((coord[1] - center[0] + 0.02) / 0.04) * mapArea.height
            ]
          }
        }
        return coord
      })
      
      const pathData = svgCoords.map((coord, index) => 
        `${index === 0 ? 'M' : 'L'} ${coord[0]} ${coord[1]}`
      ).join(' ') + ' Z'
      
      return `<path d="${pathData}" class="highlight-polygon"/>
              <text x="${svgCoords.reduce((sum, coord) => sum + coord[0], 0) / svgCoords.length}" 
                    y="${svgCoords.reduce((sum, coord) => sum + coord[1], 0) / svgCoords.length}" 
                    text-anchor="middle" class="legend" fill="#ff9800" font-weight="bold">Study Area</text>`
    }
  } catch (error) {
    console.error('Error generating polygon:', error)
  }
  
  return ''
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      map_name, 
      map_type, 
      boundary, 
      center_point, 
      zoom_level, 
      style_config, 
      export_formats,
      features = []
    } = await req.json()

    console.log('Professional map generation request:', { 
      map_name, 
      map_type, 
      center_point, 
      export_formats 
    })

    // Validate required parameters
    if (!center_point || !Array.isArray(center_point) || center_point.length !== 2) {
      throw new Error('Valid center_point [lat, lng] is required')
    }

    const [lat, lng] = center_point
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error('Center point must contain valid numbers')
    }

    // Generate map data
    const mapData = await generateMapTile([lat, lng], zoom_level || 12, style_config || {})
    
    // Generate SVG map with features and boundary
    const svgContent = await generateSVGMap(mapData, style_config || {}, features, boundary)
    
    // Create downloadable content based on format
    const results: any = {
      svg: svgContent,
      metadata: mapData.metadata
    }

    // If PDF is requested, we'll return SVG that can be converted client-side
    if (export_formats?.includes('pdf')) {
      results.pdf_data = {
        svg_content: svgContent,
        width: 800,
        height: 600,
        title: style_config?.title || map_name || 'Professional Map'
      }
    }

    const mapConfig = {
      id: crypto.randomUUID(),
      map_name: map_name || 'Professional Map',
      map_type: map_type || 'analysis',
      center_point: { lat, lng },
      zoom_level: zoom_level || 12,
      boundary,
      style_config: {
        base_layer: style_config?.base_layer || 'satellite',
        color_scheme: style_config?.color_scheme || 'professional',
        legend_position: style_config?.legend_position || 'bottom-right',
        scale_bar: style_config?.scale_bar !== false,
        north_arrow: style_config?.north_arrow !== false,
        title: style_config?.title || map_name || 'Professional Map',
        subtitle: style_config?.subtitle || 'Generated by Geo-Labs',
        ...style_config
      },
      export_formats: export_formats || ['svg'],
      features: features.slice(0, 10),
      generation_status: 'completed',
      created_at: new Date().toISOString(),
      results
    }

    console.log('Map generation completed:', mapConfig.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Professional map generated successfully',
        map_id: mapConfig.id,
        status: 'completed',
        map_config: {
          name: mapConfig.map_name,
          center: mapConfig.center_point,
          zoom: mapConfig.zoom_level,
          features_count: features.length
        },
        download_data: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )
  } catch (error) {
    console.error('Professional map generation error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to generate professional map'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      },
    )
  }
})
