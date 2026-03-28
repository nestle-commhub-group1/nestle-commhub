import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';
import AdminLayout from '../../components/layout/AdminLayout';
import { ArrowLeft, Clock, Paperclip, User, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const priCls = p => ({
  High: 'bg-orange-100 text-orange-700 border border-orange-200',
  Critical: 'bg-red-100 text-red-700 border border-red-200',
  Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  Low: 'bg-gray-100 text-gray-600 border border-gray-200',
}[p] || 'bg-gray-100 text-gray-600');

const staCls = s => ({
  Open: 'bg-red-50 text-red-700 border border-red-200',
  'In Progress': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  Resolved: 'bg-green-50 text-green-700 border border-green-200',
  Escalated: 'bg-purple-100 text-purple-700 border border-purple-200',
}[s] || 'bg-gray-50 text-gray-600');

export default function AdminTicketDetail() {
  const { id } = useParams();
  const token = localStorage.getItem('token');

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatRoom, setChatRoom] = useState('staff_retailer');
  const [timeLeft, setTimeLeft] = useState(0);
  const [actionResult, setActionResult] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ── Fetch ticket + messages ────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !id) { setLoading(false); return; }

    Promise.all([
      fetch(`${API_URL}/api/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
      fetch(`${API_URL}/api/tickets/${id}/messages?chatRoom=${chatRoom}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
    ]).then(([ticketData, msgData]) => {
      if (ticketData?.success && ticketData.ticket) {
        const t = ticketData.ticket;
        setTicket({
          id: t.ticketNumber || 'TKT-PENDING',
          category: t.category?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'General',
          priority: t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : 'Medium',
          status: t.status === 'in_progress' ? 'In Progress' : t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1) : 'Open',
          description: t.description || '',
          submitted: new Date(t.createdAt).toLocaleString(),
          slaBreached: t.isEscalated || (t.slaDeadline && new Date(t.slaDeadline) < new Date()),
          slaDeadline: t.slaDeadline ? new Date(t.slaDeadline).toLocaleString() : 'N/A',
          originalDeadline: t.slaDeadline,
          isEscalated: t.isEscalated,
          retailer: t.retailerId?.businessName || t.retailerId?.fullName || 'Retailer',
          retailerInfo: {
            name: t.retailerId?.fullName || 'Retailer',
            business: t.retailerId?.businessName || '—',
            phone: t.retailerId?.phone || '—',
            email: t.retailerId?.email || '—',
            address: t.retailerId?.businessAddress || '—',
            initials: (t.retailerId?.fullName || 'R').split(' ').map(n => n[0]).join('').toUpperCase(),
          },
          assignedTo: t.assignedTo?.fullName || null,
          distributorId: t.distributorId,
          attachments: t.attachments || [],
          _id: t._id,
          _rawStatus: t.status,
        });
      } else {
        setError('Ticket not found or you do not have permission to view it.');
      }
      if (msgData?.success) {
        const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')._id;
        setMessages((msgData.messages || []).map(m => ({
          id: m._id,
          sender: m.senderId?._id === currentUserId ? 'admin' : (m.senderRole || 'staff'),
          name: m.senderId?.fullName || m.senderName || 'User',
          text: m.message,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })));
      }
    }).catch(err => {
      setError('Failed to load ticket details.');
      console.error(err);
    }).finally(() => setLoading(false));
  }, [id, token, chatRoom]);

  // ── SLA Countdown ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ticket?.originalDeadline || ticket.status === 'Resolved') { setTimeLeft(0); return; }
    const calc = () => setTimeLeft(Math.max(0, new Date(ticket.originalDeadline) - new Date()));
    calc();
    const iv = setInterval(calc, 60000);
    return () => clearInterval(iv);
  }, [ticket?.originalDeadline, ticket?.status]);

  const hoursLeft = Math.floor(timeLeft / 3600000);
  const minsLeft = Math.floor((timeLeft % 3600000) / 60000);
  const isOverdue = timeLeft <= 0 && ticket?.status !== 'Resolved';

  // ── Update status (admin can resolve/reopen) ───────────────────────────────
  async function updateStatus(newStatus) {
    setUpdatingStatus(true);
    try {
      const res = await axios.put(
        `${API_URL}/api/tickets/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const label = newStatus === 'in_progress' ? 'In Progress' : newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        setTicket(prev => ({ ...prev, status: label, _rawStatus: newStatus }));
        setActionResult({ type: 'success', msg: `Status updated to ${label}` });
      }
    } catch (err) {
      setActionResult({ type: 'error', msg: err.response?.data?.message || 'Failed to update status.' });
    } finally {
      setUpdatingStatus(false);
      setTimeout(() => setActionResult(null), 3000);
    }
  }

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="animate-spin mr-2" size={24} />
        <span className="font-medium">Loading ticket...</span>
      </div>
    </AdminLayout>
  );

  if (error || !ticket) return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <AlertCircle size={32} className="mb-2 text-red-400" />
        <p className="font-medium">{error || 'Ticket not found.'}</p>
        <Link to="/admin/dashboard" className="mt-4 text-nestle-brown font-bold text-sm hover:underline">← Back to Dashboard</Link>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="pb-10">
        {/* Header */}
        <div className="mb-6">
          <Link to="/admin/dashboard" className="inline-flex items-center space-x-2 text-[13px] font-bold text-gray-500 hover:text-[#3D2B1F] transition-colors mb-4">
            <ArrowLeft size={16} /><span>Back to Dashboard</span>
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-extrabold text-[#2C1810]">{ticket.id}</h1>
              <p className="text-[14px] text-gray-500 font-medium mt-0.5">{ticket.retailer} · {ticket.category}</p>
              {ticket.isEscalated && (
                <span className="inline-block mt-2 bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold px-3 py-1 rounded-full">⚠️ Escalated to HQ</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[12px] font-bold px-3 py-1.5 rounded-full ${staCls(ticket.status)}`}>{ticket.status}</span>
              <span className={`text-[12px] font-bold px-3 py-1.5 rounded-md ${priCls(ticket.priority)}`}>{ticket.priority}</span>
            </div>
          </div>
        </div>

        {/* Action result toast */}
        {actionResult && (
          <div className={`mb-4 px-5 py-3 rounded-[12px] text-[14px] font-medium ${actionResult.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {actionResult.msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5">

            {/* Ticket Info */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm">
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-4">Ticket Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {[['Retailer', ticket.retailer], ['Category', ticket.category], ['Submitted', ticket.submitted], ['Assigned To', ticket.assignedTo || 'Unassigned']].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold mb-1">{k}</p>
                    <p className="text-[14px] font-bold text-[#2C1810]">{v}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold mb-2">Description</p>
              <p className="text-[14px] text-[#2C1810] font-medium leading-relaxed">{ticket.description}</p>
            </div>

            {/* SLA Status */}
            <div className={`rounded-[20px] p-6 shadow-sm ${ticket.slaBreached || isOverdue ? 'bg-red-50 border border-red-200' : 'bg-white border border-[#E0DBD5]'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[12px] font-extrabold uppercase tracking-widest flex items-center gap-2 text-[#3D2B1F]"><Clock size={14} />SLA Status</h3>
                <span className="text-[11px] text-gray-500 font-medium">Deadline: {ticket.slaDeadline}</span>
              </div>
              {ticket.slaBreached || (isOverdue && ticket.status !== 'Resolved') ? (
                <div>
                  <span className="inline-flex items-center gap-2 bg-red-100 border border-red-300 text-red-700 text-[14px] font-extrabold px-4 py-2 rounded-[10px]">⚠️ SLA BREACHED</span>
                  <p className="text-[13px] text-red-600 font-medium mt-2">This ticket has exceeded its SLA deadline and requires immediate attention.</p>
                </div>
              ) : (
                <>
                  <p className={`text-[36px] font-extrabold mb-3 ${hoursLeft < 2 && ticket.status !== 'Resolved' ? 'text-orange-600' : 'text-blue-600'}`}>
                    {ticket.status === 'Resolved' ? 'Completed' : `${hoursLeft}h ${minsLeft}m remaining`}
                  </p>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-500 ${hoursLeft < 2 && ticket.status !== 'Resolved' ? 'bg-orange-500' : 'bg-blue-500'}`}
                      style={{ width: ticket.status === 'Resolved' ? '100%' : `${Math.min(100, Math.max(5, (timeLeft / (24 * 3600000)) * 100))}%` }} />
                  </div>
                  <p className="text-[12px] text-gray-500 mt-2">Ticket is within SLA requirements</p>
                </>
              )}
            </div>

            {/* Attachments */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm">
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-4 flex items-center gap-2"><Paperclip size={14} />Attached Evidence</h3>
              {ticket.attachments?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {ticket.attachments.map((file, idx) => (
                    <div key={idx} className="group relative bg-[#F8F7F5] border border-[#E0DBD5] rounded-[12px] overflow-hidden hover:shadow-md transition-shadow aspect-square flex items-center justify-center">
                      {file.startsWith('data:image/') ? (
                        <img src={file} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center p-3 text-center">
                          <Paperclip size={24} className="text-gray-400 mb-1" />
                          <span className="text-[10px] font-bold text-gray-500">FILE_{idx + 1}</span>
                        </div>
                      )}
                      <a href={file} download={`attachment-${idx + 1}`} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[12px] font-bold">
                        View / Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-gray-400 font-medium italic">No attachments uploaded.</p>
              )}
            </div>

            {/* Admin Actions */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm">
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-4">Admin Actions</h3>
              <div className="flex flex-wrap gap-3">
                {ticket._rawStatus !== 'resolved' && (
                  <button
                    onClick={() => updateStatus('resolved')}
                    disabled={updatingStatus}
                    className="flex items-center gap-2 bg-green-600 text-white text-[13px] font-bold px-5 py-3 rounded-[10px] hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {updatingStatus ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Mark as Resolved
                  </button>
                )}
                {ticket._rawStatus === 'resolved' && (
                  <button
                    onClick={() => updateStatus('in_progress')}
                    disabled={updatingStatus}
                    className="flex items-center gap-2 bg-yellow-600 text-white text-[13px] font-bold px-5 py-3 rounded-[10px] hover:bg-yellow-700 transition-colors disabled:opacity-50"
                  >
                    Reopen Ticket
                  </button>
                )}
              </div>
            </div>

            {/* Chat (read-only view across all rooms) */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] shadow-sm overflow-hidden flex flex-col h-[480px]">
              <div className="border-b border-[#E0DBD5] bg-gray-50/50 flex flex-shrink-0">
                {['staff_retailer', 'staff_distributor', 'retailer_distributor'].map(room => (
                  <button
                    key={room}
                    onClick={() => setChatRoom(room)}
                    className={`flex-1 py-3 text-[12px] font-extrabold uppercase tracking-wide transition-all ${chatRoom === room ? 'text-nestle-brown bg-white border-b-2 border-nestle-brown' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {room === 'staff_retailer' ? '💬 Staff–Retailer' : room === 'staff_distributor' ? '🚚 Staff–Dist' : '🔗 Retailer–Dist'}
                  </button>
                ))}
              </div>
              <div className="p-5 space-y-4 overflow-y-auto bg-[#F8F7F5] flex-1">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                    <p className="text-[14px] font-bold">No messages in this room.</p>
                  </div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className="flex flex-col items-start">
                      <p className="text-[11px] text-gray-500 font-bold mb-1 ml-1">{m.name} · {m.sender.toUpperCase()}</p>
                      <div className="max-w-[82%] px-4 py-3 rounded-[14px] bg-white text-[#2C1810] border border-[#E0DBD5] shadow-sm rounded-bl-sm">
                        <p className="text-[14px] font-medium leading-relaxed">{m.text}</p>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">{m.time}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="px-5 py-2 border-t border-[#E0DBD5] bg-gray-50 text-[11px] text-gray-400 font-medium italic">
                👁 Admin view — read only
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            {/* Ticket Progress */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm">
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-5">Ticket Progress</h3>
              {[
                { key: 'submitted', label: 'Submitted', desc: ticket.submitted },
                { key: 'assigned', label: 'Assigned', desc: ticket.assignedTo || 'Pending' },
                { key: 'in_progress', label: 'In Progress', desc: ['In Progress', 'Resolved', 'Escalated'].includes(ticket.status) ? 'Being handled' : 'Pending' },
                { key: 'resolved', label: 'Resolved', desc: ticket.status === 'Resolved' ? 'Completed' : 'Pending' },
              ].map((step, idx, arr) => {
                const s = ticket.status?.toLowerCase().replace(' ', '_');
                const done = step.key === 'submitted' ||
                  (step.key === 'assigned' && ticket.assignedTo) ||
                  (step.key === 'in_progress' && ['in_progress', 'resolved', 'escalated'].includes(s)) ||
                  (step.key === 'resolved' && s === 'resolved');
                const current = !done && (
                  (step.key === 'assigned' && !ticket.assignedTo) ||
                  (step.key === 'in_progress' && s === 'open') ||
                  (step.key === 'resolved' && s === 'in_progress')
                );
                return (
                  <div key={step.key} className="flex items-start space-x-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? 'bg-[#2D7A4F] text-white' : current ? 'bg-blue-100 text-blue-600 border-2 border-blue-500' : 'bg-gray-100 border border-gray-200'}`}>
                        {done ? <CheckCircle size={16} /> : current ? <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" /> : <div className="w-2.5 h-2.5 border-2 border-gray-300 rounded-full" />}
                      </div>
                      {idx < arr.length - 1 && <div className={`w-0.5 h-8 my-1 ${done ? 'bg-[#2D7A4F]' : 'bg-gray-200'}`} />}
                    </div>
                    <div className="pb-3">
                      <p className={`text-[14px] font-bold ${done || current ? 'text-[#2C1810]' : 'text-gray-400'}`}>{step.label}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Retailer Info */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm">
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-4 flex items-center gap-2"><User size={14} />Retailer Details</h3>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-[#2C1810] text-white flex items-center justify-center text-[15px] font-bold flex-shrink-0">{ticket.retailerInfo.initials}</div>
                <div>
                  <p className="text-[14px] font-extrabold text-[#2C1810]">{ticket.retailerInfo.name}</p>
                  <p className="text-[12px] text-gray-500">{ticket.retailerInfo.business}</p>
                </div>
              </div>
              <div className="space-y-2 text-[13px]">
                <p className="text-gray-600 font-medium">📞 {ticket.retailerInfo.phone}</p>
                <p className="text-blue-600 font-medium">✉️ {ticket.retailerInfo.email}</p>
                <p className="text-gray-600 font-medium">📍 {ticket.retailerInfo.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
