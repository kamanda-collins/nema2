"""
Map Export Module - Professional high-quality map generation
Adapted from NEMA2 static_map_export.py for API use
"""
import geopandas as gpd
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server use
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import matplotlib.patheffects as path_effects
from matplotlib.patches import FancyBboxPatch
import io
import base64
import numpy as np
from datetime import datetime
from typing import Optional, Tuple
import socket

# Try to import optional dependencies
try:
    import contextily as ctx
    CONTEXTILY_AVAILABLE = True
    # Test internet connectivity
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=3)
        INTERNET_AVAILABLE = True
    except OSError:
        INTERNET_AVAILABLE = False
        print("⚠️  No internet - will use styled background")
except ImportError:
    CONTEXTILY_AVAILABLE = False
    INTERNET_AVAILABLE = False
    print("⚠️  contextily not available - using styled backgrounds")

try:
    from matplotlib_scalebar.scalebar import ScaleBar
    SCALEBAR_AVAILABLE = True
except ImportError:
    SCALEBAR_AVAILABLE = False
    print("⚠️  matplotlib-scalebar not available - scale bar disabled")


def export_map_to_png(
    site_gdf: gpd.GeoDataFrame,
    wetlands_gdf: gpd.GeoDataFrame,
    buffer_m: float = 5000,
    use_satellite: bool = True,
    site_label_text: Optional[str] = None,
    show_site_label: bool = True,
    dpi: int = 200
) -> Tuple[bytes, dict]:
    """
    Export a professional map as PNG with wetlands overlay.
    
    Returns:
        Tuple of (png_bytes, metadata_dict)
    """
    print(f"🗺️  Starting map export: buffer={buffer_m}m, satellite={use_satellite}, dpi={dpi}")
    
    if site_gdf is None or site_gdf.empty:
        raise ValueError("Site data is empty")
    if wetlands_gdf is None or wetlands_gdf.empty:
        raise ValueError("Wetlands data is empty")
    
    # Use UTM Zone 36N for Uganda/East Africa
    utm_crs = "EPSG:32636"
    site_proj = site_gdf.to_crs(utm_crs)
    wetlands_proj = wetlands_gdf.to_crs(utm_crs)
    
    # Create buffer for context (50% larger for better view)
    context_buffer = buffer_m * 1.5
    site_buffer = site_proj.buffer(context_buffer).unary_union
    
    # Filter wetlands to visible area
    mask = wetlands_proj.intersects(site_buffer)
    filtered_wetlands = wetlands_proj[mask.values]
    print(f"📊 Filtered to {len(filtered_wetlands)} wetlands in view")
    
    # Create figure
    fig, ax = plt.subplots(figsize=(12, 10))
    
    # Calculate map extent
    minx, miny, maxx, maxy = site_proj.total_bounds
    map_extent = [
        minx - context_buffer,
        maxx + context_buffer,
        miny - context_buffer,
        maxy + context_buffer
    ]
    
    # Set bounds
    ax.set_xlim(map_extent[0], map_extent[1])
    ax.set_ylim(map_extent[2], map_extent[3])
    
    # Add basemap
    basemap_added = False
    if CONTEXTILY_AVAILABLE and INTERNET_AVAILABLE:
        basemap_added = _add_basemap(ax, utm_crs, use_satellite)
    
    if not basemap_added:
        print("📍 Using styled background (no basemap)")
        _create_styled_background(ax, map_extent, use_satellite)
    
    # Plot layers
    _plot_wetlands(ax, filtered_wetlands)
    _plot_buffer_zone(ax, site_buffer, utm_crs, buffer_m)
    _plot_site(ax, site_proj)
    
    # Add site label/marker
    if show_site_label:
        _add_site_marker(ax, site_proj, site_label_text, site_gdf, context_buffer)
    
    # Add map elements
    ax.grid(True, alpha=0.3, linestyle=':', color='gray')
    
    if SCALEBAR_AVAILABLE:
        _add_scale_bar(ax)
    
    _add_north_arrow(ax, map_extent)
    _add_coordinate_info(ax, site_proj, map_extent)
    
    # Add title and metadata
    site_name = site_label_text or _get_site_name(site_gdf)
    map_type = "Satellite" if use_satellite else "Street Map"
    
    # Get coordinates
    centroid = site_proj.geometry.centroid.iloc[0]
    lat_lon = gpd.GeoDataFrame([1], geometry=[centroid], crs=utm_crs).to_crs("EPSG:4326")
    lat = lat_lon.geometry.y.iloc[0]
    lon = lat_lon.geometry.x.iloc[0]
    
    title = f"{site_name}\n{map_type} View | {lat:.4f}°N, {lon:.4f}°E"
    ax.set_title(title, fontsize=16, fontweight='bold', pad=20)
    
    # Add metadata box
    metadata_text = f"Analysis Buffer: {buffer_m/1000:.1f} km\n"
    metadata_text += f"Map Type: {map_type}\n"
    metadata_text += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
    metadata_text += "Source: NEMA Compliance API"
    
    ax.text(
        map_extent[1] - (map_extent[1] - map_extent[0]) * 0.02,
        map_extent[2] + (map_extent[3] - map_extent[2]) * 0.02,
        metadata_text,
        fontsize=8, ha='right', va='bottom',
        bbox=dict(boxstyle="round,pad=0.3", facecolor='lightgray', alpha=0.8)
    )
    
    # Add legend
    legend = ax.legend(
        loc='upper left',
        frameon=True,
        fancybox=True,
        shadow=True,
        bbox_to_anchor=(0.02, 0.98),
        fontsize=10
    )
    legend.get_frame().set_facecolor('white')
    legend.get_frame().set_alpha(0.9)
    
    # Clean layout
    ax.set_axis_off()
    plt.tight_layout()
    
    # Export to bytes
    buf = io.BytesIO()
    plt.savefig(
        buf,
        format='png',
        dpi=dpi,
        bbox_inches='tight',
        pad_inches=0.1,
        facecolor='white',
        edgecolor='none'
    )
    plt.close(fig)
    buf.seek(0)
    
    png_bytes = buf.getvalue()
    file_size_kb = len(png_bytes) / 1024
    
    # Calculate image dimensions
    width_px = int(12 * dpi)
    height_px = int(10 * dpi)
    
    metadata = {
        "site_name": site_name,
        "map_type": map_type,
        "buffer_m": buffer_m,
        "coordinates": {"lat": lat, "lon": lon},
        "wetlands_count": len(filtered_wetlands),
        "basemap_available": basemap_added,
        "dpi": dpi
    }
    
    print(f"✅ Map exported: {width_px}x{height_px}px, {file_size_kb:.1f}KB")
    
    return png_bytes, metadata


def _add_basemap(ax, utm_crs: str, use_satellite: bool) -> bool:
    """Try to add a basemap, return True if successful"""
    basemap_sources = []
    
    if use_satellite:
        basemap_sources = [
            ("Esri WorldImagery", ctx.providers.Esri.WorldImagery),
            ("CartoDB VoyagerNoLabels", ctx.providers.CartoDB.VoyagerNoLabels),
        ]
    else:
        basemap_sources = [
            ("CartoDB Positron", ctx.providers.CartoDB.Positron),
            ("OpenStreetMap", ctx.providers.OpenStreetMap.Mapnik),
        ]
    
    for name, source in basemap_sources:
        try:
            print(f"🌐 Trying {name}...")
            ctx.add_basemap(
                ax,
                crs=utm_crs,
                source=source,
                alpha=0.7,
                attribution=False,
                reset_extent=False,
                zoom=12
            )
            print(f"✅ {name} loaded")
            return True
        except Exception as e:
            print(f"❌ {name} failed: {str(e)[:100]}")
            continue
    
    return False


def _create_styled_background(ax, map_extent, use_satellite: bool):
    """Create styled background when no basemap available"""
    if use_satellite:
        ax.set_facecolor('#1a2332')  # Dark blue-gray
        ax.grid(True, alpha=0.15, linestyle='-', color='#4a6741', linewidth=0.5)
    else:
        ax.set_facecolor('#f8f9fa')  # Light background
        ax.grid(True, alpha=0.4, linestyle='-', color='#dee2e6', linewidth=1.5)


def _plot_wetlands(ax, wetlands_gdf: gpd.GeoDataFrame):
    """Plot wetlands layer"""
    if not wetlands_gdf.empty:
        wetlands_gdf.plot(
            ax=ax,
            color='lightblue',
            alpha=0.6,
            edgecolor='darkblue',
            linewidth=1.5,
            label='Wetlands',
            zorder=3
        )


def _plot_buffer_zone(ax, site_buffer, utm_crs: str, buffer_m: float):
    """Plot buffer zone"""
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


def _plot_site(ax, site_gdf: gpd.GeoDataFrame):
    """Plot site"""
    site_gdf.plot(
        ax=ax,
        color='red',
        alpha=0.8,
        edgecolor='darkred',
        linewidth=3,
        label='Project Site',
        zorder=4
    )


def _add_site_marker(ax, site_gdf: gpd.GeoDataFrame, site_label_text: Optional[str], 
                     original_gdf: gpd.GeoDataFrame, context_buffer: float):
    """Add site marker and label"""
    try:
        site_name = site_label_text or _get_site_name(original_gdf)
        centroid = site_gdf.geometry.centroid.iloc[0]
        
        # Circle marker
        ax.scatter(
            centroid.x, centroid.y,
            marker='o',
            s=200,
            color='red',
            edgecolor='white',
            linewidth=2,
            zorder=20
        )
        
        # Label
        ax.text(
            centroid.x,
            centroid.y + (context_buffer * 0.03),
            site_name,
            fontsize=16,
            fontweight='bold',
            color='white',
            ha='center',
            va='bottom',
            zorder=21,
            path_effects=[
                path_effects.withStroke(linewidth=3, foreground='black')
            ]
        )
    except Exception as e:
        print(f"⚠️  Site marker failed: {e}")


def _add_scale_bar(ax):
    """Add scale bar if available"""
    try:
        scalebar = ScaleBar(
            1,
            location='lower right',
            pad=0.5,
            border_pad=0.5,
            color='black',
            box_color='white',
            box_alpha=0.8
        )
        ax.add_artist(scalebar)
    except Exception as e:
        print(f"⚠️  Scale bar failed: {e}")


def _add_north_arrow(ax, map_extent):
    """Add north arrow"""
    try:
        arrow_x = map_extent[1] - (map_extent[1] - map_extent[0]) * 0.05
        arrow_y = map_extent[3] - (map_extent[3] - map_extent[2]) * 0.05
        
        arrow = patches.FancyArrowPatch(
            (arrow_x, arrow_y - 1000),
            (arrow_x, arrow_y),
            arrowstyle='->',
            mutation_scale=20,
            color='black',
            linewidth=2
        )
        ax.add_patch(arrow)
        
        ax.text(
            arrow_x, arrow_y + 500,
            'N',
            ha='center',
            va='bottom',
            fontsize=12,
            fontweight='bold',
            color='black'
        )
    except Exception as e:
        print(f"⚠️  North arrow failed: {e}")


def _add_coordinate_info(ax, site_gdf: gpd.GeoDataFrame, map_extent):
    """Add coordinate information"""
    try:
        centroid = site_gdf.geometry.centroid.iloc[0]
        
        # Convert to lat/lon
        lat_lon = gpd.GeoDataFrame([1], geometry=[centroid], crs=site_gdf.crs).to_crs("EPSG:4326")
        lat = lat_lon.geometry.y.iloc[0]
        lon = lat_lon.geometry.x.iloc[0]
        
        coord_text = f"UTM: {centroid.x:.0f}E, {centroid.y:.0f}N\nLat/Lon: {lat:.4f}°, {lon:.4f}°"
        ax.text(
            map_extent[0] + (map_extent[1] - map_extent[0]) * 0.02,
            map_extent[2] + (map_extent[3] - map_extent[2]) * 0.02,
            coord_text,
            fontsize=9,
            ha='left',
            va='bottom',
            bbox=dict(boxstyle="round,pad=0.3", facecolor='white', alpha=0.8)
        )
    except Exception as e:
        print(f"⚠️  Coordinate info failed: {e}")


def _get_site_name(site_gdf: gpd.GeoDataFrame) -> str:
    """Extract site name from GeoDataFrame"""
    site_name = "Selected Site"
    if 'name' in site_gdf.columns and pd.notnull(site_gdf.iloc[0]['name']):
        site_name = str(site_gdf.iloc[0]['name'])
    elif 'id' in site_gdf.columns:
        site_name = f"Site ID: {site_gdf.iloc[0]['id']}"
    return site_name
