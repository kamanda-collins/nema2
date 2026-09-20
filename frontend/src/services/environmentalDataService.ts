import { useLocation } from '@/contexts/LocationContext';

export interface RealTimeEnvironmentalData {
  airQuality: {
    aqi: number;
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
    so2: number;
    co: number;
    status: 'good' | 'moderate' | 'unhealthy' | 'hazardous';
  };
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    pressure: number;
  };
  waterQuality?: {
    ph: number;
    dissolvedOxygen: number;
    turbidity: number;
    temperature: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
  };
  vegetation: {
    ndvi: number;
    coverage: number;
    health: 'healthy' | 'stressed' | 'declining';
  };
}

class EnvironmentalDataService {
  private readonly OPENWEATHER_API_KEY = 'demo'; // User should replace with real key
  private readonly AIR_QUALITY_API_BASE = 'https://api.openweathermap.org/data/2.5';
  private readonly OPENAQ_BASE = 'https://api.openaq.org/v2/latest';
  private readonly OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

  async getEnvironmentalData(lat: number, lng: number): Promise<RealTimeEnvironmentalData> {
    try {
      // Try fetching live from open APIs FIRST, fallback to OpenWeatherMap and finally mocked
      const [weatherData, airQualityData] = await Promise.all([
        this.fetchWeatherHybrid(lat, lng),
        this.fetchAirQualityHybrid(lat, lng)
      ]);

      return {
        airQuality: airQualityData,
        weather: weatherData,
        waterQuality: this.generateWaterQualityData(),
        vegetation: this.generateVegetationData(lat, lng)
      };
    } catch (error) {
      console.error('Error fetching environmental data:', error);
      return this.getFallbackData();
    }
  }

  // HYBRID: Try Open-Meteo, fallback to OpenWeatherMap/mocked
  private async fetchWeatherHybrid(lat: number, lng: number) {
    // Try Open-Meteo
    try {
      const response = await fetch(
        `${this.OPEN_METEO_BASE}?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,pressure_msl`
      );
      if (response.ok) {
        const weather = await response.json();
        if (weather?.current) {
          return {
            temperature: Math.round(weather.current.temperature_2m ?? 20),
            humidity: Math.round(weather.current.relative_humidity_2m ?? 65),
            windSpeed: Math.round(weather.current.wind_speed_10m ?? 3),
            windDirection: this.getWindDirection(weather.current.wind_direction_10m ?? 180),
            pressure: Math.round(weather.current.pressure_msl ?? 1013)
          };
        }
      }
      throw new Error('Open-Meteo unavailable');
    } catch (err) {
      // Fallback to original
      return this.fetchWeatherData(lat, lng);
    }
  }

  // HYBRID: Try OpenAQ, fallback to OpenWeatherMap air or mocked
  private async fetchAirQualityHybrid(lat: number, lng: number) {
    // Try OpenAQ
    try {
      // Find nearest city to (lat, lng) in OpenAQ
      const response = await fetch(
        `${this.OPENAQ_BASE}?coordinates=${lat},${lng}&radius=10000&order_by=distance&limit=1`
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.results?.length) {
          const aq = data.results[0];
          // OpenAQ offers pm25, pm10, o3, no2, so2, co
          const comp: Record<string, number> = {};
          aq.measurements.forEach((m: any) => {
            if (['pm25', 'pm10', 'o3', 'no2', 'so2', 'co'].includes(m.parameter)) {
              comp[m.parameter] = typeof m.value === 'number' ? m.value : parseFloat(m.value);
            }
          });
          // Estimate AQI: use pm25 if present (US EPA approximation)
          // If not, fallback to pm10, otherwise fallback to 100 (moderate)
          let aqi = 100;
          if (comp['pm25']) {
            // Simple formula for PM2.5 to AQI
            const pm25 = comp['pm25'];
            if (pm25 <= 12) aqi = Math.round(pm25 * 4);
            else if (pm25 <= 35.4) aqi = Math.round((pm25 - 12.1) * 2.1 + 50);
            else if (pm25 <= 55.4) aqi = Math.round((pm25 - 35.5) * 2 + 100);
            else if (pm25 <= 150.4) aqi = Math.round((pm25 - 55.5) * 0.5 + 150);
            else aqi = 200;
          } else if (comp['pm10']) {
            // PM10 convert: approx
            const pm10 = comp['pm10'];
            if (pm10 <= 54) aqi = Math.round(pm10 * 2);
            else if (pm10 <= 154) aqi = Math.round((pm10 - 54) + 100);
            else aqi = 200;
          }
          // Take status from calculated
          const status = this.getAQIStatus(aqi);
          return {
            aqi,
            pm25: Math.round(comp['pm25'] ?? 25),
            pm10: Math.round(comp['pm10'] ?? 45),
            o3: Math.round(comp['o3'] ?? 80),
            no2: Math.round(comp['no2'] ?? 40),
            so2: Math.round(comp['so2'] ?? 20),
            co: Math.round(comp['co'] ?? 1.2),
            status
          };
        }
      }
      throw new Error('OpenAQ unavailable');
    } catch (err) {
      // Fallback to original
      return this.fetchAirQualityData(lat, lng);
    }
  }

  private async fetchWeatherData(lat: number, lng: number) {
    try {
      const response = await fetch(
        `${this.AIR_QUALITY_API_BASE}/weather?lat=${lat}&lon=${lng}&appid=${this.OPENWEATHER_API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Weather API failed');
      }

      const data = await response.json();
      
      return {
        temperature: Math.round(data.main?.temp || 20),
        humidity: data.main?.humidity || 65,
        windSpeed: Math.round((data.wind?.speed || 3) * 3.6), // Convert m/s to km/h
        windDirection: this.getWindDirection(data.wind?.deg || 180),
        pressure: data.main?.pressure || 1013
      };
    } catch (error) {
      console.log('Using fallback weather data');
      return {
        temperature: 24,
        humidity: 68,
        windSpeed: 12,
        windDirection: 'SW',
        pressure: 1013
      };
    }
  }

  private async fetchAirQualityData(lat: number, lng: number) {
    try {
      const response = await fetch(
        `${this.AIR_QUALITY_API_BASE}/air_pollution?lat=${lat}&lon=${lng}&appid=${this.OPENWEATHER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Air quality API failed');
      }

      const data = await response.json();
      const pollution = data.list?.[0];
      
      if (pollution) {
        const aqi = pollution.main.aqi;
        const components = pollution.components;
        
        return {
          aqi: this.convertAQIToUS(aqi),
          pm25: Math.round(components.pm2_5 || 25),
          pm10: Math.round(components.pm10 || 45),
          o3: Math.round(components.o3 || 80),
          no2: Math.round(components.no2 || 40),
          so2: Math.round(components.so2 || 20),
          co: Math.round((components.co || 1000) / 1000), // Convert to mg/m³
          status: this.getAQIStatus(this.convertAQIToUS(aqi))
        };
      }
      
      throw new Error('No air quality data');
    } catch (error) {
      console.log('Using fallback air quality data');
      return {
        aqi: 85,
        pm25: 85,
        pm10: 108,
        o3: 102,
        no2: 45,
        so2: 23,
        co: 1.2,
        status: 'moderate' as const
      };
    }
  }

  private convertAQIToUS(europeanAQI: number): number {
    // Convert European AQI (1-5) to US AQI (0-500)
    const mapping = { 1: 25, 2: 75, 3: 125, 4: 175, 5: 250 };
    return mapping[europeanAQI as keyof typeof mapping] || 100;
  }

  private getAQIStatus(aqi: number): 'good' | 'moderate' | 'unhealthy' | 'hazardous' {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 200) return 'unhealthy';
    return 'hazardous';
  }

  private getWindDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  private generateWaterQualityData() {
    // This would typically come from water monitoring APIs
    return {
      ph: 7.2 + (Math.random() - 0.5) * 0.8,
      dissolvedOxygen: 8.5 + (Math.random() - 0.5) * 2,
      turbidity: 5 + Math.random() * 10,
      temperature: 18 + Math.random() * 8,
      status: 'good' as const
    };
  }

  private generateVegetationData(lat: number, lng: number) {
    // This would typically come from satellite imagery APIs like Sentinel or Landsat
    // For now, we'll generate realistic data based on latitude
    const baseNDVI = Math.abs(lat) > 60 ? 0.3 : 0.7; // Lower NDVI in polar regions
    const ndvi = baseNDVI + (Math.random() - 0.5) * 0.2;
    
    let health: 'healthy' | 'stressed' | 'declining';
    if (ndvi > 0.6) {
      health = 'healthy';
    } else if (ndvi > 0.4) {
      health = 'stressed';
    } else {
      health = 'declining';
    }
    
    return {
      ndvi: Math.max(0, Math.min(1, ndvi)),
      coverage: Math.round((ndvi * 100)),
      health
    };
  }

  private getFallbackData(): RealTimeEnvironmentalData {
    return {
      airQuality: {
        aqi: 142,
        pm25: 85,
        pm10: 108,
        o3: 102,
        no2: 45,
        so2: 23,
        co: 1.2,
        status: 'moderate'
      },
      weather: {
        temperature: 24.5,
        humidity: 68,
        windSpeed: 12,
        windDirection: 'SW',
        pressure: 1013
      },
      waterQuality: {
        ph: 7.2,
        dissolvedOxygen: 8.5,
        turbidity: 7.2,
        temperature: 22.1,
        status: 'good'
      },
      vegetation: {
        ndvi: 0.74,
        coverage: 74,
        health: 'healthy'
      }
    };
  }
}

export const environmentalDataService = new EnvironmentalDataService();
