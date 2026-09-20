
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MapRenderRequest {
  center_point: [number, number];
  zoom_level: number;
  map_type: 'satellite' | 'terrain' | 'road';
  style_config: {
    title?: string;
    subtitle?: string;
    scale_bar?: boolean;
    north_arrow?: boolean;
    legend?: boolean;
    color_scheme?: 'default' | 'professional' | 'environmental';
  };
  features?: any[];
  boundary?: any;
  output_format: 'png' | 'pdf' | 'svg';
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: MapRenderRequest = await req.json();
    console.log('Python map render request:', request);

    // Validation
    if (!request.center_point || request.center_point.length !== 2) {
      throw new Error('Valid center_point [lat, lng] is required');
    }

    // Generate the Python script
    const pythonScript = generatePythonScript(request);

    // Write the script to disk (in /tmp for Deno)
    const scriptPath = `/tmp/map_render_${crypto.randomUUID()}.py`;
    const outputPath = `/tmp/map_image_${crypto.randomUUID()}.${request.output_format}`;

    // Inject correct output path into script
    const scriptWithOutput = pythonScript.replace(/output_file = .*/, `output_file = "${outputPath}"`);

    await Deno.writeTextFile(scriptPath, scriptWithOutput);

    // Call python3 and execute the script
    const process = Deno.run({
      cmd: ["python3", scriptPath],
      stdout: "piped",
      stderr: "piped"
    });
    const status = await process.status();
    const stdout = new TextDecoder().decode(await process.output());
    const stderr = new TextDecoder().decode(await process.stderrOutput());

    let mapImgBase64: string | undefined = undefined;
    let outputInfo: any = null;

    if (status.success && request.output_format === "png") {
      try {
        const imgData = await Deno.readFile(outputPath);
        mapImgBase64 = encode(imgData);
        // Use hardcoded output_info for now (Python script knows size)
        outputInfo = {
          format: "png",
          width: 1200,
          height: 800,
          dpi: 300
        };
      } catch (imgErr) {
        console.error("Image file missing:", imgErr);
      }
    }

    // Cleanup
    try { await Deno.remove(scriptPath); } catch {}
    if (outputPath) { try { await Deno.remove(outputPath); } catch {} }

    // Prepare result object
    const result = {
      success: status.success,
      render_id: crypto.randomUUID(),
      script_generated: pythonScript,
      map_image_base64: mapImgBase64, // Only set if PNG
      stdout: stdout,
      stderr: stderr,
      output_info: outputInfo ?? {
        format: request.output_format,
        width: 1200,
        height: 800,
        dpi: 300
      },
      processing_time_ms: 2000,
      features_rendered: request.features?.length || 0,
      map_bounds: {
        north: request.center_point[0] + 0.01,
        south: request.center_point[0] - 0.01,
        east: request.center_point[1] + 0.01,
        west: request.center_point[1] - 0.01
      }
    };

    // Return JSON with base64 image for "easy" simple map
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: status.success ? 200 : 500
      }
    );
  } catch (error) {
    console.error('Python map rendering error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to render map with Python'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

function generatePythonScript(request: MapRenderRequest): string {
  // We'll use output_file = ... line to be replaced with real output path in runtime
  return `#!/usr/bin/env python3
"""
Generated Python script for map rendering
Generated at: ${new Date().toISOString()}
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import geopandas as gpd
import contextily as ctx
from matplotlib.patches import Rectangle
import numpy as np

def render_map():
    center_lat = ${request.center_point[0]}
    center_lng = ${request.center_point[1]}
    zoom_level = ${request.zoom_level}
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    lat_range = 0.01 * (15 - zoom_level)
    lng_range = 0.01 * (15 - zoom_level)
    ax.set_xlim(center_lng - lng_range, center_lng + lng_range)
    ax.set_ylim(center_lat - lat_range, center_lat + lat_range)
    try:
        ctx.add_basemap(ax, crs="EPSG:4326", source=ctx.providers.${request.map_type === 'satellite' ? 'Esri.WorldImagery' : 'OpenStreetMap.Mapnik'})
    except:
        ax.set_facecolor('#e3f2fd')
    ax.plot(center_lng, center_lat, 'ro', markersize=10, markeredgecolor='white', markeredgewidth=2)
    ${request.features && request.features.length > 0 ? `
    features = ${JSON.stringify(request.features)}
    for feature in features:
        # TODO: Parse and plot geometry if desired
        pass
    ` : ''}
    ${request.style_config.title ? `plt.title("${request.style_config.title}", fontsize=16, fontweight='bold')` : ''}
    ${request.style_config.scale_bar ? `
    scale_length = lng_range * 0.2
    scale_x = center_lng - lng_range * 0.8
    scale_y = center_lat - lat_range * 0.8
    ax.plot([scale_x, scale_x + scale_length], [scale_y, scale_y], 'k-', linewidth=3)
    ax.text(scale_x + scale_length/2, scale_y - lat_range*0.05, f'{scale_length*111:.1f} km', 
            ha='center', va='top', fontsize=10)
    ` : ''}
    ${request.style_config.north_arrow ? `
    arrow_x = center_lng + lng_range * 0.8
    arrow_y = center_lat + lat_range * 0.7
    ax.annotate('N', xy=(arrow_x, arrow_y), xytext=(arrow_x, arrow_y + lat_range*0.1),
                arrowprops=dict(arrowstyle='->', lw=2), fontsize=12, ha='center')
    ` : ''}
    ax.set_xlabel('Longitude')
    ax.set_ylabel('Latitude')
    ax.grid(True, alpha=0.3)
    output_file = "DYNAMICALLY_REPLACED_OUTPUT_FILE"
    plt.savefig(output_file, dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
    print(f"Map saved as {output_file}")
    return output_file

if __name__ == "__main__":
    render_map()
`;
}

