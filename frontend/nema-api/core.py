"""
Core NEMA compliance checking functions
Extracted from nema2/report_logic.py with API adaptations
"""

import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, Polygon, MultiPolygon
from typing import Tuple, List, Dict, Optional, Any
from pathlib import Path


def check_compliance(
    site_gdf: gpd.GeoDataFrame,
    wetlands_gdf: gpd.GeoDataFrame
) -> Tuple[bool, List[str]]:
    """
    Check if the site intersects with any wetlands.
    
    Args:
        site_gdf: GeoDataFrame of the proposed site (must have geometry)
        wetlands_gdf: GeoDataFrame of wetlands (must have geometry and 'NAME' column)
    
    Returns:
        Tuple of (in_wetland: bool, wetland_names: List[str])
    """
    # Ensure both are in the same CRS
    if site_gdf.crs != wetlands_gdf.crs:
        wetlands_gdf = wetlands_gdf.to_crs(site_gdf.crs)
    
    # Perform spatial join to find intersections
    intersection = gpd.sjoin(
        site_gdf,
        wetlands_gdf,
        how='inner',
        predicate='intersects'
    )
    
    in_wetland = len(intersection) > 0
    wetland_names = []
    
    if in_wetland:
        # Extract wetland names (handle different possible column names)
        name_column = None
        for col in ['NAME', 'Name', 'name', 'WETLAND_NAME', 'wetland_name']:
            if col in intersection.columns:
                name_column = col
                break
        
        if name_column:
            wetland_names = intersection[name_column].unique().tolist()
        else:
            wetland_names = ["Unnamed wetland"]
    
    return in_wetland, wetland_names


def calculate_min_distance(
    site_gdf: gpd.GeoDataFrame,
    wetlands_gdf: gpd.GeoDataFrame,
    target_crs: str = "EPSG:32636"
) -> Optional[float]:
    """
    Calculate minimum distance from site to nearest wetland in meters.
    
    Args:
        site_gdf: GeoDataFrame of the site
        wetlands_gdf: GeoDataFrame of wetlands
        target_crs: CRS for distance calculation (default: UTM Zone 36N)
    
    Returns:
        Minimum distance in meters, or None if calculation fails
    """
    try:
        # Project to UTM for accurate distance calculation
        site_utm = site_gdf.to_crs(target_crs)
        wetlands_utm = wetlands_gdf.to_crs(target_crs)
        
        # Calculate distances
        distances = []
        for site_geom in site_utm.geometry:
            for wetland_geom in wetlands_utm.geometry:
                dist = site_geom.distance(wetland_geom)
                distances.append(dist)
        
        if distances:
            return min(distances)
        return None
    
    except Exception as e:
        print(f"Distance calculation error: {e}")
        return None


def assess_compliance_risk(
    in_wetland: bool,
    min_distance: Optional[float],
    buffer_zone_m: float = 200.0
) -> Dict[str, Any]:
    """
    Assess compliance risk based on wetland intersection and distance.
    
    Args:
        in_wetland: Whether site intersects wetland
        min_distance: Minimum distance to wetland in meters
        buffer_zone_m: Buffer zone requirement in meters (default: 200m)
    
    Returns:
        Dictionary with risk assessment details
    """
    if in_wetland:
        return {
            "risk_level": "CRITICAL",
            "compliant": False,
            "message": "Site is located within a protected wetland area",
            "recommendation": "Relocation required - development within wetlands is prohibited",
            "distance_to_wetland": 0.0,
            "buffer_violation": True
        }
    
    if min_distance is None:
        return {
            "risk_level": "UNKNOWN",
            "compliant": None,
            "message": "Unable to calculate distance to wetlands",
            "recommendation": "Manual verification required",
            "distance_to_wetland": None,
            "buffer_violation": None
        }
    
    if min_distance < buffer_zone_m:
        return {
            "risk_level": "HIGH",
            "compliant": False,
            "message": f"Site is within {buffer_zone_m}m buffer zone ({min_distance:.1f}m from wetland)",
            "recommendation": f"Relocation recommended - minimum {buffer_zone_m}m buffer required",
            "distance_to_wetland": round(min_distance, 2),
            "buffer_violation": True
        }
    
    # Compliant
    return {
        "risk_level": "LOW",
        "compliant": True,
        "message": f"Site is {min_distance:.1f}m from nearest wetland",
        "recommendation": "No wetland compliance issues detected",
        "distance_to_wetland": round(min_distance, 2),
        "buffer_violation": False
    }


def load_wetlands_data(wetlands_path: str) -> Optional[gpd.GeoDataFrame]:
    """
    Load wetlands data from shapefile or GeoJSON.
    
    Args:
        wetlands_path: Path to wetlands data file
    
    Returns:
        GeoDataFrame of wetlands, or None if loading fails
    """
    try:
        wetlands_gdf = gpd.read_file(wetlands_path)
        
        # Ensure valid geometry
        wetlands_gdf = wetlands_gdf[wetlands_gdf.geometry.is_valid]
        
        # Ensure WGS84 CRS
        if wetlands_gdf.crs is None:
            wetlands_gdf.set_crs("EPSG:4326", inplace=True)
        elif wetlands_gdf.crs != "EPSG:4326":
            wetlands_gdf = wetlands_gdf.to_crs("EPSG:4326")
        
        return wetlands_gdf
    
    except Exception as e:
        print(f"Error loading wetlands data: {e}")
        return None


def validate_site_geometry(site_gdf: gpd.GeoDataFrame) -> Tuple[bool, Optional[str]]:
    """
    Validate site geometry for compliance checking.
    
    Args:
        site_gdf: GeoDataFrame of the site
    
    Returns:
        Tuple of (is_valid: bool, error_message: Optional[str])
    """
    if site_gdf is None or len(site_gdf) == 0:
        return False, "Site data is empty"
    
    if 'geometry' not in site_gdf.columns:
        return False, "No geometry column found"
    
    if site_gdf.geometry.is_empty.all():
        return False, "All geometries are empty"
    
    if not site_gdf.geometry.is_valid.all():
        return False, "Invalid geometries detected"
    
    if site_gdf.crs is None:
        return False, "No CRS defined for site data"
    
    return True, None
