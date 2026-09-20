
export function exportShapeAsGeoJSON(currentShape: any): boolean {
  if (!currentShape) return false;
  const geoJsonData = JSON.stringify(currentShape, null, 2);
  const blob = new Blob([geoJsonData], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `shape-export-${Date.now()}.geojson`;
  link.click();
  window.URL.revokeObjectURL(url);

  return true;
}
