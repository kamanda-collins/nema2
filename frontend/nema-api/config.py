from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """API Configuration Settings"""
    
    # API Settings
    API_TITLE: str = "NEMA Compliance API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "RESTful API for NEMA environmental compliance checking"
    
    # CORS Settings  
    ALLOWED_ORIGINS: str = "*"  # Allow all origins for development
    
    # Feature Flags - Allow selective feature extraction
    ENABLE_COMPLIANCE_CHECK: bool = True
    ENABLE_DISTANCE_CALCULATION: bool = True
    ENABLE_REPORT_GENERATION: bool = True
    ENABLE_BATCH_PROCESSING: bool = True
    ENABLE_WETLANDS_SEARCH: bool = True
    ENABLE_MAP_VISUALIZATION: bool = True
    
    # File Upload Settings
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = [".shp", ".geojson", ".kml", ".gpkg"]
    UPLOAD_DIR: str = "./uploads"
    
    # Processing Settings
    DEFAULT_CRS: str = "EPSG:4326"  # WGS84
    UTM_CRS: str = "EPSG:32636"  # UTM Zone 36N for Uganda
    MAX_BATCH_SIZE: int = 100
    
    # Wetlands Data Path (from NEMA2)
    WETLANDS_DATA_PATH: str = "C:/Users/School/work/nema2/wetland_shp/gis_osm_water_a_free_1.shp"
    
    # Report Template Path
    REPORT_TEMPLATE_PATH: str = "C:/Users/School/work/nema2/report_template.md.j2"
    
    # Cache Settings
    ENABLE_CACHE: bool = True
    CACHE_TTL: int = 3600  # 1 hour
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
