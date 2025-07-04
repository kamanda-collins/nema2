import pandas as pd
from jinja2 import Template
import geopandas as gpd

# Load the Jinja2 template from file

def load_report_template(template_path):
    with open(template_path, 'r') as f:
        return Template(f.read())

# Calculate distance to nearest wetland (if not in one)
def calculate_min_distance(site_gdf, wetlands_gdf):
    # Project to UTM Zone 36N (EPSG:32636) for Uganda for accurate distance in meters
    projected_crs = "EPSG:32636"
    site_gdf_proj = site_gdf.to_crs(projected_crs)
    wetlands_gdf_proj = wetlands_gdf.to_crs(projected_crs)
    site_centroid = site_gdf_proj.geometry.unary_union.centroid
    wetland_geoms = wetlands_gdf_proj.geometry
    return wetland_geoms.distance(site_centroid).min()

# Render the compliance report using the template and context
def render_compliance_report(context, template_path):
    template = load_report_template(template_path)
    return template.render(**context)

# Compliance check logic
def check_compliance(site_gdf, wetlands_gdf):
    # Reproject to match
    if site_gdf.crs != wetlands_gdf.crs:
        site_gdf = site_gdf.to_crs(wetlands_gdf.crs)
    intersection = gpd.sjoin(site_gdf, wetlands_gdf, how="left", predicate="intersects")
    in_wetland = intersection['index_right'].notna().any()
    wetland_names = []
    if intersection['index_right'].notna().any():
        idxs = intersection['index_right'].dropna().unique()
        # Try to get a name, fallback to another column or index
        for idx in idxs:
            if 'name' in wetlands_gdf.columns and pd.notnull(wetlands_gdf.loc[idx, 'name']):
                wetland_names.append(str(wetlands_gdf.loc[idx, 'name']))
            elif 'id' in wetlands_gdf.columns and pd.notnull(wetlands_gdf.loc[idx, 'id']):
                wetland_names.append(f"Wetland {wetlands_gdf.loc[idx, 'id']}")
            else:
                wetland_names.append(f"Wetland {idx}")
    return in_wetland, wetland_names
