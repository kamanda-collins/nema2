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
    except ImportError:
        st.warning("The `owslib` package is required for WFS services. Install it with `pip install owslib`.")
        return None
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
        if sdf is None or len(sdf) == 0:
            st.warning("ArcGIS layer returned no features.")
            return None
        # Prefer the SHAPE geometry column when present; otherwise fall back
        # to plain latitude/longitude attribute columns.
        if 'SHAPE' in sdf.columns:
            xs = sdf['SHAPE'].apply(lambda s: getattr(s, 'x', None))
            ys = sdf['SHAPE'].apply(lambda s: getattr(s, 'y', None))
            if xs.notna().all() and ys.notna().all():
                return gpd.GeoDataFrame(
                    sdf.drop(columns=['SHAPE']),
                    geometry=gpd.points_from_xy(xs, ys),
                    crs="EPSG:4326",
                )
        lat_cols = [c for c in sdf.columns if str(c).lower() in ('lat', 'latitude', 'y')]
        lon_cols = [c for c in sdf.columns if str(c).lower() in ('lon', 'long', 'longitude', 'x')]
        if lat_cols and lon_cols:
            return gpd.GeoDataFrame(
                sdf,
                geometry=gpd.points_from_xy(sdf[lon_cols[0]], sdf[lat_cols[0]]),
                crs="EPSG:4326",
            )
        st.warning("ArcGIS layer returned no usable geometry (no SHAPE or lat/lon columns found).")
        return None
    except ImportError:
        st.warning("The `arcgis` package is required for ArcGIS layers. Install it with `pip install arcgis`.")
        return None
    except Exception as e:
        st.warning(f"Could not load wetlands from ArcGIS: {e}")
        return None
