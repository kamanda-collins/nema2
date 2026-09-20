
export function exportFeaturesAsCSV(features: any[]): boolean {
  if (!features || features.length === 0) return false;
  const csvData = features.map(f => ({
    name: f.name || 'Unnamed',
    category: f.category || 'General',
    description: f.description || '',
    created_at: f.created_at || new Date().toISOString()
  }));

  const csvContent = [
    Object.keys(csvData[0]).join(','), // header
    ...csvData.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `features-export-${Date.now()}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);

  return true;
}
