"""
Memory monitoring utility for Railway deployment
"""

import psutil
import os
import streamlit as st
import gc


def get_memory_info():
    """Get detailed memory information."""
    try:
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        
        return {
            'rss_mb': memory_info.rss / 1024 / 1024,  # Resident Set Size
            'vms_mb': memory_info.vms / 1024 / 1024,  # Virtual Memory Size
            'percent': process.memory_percent(),
            'available_mb': psutil.virtual_memory().available / 1024 / 1024,
            'total_mb': psutil.virtual_memory().total / 1024 / 1024
        }
    except ImportError:
        # psutil not available
        return None


def show_memory_status():
    """Display current memory status in Streamlit."""
    memory_info = get_memory_info()
    
    if memory_info:
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric(
                label="Memory Used", 
                value=f"{memory_info['rss_mb']:.1f} MB",
                delta=f"{memory_info['percent']:.1f}%"
            )
        
        with col2:
            st.metric(
                label="Available", 
                value=f"{memory_info['available_mb']:.1f} MB"
            )
        
        with col3:
            railway_limit = 1024  # 1GB Railway limit
            usage_percent = (memory_info['rss_mb'] / railway_limit) * 100
            st.metric(
                label="Railway Usage", 
                value=f"{usage_percent:.1f}%",
                delta="1GB Limit"
            )
        
        # Warning if approaching limits
        if usage_percent > 80:
            st.error(f"🚨 **Memory Critical**: {usage_percent:.1f}% of Railway limit used!")
        elif usage_percent > 60:
            st.warning(f"⚠️ **Memory High**: {usage_percent:.1f}% of Railway limit used")
        elif usage_percent > 40:
            st.info(f"📊 Memory usage: {usage_percent:.1f}% of Railway limit")
        
        return memory_info
    else:
        st.info("Memory monitoring not available (psutil not installed)")
        return None


def optimize_memory():
    """Force garbage collection and return memory freed."""
    before = get_memory_info()
    if before is None:
        return None
    
    before_mb = before['rss_mb']
    
    # Force garbage collection
    gc.collect()
    
    after = get_memory_info()
    after_mb = after['rss_mb']
    
    freed_mb = before_mb - after_mb
    return freed_mb


def memory_safe_batch_size(total_sites, base_memory_mb=None):
    """Calculate safe batch size based on available memory."""
    memory_info = get_memory_info()
    
    if memory_info is None:
        # Conservative fallback
        if total_sites > 100:
            return 10
        elif total_sites > 50:
            return 15
        else:
            return 20
    
    # Railway has 1GB limit, be very conservative
    railway_limit = 1024
    current_usage = memory_info['rss_mb']
    available = railway_limit - current_usage
    
    # Reserve 200MB for safety margin
    usable = available - 200
    
    if usable < 100:
        return 5  # Very small batches
    elif usable < 200:
        return 10
    elif usable < 400:
        return 15
    else:
        return 20  # Maximum safe batch size
