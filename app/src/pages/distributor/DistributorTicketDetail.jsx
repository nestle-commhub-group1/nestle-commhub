import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';
import {
  ArrowLeft, Send, Truck, MessageSquare, Briefcase, Clock,
  User, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const priCls = p => ({
  critical: 'bg-red-100 text-red-700 border-red-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  medium:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  low:      'bg-gray-100 text-gray-600 border-gray-200',
}[p?.toLowerCase()] || 'bg-gray-100 text-gray-600');

const staCls = s => ({
  open:        'bg-red-50 text-red-700 border-red-200',
  in_progress: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  resolved:    'bg-green-50 text-green-700 border-green-200',
  escalated:   'bg-purple-50 text-purple-700 border-purple-200',
}[s?.toLowerCase()] || 'bg-gray-50 text-gray-600');

// ─── ChatPane component ────────────────────────────────────────────────────────
function ChatPane({ ticketId, token, chatRoom, currentUser, accentColor, emptyLabel }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [sending, setSending]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const bottomRef                 = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/tickets/${ticketId}/messages?chatRoom=${chatRoom}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) setMessages(res.data.messages || []);
    } catch (e) {
      console.error('fetchMessages error', e);
    } finally {
      setLoading(false);
    }
  };

  // Poll every 8 seconds
  useEffect(() => {
    if (!ticketId) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 8000);
    return () => clearInterval(interval);
  }, [ticketId, chatRoom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/tickets/${ticketId}/messages`,
        { message: input.trim(), chatRoom },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessages(prev => [...prev, res.data.message]);
        setInput('');
      }
    } catch (e) {
      console.error('sendMsg error', e);
      alert('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const isMe = (msg) =>
    msg.senderId === currentUser?._id ||
    msg.senderRole === 'distributor';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={28}/>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8F7F5]/60">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
            <MessageSquare size={40} className="mb-3 opacity-30"/>
            <p className="font-semibold">{emptyLabel}</p>
            <p className="text-sm">Send the first message below.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const mine = isMe(msg);
            return (
              <div key={idx} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[76%] rounded-[16px] px-5 py-3 shadow-sm ${
                  mine
                    ? `${accentColor} text-white rounded-br-none`
                    : 'bg-white text-[#2C1810] border border-[#E0DBD5] rounded-bl-none'
                }`}>
                  <p className={`text-[11px] font-extrabold mb-1 tracking-wider uppercase ${
                    mine ? 'text-white/70' : 'text-gray-400'
                  }`}>
                    {msg.senderName} · {msg.senderRole.replace('_', ' ')}
                  </p>
                  <p className="text-[14px] leading-relaxed">{msg.message}</p>
                  <p className={`text-[10px] mt-1.5 text-right ${mine ? 'text-white/50' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-[#E0DBD5]">
        <div className="flex bg-[#F8F7F5] border border-[#E0DBD5] rounded-full p-1 focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-blue-300 transition-all">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent px-4 py-2.5 text-[14px] text-[#2C1810] font-medium focus:outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className={`ml-1 p-3 rounded-full flex items-center justify-center transition-colors ${
              !input.trim() || sending
                ? 'bg-gray-200 text-gray-400'
                : `${accentColor} text-white hover:opacity-90`
            }`}
          >
            {sending
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              : <Send size={16}/>
            }
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DistributorTicketDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const token    = localStorage.getItem('token');
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('retailer'); // 'retailer' | 'staff'

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    axios
      .get(`${API_URL}/api/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (res.data.success) setTicket(res.data.ticket); })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [id, token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F5]">
        <Loader2 className="animate-spin text-[#3D2B1F]" size={36}/>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F5]">
        <AlertCircle size={48} className="text-red-400 mb-4"/>
        <p className="text-xl font-bold text-[#2C1810]">Ticket not found</p>
        <button onClick={() => navigate('/distributor/dashboard')} className="mt-4 text-sm font-bold text-[#3D2B1F] underline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const statusNorm = ticket.status?.replace('_', ' ') || 'open';

  return (
    <div className="min-h-screen bg-[#F8F7F5] font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E0DBD5] px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <button
          onClick={() => navigate('/distributor/dashboard')}
          className="flex items-center space-x-2 font-extrabold text-[#3D2B1F] hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={18}/>
          <span className="hidden sm:inline">Back to Dashboard</span>
        </button>
        <div className="flex items-center space-x-2">
          <Truck size={18} className="text-[#E72A2E]"/>
          <span className="font-extrabold text-[#3D2B1F] text-[15px]">Distributor Portal</span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8">

        {/* Ticket Header Card */}
        <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm p-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-1">Allocated Ticket</p>
            <h1 className="text-[28px] font-extrabold text-[#2C1810]">{ticket.ticketNumber}</h1>
            <p className="text-[14px] text-gray-500 font-medium mt-1">
              {ticket.retailerId?.businessName || ticket.retailerId?.fullName || 'Retailer'} ·{' '}
              {(ticket.category || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[12px] font-bold px-3 py-1.5 rounded-full border ${staCls(ticket.status)}`}>
              {statusNorm.toUpperCase()}
            </span>
            <span className={`text-[12px] font-bold px-3 py-1.5 rounded-md border ${priCls(ticket.priority)}`}>
              {(ticket.priority || '').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Ticket details sidebar */}
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm p-6">
              <h3 className="text-[11px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-3">Issue Description</h3>
              <p className="text-[14px] text-[#2C1810] font-medium leading-relaxed">{ticket.description}</p>
            </div>

            {/* Retailer info */}
            <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm p-6">
              <h3 className="text-[11px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-4 flex items-center gap-2">
                <User size={13}/> Retailer Info
              </h3>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#2C1810] text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0">
                  {(ticket.retailerId?.fullName || 'R').split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <p className="text-[14px] font-extrabold text-[#2C1810]">{ticket.retailerId?.fullName || '—'}</p>
                  <p className="text-[12px] text-gray-500">{ticket.retailerId?.businessName || '—'}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-[13px] font-medium text-gray-600">
                <p>📞 {ticket.retailerId?.phone || 'N/A'}</p>
                <p className="text-blue-600">✉️ {ticket.retailerId?.email || 'N/A'}</p>
              </div>
            </div>

            {/* Assigned staff */}
            <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm p-6">
              <h3 className="text-[11px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-3 flex items-center gap-2">
                <Briefcase size={13}/> Nestlé Staff Handler
              </h3>
              {ticket.assignedTo ? (
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#3D2B1F] text-white flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                    {(ticket.assignedTo.fullName || 'S').split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-extrabold text-[#2C1810]">{ticket.assignedTo.fullName}</p>
                    <p className="text-[12px] text-gray-500">{ticket.assignedTo.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-gray-400 italic">No staff assigned yet.</p>
              )}
            </div>

            {/* SLA */}
            <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm p-6">
              <h3 className="text-[11px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-3 flex items-center gap-2">
                <Clock size={13}/> SLA Deadline
              </h3>
              {ticket.slaDeadline ? (
                <div>
                  <p className={`text-[14px] font-bold ${new Date(ticket.slaDeadline) < new Date() && ticket.status !== 'resolved' ? 'text-red-600' : 'text-[#2C1810]'}`}>
                    {new Date(ticket.slaDeadline).toLocaleString()}
                  </p>
                  {new Date(ticket.slaDeadline) < new Date() && ticket.status !== 'resolved' && (
                    <p className="text-[12px] text-red-500 font-bold mt-1">⚠️ SLA Breached</p>
                  )}
                </div>
              ) : (
                <p className="text-[13px] text-gray-400 italic">No deadline set.</p>
              )}
            </div>
          </div>

          {/* Right: Dual Chat */}
          <div className="lg:col-span-2 bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm flex flex-col overflow-hidden" style={{ minHeight: '600px' }}>
            {/* Tab bar */}
            <div className="flex border-b border-[#E0DBD5] bg-gray-50/50 flex-shrink-0">
              <button
                onClick={() => setTab('retailer')}
                className={`flex-1 py-4 text-[13px] font-extrabold uppercase tracking-wide transition-colors flex items-center justify-center gap-2 ${
                  tab === 'retailer'
                    ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <MessageSquare size={15}/> Chat with Retailer
              </button>
              <button
                onClick={() => setTab('staff')}
                className={`flex-1 py-4 text-[13px] font-extrabold uppercase tracking-wide transition-colors flex items-center justify-center gap-2 ${
                  tab === 'staff'
                    ? 'text-[#3D2B1F] bg-white border-b-2 border-[#3D2B1F]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Briefcase size={15}/> Internal (Nestlé Staff)
              </button>
            </div>

            {/* Tab label context */}
            <div className={`px-5 py-2 text-[11px] font-bold uppercase tracking-widest flex-shrink-0 ${
              tab === 'retailer' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-700'
            }`}>
              {tab === 'retailer'
                ? '🛒 Visible to you and the Retailer only'
                : '🔒 Internal — visible to you and Nestlé Staff only'}
            </div>

            {/* The chat pane itself — key forces remount on tab change */}
            <ChatPane
              key={tab}
              ticketId={id}
              token={token}
              chatRoom={tab === 'retailer' ? 'retailer_distributor' : 'staff_distributor'}
              currentUser={currentUser}
              accentColor={tab === 'retailer' ? 'bg-blue-600' : 'bg-[#3D2B1F]'}
              emptyLabel={tab === 'retailer' ? 'No messages with retailer yet.' : 'No internal messages yet.'}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
