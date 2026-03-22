import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';
import RetailerLayout from '../../components/layout/RetailerLayout';
import { ArrowLeft, Send, Clock, User, Paperclip, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const priCls = p => ({ 
  high: 'bg-orange-100 text-orange-700 border border-orange-200', 
  critical: 'bg-red-100 text-red-700 border border-red-200', 
  medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200', 
  low: 'bg-gray-100 text-gray-600 border border-gray-200' 
}[p?.toLowerCase()] || 'bg-gray-100 text-gray-600');

const staCls = s => ({ 
  'open': 'bg-red-50 text-red-700 border border-red-200', 
  'in_progress': 'bg-yellow-50 text-yellow-700 border border-yellow-200', 
  'resolved': 'bg-green-50 text-green-700 border border-green-200', 
  'escalated': 'bg-purple-100 text-purple-700 border border-purple-200' 
}[s?.toLowerCase()] || 'bg-gray-50 text-gray-600');

const formatStatus = (s) => {
  if (!s) return '';
  if (s === 'in_progress') return 'In Progress';
  return (s || "open").charAt(0).toUpperCase() + (s || "open").slice(1);
};

export default function TicketDetail() {
  const { id } = useParams();
  console.log("Ticket ID from URL:", id);
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ticketRes, msgRes] = await Promise.all([
          axios.get(`${API_URL}/api/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/tickets/${id}/messages`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (ticketRes.data.success) setTicket(ticketRes.data.ticket);
        if (msgRes.data.success) setMessages(msgRes.data.messages || []);
        setError(null);
      } catch (err) {
        console.log("Ticket detail error:", err.response?.data || err.message);
        setError("Failed to load ticket details");
      } finally {
        setLoading(false);
      }
    };

    if (id && token) fetchData();
  }, [id, token]);

  const send = async () => {
    if (!input.trim() || sending) return;
    try {
      setSending(true);
      const res = await axios.post(`${API_URL}/api/tickets/${id}/messages`, {
        message: input.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setMessages(p => [...p, res.data.message]);
        setInput('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <RetailerLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="w-12 h-12 text-[#3D2B1F] animate-spin mb-4" />
          <p className="text-[16px] font-bold text-gray-500">Loading ticket details...</p>
        </div>
      </RetailerLayout>
    );
  }

  if (error || !ticket) {
    return (
      <RetailerLayout>
        <div className="text-center py-32 bg-red-50 border border-red-100 rounded-[20px] mx-auto max-w-2xl mt-10">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-[20px] font-extrabold text-red-700">{error || 'Ticket not found'}</h2>
          <Link to="/retailer/tickets" className="mt-6 inline-block text-[15px] font-bold text-[#3D2B1F] underline">Back to My Tickets</Link>
        </div>
      </RetailerLayout>
    );
  }

  // SLA Calculation (simple)
  const createdAt = new Date(ticket.createdAt);
  const deadline = new Date(ticket.slaDeadline);
  const now = new Date();
  const isOverdue = now > deadline;
  const timeDiff = deadline - now;
  const hoursRemaining = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60)));
  const minsRemaining = Math.max(0, Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <RetailerLayout>
      <div className="pb-10">
        {/* Header */}
        <div className="mb-6">
          <Link to="/retailer/tickets" className="inline-flex items-center space-x-2 text-[13px] font-bold text-gray-500 hover:text-[#3D2B1F] transition-colors mb-4">
            <ArrowLeft size={16} /><span>Back to My Tickets</span>
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-extrabold text-[#2C1810]">{ticket.ticketNumber}</h1>
              <p className="text-[14px] text-gray-500 font-medium mt-0.5">
                {(ticket.category || "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[12px] font-bold px-3 py-1.5 rounded-full ${staCls(ticket.status)}`}>
                {formatStatus(ticket.status)}
              </span>
              <span className={`text-[12px] font-bold px-3 py-1.5 rounded-md ${priCls(ticket.priority)}`}>
                {(ticket.priority || "medium").charAt(0).toUpperCase() + (ticket.priority || "medium").slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5">
            {/* Info */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm">
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-4">Ticket Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold mb-1">Submitted</p>
                  <p className="text-[14px] font-bold text-[#2C1810]">{createdAt.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold mb-1">Assigned To</p>
                  <p className="text-[14px] font-bold text-[#2C1810]">{ticket.assignedTo?.fullName || 'Waiting for assignment...'}</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold mb-2">Description</p>
              <p className="text-[14px] text-[#2C1810] font-medium leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* SLA */}
            {ticket.status !== 'resolved' && (
              <div className={`border rounded-[20px] p-6 shadow-sm ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-[#E0DBD5]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest flex items-center gap-2"><Clock size={14}/>Time Remaining</h3>
                  <span className="text-[11px] text-gray-500 font-medium">Deadline: {deadline.toLocaleString()}</span>
                </div>
                <p className={`text-[36px] font-extrabold mb-3 ${isOverdue ? 'text-red-700' : 'text-blue-600'}`}>
                  {isOverdue ? 'Overdue' : `${hoursRemaining}h ${minsRemaining}m`}
                </p>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${isOverdue ? 'bg-red-500' : 'bg-[#2563EB]'} h-2 rounded-full`} style={{ width: isOverdue ? '100%' : '45%' }} />
                </div>
                <p className="text-[12px] text-gray-500 mt-2 font-medium">
                  {isOverdue ? 'SLA deadline has passed' : 'Ticket is within SLA requirements'}
                </p>
              </div>
            )}

            {/* Attachments */}
            {ticket.attachments?.length > 0 && (
              <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm">
                <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-4 flex items-center gap-2"><Paperclip size={14}/>Attached Evidence</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {ticket.attachments.map((file, idx) => {
                    const isImage = file.startsWith('data:image/');
                    const isVideo = file.startsWith('data:video/');
                    return (
                      <div key={idx} className="group relative bg-[#F8F7F5] border border-[#E0DBD5] rounded-[12px] overflow-hidden hover:shadow-md transition-shadow aspect-square flex items-center justify-center">
                        {isImage ? (
                          <img src={file} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : isVideo ? (
                          <video src={file} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center p-3 text-center">
                            <Paperclip size={24} className="text-gray-400 mb-1" />
                            <span className="text-[10px] font-bold text-gray-500 break-all">FILE_{idx+1}</span>
                          </div>
                        )}
                        <a 
                          href={file} 
                          download={`attachment-${idx+1}`}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[12px] font-bold"
                        >
                          View / Download
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chat */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] shadow-sm overflow-hidden flex flex-col h-[500px]">
              <div className="px-6 py-4 border-b border-[#E0DBD5] flex-shrink-0">
                <h3 className="text-[14px] font-extrabold text-[#2C1810]">Messages</h3>
                <p className="text-[12px] text-gray-500 mt-0.5">{messages.length} messages</p>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto bg-[#F8F7F5] flex-1">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <p className="text-[14px] font-medium">No messages yet. Send a message to start chatting.</p>
                  </div>
                ) : (
                  messages.map(m => (
                    <div key={m._id} className={`flex flex-col ${m.senderRole === 'retailer' ? 'items-end' : 'items-start'}`}>
                      <p className="text-[11px] text-gray-500 font-bold mb-1 mx-1">
                        {m.senderId?.fullName || (m.senderRole === 'retailer' ? 'Me' : 'Staff')}
                      </p>
                      <div className={`max-w-[78%] px-4 py-3 rounded-[14px] ${m.senderRole === 'retailer' ? 'bg-[#3D2B1F] text-white rounded-br-sm' : 'bg-white text-[#2C1810] border border-[#E0DBD5] shadow-sm rounded-bl-sm'}`}>
                        <p className="text-[14px] font-medium leading-relaxed whitespace-pre-wrap">{m.message}</p>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-[#E0DBD5] flex gap-3 bg-white flex-shrink-0">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && !sending && send()} 
                  placeholder="Type your message..." 
                  disabled={sending}
                  className="flex-1 border border-[#E0DBD5] rounded-[10px] px-4 py-3 text-[14px] font-medium text-[#2C1810] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 disabled:bg-gray-50" 
                />
                <button 
                  onClick={send} 
                  disabled={sending || !input.trim()}
                  className="bg-[#3D2B1F] text-white p-3 rounded-[10px] hover:bg-[#2C1810] transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18}/>}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            {/* Timeline */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm">
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-5">Ticket Progress</h3>
              <div className="space-y-0">
                {[
                  { label: 'Submitted', done: true, active: false, time: createdAt.toLocaleString() },
                  { label: 'Assigned', done: !!ticket.assignedTo, active: !ticket.assignedTo && ticket.status === 'open', time: ticket.assignedTo ? 'Completed' : 'Pending' },
                  { label: 'In Progress', done: ['in_progress', 'resolved', 'escalated'].includes(ticket.status), active: ticket.status === 'in_progress', time: ticket.status === 'in_progress' ? 'Current' : 'Pending' },
                  { label: 'Resolved', done: ticket.status === 'resolved', active: ticket.status === 'in_progress', time: ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString() : 'Pending' },
                ].map((step, idx, arr) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${step.done ? 'bg-[#2D7A4F] text-white' : step.active ? 'bg-blue-100 text-blue-600 border-2 border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.2)]' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                        {step.done ? <CheckCircle size={16} /> : step.active ? <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" /> : <div className="w-2.5 h-2.5 border-2 border-gray-300 rounded-full" />}
                      </div>
                      {idx < arr.length - 1 && <div className={`w-0.5 h-8 my-1 ${step.done ? 'bg-[#2D7A4F]' : 'bg-gray-200 shadow-inner'}`}/>}
                    </div>
                    <div className="pb-3 text-left">
                      <p className={`text-[14px] font-bold ${step.done || step.active ? 'text-[#2C1810]' : 'text-gray-400'}`}>{step.label}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5 leading-tight">{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Staff */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm">
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-4 flex items-center gap-2"><User size={14}/>Assigned Staff</h3>
              {ticket.assignedTo ? (
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-[#2C1810] text-white flex items-center justify-center text-[16px] font-bold">
                    {ticket.assignedTo.fullName.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[15px] font-extrabold text-[#2C1810]">{ticket.assignedTo.fullName}</p>
                    <p className="text-[12px] text-gray-500">Sales Staff</p>
                    <p className="text-[12px] text-[#2563EB] mt-0.5">{ticket.assignedTo.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[14px] text-gray-500 font-medium italic">Not assigned yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </RetailerLayout>
  );
}
