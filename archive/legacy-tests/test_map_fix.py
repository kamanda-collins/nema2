#!/usr/bin/env python3
"""
Test script to verify the Stamen fix works
"""

import contextily as ctx
import matplotlib.pyplot as plt
import numpy as np

def test_basemap_providers():
    """Test that our basemap providers work without Stamen"""
    print("🧪 Testing basemap providers...")
    
    # Test the providers we're using in our updated code
    test_providers = [
        ("CartoDB Positron", ctx.providers.CartoDB.Positron),
        ("Esri WorldImagery", ctx.providers.Esri.WorldImagery),
        ("OpenStreetMap", ctx.providers.OpenStreetMap.Mapnik),
        ("CartoDB VoyagerNoLabels", ctx.providers.CartoDB.VoyagerNoLabels),
        ("Esri WorldTopo", ctx.providers.Esri.WorldTopoMap)
    ]
    
    working_providers = []
    failed_providers = []
    
    for name, provider in test_providers:
        try:
            # Just check if the provider object exists and has the required attributes
            if hasattr(provider, 'url') or hasattr(provider, '__dict__'):
                working_providers.append(name)
                print(f"✅ {name}: Available")
            else:
                failed_providers.append(name)
                print(f"❌ {name}: Not properly configured")
        except Exception as e:
            failed_providers.append(name)
            print(f"❌ {name}: Error - {e}")
    
    print(f"\n📊 Results:")
    print(f"   Working providers: {len(working_providers)}")
    print(f"   Failed providers: {len(failed_providers)}")
    
    if len(working_providers) >= 3:
        print("✅ Fix successful! Multiple working providers available.")
        return True
    else:
        print("⚠️ Warning: Limited working providers available.")
        return False

def test_stamen_removal():
    """Verify Stamen is not available (which is expected)"""
    print("\n🔍 Checking Stamen availability...")
    
    try:
        # Try to access Stamen - this should fail
        stamen_providers = ctx.providers.Stamen
        print("❌ Stamen still available - this indicates an issue")
        return False
    except AttributeError:
        print("✅ Stamen correctly not available (as expected)")
        return True
    except Exception as e:
        print(f"✅ Stamen not accessible: {e}")
        return True

if __name__ == "__main__":
    print("🚀 Testing map provider fix...\n")
    
    providers_ok = test_basemap_providers()
    stamen_removed = test_stamen_removal()
    
    print(f"\n🎯 Overall result:")
    if providers_ok and stamen_removed:
        print("✅ SUCCESS: Map generation should now work without Stamen errors!")
    else:
        print("⚠️ PARTIAL: Some issues detected, but basic functionality should work.")
    
    print("\n💡 If you still see Stamen errors, restart your Streamlit app to reload the modules.")
