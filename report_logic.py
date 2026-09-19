import pandas as pd
from jinja2 import Template
import geopandas as gpd

from geo_utils import union_all_geoseries, estimate_utm_crs_for

# Load the Jinja2 template from file

def load_report_template(template_path):
    with open(template_path, 'r', encoding='utf-8') as f:
        return Template(f.read())

# Calculate distance to nearest wetland (from the site boundary, in meters)
def calculate_min_distance(site_gdf, wetlands_gdf):
    """Distance in meters between the site footprint and the nearest wetland.

    The distance is measured from the site's own geometry (its edge), not
    from its centroid, so the value matches NEMA buffer guidance which is
    defined relative to the site boundary. Uses an automatically-selected
    UTM zone (36N for Uganda, 36N/37N for Kenya) for meter accuracy.
    Returns None when either layer is empty/missing.
    """
    if site_gdf is None or site_gdf.empty or wetlands_gdf is None or wetlands_gdf.empty:
        return None

    projected_crs = estimate_utm_crs_for(site_gdf)
    site_gdf_proj = site_gdf.to_crs(projected_crs)
    wetlands_gdf_proj = wetlands_gdf.to_crs(projected_crs)

    site_footprint = union_all_geoseries(site_gdf_proj.geometry)
    distances = wetlands_gdf_proj.geometry.distance(site_footprint).dropna()
    if distances.empty:
        return None
    return float(distances.min())

# Render the compliance report using the template and context
def render_compliance_report(context, template_path):
    template = load_report_template(template_path)
    return template.render(**context)

# Compliance check logic
def check_compliance(site_gdf, wetlands_gdf):
    """Check whether the site intersects any mapped wetland.

    Returns:
        (in_wetland, wetland_names): bool and list of matched wetland names.
        Gracefully returns (False, []) for empty/missing inputs instead of
        raising, so a bad upload can never crash the app.
    """
    if site_gdf is None or site_gdf.empty or wetlands_gdf is None or wetlands_gdf.empty:
        return False, []

    # Make sure both layers share a CRS, but only when both are defined
    # (to_crs(None) would raise for layers shipped without a .prj file).
    if wetlands_gdf.crs is not None and site_gdf.crs is not None and site_gdf.crs != wetlands_gdf.crs:
        site_gdf = site_gdf.to_crs(wetlands_gdf.crs)

    try:
        intersection = gpd.sjoin(site_gdf, wetlands_gdf, how="inner", predicate="intersects")
    except TypeError:
        # geopandas < 0.10 used `op=` instead of `predicate=`
        intersection = gpd.sjoin(site_gdf, wetlands_gdf, how="inner", op="intersects")

    if intersection.empty or 'index_right' not in intersection.columns:
        return False, []

    matched_idxs = intersection['index_right'].dropna().unique()
    wetland_names = []
    for idx in matched_idxs:
        # Try to get a name, fallback to another column or index
        if 'name' in wetlands_gdf.columns and pd.notnull(wetlands_gdf.loc[idx, 'name']):
            wetland_names.append(str(wetlands_gdf.loc[idx, 'name']))
        elif 'id' in wetlands_gdf.columns and pd.notnull(wetlands_gdf.loc[idx, 'id']):
            wetland_names.append(f"Wetland {wetlands_gdf.loc[idx, 'id']}")
        else:
            wetland_names.append(f"Wetland {idx}")
    return len(wetland_names) > 0, wetland_names
