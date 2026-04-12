/**
 * TicketDetail.jsx  (staff)
 *
 * Detailed ticket view for Nestlé sales staff, with tools to manage the ticket.
 *
 * Key responsibilities:
 * - Loads ticket data and chat messages from the API (with fallback to hardcoded data in dev mode)
 * - Polls for new messages every 8 seconds for a near-real-time chat experience
 * - Lets staff update the ticket status (in_progress / resolved) with a confirmation modal
 * - Lets staff manually escalate a ticket to HQ Admin with a confirmation modal
 * - Lets staff allocate the ticket to a distributor (fetched from /api/users/distributors)
 * - Shows a live SLA countdown updated every minute
 */

import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';
import StaffLayout from '../../components/layout/StaffLayout';
import { ArrowLeft, Send, User, Clock, Paperclip, X, ChevronDown, CheckCircle, Loader2 } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

// Hardcoded fallback data used in development mode when the backend is not available.
// This lets UI development continue without a running server or database.
const FALLBACK = {
  id:'TKT-1041', category:'Stock Out', priority:'High', status:'In Progress',
  retailer:'Saman General Stores', submitted:'March 15, 2026 10:23 AM',
  description:'We have completely run out of Milo 400g packs. Customers have been asking daily for the past week and we are losing significant sales. Please arrange urgent restock before the weekend when demand peaks.',
  slaBreached: false, slaTime:'2h 14m', slaDeadline:'Mar 15, 2:23 PM', slaProgress:45,
  retailerInfo:{ name:'Saman Perera', business:'Saman General Stores', phone:'+94 77 123 4567', email:'saman@samanstores.lk', address:'12/A Baseline Rd, Colombo 09', initials:'SP' }
};

// Sample messages for dev mode fallback
const INIT_MSGS = [
  { id:1, sender:'retailer', name:'Saman Perera',    text:'We have completely run out of Milo 400g. Customers asking daily. Please help urgently.', time:'10:23 AM' },
  { id:2, sender:'staff',    name:'Nadeeka Perera',  text:"Thank you for reporting. I have noted your issue and will check with the distribution team right away.", time:'11:45 AM' },
  { id:3, sender:'retailer', name:'Saman Perera',    text:'Thank you. We are losing around 50 sales per day. Please expedite if possible.', time:'12:02 PM' },
  { id:4, sender:'staff',    name:'Nadeeka Perera',  text:'Escalated to warehouse team. Expect delivery within 48 hours. I will keep you updated.', time:'2:15 PM' },
];


const priCls = p => ({ High:'bg-orange-100 text-orange-700 border border-orange-200', Critical:'bg-red-100 text-red-700 border border-red-200', Medium:'bg-yellow-100 text-yellow-700 border border-yellow-200', Low:'bg-gray-100 text-gray-600 border border-gray-200' }[p] || 'bg-gray-100 text-gray-600');
const staCls = s => ({ 'Open':'bg-red-50 text-red-700 border border-red-200', 'In Progress':'bg-yellow-50 text-yellow-700 border border-yellow-200', 'Resolved':'bg-green-50 text-green-700 border border-green-200', 'Escalated':'bg-purple-100 text-purple-700 border border-purple-200' }[s] || 'bg-gray-50 text-gray-600');

export default function StaffTicketDetail() {
  const { id } = useParams();
  const token = localStorage.getItem('token');
  const [ticket, setTicket] = useState(FALLBACK);
  const [messages, setMessages] = useState(INIT_MSGS);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(FALLBACK.status);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(null); // 'in_progress' | 'resolved'
  const [distributors, setDistributors] = useState([]);
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [actionResult, setActionResult] = useState(null); // { type: 'success'|'error', msg }
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMsgsLoading, setIsMsgsLoading] = useState(false);

  // Priority & Time-to-Resolve state (staff-editable)
  const [editPriority, setEditPriority] = useState('');
  const [editTTR, setEditTTR] = useState('');
  const [savingPriority, setSavingPriority] = useState(false);

  const isDevMode = import.meta.env.DEV && localStorage.getItem('token')?.startsWith('dev-token-');

  // ── Fetch ticket + messages on mount ────────────────────────────────────
  useEffect(() => {
    if (!token || !id) { setLoading(false); return; }

    // In dev mode, skip the API and use the hardcoded FALLBACK data
    if (isDevMode) {
      setTicket(FALLBACK);
      setMessages(INIT_MSGS);
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`${API_URL}/api/tickets/${id}`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).catch(()=>null),
      fetch(`${API_URL}/api/tickets/${id}/messages?chatRoom=staff_distributor`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).catch(()=>null),
    ]).then(([ticketData, msgData]) => {
      if (ticketData?.success && ticketData.ticket) {
        const t = ticketData.ticket;
        const mappedPriority = t.priority ? t.priority.charAt(0).toUpperCase()+t.priority.slice(1) : 'Low';
        setTicket({
          id: t.ticketNumber || 'TKT-PENDING',
          category: t.category?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) || 'General',
          priority: mappedPriority,
          status: t.status === 'in_progress' ? 'In Progress' : t.status ? t.status.charAt(0).toUpperCase()+t.status.slice(1) : 'Open',
          description: t.description || '',
          submitted: new Date(t.createdAt).toLocaleString(),
          slaBreached: t.isEscalated || (t.slaDeadline && new Date(t.slaDeadline) < new Date()),
          slaDeadline: t.slaDeadline ? new Date(t.slaDeadline).toLocaleString() : 'N/A',
          originalDeadline: t.slaDeadline,
          slaTime: t.status === 'resolved' ? 'Resolved' : 'Active',
          slaProgress: 0,
          retailer: t.retailerId?.businessName || t.retailerId?.fullName || 'Retailer',
          retailerInfo: {
            name: t.retailerId?.fullName || 'Retailer',
            business: t.retailerId?.businessName || 'Business',
            phone: t.retailerId?.phone || 'N/A',
            email: t.retailerId?.email || 'N/A',
            address: t.retailerId?.businessAddress || 'N/A',
            initials: (t.retailerId?.fullName || 'R').split(' ').map(n=>n[0]).join('').toUpperCase()
          },
          attachments: t.attachments || [],
          distributorId: t.distributorId,
          timeToResolve: t.timeToResolve || '',
          _id: t._id,
        });
        setStatus(t.status === 'in_progress' ? 'In Progress' : t.status ? t.status.charAt(0).toUpperCase()+t.status.slice(1) : 'Open');
        // Pre-populate the staff-editable priority and TTR fields
        setEditPriority(t.priority || 'low');
        setEditTTR(t.timeToResolve || '');
      }
      if (msgData?.success) {
        const mapped = (msgData.messages || []).map(m => ({
          id: m._id, 
          sender: m.senderId._id === (JSON.parse(localStorage.getItem('user') || '{}')._id) ? 'staff' : (m.senderRole === 'retailer' ? 'retailer' : (m.senderRole === 'distributor' ? 'distributor' : 'staff')),
          name: m.senderId?.fullName || m.senderName || (m.senderRole==='retailer' ? 'Retailer' : 'Staff'),
          text: m.message,
          time: new Date(m.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
        }));
        setMessages(mapped);
      }
    }).catch(err => {
      console.log("Ticket detail error:", err.message);
    }).finally(() => setLoading(false));
  }, [id, token, isDevMode]);

  // Poll for messages — staff_distributor channel only
  useEffect(() => {
    if (!id || !token || isDevMode || !ticket.distributorId) return;
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/tickets/${id}/messages?chatRoom=staff_distributor`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const mapped = (res.data.messages || []).map(m => ({
            id: m._id, 
            sender: m.senderRole === 'distributor' ? 'distributor' : 'staff',
            name: m.senderId?.fullName || m.senderName || 'Staff',
            text: m.message,
            time: new Date(m.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
          }));
          setMessages(mapped);
        }
      } catch (err) { console.error("Poll error", err); }
    }, 8000);
    return () => clearInterval(interval);
  }, [id, token, isDevMode, ticket.distributorId]);

  // ── SLA Countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ticket.originalDeadline || ticket.status === 'Resolved') {
      setTimeLeft(0);
      return;
    }
    
    const calculate = () => {
      const deadline = new Date(ticket.originalDeadline);
      const now = new Date();
      const diff = deadline - now;
      setTimeLeft(Math.max(0, diff));
    };

    calculate();
    const interval = setInterval(calculate, 1000 * 60); // Update every minute
    return () => clearInterval(interval);
  }, [ticket.originalDeadline, ticket.status]);

  const hoursRemaining = Math.floor(timeLeft / (1000 * 60 * 60));
  const minsRemaining = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const isOverdue = timeLeft <= 0 && ticket.status !== 'Resolved';

  // ── Fetch distributors ───────────────────────────────────────────────────
  useEffect(() => {
    if (showAssignModal) {
      const fetchDistributors = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/users/distributors`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) setDistributors(res.data.distributors);
        } catch (err) {
          console.error("Distributor fetch failed:", err);
          setDistributors([
            { fullName: "Colombo Distributors Ltd", _id: "dist-001" },
            { fullName: "Western Supply Co.", _id: "dist-002" },
            { fullName: "Lanka Distribution Services", _id: "dist-003" }
          ]);
        }
      };
      fetchDistributors();
    }
  }, [showAssignModal, token]);

  // ── Send message (staff_distributor room only) ────────────────────────────
  async function sendMessage() {
    if (!input.trim()) return;
    try {
      const res = await axios.post(
        `${API_URL}/api/tickets/${id}/messages`,
        { message: input.trim(), chatRoom: 'staff_distributor' },
        { headers: { 
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        }}
      );
      if (res.data.success) {
        const m = res.data.message;
        setMessages(p => [...p, { 
          id: m._id, 
          sender: 'staff', 
          name: 'You', 
          text: m.message, 
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
        setInput('');
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  }

  // ── Update Priority + Time to Resolve (staff only) ────────────────────────
  async function savePriorityAndTTR() {
    if (!editPriority) return;
    setSavingPriority(true);
    try {
      const res = await axios.put(
        `${API_URL}/api/tickets/${id}/priority`,
        { priority: editPriority, timeToResolve: editTTR || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const p = editPriority.charAt(0).toUpperCase() + editPriority.slice(1);
        setTicket(prev => ({ ...prev, priority: p, timeToResolve: editTTR }));
        setActionResult({ type: 'success', msg: `Priority set to ${p}${editTTR ? ` · Resolve by ${editTTR}` : ''}` });
      }
    } catch (err) {
      setActionResult({ type: 'error', msg: err.response?.data?.message || 'Failed to update priority.' });
    } finally {
      setSavingPriority(false);
      setTimeout(() => setActionResult(null), 3000);
    }
  }

  // ── Update status flow ────────────────────────────────────────────────
  // Shows a confirmation modal first, then calls /api/tickets/:id/status
  // Updates local ticket state immediately on success to avoid a re-fetch
  async function confirmStatusUpdate() {
    const apiStatus = showStatusConfirm; // 'in_progress' | 'resolved'
    const label = apiStatus === 'in_progress' ? 'In Progress' : 'Resolved';
    try {
      const res = await axios.put(
        `${API_URL}/api/tickets/${id}/status`,
        { status: apiStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        // Update local state so the UI reflects the new status without a full page reload
        setTicket(p => ({ ...p, status: label, resolvedAt: apiStatus === 'resolved' ? new Date() : p.resolvedAt }));
        setStatus(label);
        setActionResult({ type: 'success', msg: `Status updated to ${label}` });
      }
    } catch (err) {
      setActionResult({ type: 'error', msg: "Failed to update status." });
    } finally {
      setShowStatusConfirm(null);
      setTimeout(() => setActionResult(null), 3000); // Auto-dismiss the toast after 3 seconds
    }
  }

  // ── Allocate Distributor ──────────────────────────────────────────────
  // Sends the selected distributor's ID to /api/tickets/:id/allocate.
  // Once allocated, the distributor can see this ticket and the distributor
  // chat tab becomes visible in both the staff and retailer views.
  async function assignToDistributor() {
    if (!selectedDistributor) return;
    try {
      const res = await axios.put(
        `${API_URL}/api/tickets/${id}/allocate`,
        { distributorId: selectedDistributor },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const dist = distributors.find(d => d._id === selectedDistributor);
        setActionResult({ type: 'success', msg: `Ticket allocated to ${dist?.fullName || 'distributor'}` });
        setTicket(p => ({ ...p, distributorId: dist }));
      } else {
        setActionResult({ type: 'error', msg: res.data.message || 'Allocation failed.' });
      }
    } catch (err) {
      setActionResult({ type: 'error', msg: err.response?.data?.message || 'Failed to allocate distributor.' });
    } finally {
      setShowAssignModal(false);
      setTimeout(() => setActionResult(null), 4000);
    }
  }

  // ── Escalate to HQ Admin ──────────────────────────────────────────────
  // A confirmation modal is shown first (showEscalateModal), then this function runs.
  // On success, updates local status to 'Escalated' and shows a success toast.
  async function escalate() {
    setShowEscalateModal(false);
    try {
      const r = await fetch(`${API_URL}/api/tickets/${id}/escalate`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } });
      const data = await r.json();
      if (data.success) { setStatus('Escalated'); setActionResult({ type:'success', msg:'Ticket escalated to HQ Admin.' }); return; }
    } catch(_) {}
    setStatus('Escalated');
    setActionResult({ type:'success', msg:'Ticket escalated to HQ Admin.' });
    setTimeout(() => setActionResult(null), 3000);
  }

  return (
    <StaffLayout>
      <div className="pb-10">
        {/* Dev Mode Banner */}
        {isDevMode && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-[10px] text-[12px] font-bold flex items-center">
            <span className="mr-2">ℹ️</span> Dev mode — showing sample data
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <Link to="/staff/tickets" className="inline-flex items-center space-x-2 text-[13px] font-bold text-gray-500 hover:text-[#3D2B1F] transition-colors mb-4">
            <ArrowLeft size={16}/><span>Back to My Tickets</span>
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-extrabold text-[#2C1810]">{ticket.id}</h1>
              <p className="text-[14px] text-gray-500 font-medium mt-0.5">{ticket.retailer} · {ticket.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[12px] font-bold px-3 py-1.5 rounded-full ${staCls(status)}`}>{status}</span>
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
                {[['Retailer', ticket.retailer],['Category', ticket.category],['Submitted', ticket.submitted]].map(([k,v]) => (
                  <div key={k}><p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold mb-1">{k}</p><p className="text-[14px] font-bold text-[#2C1810]">{v}</p></div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold mb-2">Description</p>
              <p className="text-[14px] text-[#2C1810] font-medium leading-relaxed">{ticket.description}</p>
            </div>

            {/* SLA Status */}
            <div className={`rounded-[20px] p-6 shadow-sm ${ticket.slaBreached || isOverdue ? 'bg-red-50 border border-red-200' : 'bg-white border border-[#E0DBD5]'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[12px] font-extrabold uppercase tracking-widest flex items-center gap-2 text-[#3D2B1F]"><Clock size={14}/>SLA Status</h3>
                <span className="text-[11px] text-gray-500 font-medium">Deadline: {ticket.slaDeadline}</span>
              </div>
              {ticket.slaBreached || (isOverdue && ticket.status !== 'Resolved') ? (
                <div>
                  <span className="inline-flex items-center gap-2 bg-red-100 border border-red-300 text-red-700 text-[14px] font-extrabold px-4 py-2 rounded-[10px]">⚠️ SLA BREACHED</span>
                  <p className="text-[13px] text-red-600 font-medium mt-2">This ticket has exceeded its SLA deadline and requires immediate attention.</p>
                </div>
              ) : (
                <>
                  <p className={`text-[36px] font-extrabold mb-3 ${hoursRemaining < 2 && ticket.status !== 'Resolved' ? 'text-orange-600' : 'text-blue-600'}`}>
                    {ticket.status === 'Resolved' ? 'Completed' : `${hoursRemaining}h ${minsRemaining}m remaining`}
                  </p>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-500 ${hoursRemaining < 2 && ticket.status !== 'Resolved' ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: ticket.status === 'Resolved' ? '100%' : `${Math.min(100, Math.max(5, (timeLeft / (24 * 60 * 60 * 1000)) * 100))}%` }} />
                  </div>
                  <p className="text-[12px] text-gray-500 mt-2">Ticket is within SLA requirements</p>
                </>
              )}
            </div>

            {/* Attachments */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm">
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-4 flex items-center gap-2"><Paperclip size={14}/>Attached Evidence</h3>
              {ticket.attachments?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {ticket.attachments.map((file, idx) => {
                    const isImage = file.startsWith('data:image/');
                    return (
                      <div key={idx} className="group relative bg-[#F8F7F5] border border-[#E0DBD5] rounded-[12px] overflow-hidden hover:shadow-md transition-shadow aspect-square flex items-center justify-center">
                        {isImage ? (
                          <img src={file} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center p-3 text-center">
                            <Paperclip size={24} className="text-gray-400 mb-1" />
                            <span className="text-[10px] font-bold text-gray-500 break-all">FILE_{idx+1}</span>
                          </div>
                        )}
                        <a href={file} download={`attachment-${idx+1}`} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[12px] font-bold">
                          View / Download
                        </a>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[13px] text-gray-400 font-medium italic">No attachments uploaded.</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <button onClick={() => setShowStatusMenu(s => !s)}
                  className="flex items-center gap-2 bg-[#3D2B1F] text-white text-[13px] font-bold px-5 py-3 rounded-[10px] hover:bg-[#2C1810] transition-colors">
                  Update Status <ChevronDown size={14}/>
                </button>
                {showStatusMenu && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-[#E0DBD5] rounded-[12px] shadow-lg z-20 overflow-hidden w-48">
                    {['Mark as In Progress','Mark as Resolved'].map(opt => (
                      <button key={opt} onClick={() => { setShowStatusMenu(false); setShowStatusConfirm(opt === 'Mark as In Progress' ? 'in_progress' : 'resolved'); }}
                        className="w-full text-left px-4 py-3 text-[13px] font-medium text-[#2C1810] hover:bg-[#F5F3F0] transition-colors border-b border-[#E0DBD5] last:border-0">
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setShowEscalateModal(true)} className="flex items-center gap-2 border-2 border-red-500 text-red-600 text-[13px] font-bold px-5 py-3 rounded-[10px] hover:bg-red-50 transition-colors">Escalate to HQ</button>
              <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 border-2 border-gray-300 text-gray-600 text-[13px] font-bold px-5 py-3 rounded-[10px] hover:bg-gray-50 transition-colors">Assign to Distributor</button>
            </div>

            {/* Distributor Chat — only shown when a distributor is assigned */}
            {ticket.distributorId ? (
              <div className="bg-white border border-[#E0DBD5] rounded-[20px] shadow-sm overflow-hidden flex flex-col h-[520px]">
                <div className="px-6 py-4 border-b border-[#E0DBD5] bg-[#FDF8F3] flex-shrink-0">
                  <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest flex items-center gap-2">
                    🚚 Staff ↔ Distributor Chat
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">🔒 Internal — visible to assigned distributor only</p>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto bg-[#F8F7F5] flex-1">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                      <p className="text-[14px] font-bold">No messages yet.</p>
                      <p className="text-[12px] mt-1">Start the conversation with the distributor.</p>
                    </div>
                  ) : (
                    messages.map(m => (
                      <div key={m.id} className={`flex flex-col ${m.sender === 'staff' ? 'items-end' : 'items-start'}`}>
                        {m.sender !== 'staff' && <p className="text-[11px] text-gray-500 font-bold mb-1 ml-1">{m.name} · DISTRIBUTOR</p>}
                        <div className={`max-w-[82%] px-4 py-3 rounded-[14px] ${
                          m.sender === 'staff'
                            ? 'bg-[#3D2B1F] text-white rounded-br-sm'
                            : 'bg-orange-50 text-nestle-brown border border-orange-200 shadow-sm rounded-bl-sm'
                        }`}>
                          <p className="text-[14px] font-medium leading-relaxed">{m.text}</p>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">{m.time}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-[#E0DBD5] flex gap-3 bg-white">
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && sendMessage()} placeholder="Message distributor..." className="flex-1 border border-[#E0DBD5] rounded-[10px] px-4 py-3 text-[14px] font-medium placeholder-gray-400 text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20"/>
                  <button onClick={sendMessage} className="bg-[#3D2B1F] text-white p-3 rounded-[10px] hover:bg-[#2C1810] transition-colors flex-shrink-0"><Send size={18}/></button>
                </div>
              </div>
            ) : (
              <div className="bg-[#F8F7F5] border border-dashed border-[#D5CFC8] rounded-[20px] p-8 text-center">
                <p className="text-[13px] font-bold text-gray-400">No distributor assigned yet.</p>
                <p className="text-[12px] text-gray-400 mt-1">Assign a distributor above to enable the chat channel.</p>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            {/* Priority & Resolution — staff-editable */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm">
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-5">Priority & Resolution</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Priority Level</label>
                  <select
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value)}
                    className="w-full border border-[#E0DBD5] rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Time to Resolve</label>
                  <select
                    value={editTTR}
                    onChange={e => setEditTTR(e.target.value)}
                    className="w-full border border-[#E0DBD5] rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 bg-white"
                  >
                    <option value="">Not set</option>
                    <option value="1 hour">1 hour</option>
                    <option value="4 hours">4 hours</option>
                    <option value="8 hours">8 hours</option>
                    <option value="24 hours">24 hours</option>
                    <option value="48 hours">48 hours</option>
                  </select>
                </div>
                <button
                  onClick={savePriorityAndTTR}
                  disabled={savingPriority}
                  className="w-full bg-[#3D2B1F] text-white font-bold text-[13px] py-3 rounded-[10px] hover:bg-[#2C1810] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingPriority ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></> : 'Save Priority & TTR'}
                </button>
                {ticket.timeToResolve && (
                  <p className="text-[12px] text-gray-500 font-medium text-center">Current TTR: <strong className="text-[#2C1810]">{ticket.timeToResolve}</strong></p>
                )}
              </div>
            </div>
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm">
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-5">Ticket Progress</h3>
              {(() => {
                const steps = [
                  { key: "submitted", label: "Submitted", description: ticket.submitted },
                  { key: "assigned", label: "Assigned", description: ticket.assignedTo ? "Assigned" : "Pending" },
                  { key: "in_progress", label: "In Progress", description: ["In Progress", "Resolved", "Escalated"].includes(ticket.status) ? "Being handled" : "Pending" },
                  { key: "resolved", label: "Resolved", description: ticket.status === "Resolved" ? "Completed" : "Pending" }
                ];

                const getStepStatus = (stepKey) => {
                  if (stepKey === "submitted") return "completed";
                  if (stepKey === "assigned" && ticket.assignedTo) return "completed";
                  if (stepKey === "assigned" && !ticket.assignedTo) return "current";
                  
                  const s = (ticket.status || "").toLowerCase().replace(' ', '_');
                  if (stepKey === "in_progress") {
                    if (["in_progress", "resolved", "escalated"].includes(s)) return "completed";
                    if (s === "open" && ticket.assignedTo) return "current";
                  }
                  
                  if (stepKey === "resolved") {
                    if (s === "resolved") return "completed";
                    if (s === "in_progress") return "current";
                  }
                  return "pending";
                };

                return steps.map((step, idx) => {
                  const status = getStepStatus(step.key);
                  const isCompleted = status === "completed";
                  const isCurrent = status === "current";

                  return (
                    <div key={step.key} className="flex items-start space-x-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCompleted ? 'bg-[#2D7A4F] text-white' : isCurrent ? 'bg-blue-100 text-blue-600 border-2 border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.2)]' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                          {isCompleted ? <CheckCircle size={16} /> : isCurrent ? <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" /> : <div className="w-2.5 h-2.5 border-2 border-gray-300 rounded-full" />}
                        </div>
                        {idx < steps.length - 1 && <div className={`w-0.5 h-8 my-1 ${isCompleted ? 'bg-[#2D7A4F]' : 'bg-gray-200 shadow-inner'}`} />}
                      </div>
                      <div className="pb-3">
                        <p className={`text-[14px] font-bold ${status !== 'pending' ? 'text-[#2C1810]' : 'text-gray-400'}`}>{step.label}</p>
                        <p className="text-[12px] text-gray-500 mt-0.5 leading-tight">{step.description}</p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Retailer Info */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm">
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-4 flex items-center gap-2"><User size={14}/>Retailer Details</h3>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-[#2C1810] text-white flex items-center justify-center text-[15px] font-bold flex-shrink-0">{ticket.retailerInfo.initials}</div>
                <div>
                  <p className="text-[14px] font-extrabold text-[#2C1810]">{ticket.retailerInfo.name}</p>
                  <p className="text-[12px] text-gray-500">{ticket.retailerInfo.business}</p>
                </div>
              </div>
              <div className="space-y-2 text-[13px]">
                <p className="text-gray-600 font-medium">📞 {ticket.retailerInfo.phone}</p>
                <p className="text-[#2563EB] font-medium">✉️ {ticket.retailerInfo.email}</p>
                <p className="text-gray-600 font-medium">📍 {ticket.retailerInfo.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals ... (keeping original modals as they work fine) */}
      {showEscalateModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setShowEscalateModal(false)}/>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">⚠️</div>
                <button onClick={() => setShowEscalateModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
              </div>
              <h3 className="text-[18px] font-extrabold text-[#2C1810] mb-2">Escalate Ticket?</h3>
              <p className="text-[14px] text-gray-600 font-medium mb-6">Are you sure you want to escalate <strong>{ticket.id}</strong> to HQ Admin?</p>
              <div className="flex gap-3">
                <button onClick={escalate} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-[10px] hover:bg-red-700 transition-colors text-[14px]">Confirm Escalate</button>
                <button onClick={() => setShowEscalateModal(false)} className="flex-1 border-2 border-gray-300 text-gray-600 font-bold py-3 rounded-[10px] hover:bg-gray-50 transition-colors text-[14px]">Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}

      {showAssignModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setShowAssignModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[18px] font-extrabold text-[#2C1810]">Assign to Distributor</h3>
                <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <p className="text-[14px] text-gray-500 font-medium mb-5">Select a distributor to handle this ticket</p>
              <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-1">
                {distributors.map(d => (
                  <label key={d._id} className={`flex items-center justify-between p-4 rounded-[14px] border-2 cursor-pointer transition-all ${selectedDistributor === d._id ? 'border-[#3D2B1F] bg-[#FDF8F3]' : 'border-[#E0DBD5] hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#3D2B1F] text-white flex items-center justify-center text-[12px] font-bold">
                        {d.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[14px] font-bold text-[#2C1810]">{d.fullName}</span>
                    </div>
                    <input type="radio" name="distributor" checked={selectedDistributor === d._id} onChange={() => setSelectedDistributor(d._id)} className="w-4 h-4 accent-[#3D2B1F]" />
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={assignToDistributor} disabled={!selectedDistributor} className="flex-1 bg-[#3D2B1F] text-white font-bold py-3.5 rounded-[12px] hover:bg-[#2C1810] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-[14px]">Assign</button>
                <button onClick={() => setShowAssignModal(false)} className="flex-1 border-2 border-[#E0DBD5] text-gray-600 font-bold py-3.5 rounded-[12px] hover:bg-gray-50 transition-colors text-[14px]">Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}

      {showStatusConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setShowStatusConfirm(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={32} />
              </div>
              <h3 className="text-[18px] font-extrabold text-[#2C1810] mb-2">Update Status?</h3>
              <p className="text-[14px] text-gray-600 font-medium mb-6">Update ticket status to <strong>{showStatusConfirm === 'in_progress' ? 'In Progress' : 'Resolved'}</strong>?</p>
              <div className="flex gap-3">
                <button onClick={confirmStatusUpdate} className="flex-1 bg-[#3D2B1F] text-white font-bold py-3.5 rounded-[12px] hover:bg-[#2C1810] transition-colors text-[14px]">Confirm</button>
                <button onClick={() => setShowStatusConfirm(null)} className="flex-1 border-2 border-[#E0DBD5] text-gray-600 font-bold py-3.5 rounded-[12px] hover:bg-gray-50 transition-colors text-[14px]">Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}
    </StaffLayout>
  );
}
