"""
static_map_export.py
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
    from static_map_export import export_static_map_png
    png_bytes = export_static_map_png(site_gdf, wetlands_gdf, filename="output.png")
    # Save to file or use in Streamlit download button

"""
import geopandas as gpd
import pandas as pd

# Server-side rendering: force a headless backend so image export never
# depends on a GUI toolkit (Tk/Qt) being available.
import matplotlib
try:
    matplotlib.use("Agg", force=False)
except Exception:
    pass

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import matplotlib.patheffects as path_effects
from matplotlib.patches import FancyBboxPatch
import io
import numpy as np
from datetime import datetime
import urllib.request
import socket

# Optional contextily import for basemaps
try:
    import contextily as ctx
    CONTEXTILY_AVAILABLE = True
    # Test internet connectivity for basemaps
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=3)
        INTERNET_AVAILABLE = True
    except OSError:
        INTERNET_AVAILABLE = False
        print("⚠️ No internet connection detected for basemap tiles")
except ImportError:
    CONTEXTILY_AVAILABLE = False
    INTERNET_AVAILABLE = False

# Optional scalebar import
try:
    from matplotlib_scalebar.scalebar import ScaleBar
    SCALEBAR_AVAILABLE = True
except ImportError:
    SCALEBAR_AVAILABLE = False


def export_static_map_png(site_gdf, wetlands_gdf, filename=None, buffer_m=5000, dpi=200, use_satellite=True, 
                         site_label_text=None, show_site_label=True):
    """
    Export a comprehensive static PNG map with satellite or street view, custom site names,
    and surrounding context including geographic features.
    """
    print(f"🚀 Starting PNG export. Contextily available: {CONTEXTILY_AVAILABLE}")
    print(f"📊 Parameters: buffer={buffer_m}m, dpi={dpi}, satellite={use_satellite}")
    
    if site_gdf is None or site_gdf.empty:
        raise ValueError("site_gdf must not be empty")
    if wetlands_gdf is None or wetlands_gdf.empty:
        raise ValueError("wetlands_gdf must not be empty")
    
    # geopandas/shapely version compatibility helpers
    from geo_utils import estimate_utm_crs_for, union_all_geoseries
    utm_crs = estimate_utm_crs_for(site_gdf)
    site_proj = site_gdf.to_crs(utm_crs)
    wetlands_proj = wetlands_gdf.to_crs(utm_crs)

    # Create a larger buffer for better context
    context_buffer = buffer_m * 1.5  # 50% larger for context
    site_buffer = union_all_geoseries(site_proj.buffer(context_buffer))

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
    
    # Add basemap first (base layer) - always try to include one
    if CONTEXTILY_AVAILABLE and INTERNET_AVAILABLE:
        basemap_added = False
        # Set map extent before adding basemap
        ax.set_xlim(map_extent[0], map_extent[1])
        ax.set_ylim(map_extent[2], map_extent[3])
        
        print(f"Attempting to add basemap. Use satellite: {use_satellite}")
        print(f"Map extent: {map_extent}")
        print(f"Internet available: {INTERNET_AVAILABLE}")
        
        # Try different basemap sources with more permissive settings
        basemap_sources = []
        if use_satellite:
            basemap_sources = [
                ("Esri WorldImagery", ctx.providers.Esri.WorldImagery),
                ("CartoDB VoyagerNoLabels", ctx.providers.CartoDB.VoyagerNoLabels),
                ("OpenStreetMap", ctx.providers.OpenStreetMap.Mapnik),
                ("Esri WorldTopo", ctx.providers.Esri.WorldTopoMap),
                ("CartoDB Positron", ctx.providers.CartoDB.Positron)
            ]
        else:
            basemap_sources = [
                ("CartoDB Positron", ctx.providers.CartoDB.Positron),
                ("OpenStreetMap", ctx.providers.OpenStreetMap.Mapnik),
                ("CartoDB VoyagerNoLabels", ctx.providers.CartoDB.VoyagerNoLabels),
                ("Esri WorldTopo", ctx.providers.Esri.WorldTopoMap),
                ("Esri WorldImagery", ctx.providers.Esri.WorldImagery)
            ]
        
        for name, source in basemap_sources:
            if basemap_added:
                break
            try:
                print(f"Trying {name}...")
                # Add timeout and more permissive settings
                ctx.add_basemap(
                    ax, 
                    crs=utm_crs, 
                    source=source, 
                    alpha=0.7,
                    attribution=False,  # Skip attribution to avoid issues
                    reset_extent=False,  # Don't reset extent
                    zoom=12  # Fixed zoom level to avoid auto-zoom issues
                )
                basemap_added = True
                print(f'✅ {name} basemap added successfully.')
                break
            except Exception as e:
                error_msg = str(e)
                print(f"❌ {name} failed: {error_msg[:200]}...")
                # Log specific error types for debugging
                if "HTTP" in error_msg or "404" in error_msg:
                    print(f"   Network/API issue with {name}")
                elif "timeout" in error_msg.lower():
                    print(f"   Timeout connecting to {name}")
                elif "SSL" in error_msg or "certificate" in error_msg.lower():
                    print(f"   SSL/Certificate issue with {name}")
                continue
        
        # If all fail, create a styled background
        if not basemap_added:
            print("⚠️ All basemap sources failed. Creating styled map background.")
            create_styled_background(ax, map_extent, use_satellite)
    else:
        print("⚠️ Contextily or internet not available. Creating styled map background.")
        create_styled_background(ax, map_extent, use_satellite)

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

    # Add clean site label with customizable marker
    if show_site_label:
        try:
            # Use custom label text if provided, otherwise get from GeoDataFrame
            site_name = site_label_text if site_label_text else get_site_name(site_gdf)
            centroid = site_proj.geometry.centroid.iloc[0]
            
            # Add a simple circle marker
            ax.scatter(
                centroid.x, centroid.y,
                marker='o',
                s=200,  # Medium size
                color='red',
                edgecolor='white',
                linewidth=2,
                zorder=20
            )
            
            # Add clean outlined label slightly above the marker
            ax.text(
                centroid.x, centroid.y + (context_buffer * 0.03),  # Slightly above marker
                site_name,
                fontsize=16, fontweight='bold', color='white',
                ha='center', va='bottom',
                zorder=21,
                path_effects=[
                    path_effects.withStroke(linewidth=3, foreground='black')
                ]
            )
        except Exception as e:
            print(f"Site marker/label failed: {e}")

    # Set map bounds (redundant, but ensures correct extent)
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
    
    # Remove any mention of 'Enhanced Map Features' or emoji from the map title, legend, or metadata box
    # Title: only show site name and map type/coords
    title = f"{site_name}\n{map_type} View | {lat:.4f}\u00b0N, {lon:.4f}\u00b0E"
    ax.set_title(title, fontsize=16, fontweight='bold', pad=20)
    # Metadata box: only show buffer, map type, date, and source
    metadata_text = f"Analysis Buffer: {buffer_m/1000:.1f} km\n"
    metadata_text += f"Map Type: {'Satellite' if use_satellite else 'Street Map'}\n"
    metadata_text += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
    metadata_text += "Source: NEMA Compliance Checker"
    
    # Add metadata box in bottom right
    ax.text(map_extent[1] - (map_extent[1] - map_extent[0]) * 0.02, 
           map_extent[2] + (map_extent[3] - map_extent[2]) * 0.02,
           metadata_text, fontsize=8, ha='right', va='bottom',
           bbox=dict(boxstyle="round,pad=0.3", facecolor='lightgray', alpha=0.8))
    
    # Enhanced legend
    legend = ax.legend(loc='upper left', frameon=True, fancybox=True, shadow=True, 
                      bbox_to_anchor=(0.02, 0.98), fontsize=10)
    legend.get_frame().set_facecolor('white')
    legend.get_frame().set_alpha(0.9)
    
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


def create_styled_background(ax, map_extent, use_satellite):
    """Create a styled background when basemap tiles are unavailable"""
    try:
        print("Creating styled map background...")
        
        if use_satellite:
            # Satellite-like dark background with terrain feel
            ax.set_facecolor('#1a2332')  # Dark blue-gray
            
            # Add some subtle "terrain" patches
            width = map_extent[1] - map_extent[0]
            height = map_extent[3] - map_extent[2]
            
            # Add random terrain-like patches
            import random
            random.seed(42)  # Consistent random pattern
            for i in range(20):
                x = map_extent[0] + random.random() * width
                y = map_extent[2] + random.random() * height
                size = min(width, height) * (0.05 + random.random() * 0.1)
                
                terrain_patch = patches.Circle(
                    (x, y), size,
                    facecolor='#2d4a3e', alpha=0.3, edgecolor='none'
                )
                ax.add_patch(terrain_patch)
            
            # Add grid with subtle lines
            ax.grid(True, alpha=0.15, linestyle='-', color='#4a6741', linewidth=0.5)
            
        else:
            # Street map-like light background
            ax.set_facecolor('#f8f9fa')  # Light background
            
            # Add street-like grid pattern
            width = map_extent[1] - map_extent[0]
            height = map_extent[3] - map_extent[2]
            
            # Major grid lines (like major roads)
            ax.grid(True, alpha=0.4, linestyle='-', color='#dee2e6', linewidth=1.5)
            
            # Minor grid lines (like streets)
            ax.grid(True, alpha=0.2, linestyle='-', color='#e9ecef', linewidth=0.8)
        
        print("✅ Styled background created successfully")
        
    except Exception as e:
        print(f"❌ Failed to create styled background: {e}")
        # Final fallback
        ax.set_facecolor('#f0f0f0')
