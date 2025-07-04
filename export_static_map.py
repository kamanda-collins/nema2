"""
export_static_map.py
-------------------

Export a comprehensive static PNG map of the area around the selected geometry (site), with wetlands overlay
and surrounding context including roads, settlements, and geographic features.

This module provides a function to generate a static PNG image of the map area around a given site geometry 
and nearby wetlands, with enhanced context and geographic references.

Dependencies:
- geopandas
- matplotlib
- contextily (for basemap tiles)
- matplotlib-scalebar (for scale bar)

Example usage:
    from export_static_map import export_static_map_png
    png_bytes = export_static_map_png(site_gdf, wetlands_gdf, filename="output.png")
    # Save to file or use in Streamlit download button

"""
import geopandas as gpd
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch
import io
import numpy as np
from datetime import datetime

# Optional contextily import for basemaps
try:
    import contextily as ctx
    CONTEXTILY_AVAILABLE = True
except ImportError:
    CONTEXTILY_AVAILABLE = False

# Optional scalebar import
try:
    from matplotlib_scalebar.scalebar import ScaleBar
    SCALEBAR_AVAILABLE = True
except ImportError:
    SCALEBAR_AVAILABLE = False


def export_static_map_png(site_gdf, wetlands_gdf, filename=None, buffer_m=5000, dpi=200, use_satellite=True):
    """
    Export a comprehensive static PNG map of the area around the selected geometry (site), with wetlands overlay
    and surrounding context.

    Args:
        site_gdf (GeoDataFrame): GeoDataFrame containing the site geometry (must have CRS).
        wetlands_gdf (GeoDataFrame): GeoDataFrame of wetlands to overlay (must have CRS).
        filename (str, optional): If provided, save PNG to this file. If None, return PNG bytes.
        buffer_m (int, optional): Buffer (in meters) around the site to include in the map. Default 5000 (5km).
        dpi (int, optional): DPI for the PNG image. Default 200.
        use_satellite (bool, optional): Use satellite imagery as basemap. Default True.

    Returns:
        bytes or None: PNG image bytes if filename is None, else None.
    """
    if site_gdf is None or site_gdf.empty:
        raise ValueError("site_gdf must not be empty")
    if wetlands_gdf is None or wetlands_gdf.empty:
        raise ValueError("wetlands_gdf must not be empty")
    
    # Use UTM Zone 36N for Uganda/Kenya
    utm_crs = "EPSG:32636"
    site_proj = site_gdf.to_crs(utm_crs)
    wetlands_proj = wetlands_gdf.to_crs(utm_crs)
    
    # Create a larger buffer for better context
    context_buffer = buffer_m * 1.5  # 50% larger for context
    site_buffer = site_proj.buffer(context_buffer).unary_union
    
    # Filter wetlands to those that intersect the buffer
    mask = wetlands_proj.intersects(site_buffer)
    filtered_wetlands = wetlands_proj[mask.values]
    
    # Create figure with better layout
    fig, ax = plt.subplots(figsize=(12, 10))
    
    # Set bounds with extended context
    minx, miny, maxx, maxy = site_proj.total_bounds
    map_extent = [
        minx - context_buffer, 
        maxx + context_buffer,
        miny - context_buffer, 
        maxy + context_buffer
    ]
    
    # Add basemap first (base layer) with robust fallback
    if CONTEXTILY_AVAILABLE:
        basemap_added = False
        
        # Try different basemap sources with fallbacks
        if use_satellite:
            basemap_sources = [
                ("Esri WorldImagery", ctx.providers.Esri.WorldImagery),
                ("CartoDB VoyagerNoLabels", ctx.providers.CartoDB.VoyagerNoLabels),
                ("OpenStreetMap", ctx.providers.OpenStreetMap.Mapnik)
            ]
        else:
            basemap_sources = [
                ("CartoDB Positron", ctx.providers.CartoDB.Positron),
                ("OpenStreetMap", ctx.providers.OpenStreetMap.Mapnik),
                ("Esri WorldTopo", ctx.providers.Esri.WorldTopoMap)
            ]
        
        for name, source in basemap_sources:
            if basemap_added:
                break
            try:
                print(f"Trying {name}...")
                ctx.add_basemap(ax, crs=utm_crs, source=source, 
                              zoom='auto', attribution=False, alpha=0.7)
                basemap_added = True
                print(f'✅ {name} basemap added successfully.')
                break
            except Exception as e:
                print(f"❌ {name} failed: {str(e)[:100]}...")
                continue
        
        if not basemap_added:
            print("⚠️ All basemap sources failed. Continuing without basemap.")
    
    # Plot wetlands with enhanced styling
    if not filtered_wetlands.empty:
        filtered_wetlands.plot(
            ax=ax, 
            color='lightblue', 
            alpha=0.6, 
            edgecolor='darkblue', 
            linewidth=1.5, 
            label='Wetlands',
            zorder=3
        )
    
    # Plot site buffer area (context area)
    site_buffer_gdf = gpd.GeoDataFrame([1], geometry=[site_buffer], crs=utm_crs)
    site_buffer_gdf.plot(
        ax=ax, 
        color='none', 
        edgecolor='orange', 
        linewidth=2, 
        linestyle='--', 
        alpha=0.7,
        label=f'{buffer_m/1000:.1f}km Analysis Area',
        zorder=2
    )
    
    # Plot site with enhanced styling
    site_proj.plot(
        ax=ax, 
        color='red', 
        alpha=0.8, 
        edgecolor='darkred', 
        linewidth=3, 
        label='Project Site',
        zorder=4
    )
    
    # Set map bounds
    ax.set_xlim(map_extent[0], map_extent[1])
    ax.set_ylim(map_extent[2], map_extent[3])
    
    # Add coordinate grid
    ax.grid(True, alpha=0.3, linestyle=':', color='gray')
    
    # Add scale bar if available
    if SCALEBAR_AVAILABLE:
        try:
            scalebar = ScaleBar(1, location='lower right', pad=0.5, border_pad=0.5, 
                              color='black', box_color='white', box_alpha=0.8)
            ax.add_artist(scalebar)
        except:
            pass
    
    # Add north arrow
    add_north_arrow(ax, map_extent)
    
    # Add coordinate information
    add_coordinate_info(ax, site_proj, map_extent)
    
    # Enhanced title with more information
    site_name = get_site_name(site_gdf)
    map_type = "Satellite" if use_satellite else "Street Map"
    
    # Get coordinates for title
    centroid = site_proj.geometry.centroid.iloc[0]
    lat_lon = gpd.GeoDataFrame([1], geometry=[centroid], crs=utm_crs).to_crs("EPSG:4326")
    lat = lat_lon.geometry.y.iloc[0]
    lon = lat_lon.geometry.x.iloc[0]
    
    title = f"{site_name}\n{map_type} View | {lat:.4f}°N, {lon:.4f}°E"
    ax.set_title(title, fontsize=16, fontweight='bold', pad=20)
    
    # Enhanced legend
    legend = ax.legend(loc='upper left', frameon=True, fancybox=True, shadow=True, 
                      bbox_to_anchor=(0.02, 0.98), fontsize=10)
    legend.get_frame().set_facecolor('white')
    legend.get_frame().set_alpha(0.9)
    
    # Add metadata box
    add_metadata_box(ax, buffer_m, use_satellite, map_extent)
    
    # Remove axes for clean look
    ax.set_axis_off()
    
    plt.tight_layout()
    
    # Save or return bytes
    if filename:
        plt.savefig(filename, dpi=dpi, bbox_inches='tight', pad_inches=0.1, 
                   facecolor='white', edgecolor='none')
        plt.close(fig)
        return None
    else:
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=dpi, bbox_inches='tight', pad_inches=0.1,
                   facecolor='white', edgecolor='none')
        plt.close(fig)
        buf.seek(0)
        return buf.getvalue()


def get_site_name(site_gdf):
    """Extract site name from GeoDataFrame"""
    site_name = "Selected Site"  # Default
    if 'name' in site_gdf.columns and pd.notnull(site_gdf.iloc[0]['name']):
        site_name = str(site_gdf.iloc[0]['name'])
    elif hasattr(site_gdf, 'name') and site_gdf.name:
        site_name = str(site_gdf.name)
    elif 'id' in site_gdf.columns:
        site_name = f"Site ID: {site_gdf.iloc[0]['id']}"
    return site_name


def add_north_arrow(ax, map_extent):
    """Add a north arrow to the map"""
    try:
        # Position north arrow in upper right
        arrow_x = map_extent[1] - (map_extent[1] - map_extent[0]) * 0.05
        arrow_y = map_extent[3] - (map_extent[3] - map_extent[2]) * 0.05
        
        # Create north arrow
        arrow = patches.FancyArrowPatch(
            (arrow_x, arrow_y - 1000), (arrow_x, arrow_y),
            arrowstyle='->', mutation_scale=20, color='black', linewidth=2
        )
        ax.add_patch(arrow)
        
        # Add "N" label
        ax.text(arrow_x, arrow_y + 500, 'N', ha='center', va='bottom', 
               fontsize=12, fontweight='bold', color='black')
    except:
        pass


def add_coordinate_info(ax, site_proj, map_extent):
    """Add coordinate information to the map"""
    try:
        # Get site centroid coordinates
        centroid = site_proj.geometry.centroid.iloc[0]
        
        # Convert to lat/lon
        lat_lon = gpd.GeoDataFrame([1], geometry=[centroid], crs=site_proj.crs).to_crs("EPSG:4326")
        lat = lat_lon.geometry.y.iloc[0]
        lon = lat_lon.geometry.x.iloc[0]
        
        # Add coordinate text in bottom left
        coord_text = f"UTM: {centroid.x:.0f}E, {centroid.y:.0f}N\nLat/Lon: {lat:.4f}°, {lon:.4f}°"
        ax.text(map_extent[0] + (map_extent[1] - map_extent[0]) * 0.02, 
               map_extent[2] + (map_extent[3] - map_extent[2]) * 0.02,
               coord_text, fontsize=9, ha='left', va='bottom',
               bbox=dict(boxstyle="round,pad=0.3", facecolor='white', alpha=0.8))
    except:
        pass


def add_metadata_box(ax, buffer_m, use_satellite, map_extent):
    """Add metadata information box"""
    try:
        # Create metadata text
        metadata_text = f"Analysis Buffer: {buffer_m/1000:.1f} km\n"
        metadata_text += f"Map Type: {'Satellite' if use_satellite else 'Street Map'}\n"
        metadata_text += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
        metadata_text += "Source: NEMA Compliance Checker"
        
        # Add metadata box in bottom right
        ax.text(map_extent[1] - (map_extent[1] - map_extent[0]) * 0.02, 
               map_extent[2] + (map_extent[3] - map_extent[2]) * 0.02,
               metadata_text, fontsize=8, ha='right', va='bottom',
               bbox=dict(boxstyle="round,pad=0.3", facecolor='lightgray', alpha=0.8))
    except:
        pass
