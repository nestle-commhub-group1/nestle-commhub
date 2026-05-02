import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import axios from 'axios';
import { X, Loader2 } from 'lucide-react';
import API_URL from '../../config/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const HeatLayer = ({ data, onRetailerClick }) => {
  const map = useMap();

  useEffect(() => {
    if (!data || data.length === 0) return;
    
    const points = data.map(r => [r.latitude, r.longitude, (r.rejectionRate || 0) / 100]);
    const heat = L.heatLayer(points, {
      radius: 35, 
      blur: 25, 
      maxZoom: 10, 
      max: 1.0,
      gradient: { 0.0: '#00ff00', 0.4: '#ffff00', 0.7: '#ff8000', 1.0: '#ff0000' }
    });
    
    heat.addTo(map);
    
    return () => {
      map.removeLayer(heat);
    };
  }, [data, map]);

  return (
    <>
      {data.map((r, i) => (
        <CircleMarker
          key={r.id || i}
          center={[r.latitude, r.longitude]}
          radius={7}
          fillColor="white"
          color="#333"
          weight={1.5}
          fillOpacity={0.9}
          eventHandlers={{ click: () => onRetailerClick(r) }}
        />
      ))}
    </>
  );
};

const HeatMap = ({ embedded = false }) => {
  const [retailerData, setRetailerData] = useState([]);
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    region: 'all',
    issueType: 'all',
    period: '30'
  });

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
    const interval = setInterval(fetchData, 1800000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [filters]);

  const totalRetailers = retailerData.length;
  const highIssueZones = retailerData.filter(r => (r.rejectionRate || 0) >= 30).length;
  const totalOpenTickets = retailerData.reduce((acc, r) => acc + (r.openTickets || 0), 0);
  const avgRejectionRate = totalRetailers > 0
    ? (retailerData.reduce((acc, r) => acc + (r.rejectionRate || 0), 0) / totalRetailers).toFixed(1)
    : "0.0";

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
    <div className={embedded ? "" : "p-8 min-h-screen bg-gray-50 font-sans"}>
      {!embedded && (
        <h1 className="text-3xl font-extrabold mb-6 text-gray-900 tracking-tight">Issue Heat Map</h1>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Region</label>
          <select
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.region}
            onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
          >
            <option value="all">All Regions</option>
            <option value="Western">Western</option>
            <option value="Central">Central</option>
            <option value="Northern">Northern</option>
            <option value="Eastern">Eastern</option>
            <option value="Southern">Southern</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Issue Type</label>
          <select
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.issueType}
            onChange={(e) => setFilters(prev => ({ ...prev, issueType: e.target.value }))}
          >
            <option value="all">All Issues</option>
            <option value="Stock rejection">Stock rejection</option>
            <option value="Delivery delay">Delivery delay</option>
            <option value="Quality complaint">Quality complaint</option>
            <option value="Payment dispute">Payment dispute</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Period</label>
          <select
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.period}
            onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
        <div className="flex items-center gap-2 mt-4 lg:mt-0 text-sm font-medium text-gray-600">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Live — updates every 30 mins
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-xs font-bold text-gray-500 uppercase">Total Retailers</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{totalRetailers}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-xs font-bold text-gray-500 uppercase">High Issue Zones</div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">{highIssueZones}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-xs font-bold text-gray-500 uppercase">Open Tickets</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{totalOpenTickets}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-xs font-bold text-gray-500 uppercase">Avg Rejection Rate</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{avgRejectionRate}%</div>
        </div>
      </div>

      {/* Main Layout (Map + Panel) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Map */}
        <div 
          className="flex-1 relative overflow-hidden bg-white shadow-sm border border-gray-200"
          style={{ height: embedded ? '480px' : '520px', borderRadius: '8px' }}
        >
          {loading && (
            <div className="absolute inset-0 bg-white/70 z-[1000] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-blue-600 font-semibold">
                <Loader2 className="animate-spin" size={32} />
                Loading...
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 bg-white/90 z-[1000] flex items-center justify-center">
              <div className="text-red-500 font-semibold bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                {error}
              </div>
            </div>
          )}

          <MapContainer center={[7.8731, 80.7718]} zoom={7} style={{ width: '100%', height: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <HeatLayer data={retailerData} onRetailerClick={setSelectedRetailer} />
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[999] bg-white p-3 rounded-lg shadow-md border border-gray-100 text-xs font-medium">
            <div className="mb-2 text-gray-600">Rejection Rate</div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500 opacity-80"></div>Low 0%</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-yellow-400 opacity-80"></div>Medium 15%</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500 opacity-80"></div>High 30%+</div>
            </div>
          </div>
        </div>

        {/* Right: Side Panel */}
        <div className="w-full lg:w-[300px] bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden" style={{ height: embedded ? '480px' : '520px' }}>
          {!selectedRetailer ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-sm font-medium text-gray-400">
              Click a marker on the map to view retailer details and tickets
            </div>
          ) : (
            <div className="flex flex-col h-full relative">
              <button 
                onClick={() => setSelectedRetailer(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="p-6 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-4 mb-6 mt-2">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                    {selectedRetailer.businessName ? selectedRetailer.businessName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'RT'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{selectedRetailer.businessName}</h3>
                    <p className="text-xs font-medium text-gray-500">{selectedRetailer.region} Region</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Rejection rate:</span>
                    <span className={getRejectionRateColor(selectedRetailer.rejectionRate || 0)}>
                      {selectedRetailer.rejectionRate || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Open tickets:</span>
                    <span className="font-bold text-gray-900">{selectedRetailer.openTickets || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total orders:</span>
                    <span className="font-medium text-gray-900">{selectedRetailer.totalOrders || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Avg order value:</span>
                    <span className="font-medium text-gray-900">${selectedRetailer.avgOrderValue || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Last order:</span>
                    <span className="font-medium text-gray-900">{selectedRetailer.lastOrderDate ? new Date(selectedRetailer.lastOrderDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col overflow-hidden">
                <h4 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider shrink-0">Open Tickets</h4>
                <div className="overflow-y-auto pr-2 space-y-3 max-h-[280px]">
                  {selectedRetailer.tickets && selectedRetailer.tickets.length > 0 ? (
                    selectedRetailer.tickets.map((t, i) => (
                      <div key={t.ticketId || t.id || i} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-gray-400">#{t.ticketId || t.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getTicketColor(t.type)}`}>
                            {t.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 font-medium leading-relaxed">{t.description}</p>
                        {t.orderReference && (
                          <div className="mt-2 text-[10px] text-gray-500 font-medium">Ref: {t.orderReference}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-xs text-gray-400 py-4">No open tickets.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeatMap;
