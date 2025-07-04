import time
import os
import sys
import gc  # Garbage collection for memory management

# Memory monitoring for Railway deployment
def get_memory_usage():
    """Get current memory usage in MB (simplified for Railway)."""
    try:
        import psutil
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / 1024 / 1024  # Convert to MB
    except ImportError:
        return None  # psutil not available

#import necessary libraries
# This code is a minimal Streamlit app for checking NEMA wetland compliance in Uganda.
# It allows users to upload site coordinates, select wetlands data sources, visualize the data on a map,
# and generate a compliance report based on user inputs and the compliance check results.
# It supports multiple data sources for wetlands, including local files, OGC WFS, and
import streamlit as st

# --- Page Configuration with Custom Favicon ---
favicon_path = os.path.join(os.path.dirname(__file__), "static", "favicon.svg")
if os.path.exists(favicon_path):
    with open(favicon_path, 'r') as f:
        favicon_svg = f.read()
    
    # Convert SVG to data URL for favicon
    import base64
    favicon_b64 = base64.b64encode(favicon_svg.encode()).decode()
    favicon_url = f"data:image/svg+xml;base64,{favicon_b64}"
    
    st.set_page_config(
        page_title="NEMA Compliance Checker - KamandaLabs",
        page_icon=favicon_url,
        layout="wide",
        initial_sidebar_state="collapsed"
    )
else:
    st.set_page_config(
        page_title="NEMA Compliance Checker - KamandaLabs",
        page_icon="🌿",
        layout="wide",
        initial_sidebar_state="collapsed"
    )

# --- Inject Obsidian Dark CSS Theme ---
css_path = os.path.join(os.path.dirname(__file__), "static", "obsidian_dark.css")
if os.path.exists(css_path):
    with open(css_path) as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)
import geopandas as gpd
import pandas as pd
import tempfile
import zipfile
import os
import folium
from streamlit_folium import st_folium
import io
from report_logic import check_compliance, calculate_min_distance, render_compliance_report
from data_sources import load_wetlands_from_file, load_wetlands_from_wfs, load_wetlands_from_arcgis
from batch_processing import show_batch_processing_ui, process_batch_sites, generate_batch_report

# Always define these first!
site_gdf = None
batch_sites_df = None

# Developer mode toggle and memory monitoring
st.sidebar.markdown("## ⚙️ Developer Options")
developer_mode = st.sidebar.checkbox("Developer Mode", value=False, help="Show technical info and warnings.")
st.session_state['developer_mode'] = developer_mode

if developer_mode:
    from memory_monitor import show_memory_status
    show_memory_status()

# --- Developer Mode Toggle ---
# (Moved to top bar)

# --- Mobile Meta Tag ---
st.markdown(
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    unsafe_allow_html=True
)

# --- Mobile & Responsive CSS ---
st.markdown('''
<style>
/* Enhanced responsive design for mobile */
@media (max-width: 768px) {
  .main .block-container { 
    padding: 0.5rem 0.3rem !important; 
    max-width: 100% !important;
  }
  h1 { font-size: 1.4em !important; line-height: 1.2 !important; }
  h2 { font-size: 1.2em !important; }
  .stButton button { 
    font-size: 0.9em !important; 
    padding: 0.4rem 0.8rem !important;
    width: 100% !important;
  }
  .stRadio label { font-size: 0.9em !important; }
  .stDataFrame { font-size: 0.8em !important; }
  .stSelectbox, .stTextInput, .stTextArea { 
    font-size: 0.9em !important; 
  }
  .stFileUploader { margin-bottom: 1rem !important; }
  /* Make columns stack on mobile */
  .stColumns { flex-direction: column !important; }
  .stColumn { width: 100% !important; margin-bottom: 0.5rem !important; }
}

/* Mobile-first map sizing */
.leaflet-container { 
  min-height: 300px !important; 
  height: 60vw !important; 
  max-height: 500px !important; 
  margin: 0 auto !important;
  border-radius: 8px !important;
}

@media (max-width: 480px) {
  .leaflet-container { 
    min-height: 250px !important; 
    height: 70vw !important; 
    max-height: 400px !important; 
  }
  h1 { font-size: 1.2em !important; }
  .main .block-container { padding: 0.3rem 0.2rem !important; }
}

/* Responsive header for mobile */
@media (max-width: 600px) {
  .header-container { 
    flex-direction: column !important; 
    text-align: center !important; 
  }
  .header-container > div { 
    margin-left: 0 !important; 
    margin-top: 0.5rem !important; 
  }
}
</style>
''', unsafe_allow_html=True)

# --- Concise UI Helper ---
def concise(text):
    return f"<span style='font-size:1.05em;color:#e0e0e0;'>{text}</span>"

# --- 1. Input Data Logic ---

# --- Professional Header with Branding ---

# --- Show memory usage only for developer ---
if st.session_state.get('developer_mode', False):
    memory_usage = get_memory_usage()
    if memory_usage:
        st.sidebar.info(f"Memory usage: {memory_usage:.1f}MB / 1024MB")

# Load and display logo
logo_path = os.path.join(os.path.dirname(__file__), "static", "logo.svg")
if os.path.exists(logo_path):
    with open(logo_path, 'r') as f:
        logo_svg = f.read()
    
    # Render SVG as an <img> tag to avoid raw SVG code in UI
    import base64
    logo_svg_b64 = base64.b64encode(logo_svg.encode()).decode()
    logo_img_tag = f"<img src='data:image/svg+xml;base64,{logo_svg_b64}' width='64' height='64' style='vertical-align:middle;'>"
    st.markdown(f"""
    <div class='header-container' style='display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;'>
        <div style='display:flex;align-items:center;gap:14px;flex-wrap:wrap;'>
            <h1 style="margin-bottom:0;font-size:2.1em;color:#fff;font-weight:900;letter-spacing:0.5px;">NEMA Compliance Checker</h1>
            <img src='https://upload.wikimedia.org/wikipedia/commons/4/4e/Flag_of_Uganda.svg' width='36' style='border-radius:6px;border:1.5px solid #222;'>
        </div>
        <div style='margin-left:auto;flex-shrink:0;'>
            {logo_img_tag}
        </div>
    </div>
    <div style='font-size:1.1em;margin-top:0.2em;background: linear-gradient(90deg, #a259e6 0%, #6d3680 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; font-weight:bold;'>by <a href='https://kamandalabs.me' target='_blank' style='color:inherit;text-decoration:none;font-weight:bold;'>KamandaLabs</a></div>
    <div style='font-size:1.1em;margin-top:0.7em;color:#e0e0e0;'>Upload your site coordinates to check for wetland compliance.</div>
    """, unsafe_allow_html=True)
else:
    # Fallback without logo
    st.markdown("""
    <div class='header-container' style='display:flex;align-items:center;gap:14px;flex-wrap:wrap;'>
      <h1 style="margin-bottom:0;font-size:2.1em;color:#fff;font-weight:900;letter-spacing:0.5px;">NEMA Compliance Checker</h1>
      <img src='https://upload.wikimedia.org/wikipedia/commons/4/4e/Flag_of_Uganda.svg' width='36' style='border-radius:6px;border:1.5px solid #222;'>
    </div>
    <div style='font-size:1.1em;margin-top:0.2em;background: linear-gradient(90deg, #a259e6 0%, #6d3680 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; font-weight:bold;'>by <a href='https://kamandalabs.me' target='_blank' style='color:inherit;text-decoration:none;font-weight:bold;'>KamandaLabs</a></div>
    <div style='font-size:1.1em;margin-top:0.7em;color:#e0e0e0;'>Upload your site coordinates to check for wetland compliance.</div>
    """, unsafe_allow_html=True)

# --- Site Data Input Logic - MOVED TO TOP ---
st.caption("<span style='font-size:1.1em;'>⚡ <b>Tip:</b> For best performance, use a small site file or a small area on the interactive map. Large datasets may slow down visualization and distance calculations. 🐢</span>", unsafe_allow_html=True)

# Add processing mode selection
if 'processing_mode' not in st.session_state:
    st.session_state['processing_mode'] = "Single Site"
processing_mode = st.radio(
    "🔧 Processing Mode",
    ["Single Site", "Batch Processing"],
    index=0 if st.session_state['processing_mode'] == "Single Site" else 1,
    horizontal=True,
    key="processing_mode_radio"
)
st.session_state['processing_mode'] = processing_mode

site_gdf = None
batch_sites_df = None
t0 = time.time()

if processing_mode == "Single Site":
    # UI state for toggling between file upload and interactive map
    if 'show_map_input' not in st.session_state:
        st.session_state['show_map_input'] = False

    if not st.session_state['show_map_input']:
        uploaded_file = st.file_uploader(
            "Upload site coordinates (GeoJSON, Shapefile ZIP, or CSV)",
            type=["geojson", "json", "zip", "csv"]
        )
        st.button("🗺️ Use Interactive Map", on_click=lambda: st.session_state.update({'show_map_input': True}))
        def read_site_file(uploaded_file):
            try:
                if uploaded_file.name.endswith(".zip"):
                    with tempfile.TemporaryDirectory() as temp_dir:
                        zip_path = os.path.join(temp_dir, "shapefile.zip")
                        with open(zip_path, "wb") as f:
                            f.write(uploaded_file.getbuffer())
                        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                            zip_ref.extractall(temp_dir)
                        shp_files = [f for f in os.listdir(temp_dir) if f.endswith('.shp')]
                        if not shp_files:
                            st.error("No .shp file found in the ZIP archive.")
                            return None
                        shp_path = os.path.join(temp_dir, shp_files[0])
                        return gpd.read_file(shp_path)
                elif uploaded_file.name.endswith(".csv"):
                    df = pd.read_csv(uploaded_file)
                    lat_col, lon_col = None, None
                    for lats in ['lat', 'latitude', 'Lat', 'Latitude']:
                        if lats in df.columns:
                            lat_col = lats
                            break
                    for lons in ['lon', 'longitude', 'Lon', 'Longitude']:
                        if lons in df.columns:
                            lon_col = lons
                            break
                    if lat_col and lon_col:
                        return gpd.GeoDataFrame(df, geometry=gpd.points_from_xy(df[lon_col], df[lat_col]), crs="EPSG:4326")
                    else:
                        st.error("CSV must have latitude and longitude columns.")
                        return None
                else:
                    return gpd.read_file(uploaded_file)
            except Exception as e:
                st.error(f"Could not read uploaded file: {e}")
                return None
        if uploaded_file is not None:
            site_gdf = read_site_file(uploaded_file)
            if site_gdf is not None and not site_gdf.empty:
                st.success(f"Loaded {len(site_gdf)} site feature(s)")
                # Display GeoDataFrame with geometry as WKT to avoid ArrowTypeError
                st.write(site_gdf.drop(columns='geometry').assign(geometry=site_gdf.geometry.astype(str)))
            elif site_gdf is not None and site_gdf.empty:
                st.warning("Uploaded file contains no valid features.")
    else:
        from interactive_input import get_geometry_from_map
        site_gdf = get_geometry_from_map()
        if site_gdf is not None and not site_gdf.empty:
            st.success("Geometry captured from map!")
            # Display GeoDataFrame with geometry as WKT to avoid ArrowTypeError
            st.write(site_gdf.drop(columns='geometry').assign(geometry=site_gdf.geometry.astype(str)))
        # Reduce vertical space after the map
        st.markdown("<div style='margin-bottom:-40px;'></div>", unsafe_allow_html=True)
        st.button("⬅️ Back to File Upload", on_click=lambda: st.session_state.update({'show_map_input': False}))

else:  # Batch Processing Mode
    batch_sites_df = show_batch_processing_ui()

# --- 2. Database Integration Logic ---

t1 = time.time()
# --- Wetlands Data Source Selection ---
st.subheader("Wetlands Data Source 🐸")
data_source_options = [
    ("Local File", "🗂️"),
    ("OGC WFS", "🌐"),
    ("ArcGIS REST API", "🛰️")
]
if 'selected_data_source' not in st.session_state:
    st.session_state['selected_data_source'] = data_source_options[0][0]
cols = st.columns(len(data_source_options))
for i, (opt, icon) in enumerate(data_source_options):
    is_selected = st.session_state['selected_data_source'] == opt
    btn_style = "background-color:#1e88e5;color:white;font-weight:900;" if is_selected else ""
    if cols[i].button(f"{icon} {opt}", key=f"ds_{opt}", help=f"Select {opt}"):
        st.session_state['selected_data_source'] = opt
    # Visual highlight for selected
    cols[i].markdown(f"<div style='height:4px;{'background-color:#1e88e5;' if is_selected else ''}'></div>", unsafe_allow_html=True)
data_source = st.session_state['selected_data_source']
st.caption("<span style='font-size:1.1em;'>💡 <b>Pro Tip:</b> For best performance, use a smaller region or sample of the wetlands database. Large shapefiles may cause slow visualization and distance calculations. 🦦</span>", unsafe_allow_html=True)
# Memory monitoring for Railway deployment
def get_memory_usage():
    """Get current memory usage in MB (simplified for Railway)."""
    try:
        import psutil
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / 1024 / 1024  # Convert to MB
    except ImportError:
        return None  # psutil not available

def load_default_wetlands():
    """Lazy load default wetlands data only when needed."""
    if 'wetlands_gdf' not in st.session_state:
        st.session_state['wetlands_gdf'] = None
        st.session_state['wetlands_loaded'] = False
    
    if not st.session_state.get('wetlands_loaded', False):
        with st.spinner("Loading default wetlands data..."):
            default_main = os.path.abspath("wetland_shp/gis_osm_water_a_free_1.shp")
            default_reinforce = os.path.abspath("wetland_shp/gis_osm_waterways_free_1.shp")
            
            try:
                gdf_main = gpd.read_file(default_main) if os.path.exists(default_main) else None
            except Exception as e:
                st.warning(f"Error loading main shapefile: {e}")
                gdf_main = None
                
            try:
                gdf_reinforce = gpd.read_file(default_reinforce) if os.path.exists(default_reinforce) else None
            except Exception as e:
                st.warning(f"Error loading reinforce shapefile: {e}")
                gdf_reinforce = None
                
            if gdf_main is not None and gdf_reinforce is not None:
                st.session_state['wetlands_gdf'] = pd.concat([gdf_main, gdf_reinforce], ignore_index=True)
            elif gdf_main is not None:
                st.session_state['wetlands_gdf'] = gdf_main
            elif gdf_reinforce is not None:
                st.session_state['wetlands_gdf'] = gdf_reinforce
            else:
                st.session_state['wetlands_gdf'] = None
                
            st.session_state['wetlands_loaded'] = True
            
            # Show memory usage after loading
            memory_usage = get_memory_usage()
            if memory_usage:
                if memory_usage > 800:  # Close to 1GB limit
                    st.warning(f"⚠️ High memory usage: {memory_usage:.1f}MB / 1024MB")
                else:
                    st.info(f"📊 Memory usage: {memory_usage:.1f}MB / 1024MB")
    
    return st.session_state['wetlands_gdf']

# Initialize session state without loading data
if 'wetlands_gdf' not in st.session_state:
    st.session_state['wetlands_gdf'] = None
    st.session_state['wetlands_loaded'] = False
if data_source == "Local File":
    wetland_input_method = st.radio(
        "How would you like to provide wetlands data?",
        ["🗃️ Use preloaded NEMA wetlands data", "⬆️ Upload your own wetlands data (Shapefile or ZIP)"]
    )
    if wetland_input_method == "🗃️ Use preloaded NEMA wetlands data":
        # Lazy load the default wetlands data only when user selects this option
        wetlands_gdf = load_default_wetlands()
        if wetlands_gdf is not None:
            st.info(f"🟦🟩 Loaded {len(wetlands_gdf)} features from preloaded shapefiles.")
        else:
            st.warning("No preloaded wetlands shapefiles found.")
    else:
        uploaded_wetlands = st.file_uploader(
            "⬆️ Upload wetlands data (Shapefile ZIP or .shp)",
            type=["zip", "shp"]
        )
        reinforce_uploaded = st.file_uploader(
            "(Optional) ➕ Additional shapefile for water features",
            type=["zip", "shp"],
            key="reinforce_wetlands_upload"
        )
        def read_shapefile_from_upload(uploaded_file):
            if uploaded_file is None:
                return None
            if uploaded_file.name.endswith(".zip"):
                with tempfile.TemporaryDirectory() as temp_dir:
                    zip_path = os.path.join(temp_dir, "shapefile.zip")
                    with open(zip_path, "wb") as f:
                        f.write(uploaded_file.getbuffer())
                    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                        zip_ref.extractall(temp_dir)
                    shp_files = [f for f in os.listdir(temp_dir) if f.endswith('.shp')]
                    if not shp_files:
                        st.warning("No .shp file found in the ZIP archive.")
                        return None
                    shp_path = os.path.join(temp_dir, shp_files[0])
                    return gpd.read_file(shp_path)
            elif uploaded_file.name.endswith(".shp"):
                with tempfile.TemporaryDirectory() as temp_dir:
                    shp_path = os.path.join(temp_dir, uploaded_file.name)
                    with open(shp_path, "wb") as f:
                        f.write(uploaded_file.getbuffer())
                    return gpd.read_file(shp_path)
            else:
                st.warning("Unsupported file type for wetlands data.")
                return None
        gdf_main = read_shapefile_from_upload(uploaded_wetlands)
        gdf_reinforce = read_shapefile_from_upload(reinforce_uploaded)
        if gdf_main is not None and gdf_reinforce is not None:
            wetlands_gdf = pd.concat([gdf_main, gdf_reinforce], ignore_index=True)
            st.info(f"🟦🟩 Loaded {len(wetlands_gdf)} features from uploaded main and reinforce shapefiles.")
        elif gdf_main is not None:
            wetlands_gdf = gdf_main
            st.info(f"🟦 Loaded {len(wetlands_gdf)} features from uploaded main shapefile.")
        elif gdf_reinforce is not None:
            wetlands_gdf = gdf_reinforce
            st.info(f"🟩 Loaded {len(wetlands_gdf)} features from uploaded reinforce shapefile.")
        else:
            wetlands_gdf = None
elif data_source == "OGC WFS":
    wfs_url = st.text_input("🌐 WFS Service URL", "")
    wfs_layer = st.text_input("🗺️ WFS Layer Name", "")
    if wfs_url and wfs_layer:
        wetlands_gdf = load_wetlands_from_wfs(wfs_url, wfs_layer)
elif data_source == "ArcGIS REST API":
    arcgis_url = st.text_input("🛰️ ArcGIS Feature Layer URL", "")
    if arcgis_url:
        wetlands_gdf = load_wetlands_from_arcgis(arcgis_url)
if wetlands_gdf is not None and not wetlands_gdf.empty:
    # Only show info if not already shown above
    # Fix: Only reference gdf_main/gdf_reinforce if they are defined in this scope
    show_info = True
    if data_source == "Local File":
        # Check if gdf_main/gdf_reinforce are defined in locals()
        if 'gdf_main' in locals() or 'gdf_reinforce' in locals():
            # If either is defined and not None, don't show info again
            if (locals().get('gdf_main') is not None) or (locals().get('gdf_reinforce') is not None):
                show_info = False
    if show_info:
        st.info(f"🦆 Loaded wetlands database: {len(wetlands_gdf)} features")
    if len(wetlands_gdf) > 60000:
        st.warning("⚠️ Large wetlands dataset detected. Visualization and distance calculations may be slow. Consider using a smaller region or sampling the data. 🐘")
        folium.GeoJson(filtered_wetlands_gdf, name="Wetlands", style_function=lambda x: {"color": "blue", "weight": 1, "fillOpacity": 0.2}).add_to(m)
        folium.GeoJson(site_gdf, name="Site", style_function=lambda x: {"color": "red", "weight": 3, "fillOpacity": 0.1}).add_to(m)
        folium.LayerControl().add_to(m)
        
        # Responsive map rendering
        col1, col2, col3 = st.columns([1, 10, 1])
        with col2:
            st_folium(m, width=None, height=400, use_container_width=True)
# Automatic spatial filtering: only process wetlands near the site (buffered bbox in meters, projected CRS)
filtered_wetlands_gdf = wetlands_gdf
if site_gdf is not None and not site_gdf.empty and wetlands_gdf is not None and not wetlands_gdf.empty:
    # Use UTM Zone 36N for Uganda (EPSG:32636)
    utm_crs = "EPSG:32636"
    try:
        site_proj = site_gdf.to_crs(utm_crs)
        wetlands_proj = wetlands_gdf.to_crs(utm_crs)
        # Buffer the site by 5000 meters (5km)
        site_buffer = site_proj.buffer(5000).unary_union
        # Filter wetlands to those that intersect the buffer
        mask = wetlands_proj.intersects(site_buffer)
        filtered_wetlands_gdf = wetlands_gdf[mask.values]
        if filtered_wetlands_gdf.empty:
            st.warning("🦩 No wetlands found within 5km of the site. Showing all wetlands.")
            filtered_wetlands_gdf = wetlands_gdf
        else:
            st.info(f"🔍 Filtered wetlands to {len(filtered_wetlands_gdf)} features within 5km of the site.")
    except Exception as e:
        st.warning(f"Spatial filtering failed: {e}. Showing all wetlands.")
        filtered_wetlands_gdf = wetlands_gdf
    with st.spinner("Rendering map (may take a few seconds for large datasets)..."):
        bounds = site_gdf.total_bounds if not site_gdf.empty else [32, -1, 34, 1]
        center = [(bounds[1]+bounds[3])/2, (bounds[0]+bounds[2])/2]
        
        # Check if site has map type preference
        use_satellite_viz = False
        if 'map_type' in site_gdf.columns and site_gdf.iloc[0]['map_type'] == 'Satellite':
            use_satellite_viz = True
        
        # Create map with appropriate base layer
        if use_satellite_viz:
            m = folium.Map(
                location=center, 
                zoom_start=10,
                tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                attr="Esri, Maxar, Earthstar Geographics"
            )
        else:
            m = folium.Map(location=center, zoom_start=10)
        
        folium.GeoJson(filtered_wetlands_gdf, name="Wetlands", style_function=lambda x: {"color": "blue", "weight": 1, "fillOpacity": 0.2}).add_to(m)
        folium.GeoJson(site_gdf, name="Site", style_function=lambda x: {"color": "red", "weight": 3, "fillOpacity": 0.1}).add_to(m)
        folium.LayerControl().add_to(m)
        st_folium(m, width=700, height=500)
        # st.write(f"[Timing] Visualization: {time.time() - t2:.2f} seconds")
elif site_gdf is not None and not site_gdf.empty:
    st.info("Wetlands database not loaded. Showing only site features.")
elif wetlands_gdf is not None and not wetlands_gdf.empty:
    st.info("Site data not loaded. Showing only wetlands database.")

# --- 4. Compliance Check & Report Generation Logic ---
t3 = time.time()
# Use filtered wetlands for compliance and distance
if site_gdf is not None and not site_gdf.empty and filtered_wetlands_gdf is not None and not filtered_wetlands_gdf.empty:
    if site_gdf.crs is None or filtered_wetlands_gdf.crs is None:
        st.warning("One or both layers have no CRS defined. Please ensure both have valid coordinate reference systems.")
    else:
        in_wetland, wetland_names = check_compliance(site_gdf, filtered_wetlands_gdf)
        # st.write(f"[Timing] Compliance check: {time.time() - t3:.2f} seconds")
        min_distance = None
        if not in_wetland:
            with st.spinner("Calculating minimum distance to wetland (may take a few seconds for large datasets)..."):
                t4 = time.time()
                min_distance = calculate_min_distance(site_gdf, filtered_wetlands_gdf)
                # st.write(f"[Timing] Distance calculation: {time.time() - t4:.2f} seconds")
        st.subheader("Compliance Result 📝")
        if in_wetland:
            # st.error does not support unsafe_allow_html, so use st.markdown for HTML
            st.error("🚨 Site is located in or overlaps a NEMA wetland! NEMA compliance required. 🐸")
            if wetland_names:
                # Filter out None/empty names
                clean_names = [w for w in wetland_names if w]
                if clean_names:
                    st.markdown("<b>Wetland(s) detected:</b> <span style='color:#1e88e5;font-size:1.15em;font-weight:bold;'>" + ', '.join(clean_names) + "</span> 🦆", unsafe_allow_html=True)
                else:
                    st.markdown("<b>Wetland(s) detected:</b> <span style='color:#1e88e5;font-size:1.15em;font-weight:bold;'>Unnamed Wetland(s)</span> 🦆", unsafe_allow_html=True)
        else:
            # st.success does not support unsafe_allow_html, so use st.markdown for HTML
            st.success("✅ Site is NOT in a mapped NEMA wetland. 🎉")
            # Show distance to nearest wetland more prominently
            if min_distance is not None:
                st.markdown(f"<div style='font-size:1.15em;margin-top:0.5em;'><b>Distance to nearest wetland:</b> <span style='color:#1e88e5;font-weight:bold;'>{min_distance:,.1f} meters</span></div>", unsafe_allow_html=True)
        # Collect user input for key sections
        st.subheader("Customize Report Sections ✍️")
        st.caption("<span style='font-size:1.05em;'>All sections below are <b>optional</b>. You can fill in as much or as little as you like, or simply proceed to download the template report.</span>", unsafe_allow_html=True)
        executive_summary = st.text_area("📝 Executive Summary", "Brief overview of the project/operation.")
        purpose = st.text_input("🎯 Purpose of the Report", "To demonstrate adherence to NEMA regulations.")
        project_description = st.text_area("🏗️ Project/Operation Description", "Description of business activities, location, and scale.")
        ems_overview = st.text_area("🌱 EMS Overview", "Describe the organizational structure for environmental management.")
        audits_summary = st.text_area("🔍 Audits and Inspections Summary", "Summary of audits conducted and findings.")
        community_engagement = st.text_area("🤝 Community Engagement", "Description of engagement with local communities.")
        challenges = st.text_area("🚧 Challenges and Future Plans", "Key environmental challenges and future plans.")
        conclusion = st.text_area("✅ Conclusion", "Overall statement on the project's environmental compliance status.")
        # Render the report
        context = dict(
            date=pd.Timestamp.now().strftime('%Y-%m-%d'),
            num_features=len(site_gdf),
            executive_summary=executive_summary,
            purpose=purpose,
            project_description=project_description,
            ems_overview=ems_overview,
            audits_summary=audits_summary,
            community_engagement=community_engagement,
            challenges=challenges,
            conclusion=conclusion,
            in_wetland=in_wetland,
            wetland_names=wetland_names,
            min_distance=min_distance if min_distance is not None else 'N/A'
        )
        template_path = os.path.join(os.path.dirname(__file__), 'report_template.md.j2')
        t5 = time.time()
        rendered_report = render_compliance_report(context, template_path)
        # st.write(f"[Timing] Report generation: {time.time() - t5:.2f} seconds")
        st.subheader("Download Compliance Report 📥")
        # Markdown download
        st.download_button(
            "⬇️ Download Report (Markdown)",
            data=rendered_report,
            file_name="nema_compliance_report.md",
            mime="text/markdown"
        )
        # Word download (convert markdown to docx)
        try:
            import markdown
            from docx import Document
            from io import BytesIO
            from bs4 import BeautifulSoup
            # Convert markdown to HTML, then to docx (simple approach)
            html = markdown.markdown(rendered_report)
            doc = Document()
            soup = BeautifulSoup(html, "html.parser")
            for element in soup.find_all(['h1','h2','h3','h4','h5','h6','p','ul','ol','li']):
                if element.name.startswith('h'):
                    doc.add_heading(element.get_text(), int(element.name[1]))
                elif element.name == 'p':
                    doc.add_paragraph(element.get_text())
                elif element.name == 'li':
                    doc.add_paragraph(element.get_text(), style='List Bullet')
            word_buffer = BytesIO()
            doc.save(word_buffer)
            word_buffer.seek(0)
            st.download_button(
                "⬇️ Download Report (Word)",
                data=word_buffer,
                file_name="nema_compliance_report.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
            # --- Enhanced PNG Export Section ---
            st.markdown("### 🖼️ Export Static Map")
            
            # Map export options
            col1, col2, col3 = st.columns(3)
            
            with col1:
                map_type = st.selectbox(
                    "Map Type",
                    ["Satellite", "Street Map"],
                    index=0,
                    help="Choose between satellite imagery or street map"
                )
            
            with col2:
                buffer_km = st.slider(
                    "Context Area (km)",
                    min_value=1.0,
                    max_value=10.0,
                    value=5.0,
                    step=0.5,
                    help="How much surrounding area to include"
                )
            
            with col3:
                map_quality = st.selectbox(
                    "Map Quality",
                    ["High (300 DPI)", "Medium (200 DPI)", "Low (150 DPI)"],
                    index=1,
                    help="Higher quality = larger file size"
                )
            
            # Site label customization
            col4, col5 = st.columns(2)
            with col4:
                show_site_label = st.checkbox(
                    "Show site label on map",
                    value=True,
                    help="Display site name/label on the exported map"
                )
            with col5:
                custom_site_label = st.text_input(
                    "Custom site label (optional)",
                    placeholder="Leave blank to use default site name",
                    help="Custom text to display on the map instead of the default site name"
                )
            
            # Extract DPI from quality selection
            dpi_map = {"High (300 DPI)": 300, "Medium (200 DPI)": 200, "Low (150 DPI)": 150}
            dpi = dpi_map[map_quality]
            
            # Preview info
            st.info(f"📊 **Map Preview**: {map_type} view with {buffer_km} km context area at {map_quality.split(' ')[0].lower()} quality")
            
            # Export button
            if st.button("🖼️ Generate & Download Map", type="primary"):
                try:
                    with st.spinner("🎨 Generating enhanced map with surrounding context..."):
                        from static_map_export import export_static_map_png
                        
                        # Determine map settings
                        use_satellite = (map_type == "Satellite")
                        buffer_m = int(buffer_km * 1000)  # Convert to meters
                        
                        # Get custom filename based on site name
                        site_name = "nema_site_map"
                        if 'name' in site_gdf.columns and pd.notnull(site_gdf.iloc[0]['name']):
                            # Clean site name for filename
                            clean_name = str(site_gdf.iloc[0]['name']).replace(' ', '_').replace('/', '_')
                            site_name = f"nema_{clean_name}_map"
                        
                        # Generate enhanced map
                        png_bytes = export_static_map_png(
                            site_gdf, 
                            filtered_wetlands_gdf, 
                            buffer_m=buffer_m,
                            use_satellite=use_satellite,
                            dpi=dpi,
                            site_label_text=custom_site_label if custom_site_label.strip() else None,
                            show_site_label=show_site_label
                        )
                        
                        # Calculate file size
                        file_size_mb = len(png_bytes) / (1024 * 1024)
                        
                        st.success(f"✅ Map generated successfully! File size: {file_size_mb:.1f} MB")
                        
                        # Download button
                        st.download_button(
                            label="⬇️ Download Enhanced Map (PNG)",
                            data=png_bytes,
                            file_name=f"{site_name}_{map_type.lower()}_{buffer_km}km.png",
                            mime="image/png",
                            help="Click to download your enhanced map with surrounding context"
                        )
                        

                        
                except Exception as e:
                    error_msg = str(e)
                    if "Stamen" in error_msg:
                        st.error("❌ Map generation failed: Stamen tile service is no longer available.")
                        st.info("💡 This error has been fixed. Please try again - the system will now use alternative map providers.")
                    elif "HTTP" in error_msg or "404" in error_msg:
                        st.error("❌ Map generation failed: Network connectivity issue with map tile service.")
                        st.info("💡 Try switching to a different map type or check your internet connection.")
                    elif "timeout" in error_msg.lower():
                        st.error("❌ Map generation failed: Connection timeout to map tile service.")
                        st.info("💡 Try reducing the context area or switching map types.")
                    else:
                        st.error(f"❌ Map generation failed: {error_msg}")
                        st.info("💡 Try reducing the context area, switching to street map, or contact support if the issue persists.")
                    
                    # Offer fallback options
                    with st.expander("🔧 Alternative Options"):
                        st.write("If map generation continues to fail, try these alternatives:")
                        st.write("- Reduce the context area to 1-2 km")
                        st.write("- Switch from Satellite to Street Map view")
                        st.write("- Use Low (150 DPI) quality instead of High")
                        st.write("- Check your internet connection")
                        st.write("- Export the data as CSV/Excel and create maps externally")
        except Exception as e:
            st.error(f"Word export failed: {e}")

# --- 5. Batch Processing Results ---
elif processing_mode == "Batch Processing" and batch_sites_df is not None:
    st.subheader("🔄 Batch Processing Results")
    
    # Ensure wetlands data is loaded for batch processing
    if wetlands_gdf is None:
        st.error("❌ No wetlands data loaded. Please select a data source and load wetlands data first.")
        st.info("� Go back to the 'Wetlands Data Source' section and load your data.")
    else:
        with st.spinner("Processing all sites... This may take a few minutes for large datasets."):
            # Show memory usage before processing
            memory_usage = get_memory_usage()
            if memory_usage:
                if memory_usage > 800:  # Close to 1GB limit
                    st.error(f"⚠️ Memory usage too high before processing: {memory_usage:.1f}MB / 1024MB. Processing may fail.")
                else:
                    st.info(f"📊 Memory usage before processing: {memory_usage:.1f}MB / 1024MB")
            
            # Process all sites
            results_df = process_batch_sites(batch_sites_df, wetlands_gdf)
        
        # Display summary
        total_sites = len(results_df)
        sites_in_wetland = len(results_df[results_df['in_wetland'] == True])
        sites_compliant = total_sites - sites_in_wetland
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Total Sites", total_sites)
        with col2:
            st.metric("Sites in Wetlands", sites_in_wetland, delta=None, delta_color="inverse")
        with col3:
            st.metric("Compliant Sites", sites_compliant, delta=None)
        
        # Display results table
        st.subheader("📊 Detailed Results")
        
        # Color-code the results
        def color_compliance(val):
            if val == 'COMPLIANT':
                return 'background-color: #d4edda; color: #155724'
            elif 'REQUIRES NEMA' in val:
                return 'background-color: #f8d7da; color: #721c24'
            else:
                return 'background-color: #fff3cd; color: #856404'
        
        styled_df = results_df.style.applymap(color_compliance, subset=['compliance_status'])
        st.dataframe(styled_df, use_container_width=True)
        
        # Generate and offer batch report download
        st.subheader("📥 Download Batch Report")
        batch_report = generate_batch_report(results_df)
        
        col1, col2 = st.columns(2)
        with col1:
            st.download_button(
                "⬇️ Download Batch Report (Markdown)",
                data=batch_report,
                file_name="nema_batch_compliance_report.md",
                mime="text/markdown"
            )
        
        with col2:
            # CSV download
            csv_data = results_df.to_csv(index=False)
            st.download_button(
                "⬇️ Download Results (CSV)",
                data=csv_data,
                file_name="nema_batch_results.csv",
                mime="text/csv"
            )

# --- Top Feedback & Contact Bar ---
col_feedback, col_contact, col_dev = st.columns([2,2,1])
with col_feedback:
    if st.button("💬 Feedback", key="top_feedback_btn"):
        st.session_state['show_feedback'] = True
with col_contact:
    if st.button("📞 Contact", key="top_contact_btn"):
        st.session_state['show_contact'] = True
with col_dev:
    pass  # Developer options already handled at top

# --- Feedback Modal ---
if st.session_state.get('show_feedback', False):
    st.markdown("<h4>💬 Feedback</h4>", unsafe_allow_html=True)
    st.markdown("Help us improve! Your feedback is anonymous.")
    feedback = st.text_area("Your feedback", max_chars=500, key="feedback_text")
    if st.button("Submit Feedback", key="submit_feedback"):
        if feedback.strip():
            with open("feedback.txt", "a") as f:
                f.write(feedback.strip() + "\n---\n")
            st.success("Thank you for your feedback!")
            st.session_state['show_feedback'] = False
        else:
            st.warning("Please enter some feedback before submitting.")
    if st.button("Close", key="close_feedback"):
        st.session_state['show_feedback'] = False

# --- Contact Modal ---
if st.session_state.get('show_contact', False):
    st.markdown("<h4>📞 Contact</h4>", unsafe_allow_html=True)
    st.markdown("<b>WhatsApp:</b> <a href='https://wa.me/256771594776' target='_blank'>+256 771 594776</a><br><b>Email:</b> <a href='mailto:kamandacollins00@gmail.com'>kamandacollins00@gmail.com</a>", unsafe_allow_html=True)
    if st.button("Close", key="close_contact"):
        st.session_state['show_contact'] = False

# Force HTTPS in production (simplified approach)
if os.getenv("RAILWAY_ENVIRONMENT") == "production":
    try:
        # Use a simpler approach for HTTPS enforcement
        import streamlit.web.server.server as server
        
        # Check if we're in production and should enforce HTTPS
        # This is a simplified check - Railway automatically handles HTTPS
        if os.getenv("FORCE_HTTPS", "false").lower() == "true":
            st.info("🔒 This application is secured with HTTPS encryption.")
    except Exception as e:
        # If there's any issue with HTTPS checking, just continue
        pass