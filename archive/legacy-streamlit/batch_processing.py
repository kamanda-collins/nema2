"""
batch_processing.py

Batch processing functionality for checking multiple sites against NEMA wetland compliance.
Allows users to upload a CSV with multiple coordinates and generates a comprehensive report.
Optimized for Railway's memory constraints.

Dependencies: pandas, geopandas, streamlit
"""

import pandas as pd
import geopandas as gpd
import streamlit as st
from shapely.geometry import Point
from report_logic import check_compliance, calculate_min_distance
import tempfile
import zipfile
import os
import gc  # Garbage collection for memory management
from memory_monitor import get_memory_info, show_memory_status, optimize_memory, memory_safe_batch_size


def process_batch_sites(sites_df, wetlands_gdf, max_batch_size=None):
    """
    Process multiple sites for wetland compliance checking with intelligent memory optimization.
    
    Args:
        sites_df (DataFrame): DataFrame with columns 'latitude', 'longitude', and optionally 'name', 'id'
        wetlands_gdf (GeoDataFrame): Wetlands data for compliance checking
        max_batch_size (int): Maximum number of sites to process at once (auto-calculated if None)
    
    Returns:
        DataFrame: Results with compliance status for each site
    """
    results = []
    total_sites = len(sites_df)
    
    # Show initial memory status
    st.write("🔍 **Memory Status Before Processing:**")
    initial_memory = show_memory_status()
    
    # Calculate safe batch size based on available memory
    if max_batch_size is None:
        safe_batch_size = memory_safe_batch_size(total_sites)
        st.info(f"📊 **Auto-calculated batch size**: {safe_batch_size} sites per batch (based on available memory)")
    else:
        safe_batch_size = max_batch_size
    
    # Further reduce batch size for Railway's limited memory
    effective_batch_size = min(safe_batch_size, 15) if total_sites > 30 else safe_batch_size
    
    st.write(f"⚙️ **Processing {total_sites} sites in batches of {effective_batch_size}**")
    
    # Process in smaller batches to manage memory
    for batch_start in range(0, total_sites, effective_batch_size):
        batch_end = min(batch_start + effective_batch_size, total_sites)
        batch_sites = sites_df.iloc[batch_start:batch_end].copy()
        
        # Monitor memory between batches
        if batch_start > 0:
            freed_mb = optimize_memory()
            if freed_mb and freed_mb > 0:
                st.write(f"🧹 Freed {freed_mb:.1f}MB memory")
        
        # Create geometries from coordinates for this batch
        geometries = [Point(lon, lat) for lon, lat in zip(batch_sites['longitude'], batch_sites['latitude'])]
        sites_gdf = gpd.GeoDataFrame(batch_sites, geometry=geometries, crs="EPSG:4326")
        
        # Process each site in the batch
        for idx, site_row in sites_gdf.iterrows():
            original_idx = batch_start + (idx - batch_sites.index[0])
            site_name = site_row.get('name', f'Site {original_idx + 1}')
            site_id = site_row.get('id', original_idx + 1)
            
            # Create single-site GeoDataFrame
            single_site = gpd.GeoDataFrame([site_row], crs=sites_gdf.crs)
            
            try:
                # Check compliance
                in_wetland, wetland_names = check_compliance(single_site, wetlands_gdf)
                
                # Calculate distance if not in wetland (limit to reasonable distance for memory)
                min_distance = None
                if not in_wetland:
                    min_distance = calculate_min_distance(single_site, wetlands_gdf)
                    # Cap distance calculation to save memory and processing time
                    if min_distance and min_distance > 5000:  # Reduced from 10km to 5km
                        min_distance = 5000
                
                # Compile results
                result = {
                    'site_id': site_id,
                    'site_name': site_name,
                    'latitude': site_row['latitude'],
                    'longitude': site_row['longitude'],
                    'in_wetland': in_wetland,
                    'compliance_status': 'REQUIRES NEMA APPROVAL' if in_wetland else 'COMPLIANT',
                    'wetland_names': ', '.join(wetland_names[:3]) if wetland_names else 'None',  # Limit to 3 names
                    'distance_to_wetland_m': round(min_distance, 2) if min_distance is not None else 'N/A',
                    'risk_level': get_risk_level(in_wetland, min_distance)
                }
                
            except Exception as e:
                result = {
                    'site_id': site_id,
                    'site_name': site_name,
                    'latitude': site_row['latitude'],
                    'longitude': site_row['longitude'],
                    'in_wetland': False,
                    'compliance_status': f'ERROR: {str(e)[:50]}...',  # Truncate error message
                    'wetland_names': 'Error',
                    'distance_to_wetland_m': 'Error',
                    'risk_level': 'Unknown'
                }
            
            results.append(result)
        
        # Clear batch data to free memory aggressively
        del sites_gdf, geometries, batch_sites
        
        # Force garbage collection and show memory impact
        freed_mb = optimize_memory()
        
        # Show progress with memory info for large batches
        progress = (batch_end / total_sites) * 100
        st.write(f"Progress: {progress:.1f}% ({batch_end}/{total_sites} sites)")
        
        # Show memory status every few batches
        if batch_start > 0 and (batch_start // effective_batch_size) % 3 == 0:
            st.write("📊 **Current Memory Status:**")
            show_memory_status()
    
    # Final memory cleanup and status
    optimize_memory()
    st.write("✅ **Processing Complete - Final Memory Status:**")
    final_memory = show_memory_status()
    
    if initial_memory and final_memory:
        memory_delta = final_memory['rss_mb'] - initial_memory['rss_mb']
        if memory_delta > 0:
            st.warning(f"⚠️ Memory increased by {memory_delta:.1f}MB during processing")
        else:
            st.success(f"✅ Memory optimized: {abs(memory_delta):.1f}MB freed")
    
    return pd.DataFrame(results)


def get_risk_level(in_wetland, min_distance):
    """Determine risk level based on wetland proximity."""
    if in_wetland:
        return 'HIGH - In Wetland'
    elif min_distance is None:
        return 'Unknown'
    elif min_distance < 100:
        return 'HIGH - Very Close'
    elif min_distance < 500:
        return 'MEDIUM - Close'
    elif min_distance < 1000:
        return 'LOW - Moderate Distance'
    else:
        return 'VERY LOW - Far'


def generate_batch_report(results_df):
    """Generate a summary report for batch processing results."""
    total_sites = len(results_df)
    sites_in_wetland = len(results_df[results_df['in_wetland'] == True])
    sites_compliant = len(results_df[results_df['compliance_status'] == 'COMPLIANT'])
    
    report = f"""# Batch NEMA Wetland Compliance Report

## Summary
- **Total Sites Processed**: {total_sites}
- **Sites in Wetlands**: {sites_in_wetland}
- **Compliant Sites**: {sites_compliant}
- **Sites Requiring NEMA Approval**: {sites_in_wetland}

## Risk Distribution
"""
    
    # Add risk level distribution
    risk_counts = results_df['risk_level'].value_counts()
    for risk, count in risk_counts.items():
        report += f"- **{risk}**: {count} sites\n"
    
    report += "\n## Detailed Results\n\n"
    
    # Add detailed table
    for _, row in results_df.iterrows():
        status_emoji = "🚨" if row['in_wetland'] else "✅"
        report += f"### {status_emoji} {row['site_name']} (ID: {row['site_id']})\n"
        report += f"- **Coordinates**: {row['latitude']:.6f}, {row['longitude']:.6f}\n"
        report += f"- **Status**: {row['compliance_status']}\n"
        report += f"- **Risk Level**: {row['risk_level']}\n"
        if row['wetland_names'] != 'None':
            report += f"- **Wetlands**: {row['wetland_names']}\n"
        if row['distance_to_wetland_m'] != 'N/A':
            report += f"- **Distance to Wetland**: {row['distance_to_wetland_m']} meters\n"
        report += "\n"
    
    report += """
---
*This is an automated batch compliance report. For official compliance certification, consult NEMA Uganda directly.*
"""
    
    return report


def show_batch_processing_ui():
    """Display the batch processing interface in Streamlit with aggressive memory management for Railway."""
    st.subheader("🔄 Batch Site Processing")
    st.caption("Upload a CSV file with multiple site coordinates to check all sites at once.")
    
    # Updated memory warning for Railway
    st.error("🚨 **Railway Memory Limits**: Please limit batch processing to **50 sites or fewer**. Railway's free tier has strict memory limits that will cause crashes with larger datasets.")
    
    # Show current memory optimization features
    st.info("✅ **Memory Optimizations Active**: Reduced batch sizes, aggressive garbage collection, distance capping, and progress monitoring.")
    
    # File upload
    uploaded_csv = st.file_uploader(
        "Upload CSV with multiple sites",
        type=["csv"],
        help="CSV should have columns: latitude, longitude, and optionally: name, id"
    )
    
    if uploaded_csv is not None:
        try:
            # Read the CSV
            sites_df = pd.read_csv(uploaded_csv)
            
            # More aggressive size limits for Railway
            if len(sites_df) > 100:
                st.error(f"❌ File too large: {len(sites_df)} sites. **Railway limit: 50 sites maximum** to prevent out-of-memory crashes.")
                return None
            elif len(sites_df) > 50:
                st.warning(f"⚠️ Large dataset: {len(sites_df)} sites. **High risk of memory crash on Railway**. Consider splitting into smaller files.")
            elif len(sites_df) > 30:
                st.warning(f"⚠️ Medium dataset: {len(sites_df)} sites. Processing will use aggressive memory optimization.")
            
            # Validate required columns
            required_cols = ['latitude', 'longitude']
            missing_cols = [col for col in required_cols if col not in sites_df.columns]
            
            if missing_cols:
                st.error(f"Missing required columns: {', '.join(missing_cols)}")
                st.info("Your CSV must have columns: latitude, longitude")
                st.info("Optional columns: name, id")
                return None
            
            # Add default names/IDs if missing
            if 'name' not in sites_df.columns:
                sites_df['name'] = [f'Site {i+1}' for i in range(len(sites_df))]
            if 'id' not in sites_df.columns:
                sites_df['id'] = range(1, len(sites_df) + 1)
            
            st.success(f"✅ Loaded {len(sites_df)} sites from CSV")
            
            # Show memory usage estimate (more conservative for Railway)
            estimated_memory = len(sites_df) * 0.8  # More conservative estimate for Railway
            st.info(f"📊 Estimated memory usage: ~{estimated_memory:.1f}MB (Railway limit: ~512MB)")
            
            if estimated_memory > 200:
                st.error("� **Memory usage too high for Railway**. Please reduce the number of sites.")
                return None
            
            # Show preview
            with st.expander("📊 Preview Sites"):
                st.dataframe(sites_df.head(10))
                if len(sites_df) > 10:
                    st.info(f"Showing first 10 of {len(sites_df)} sites")
            
            return sites_df
            
        except Exception as e:
            st.error(f"Error reading CSV: {e}")
            return None
    
    return None
