import React from 'react';
import { Target, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';

const SLAMonitor = () => {
  const regionalSLA = [
    { region: 'Western Province', total: 48, resolved: 41, sla: '85%', status: 'On Track', statusColor: 'text-nestle-success bg-green-50 border-green-200' },
    { region: 'Central Province', total: 31, resolved: 24, sla: '77%', status: 'At Risk', statusColor: 'text-nestle-warning bg-yellow-50 border-yellow-200' },
    { region: 'Southern Province', total: 27, resolved: 21, sla: '78%', status: 'At Risk', statusColor: 'text-nestle-warning bg-yellow-50 border-yellow-200' },
    { region: 'Northern Province', total: 22, resolved: 15, sla: '68%', status: 'Breached', statusColor: 'text-nestle-danger bg-red-50 border-red-200' },
    { region: 'Eastern Province', total: 14, resolved: 10, sla: '71%', status: 'At Risk', statusColor: 'text-nestle-warning bg-yellow-50 border-yellow-200' }
  ];

  const breaches = [
    { id: 'TKT-1037', region: 'Western', priority: 'Critical', deadline: 'Today, 10:00 AM', breachedBy: '2 hrs', assignedTo: 'Nadeeka Perera' },
    { id: 'TKT-1018', region: 'Northern', priority: 'High', deadline: 'Yesterday, 5:00 PM', breachedBy: '19 hrs', assignedTo: 'Amali K.' },
    { id: 'TKT-1011', region: 'Eastern', priority: 'Medium', deadline: 'Yesterday, 12:00 PM', breachedBy: '24 hrs', assignedTo: 'Suresh D.' },
    { id: 'TKT-1005', region: 'Northern', priority: 'Critical', deadline: 'Mar 14, 09:00 AM', breachedBy: '48 hrs', assignedTo: 'Amali K.' },
    { id: 'TKT-0998', region: 'Central', priority: 'High', deadline: 'Mar 13, 04:00 PM', breachedBy: '60 hrs', assignedTo: 'Ruwan S.' }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 pb-10">
        <div className="flex justify-between items-center">
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">SLA Monitor</h1>
          <select className="bg-white border border-gray-200 text-nestle-brown font-bold text-[14px] px-4 py-2.5 rounded-[12px] shadow-sm outline-none focus:border-nestle-brown">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>This Quarter</option>
          </select>
        </div>

        {/* Top metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-[16px] p-5 shadow-sm border-l-[4px] border-l-[#3B82F6] flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-gray-500 mb-1">Overall Compliance</p>
              <p className="text-[24px] font-extrabold text-nestle-brown">78%</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl"><Target size={20} className="text-[#3B82F6]" /></div>
          </div>
          <div className="bg-white rounded-[16px] p-5 shadow-sm border-l-[4px] border-l-nestle-danger flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-gray-500 mb-1">Critical Breaches</p>
              <p className="text-[24px] font-extrabold text-nestle-brown">8</p>
            </div>
            <div className="bg-red-50 p-3 rounded-xl"><AlertCircle size={20} className="text-nestle-danger" /></div>
          </div>
          <div className="bg-white rounded-[16px] p-5 shadow-sm border-l-[4px] border-l-nestle-warning flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-gray-500 mb-1">Avg Response Time</p>
              <p className="text-[24px] font-extrabold text-nestle-brown">4.2 hrs</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-xl"><Clock size={20} className="text-nestle-warning" /></div>
          </div>
          <div className="bg-white rounded-[16px] p-5 shadow-sm border-l-[4px] border-l-nestle-success flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-gray-500 mb-1">Resolved on Time</p>
              <p className="text-[24px] font-extrabold text-nestle-brown">34</p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl"><CheckCircle size={20} className="text-nestle-success" /></div>
          </div>
        </div>

        {/* Region SLA Table */}
        <div className="bg-white rounded-[20px] shadow-sm border border-nestle-border overflow-hidden">
          <div className="px-6 py-5 border-b border-nestle-border bg-[#F8F7F5]/50">
            <h2 className="text-[18px] font-extrabold text-nestle-brown">Regional SLA Compliance</h2>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-[14px] whitespace-nowrap">
              <thead className="bg-[#F8F7F5] text-gray-500 font-bold text-[12px] tracking-wider uppercase rounded-xl">
                <tr>
                  <th className="px-5 py-3">Region</th>
                  <th className="px-5 py-3">Total Tickets</th>
                  <th className="px-5 py-3">Resolved</th>
                  <th className="px-5 py-3">SLA %</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="font-medium text-[13px]">
                {regionalSLA.map((region, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-4 text-nestle-brown font-bold">{region.region}</td>
                    <td className="px-5 py-4 text-gray-600">{region.total}</td>
                    <td className="px-5 py-4 text-gray-600">{region.resolved}</td>
                    <td className="px-5 py-4 font-bold text-nestle-brown">{region.sla}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold border ${region.statusColor}`}>
                        {region.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Breach Details */}
        <div className="bg-white rounded-[20px] shadow-sm border border-nestle-border overflow-hidden">
          <div className="px-6 py-5 border-b border-nestle-border bg-[#F8F7F5]/50 flex items-center">
             <AlertCircle className="text-nestle-danger mr-2" size={20} />
             <h2 className="text-[18px] font-extrabold text-[#8B0000]">Breach Details</h2>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-[14px] whitespace-nowrap">
              <thead className="bg-[#F8F7F5] text-gray-500 font-bold text-[12px] tracking-wider uppercase">
                <tr>
                  <th className="px-5 py-3">Ticket ID</th>
                  <th className="px-5 py-3">Region</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">SLA Deadline</th>
                  <th className="px-5 py-3">Breached By</th>
                  <th className="px-5 py-3">Assigned To</th>
                </tr>
              </thead>
              <tbody className="font-medium text-[13px]">
                {breaches.map((b, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-red-50/30">
                    <td className="px-5 py-4 text-nestle-brown font-bold">{b.id}</td>
                    <td className="px-5 py-4 text-gray-600">{b.region}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-bold border ${
                        b.priority === 'Critical' ? 'text-red-700 bg-red-100 border-red-200' :
                        b.priority === 'High' ? 'text-orange-700 bg-orange-100 border-orange-200' :
                        'text-yellow-700 bg-yellow-100 border-yellow-200'
                      }`}>
                        {b.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{b.deadline}</td>
                    <td className="px-5 py-4 text-nestle-danger font-bold">{b.breachedBy}</td>
                    <td className="px-5 py-4 text-gray-600">{b.assignedTo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default SLAMonitor;
