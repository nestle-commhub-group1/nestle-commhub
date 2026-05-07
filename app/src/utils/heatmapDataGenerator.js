// Generate heatmap data points from retailers and their issues
export const generateHeatmapData = (retailerData) => {
  if (!retailerData || retailerData.length === 0) return [];

  // Generate heatmap points
  const heatmapData = [];

  retailerData.forEach(retailer => {
    if (retailer.latitude == null || retailer.longitude == null) return;

    const lat = retailer.latitude;
    const lng = retailer.longitude;
    const issueCount = retailer.openTickets || 0;
    const rejectionRate = retailer.rejectionRate || 0;
    
    // Calculate intensity (0-1 scale)
    // Boosted multipliers to make issue severities visible
    let intensity = 0.1 + Math.min((rejectionRate / 10) + (issueCount * 0.4), 0.9);
    
    if (intensity > 0) {
      // Center point
      heatmapData.push([lat, lng, intensity]);
      
      // Add slightly offset points to create a "bloom" effect for the density
      // This helps with the contour look when points are sparse
      const bloomPoints = [
        [lat + 0.02, lng, intensity * 0.6],
        [lat - 0.02, lng, intensity * 0.6],
        [lat, lng + 0.02, intensity * 0.6],
        [lat, lng - 0.02, intensity * 0.6],
        [lat + 0.01, lng + 0.01, intensity * 0.8],
        [lat - 0.01, lng - 0.01, intensity * 0.8],
      ];
      
      bloomPoints.forEach(p => heatmapData.push(p));
    }
  });

  return heatmapData;
};

// Map issue rate to intensity label
export const getIntensityLabel = (intensity) => {
  if (intensity >= 0.7) return 'CRITICAL 🔴';
  if (intensity >= 0.4) return 'ELEVATED 🟠';
  if (intensity >= 0.2) return 'MEDIUM 🟡';
  return 'LOW 🟢';
};
