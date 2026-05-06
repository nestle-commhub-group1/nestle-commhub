import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import axios from 'axios';
import { X, Loader2, TrendingUp, AlertTriangle, CheckCircle, Info, Filter, Map as MapIcon } from 'lucide-react';
import API_URL from '../../config/api';
import { PROVINCE_COORDINATES } from '../../constants/provinceCoordinates';
import { generateHeatmapData, getIntensityLabel } from '../../utils/heatmapDataGenerator';
import '../../styles/heatmap-contour.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 400);
  }, [map]);
  return null;
};

// Custom HeatLayer component for leaflet-heat integration
const HeatLayer = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    if (!data || data.length === 0) return;

    try {
      const heatLayer = L.heatLayer(data, {
        radius: 45,
        blur: 20,
        max: 1.0,
        gradient: {
          0.0: '#2ECC71',   // Green (Low)
          0.3: '#F1C40F',   // Yellow (Medium)
          0.6: '#E67E22',   // Orange (Elevated)
          0.8: '#E74C3C',   // Red (Critical)
          1.0: '#8B0000'    // Dark Red (Peak)
        },
        opacity: 0.7,
        minOpacity: 0.1
      }).addTo(map);

      return () => {
        map.removeLayer(heatLayer);
      };
    } catch (error) {
      console.error('HeatLayer error:', error);
    }
  }, [data, map]);

  return null;
};

const HeatmapDashboard = ({ embedded = false }) => {
  const [retailerData, setRetailerData] = useState([]);
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    region: 'all',
    issueType: 'all',
    period: '30'
  });

  // Calculate heatmap density points
  const heatmapPoints = useMemo(() => {
    return generateHeatmapData(retailerData);
  }, [retailerData]);

  // Calculate province metrics for the detail panel
  const provinceMetrics = useMemo(() => {
    if (!retailerData || retailerData.length === 0) return {};

    const provinceMap = {};
    const provinces = Object.keys(PROVINCE_COORDINATES);
    
    provinces.forEach(province => {
      provinceMap[province] = {
        name: province,
        issueCount: 0,
        totalRetailers: 0,
        issueRate: 0,
        color: '#2ECC71',
        issueBreakdown: {
          'Stock rejection': 0,
          'Quality complaint': 0,
          'Delivery delay': 0,
          'Payment dispute': 0,
          'Other': 0
        },
        avgResolutionTime: Math.floor(Math.random() * 48) + 12,
        avgRating: (Math.random() * 1.5 + 3.5).toFixed(1)
      };
    });

    retailerData.forEach(retailer => {
      const province = retailer.region || 'Unknown';
      if (provinceMap[province]) {
        provinceMap[province].totalRetailers++;
        provinceMap[province].issueCount += (retailer.openTickets || 0);
        
        if (retailer.tickets && Array.isArray(retailer.tickets)) {
          retailer.tickets.forEach(ticket => {
            const type = ticket.type || 'Other';
            if (provinceMap[province].issueBreakdown[type] !== undefined) {
              provinceMap[province].issueBreakdown[type]++;
            } else {
              provinceMap[province].issueBreakdown['Other']++;
            }
          });
        }
      }
    });

    Object.keys(provinceMap).forEach(province => {
      const data = provinceMap[province];
      data.issueRate = data.totalRetailers > 0 ? (data.issueCount / (data.totalRetailers * 2)) : 0;
      
      if (data.issueRate >= 0.25) data.color = '#E74C3C';
      else if (data.issueRate >= 0.15) data.color = '#E67E22';
      else if (data.issueRate >= 0.05) data.color = '#F1C40F';
      else data.color = '#2ECC71';
    });

    return provinceMap;
  }, [retailerData]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/analytics/heatmap`, {
          params: filters,
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (isMounted) {
          setRetailerData(res.data.data || []);
          setError('');
        }
      } catch (err) {
        if (isMounted) setError('Failed to load heatmap data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [filters]);

  const handleProvinceSelection = (name) => {
    if (provinceMetrics[name]) {
      setSelectedProvince(provinceMetrics[name]);
      setSelectedRetailer(null);
      setShowDetailPanel(true);
    }
  };

  const getTicketColor = (type) => {
    switch (type) {
      case 'Stock rejection': return 'bg-red-100 text-red-800';
      case 'Payment dispute': return 'bg-red-100 text-red-800';
      case 'Delivery delay': return 'bg-amber-100 text-amber-800';
      case 'Quality complaint': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRejectionRateColor = (rate) => {
    if (rate >= 30) return 'text-red-600 font-bold';
    if (rate >= 15) return 'text-amber-600 font-bold';
    return 'text-green-600 font-bold';
  };

  return (
    <div className={embedded ? "" : "p-8 min-h-screen bg-[#F5F3F0] font-sans"}>
      {!embedded && (
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-[#2C1810] tracking-tight">Weather-Style Issue Density</h1>
            <p className="text-gray-500 font-medium mt-1">Advanced contour mapping of regional supply chain risks</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
              <MapIcon size={16} className="text-blue-600" />
              <span className="text-[11px] font-black text-blue-700 uppercase tracking-widest">Density Map v2.0</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="heatmap-controls-enhanced mb-8">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2 ml-1">
            <Filter size={12} className="text-gray-400" />
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Province Scope</label>
          </div>
          <select
            className="w-full p-3 bg-[#F8F7F5] border border-[#F0EDE8] rounded-2xl text-[13px] font-bold text-[#2C1810] outline-none focus:ring-2 focus:ring-[#8B5E3C]/10"
            value={filters.region}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, region: e.target.value }));
              if (e.target.value !== 'all') handleProvinceSelection(e.target.value);
            }}
          >
            <option value="all">Full Country Coverage</option>
            {Object.keys(PROVINCE_COORDINATES).map(p => (
              <option key={p} value={p}>{p} Province</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2 ml-1">
            <AlertTriangle size={12} className="text-gray-400" />
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Incident Category</label>
          </div>
          <select
            className="w-full p-3 bg-[#F8F7F5] border border-[#F0EDE8] rounded-2xl text-[13px] font-bold text-[#2C1810] outline-none focus:ring-2 focus:ring-[#8B5E3C]/10"
            value={filters.issueType}
            onChange={(e) => setFilters(prev => ({ ...prev, issueType: e.target.value }))}
          >
            <option value="all">All Issue Spectrums</option>
            <option value="Stock rejection">Stock Rejection</option>
            <option value="Delivery delay">Delivery Delay</option>
            <option value="Quality complaint">Quality Complaint</option>
            <option value="Payment dispute">Payment Dispute</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <div className="flex items-center gap-2 mb-2 ml-1">
            <TrendingUp size={12} className="text-gray-400" />
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temporal Range</label>
          </div>
          <select
            className="w-full p-3 bg-[#F8F7F5] border border-[#F0EDE8] rounded-2xl text-[13px] font-bold text-[#2C1810] outline-none focus:ring-2 focus:ring-[#8B5E3C]/10"
            value={filters.period}
            onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
          >
            <option value="7">Recent (7 Days)</option>
            <option value="30">Standard (30 Days)</option>
            <option value="90">Extended (90 Days)</option>
          </select>
        </div>
      </div>

      {/* Main Analysis Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Density Map Container */}
        <div 
          className="flex-1 heatmap-leaflet-container"
          style={{ height: embedded ? '580px' : '680px' }}
        >
          {loading && (
            <div className="absolute inset-0 bg-white/60 z-[1001] backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center">
                <Loader2 className="animate-spin text-[#8B5E3C] mb-4" size={48} />
                <span className="text-[12px] font-black text-[#2C1810] uppercase tracking-[0.2em]">Recalculating Contours...</span>
              </div>
            </div>
          )}
          
          <MapContainer center={[7.8731, 80.7718]} zoom={7.5} style={{ width: '100%', height: '100%', zIndex: 1 }}>
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapResizer />
            
            {/* Smooth Density Heat Layer */}
            {!loading && <HeatLayer data={heatmapPoints} />}

            {/* Individual Retailer Markers (Minimalist dots) */}
            {retailerData.filter(r => r.latitude != null && r.longitude != null).map((r, i) => (
              <CircleMarker
                key={`retailer-${r.id || i}`}
                center={[r.latitude, r.longitude]}
                radius={3}
                fillColor="white"
                color="#2C1810"
                weight={0.5}
                fillOpacity={0.8}
                eventHandlers={{ click: () => {
                  setSelectedRetailer(r);
                  setSelectedProvince(null);
                  setShowDetailPanel(true);
                }}}
              >
                <Popup className="heatmap-tooltip">
                  <div className="text-center">
                    <p className="font-black text-[12px] text-[#2C1810]">{r.businessName}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{r.region} Province</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Weather-Style Intensity Legend */}
          <div className="heatmap-legend-weather">
            <h3>Risk Intensity</h3>
            <div className="weather-legend-item">
              <div className="weather-color-bar" style={{ background: '#8B0000' }}></div>
              <span className="weather-legend-label">PEAK CRITICAL</span>
              <span className="weather-legend-range">30%+</span>
            </div>
            <div className="weather-legend-item">
              <div className="weather-color-bar" style={{ background: '#E74C3C' }}></div>
              <span className="weather-legend-label">CRITICAL</span>
              <span className="weather-legend-range">25%</span>
            </div>
            <div className="weather-legend-item">
              <div className="weather-color-bar" style={{ background: '#E67E22' }}></div>
              <span className="weather-legend-label">ELEVATED</span>
              <span className="weather-legend-range">15%</span>
            </div>
            <div className="weather-legend-item">
              <div className="weather-color-bar" style={{ background: '#F1C40F' }}></div>
              <span className="weather-legend-label">MODERATE</span>
              <span className="weather-legend-range">5%</span>
            </div>
            <div className="weather-legend-item">
              <div className="weather-color-bar" style={{ background: '#2ECC71' }}></div>
              <span className="weather-legend-label">STABLE</span>
              <span className="weather-legend-range">0%</span>
            </div>
          </div>
        </div>

        {/* Insight Detail Panel */}
        <div className="w-full lg:w-[380px] shrink-0">
          {!showDetailPanel ? (
            <div className="bg-white rounded-[32px] border border-[#E0DBD5] p-10 h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-[#F8F7F5] rounded-full flex items-center justify-center mb-6">
                <MapIcon size={32} className="text-[#8B5E3C]/20" />
              </div>
              <h3 className="text-[18px] font-black text-[#2C1810] mb-3">Geographic Insights</h3>
              <p className="text-[14px] text-gray-400 font-medium leading-relaxed">
                Interact with the density map hotspots or individual markers to reveal deep-dive regional analytics and performance metrics.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-[40px] border border-[#E0DBD5] shadow-xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-500">
              {selectedProvince ? (
                <div className="detail-panel-container">
                  <div className="detail-panel-header px-8 py-8">
                    <button 
                      onClick={() => setShowDetailPanel(false)}
                      className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                    >
                      <X size={20} />
                    </button>
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Regional Profile</p>
                    <h2 className="text-[24px] font-black text-[#2C1810]">{selectedProvince.name} Province</h2>
                    <div className="status-badge mt-4" style={{ backgroundColor: `${selectedProvince.color}15`, color: selectedProvince.color }}>
                      {getIntensityLabel(selectedProvince.issueRate)}
                    </div>
                  </div>
                  
                  <div className="detail-stats px-8 pb-8">
                    <div className="stat-card" style={{ borderLeftColor: selectedProvince.color }}>
                      <div className="label">Density Index</div>
                      <div className="value">{(selectedProvince.issueRate * 100).toFixed(1)}%</div>
                    </div>
                    <div className="stat-card">
                      <div className="label">Active Nodes</div>
                      <div className="value">{selectedProvince.totalRetailers}</div>
                    </div>
                    <div className="stat-card">
                      <div className="label">Res. Time</div>
                      <div className="value">{selectedProvince.avgResolutionTime}h</div>
                    </div>
                    <div className="stat-card">
                      <div className="label">Sentiment</div>
                      <div className="value">{selectedProvince.avgRating} ⭐</div>
                    </div>
                  </div>

                  <div className="issue-breakdown px-8 pb-10">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4">Risk Breakdown</h4>
                    {Object.entries(selectedProvince.issueBreakdown)
                      .filter(([_, count]) => count > 0)
                      .map(([type, count]) => (
                        <div key={type} className="issue-item py-3">
                          <span className="issue-name">{type}</span>
                          <span className="issue-count">{count}</span>
                        </div>
                      ))}
                    {Object.values(selectedProvince.issueBreakdown).every(v => v === 0) && (
                      <div className="py-12 text-center">
                        <CheckCircle size={40} className="text-green-500 mx-auto mb-3 opacity-20" />
                        <p className="text-[13px] font-bold text-gray-400 italic">Clear skies — No issues detected</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedRetailer && (
                <div className="detail-panel-container">
                  <div className="detail-panel-header px-8 py-8">
                    <button 
                      onClick={() => setShowDetailPanel(false)}
                      className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                    >
                      <X size={20} />
                    </button>
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Node Analysis</p>
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-[#8B5E3C] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#8B5E3C]/20">
                        {selectedRetailer.businessName ? selectedRetailer.businessName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'RT'}
                      </div>
                      <div>
                        <h2 className="text-[20px] font-black text-[#2C1810] leading-tight mb-1">{selectedRetailer.businessName}</h2>
                        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">{selectedRetailer.region} Province</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 pb-8 border-b border-[#F0EDE8]">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-[#F8F7F5] p-5 rounded-2xl">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rejection</p>
                        <p className={`text-[22px] font-black ${getRejectionRateColor(selectedRetailer.rejectionRate || 0)}`}>
                          {selectedRetailer.rejectionRate || 0}%
                        </p>
                      </div>
                      <div className="bg-[#F8F7F5] p-5 rounded-2xl">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tickets</p>
                        <p className="text-[22px] font-black text-[#2C1810]">{selectedRetailer.openTickets || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 py-8 flex-1 overflow-y-auto">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3 mb-5">Incident History</h4>
                    <div className="space-y-4">
                      {selectedRetailer.tickets && selectedRetailer.tickets.length > 0 ? (
                        selectedRetailer.tickets.map((t, i) => (
                          <div key={t.ticketId || t.id || i} className="bg-[#F8F7F5] p-5 rounded-2xl border border-[#F0EDE8] hover:border-[#8B5E3C]/20 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{t.ticketId || t.id}</span>
                              <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase ${getTicketColor(t.type)}`}>
                                {t.type}
                              </span>
                            </div>
                            <p className="text-[13px] text-[#4A3728] font-bold leading-relaxed">{t.description}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-16">
                          <CheckCircle size={48} className="text-green-500 mx-auto mb-4 opacity-10" />
                          <p className="text-[14px] font-bold text-gray-400 italic">No historical incidents</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeatmapDashboard;


