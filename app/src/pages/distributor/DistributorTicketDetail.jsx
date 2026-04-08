import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';
import {
  ArrowLeft, Send, Truck, Clock,
  User, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import DistributorLayout from '../../components/layout/DistributorLayout';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const priCls = p => ({
  critical: 'bg-red-50 text-red-700 border-red-200',
  high:     'bg-orange-50 text-orange-700 border-orange-200',
  medium:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  low:      'bg-gray-50 text-gray-600 border-gray-200',
}[p?.toLowerCase()] || 'bg-gray-50 text-gray-600');

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
                <div className={`max-w-[80%] rounded-[16px] px-5 py-3 shadow-sm ${
                  mine
                    ? `${accentColor} text-white rounded-br-none`
                    : 'bg-white text-nestle-brown border border-nestle-border rounded-bl-none'
                }`}>
                  <p className={`text-[11px] font-bold mb-1 tracking-wider uppercase ${
                    mine ? 'text-white/70' : 'text-gray-400'
                  }`}>
                    {msg.senderName} · {msg.senderRole.replace('_', ' ')}
                  </p>
                  <p className="text-[14px] leading-relaxed font-medium">{msg.message}</p>
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

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-nestle-border">
        <div className="flex bg-[#F8F7F5] border border-nestle-border rounded-full p-1 focus-within:ring-2 focus-within:ring-nestle-brown/20 transition-all">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent px-5 py-2.5 text-[14px] text-nestle-brown font-medium focus:outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className={`ml-1 p-3 rounded-full flex items-center justify-center transition-colors shadow-sm ${
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

export default function DistributorTicketDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const token    = localStorage.getItem('token');
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen flex items-center justify-center bg-nestle-gray">
        <Loader2 className="animate-spin text-nestle-brown" size={36}/>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-nestle-gray px-4">
        <div className="bg-white p-10 rounded-[24px] border border-nestle-border shadow-sm text-center max-w-md w-full">
          <AlertCircle size={48} className="text-nestle-danger mb-4 mx-auto"/>
          <p className="text-xl font-bold text-nestle-brown">Ticket Not Found</p>
          <p className="text-gray-500 mt-2 font-medium">This allocation may have been removed or assigned to someone else.</p>
          <button onClick={() => navigate('/distributor/dashboard')} className="mt-8 bg-nestle-brown text-white font-bold py-3 px-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <DistributorLayout>
      <div className="space-y-6 pb-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/distributor/dashboard')}
            className="p-2.5 bg-white rounded-full border border-nestle-border shadow-sm text-nestle-brown hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20}/>
          </button>
          <div className="flex-1 min-w-0">
             <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-[26px] font-extrabold text-nestle-brown truncate">{ticket.ticketNumber}</h1>
                <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold border ${priCls(ticket.priority)}`}>
                  {ticket.priority?.toUpperCase()}
                </span>
             </div>
             <p className="text-[14px] text-gray-500 font-medium">
               {(ticket.category || '').replace(/_/g, ' ')} · {ticket.retailerId?.businessName || 'Retailer'}
             </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Details Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white rounded-[20px] border border-nestle-border shadow-sm p-6">
               <div className="flex items-center space-x-2 mb-4">
                 <div className={`px-3 py-1 rounded-full text-[12px] font-bold border ${staCls(ticket.status)}`}>
                    {ticket.status?.replace('_', ' ').toUpperCase()}
                 </div>
               </div>
               <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2">Issue Description</h3>
               <p className="text-[14px] text-nestle-brown font-medium leading-relaxed">{ticket.description}</p>
            </div>

            <div className="bg-white rounded-[20px] border border-nestle-border shadow-sm p-6">
              <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User size={14}/> Retailer Details
              </h3>
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-nestle-brown text-white flex items-center justify-center text-[15px] font-bold flex-shrink-0 shadow-sm">
                  {(ticket.retailerId?.fullName || 'R')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-nestle-brown truncate max-w-[150px]">{ticket.retailerId?.fullName}</p>
                  <p className="text-[12px] text-gray-400 font-medium">{ticket.retailerId?.businessName}</p>
                </div>
              </div>
              <div className="space-y-3 text-[13px] font-medium border-t border-gray-50 pt-4">
                <p className="flex items-center text-gray-600 truncate"><span className="text-gray-400 w-6">📞</span> {ticket.retailerId?.phone || 'N/A'}</p>
                <p className="flex items-center text-[#3B82F6] truncate"><span className="text-gray-400 w-6">✉️</span> {ticket.retailerId?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-white rounded-[20px] border border-nestle-border shadow-sm p-6">
              <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Clock size={14}/> SLA Deadline
              </h3>
              {ticket.slaDeadline ? (
                <div>
                  <p className={`text-[15px] font-bold ${new Date(ticket.slaDeadline) < new Date() && ticket.status !== 'resolved' ? 'text-nestle-danger' : 'text-nestle-brown'}`}>
                    {new Date(ticket.slaDeadline).toLocaleDateString()} at {new Date(ticket.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {new Date(ticket.slaDeadline) < new Date() && ticket.status !== 'resolved' && (
                    <div className="flex items-center space-x-1.5 mt-2 bg-red-50 text-red-600 px-2.5 py-1 rounded-md w-max border border-red-100">
                      <AlertCircle size={12}/>
                      <span className="text-[11px] font-bold uppercase tracking-tight">SLA Breached</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[14px] text-gray-400 italic">No deadline set.</p>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2 bg-white rounded-[20px] border border-nestle-border shadow-sm flex flex-col overflow-hidden h-[650px]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E0DBD5] bg-[#FDF8F3] flex-shrink-0">
              <h3 className="text-[12px] font-extrabold text-[#8B5A2B] uppercase tracking-widest flex items-center gap-2">
                🚚 Staff ↔ Distributor Chat
              </h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">🔒 Internal channel with assigned Nestlé Staff</p>
            </div>

            <ChatPane
              ticketId={id}
              token={token}
              chatRoom="staff_distributor"
              currentUser={currentUser}
              accentColor="bg-nestle-brown"
              emptyLabel="No messages with staff yet."
            />
          </div>
        </div>
      </div>
    </DistributorLayout>
  );
}
