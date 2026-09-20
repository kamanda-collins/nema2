"""
spatial_db.py

PostGIS Spatial Storage & Search (plan Phase 2.2):
- Managed via SQLAlchemy + GeoAlchemy2
- Stores gazetted wetlands with GIST indexing
- High-performance proximity queries (ST_DWithin, ST_Distance)
"""

import os
from typing import List, Optional, Tuple

from sqlalchemy import Column, Float, Integer, String, create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Optional: GeoAlchemy2 is only needed when PostGIS is enabled
try:
    from geoalchemy2 import Geometry
    HAS_GEOALCHEMY2 = True
except ImportError:
    Geometry = None
    HAS_GEOALCHEMY2 = False

from shapely.geometry import Point, shape

# Database connection URL from environment or fallback
# Format: postgresql://user:password@host:port/dbname
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/nema_spatial")

Base = declarative_base()

class GazettedWetland(Base):
    """Spatially indexed table for official wetland records."""
    __tablename__ = "gazetted_wetlands"

    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    feature_kind = Column(String(50))  # e.g., 'wetland', 'river', 'lake'
    country = Column(String(50))
    source = Column(String(100))
    
    # GIST indexed geometry column in WGS84 (EPSG:4326)
    if HAS_GEOALCHEMY2:
        geom = Column(Geometry("GEOMETRY", srid=4326))
    else:
        geom = None

# Global engine and session factory
engine = None
SessionLocal = None

def get_db():
    """Dependency for FastAPI or other services to get a DB session."""
    global SessionLocal
    if SessionLocal is None:
        init_spatial_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_spatial_db():
    """Connect to Postgres and create tables/indexes."""
    global engine, SessionLocal
    if os.getenv("DISABLE_POSTGIS"):
        return False
    try:
        # Add connect_timeout to fail fast if PostGIS is not available
        engine = create_engine(
            DATABASE_URL,
            connect_args={"connect_timeout": 1}
        )
        Base.metadata.create_all(engine)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        return True
    except Exception as e:
        print(f"PostGIS Connection Failed: {e}")
        return False

def load_postgis_as_gdf(lat: float, lon: float, radius_m: float) -> Optional[object]:
    """
    Query gazetted wetlands from PostGIS and return as a GeoDataFrame.
    Returns None if PostGIS is not reachable or not configured.
    """
    if os.getenv("DISABLE_POSTGIS"):
        return None
    if not HAS_GEOALCHEMY2:
        return None
    
    if engine is None and not init_spatial_db():
        return None

    # Quick connection check - if we can't connect, return None immediately
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        if not inspector.has_table("gazetted_wetlands"):
            return None
    except Exception:
        return None

    import geopandas as gpd
    
    query = """
        SELECT name, feature_kind, country, source, geom as geometry
        FROM gazetted_wetlands
        WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_Point(:lon, :lat), 4326)::geography, :radius)
    """
    try:
        gdf = gpd.read_postgis(
            text(query),
            engine,
            geom_col="geometry",
            crs="EPSG:4326",
            params={"lat": lat, "lon": lon, "radius": radius_m}
        )
        return gdf
    except Exception as e:
        print(f"PostGIS query failed: {e}")
        return None

def query_proximity_postgis(lat: float, lon: float, radius_m: float) -> List[dict]:
    """
    Execute high-performance proximity query using PostGIS ST_DWithin.
    Returns list of features within radius.
    """
    if engine is None and not init_spatial_db():
        return []

    # PostGIS ST_DWithin handles geodesic distance if cast to geography
    query = text("""
        SELECT name, feature_kind, source, 
               ST_Distance(geom::geography, ST_SetSRID(ST_Point(:lon, :lat), 4326)::geography) as dist_m
        FROM gazetted_wetlands
        WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_Point(:lon, :lat), 4326)::geography, :radius)
        ORDER BY dist_m ASC
    """)
    
    results = []
    try:
        with engine.connect() as conn:
            rs = conn.execute(query, {"lat": lat, "lon": lon, "radius": radius_m})
            for row in rs:
                results.append({
                    "name": row[0],
                    "feature_kind": row[1],
                    "source": row[2],
                    "distance_m": row[3]
                })
    except Exception as e:
        print(f"PostGIS Query Error: {e}")
    
    return results
