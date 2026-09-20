
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Zap, Target, Search, Download, Eye } from 'lucide-react';

interface SpectralAnalysisProps {
  dataset: string;
}

export const SpectralAnalysis: React.FC<SpectralAnalysisProps> = ({ dataset }) => {
  const [selectedSpectrum, setSelectedSpectrum] = useState('full');
  const [analysisMode, setAnalysisMode] = useState('mineral');
  const [selectedMineral, setSelectedMineral] = useState('quartz');

  // Mock spectral data for mineral identification
  const spectralData = [
    { wavelength: 400, reflectance: 0.05, quartz: 0.12, feldspar: 0.08, calcite: 0.15, iron_oxide: 0.03 },
    { wavelength: 450, reflectance: 0.08, quartz: 0.15, feldspar: 0.12, calcite: 0.18, iron_oxide: 0.04 },
    { wavelength: 500, reflectance: 0.12, quartz: 0.18, feldspar: 0.15, calcite: 0.22, iron_oxide: 0.06 },
    { wavelength: 550, reflectance: 0.18, quartz: 0.22, feldspar: 0.18, calcite: 0.25, iron_oxide: 0.08 },
    { wavelength: 600, reflectance: 0.25, quartz: 0.28, feldspar: 0.22, calcite: 0.30, iron_oxide: 0.12 },
    { wavelength: 650, reflectance: 0.32, quartz: 0.35, feldspar: 0.28, calcite: 0.35, iron_oxide: 0.18 },
    { wavelength: 700, reflectance: 0.38, quartz: 0.42, feldspar: 0.35, calcite: 0.40, iron_oxide: 0.25 },
    { wavelength: 750, reflectance: 0.42, quartz: 0.45, feldspar: 0.38, calcite: 0.42, iron_oxide: 0.30 },
    { wavelength: 800, reflectance: 0.45, quartz: 0.48, feldspar: 0.42, calcite: 0.45, iron_oxide: 0.35 },
    { wavelength: 850, reflectance: 0.48, quartz: 0.50, feldspar: 0.45, calcite: 0.48, iron_oxide: 0.38 },
    { wavelength: 900, reflectance: 0.50, quartz: 0.52, feldspar: 0.48, calcite: 0.50, iron_oxide: 0.40 }
  ];

  const mineralConfidence = [
    { mineral: 'Quartz', confidence: 87, probability: 0.87, absorption: '1400nm, 1900nm' },
    { mineral: 'Feldspar', confidence: 72, probability: 0.72, absorption: '1400nm, 2200nm' },
    { mineral: 'Calcite', confidence: 65, probability: 0.65, absorption: '2300nm, 2500nm' },
    { mineral: 'Iron Oxide', confidence: 58, probability: 0.58, absorption: '900nm, 1200nm' },
    { mineral: 'Clay Minerals', confidence: 45, probability: 0.45, absorption: '1400nm, 2200nm' },
    { mineral: 'Chlorite', confidence: 38, probability: 0.38, absorption: '2300nm, 2400nm' }
  ];

  const spectralIndices = [
    { name: 'Iron Oxide Index', value: 1.24, description: 'Indicates iron-bearing minerals' },
    { name: 'Clay Index', value: 0.87, description: 'Clay mineral abundance' },
    { name: 'Carbonate Index', value: 1.15, description: 'Carbonate mineral presence' },
    { name: 'Vegetation Index', value: 0.65, description: 'Vegetation coverage' }
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Spectral Analysis & Mineral Identification</h3>
          <p className="text-gray-600">Advanced hyperspectral analysis for geological exploration</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedSpectrum} onValueChange={setSelectedSpectrum}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Spectrum Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full Spectrum</SelectItem>
              <SelectItem value="vnir">VNIR (400-1000nm)</SelectItem>
              <SelectItem value="swir">SWIR (1000-2500nm)</SelectItem>
              <SelectItem value="thermal">Thermal (8000-14000nm)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={analysisMode} onValueChange={setAnalysisMode}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Analysis Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mineral">Mineral ID</SelectItem>
              <SelectItem value="vegetation">Vegetation</SelectItem>
              <SelectItem value="water">Water Quality</SelectItem>
              <SelectItem value="soil">Soil Analysis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Spectral Signature Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Spectral Signatures</h3>
          <div className="flex gap-2">
            <Badge variant="outline">
              <Zap className="h-3 w-3 mr-1" />
              Live Analysis
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Spectrum
            </Button>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={spectralData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="wavelength" label={{ value: 'Wavelength (nm)', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Reflectance', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="reflectance" stroke="#3b82f6" strokeWidth={3} name="Sample Spectrum" />
            <Line type="monotone" dataKey="quartz" stroke="#10B981" strokeWidth={2} name="Quartz Reference" strokeDasharray="5 5" />
            <Line type="monotone" dataKey="feldspar" stroke="#F59E0B" strokeWidth={2} name="Feldspar Reference" strokeDasharray="5 5" />
            <Line type="monotone" dataKey="calcite" stroke="#EF4444" strokeWidth={2} name="Calcite Reference" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Mineral Identification Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Mineral Identification Results</h3>
          <div className="space-y-4">
            {mineralConfidence.map((mineral, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{mineral.mineral}</span>
                    <Badge variant={mineral.confidence > 70 ? 'default' : 'secondary'}>
                      {mineral.confidence}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">Key absorptions: {mineral.absorption}</p>
                </div>
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${mineral.confidence}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Spectral Indices</h3>
          <div className="space-y-4">
            {spectralIndices.map((index, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{index.name}</span>
                  <span className="text-lg font-bold text-blue-600">{index.value}</span>
                </div>
                <p className="text-sm text-gray-600">{index.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Absorption Features */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Key Absorption Features</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={spectralData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="wavelength" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="reflectance"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">1400nm Band</h4>
            <p className="text-sm text-blue-700">OH- absorption (clay, hydroxides)</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900">2200nm Band</h4>
            <p className="text-sm text-green-700">Al-OH absorption (clays, micas)</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <h4 className="font-medium text-red-900">2300nm Band</h4>
            <p className="text-sm text-red-700">CO3 absorption (carbonates)</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
