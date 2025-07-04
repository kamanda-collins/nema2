import geopandas as gpd
import streamlit as st

def load_wetlands_from_file(path):
    try:
        # If it's a zip, extract and find the .shp
        if path.lower().endswith('.zip'):
            import tempfile, zipfile, os
            with tempfile.TemporaryDirectory() as temp_dir:
                with zipfile.ZipFile(path, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)
                shp_files = [f for f in os.listdir(temp_dir) if f.endswith('.shp')]
                if not shp_files:
                    st.warning("No .shp file found in the ZIP archive.")
                    return None
                shp_path = os.path.join(temp_dir, shp_files[0])
                gdf = gpd.read_file(shp_path)
        else:
            gdf = gpd.read_file(path)
        if gdf is not None and not gdf.empty:
            return gdf
        else:
            st.warning("Wetlands file is empty or invalid.")
            return None
    except Exception as e:
        st.warning(f"Could not load wetlands file: {e}")
        return None

# Optional: OGC WFS/WMS support
# Requires: pip install owslib

def load_wetlands_from_wfs(wfs_url, layer_name):
    try:
        from owslib.wfs import WebFeatureService
        import io
        wfs = WebFeatureService(url=wfs_url, version='1.1.0')
        response = wfs.getfeature(typename=layer_name, outputFormat='json')
        gdf = gpd.read_file(io.BytesIO(response.read()))
        return gdf
    except Exception as e:
        st.warning(f"Could not load wetlands from WFS: {e}")
        return None

# Optional: ArcGIS REST API support
# Requires: pip install arcgis

def load_wetlands_from_arcgis(feature_layer_url):
    try:
        from arcgis.features import FeatureLayer
        fl = FeatureLayer(feature_layer_url)
        sdf = fl.query(as_df=True, out_sr=4326)
        gdf = gpd.GeoDataFrame(sdf, geometry=gpd.points_from_xy(sdf['SHAPE'].x, sdf['SHAPE'].y), crs="EPSG:4326")
        return gdf
    except Exception as e:
        st.warning(f"Could not load wetlands from ArcGIS: {e}")
        return None
