"""
interactive_input.py

Enhanced interactive map input for NEMA Wetland Compliance app with:
- Search functionality for places
- Satellite/OpenStreetMap toggle
- Custom site naming

Dependencies: folium, streamlit-folium, geopandas, shapely
"""

import geopandas as gpd
from shapely.geometry import shape, Point, Polygon
import pandas as pd
import streamlit as st
from streamlit_folium import st_folium
import folium
import requests


def search_location(query):
    """
    Search for a location using Nominatim (OpenStreetMap) geocoding.
    Returns [lat, lon] if found, None otherwise.
    """
    try:
        url = f"https://nominatim.openstreetmap.org/search"
        params = {
            'q': query,
            'format': 'json',
            'limit': 1,
            'countrycodes': 'ug'  # Focus on Uganda
        }
        headers = {'User-Agent': 'NEMA-Compliance-Checker/1.0'}
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        if response.status_code == 200:
            results = response.json()
            if results:
                lat = float(results[0]['lat'])
                lon = float(results[0]['lon'])
                return [lat, lon]
    except Exception as e:
        st.warning(f"Search failed: {e}")
    
    return None


def get_geometry_from_map(bounds=None, draw_types=("marker", "polygon", "rectangle")):
    """
    Enhanced interactive map with search and satellite options.
    Returns a GeoDataFrame with custom site name.
    """
    if bounds is None:
        bounds = [32, -1, 34, 1]  # Uganda default
    center = [(bounds[1]+bounds[3])/2, (bounds[0]+bounds[2])/2]
    
    # Map type selection
    col1, col2 = st.columns([2, 1])
    
    with col1:
        # Location search
        search_query = st.text_input(
            "🔍 Search for a location in Uganda", 
            placeholder="e.g., Kampala, Entebbe, Jinja..."
        )
        
        if search_query and st.button("🎯 Go to Location"):
            coords = search_location(search_query)
            if coords:
                center = coords
                st.success(f"📍 Found: {search_query}")
            else:
                st.error(f"❌ Could not find: {search_query}")
    
    with col2:
        map_type = st.selectbox(
            "🗺️ Map Type",
            ["OpenStreetMap", "Satellite"],
            help="Choose between street map or satellite imagery"
        )
    
    # Site name input
    site_name = st.text_input(
        "📝 Site Name", 
        value="My Site", 
        help="Enter a custom name for your site (will appear on maps and reports)"
    )
    
    # Create map with selected base layer
    if map_type == "Satellite":
        # Use satellite imagery
        m = folium.Map(
            location=center, 
            zoom_start=8,
            tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            attr="Esri, Maxar, Earthstar Geographics"
        )
    else:
        # Default OpenStreetMap
        m = folium.Map(location=center, zoom_start=8)
    
    # Add drawing tools
    draw = folium.plugins.Draw(
        export=True,
        draw_options={
            "polyline": False,
            "circle": False,
            "circlemarker": False,
            "marker": "marker" in draw_types,
            "polygon": "polygon" in draw_types,
            "rectangle": "rectangle" in draw_types,
        },
        edit_options={"edit": True}
    )
    draw.add_to(m)
    
    # Instructions
    st.markdown(f"**📍 Drawing on: {map_type} | Site Name: '{site_name}'**")
    st.write("Draw a marker, polygon, or rectangle to select your site location.")
    
    # Display responsive map
    col1, col2, col3 = st.columns([1, 10, 1])
    with col2:
        output = st_folium(m, width=None, height=400, use_container_width=True, returned_objects=["last_active_drawing"])
    
    # Process drawn geometry
    geojson = output.get("last_active_drawing")
    if geojson:
        geom = shape(geojson["geometry"])
        # Create GeoDataFrame with custom name
        data = {"name": site_name, "map_type": map_type}
        gdf = gpd.GeoDataFrame([data], geometry=[geom], crs="EPSG:4326")
        return gdf
    
    return None

# Example usage in Streamlit:
# site_gdf = get_geometry_from_map()
# if site_gdf is not None:
#     st.success("Geometry captured from map!")
#     st.write(site_gdf)
