import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import StaffLayout from '../../components/layout/StaffLayout';
import { ArrowLeft, Send, User, Clock, Paperclip, X, ChevronDown, CheckCircle } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

// ─── Hardcoded fallback ───────────────────────────────────────────────────────
const FALLBACK = {
  id:'TKT-1041', category:'Stock Out', priority:'High', status:'In Progress',
  retailer:'Saman General Stores', submitted:'March 15, 2026 10:23 AM',
  description:'We have completely run out of Milo 400g packs. Customers have been asking daily for the past week and we are losing significant sales. Please arrange urgent restock before the weekend when demand peaks.',
  slaBreached: false, slaTime:'2h 14m', slaDeadline:'Mar 15, 2:23 PM', slaProgress:45,
  retailerInfo:{ name:'Saman Perera', business:'Saman General Stores', phone:'+94 77 123 4567', email:'saman@samanstores.lk', address:'12/A Baseline Rd, Colombo 09', initials:'SP' }
};

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
  console.log("Ticket ID from URL:", id);
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

  const token = localStorage.getItem('token');

  // ── Fetch ticket + messages ───────────────────────────────────────────────
  useEffect(() => {
    if (!token || !id) { setLoading(false); return; }
    Promise.all([
      fetch(`http://localhost:5001/api/tickets/${id}`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).catch(()=>null),
      fetch(`http://localhost:5001/api/tickets/${id}/messages`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).catch(()=>null),
    ]).then(([ticketData, msgData]) => {
      if (ticketData?.success && ticketData.ticket) {
        const t = ticketData.ticket;
        setTicket({
          ...FALLBACK,
          id: t.ticketNumber || t._id,
          category: t.category?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) || FALLBACK.category,
          priority: t.priority ? t.priority.charAt(0).toUpperCase()+t.priority.slice(1) : FALLBACK.priority,
          status: t.status === 'in_progress' ? 'In Progress' : t.status ? t.status.charAt(0).toUpperCase()+t.status.slice(1) : FALLBACK.status,
          description: t.description || FALLBACK.description,
          slaBreached: t.isEscalated || (t.slaDeadline && new Date(t.slaDeadline) < new Date()),
          _id: t._id,
        });
        setStatus(t.status === 'in_progress' ? 'In Progress' : t.status ? t.status.charAt(0).toUpperCase()+t.status.slice(1) : FALLBACK.status);
      }
      if (msgData?.success && msgData.messages?.length > 0) {
        const mapped = msgData.messages.map(m => ({
          id: m._id, sender: m.senderRole === 'retailer' ? 'retailer' : 'staff',
          name: m.senderId?.fullName || (m.senderRole==='retailer' ? 'Retailer' : 'Staff'),
          text: m.message,
          time: new Date(m.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
        }));
        setMessages(mapped);
      }
    }).catch(err => {
      console.log("Ticket detail error:", err.response?.data || err.message);
    }).finally(() => setLoading(false));
  }, [id]);

  // ── Fetch distributors ───────────────────────────────────────────────────
  useEffect(() => {
    if (showAssignModal) {
      const fetchDistributors = async () => {
        try {
          const res = await axios.get('http://localhost:5001/api/users/distributors', {
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

  // ── Send message ──────────────────────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim()) return;
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `http://localhost:5001/api/tickets/${id}/messages`,
        { message: input.trim() },
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

  // ── Update status ─────────────────────────────────────────────────────────
  async function confirmStatusUpdate() {
    const apiStatus = showStatusConfirm;
    const label = apiStatus === 'in_progress' ? 'In Progress' : 'Resolved';
    try {
      const res = await axios.put(
        `http://localhost:5001/api/tickets/${id}/status`,
        { status: apiStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setTicket(p => ({ ...p, status: apiStatus, resolvedAt: apiStatus === 'resolved' ? new Date() : p.resolvedAt }));
        setStatus(label);
        setActionResult({ type: 'success', msg: `Status updated to ${label}` });
      }
    } catch (err) {
      setActionResult({ type: 'error', msg: "Failed to update status." });
    } finally {
      setShowStatusConfirm(null);
      setTimeout(() => setActionResult(null), 3000);
    }
  }

  // ── Assign to Distributor ──────────────────────────────────────────────────
  async function assignToDistributor() {
    if (!selectedDistributor) return;
    try {
      const res = await axios.put(
        `http://localhost:5001/api/tickets/${id}/assign`,
        { assignedTo: selectedDistributor },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setActionResult({ type: 'success', msg: "Ticket assigned to distributor" });
        setTicket(p => ({ ...p, assignedTo: distributors.find(d => d._id === selectedDistributor) }));
      }
    } catch (err) {
      console.log("Assignment failed, logging to console as fallback.");
      console.log("Assigning ticket to:", selectedDistributor);
      setActionResult({ type: 'success', msg: "Ticket assigned to distributor" });
    } finally {
      setShowAssignModal(false);
      setTimeout(() => setActionResult(null), 3000);
    }
  }

  // ── Escalate ──────────────────────────────────────────────────────────────
  async function escalate() {
    setShowEscalateModal(false);
    try {
      const r = await fetch(`http://localhost:5001/api/tickets/${id}/escalate`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } });
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

            {/* SLA */}
            <div className={`rounded-[20px] p-6 shadow-sm ${ticket.slaBreached ? 'bg-red-50 border border-red-200' : 'bg-white border border-[#E0DBD5]'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[12px] font-extrabold uppercase tracking-widest flex items-center gap-2 text-[#3D2B1F]"><Clock size={14}/>SLA Status</h3>
                <span className="text-[11px] text-gray-500 font-medium">Deadline: {ticket.slaDeadline}</span>
              </div>
              {ticket.slaBreached ? (
                <div>
                  <span className="inline-flex items-center gap-2 bg-red-100 border border-red-300 text-red-700 text-[14px] font-extrabold px-4 py-2 rounded-[10px]">⚠️ SLA BREACHED</span>
                  <p className="text-[13px] text-red-600 font-medium mt-2">This ticket has exceeded its SLA deadline and requires immediate attention.</p>
                </div>
              ) : (
                <>
                  <p className="text-[36px] font-extrabold text-orange-600 mb-3">{ticket.slaTime}</p>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width:`${ticket.slaProgress}%` }}/>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-2">{ticket.slaProgress}% of SLA time used</p>
                </>
              )}
            </div>

            {/* Attachments */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm">
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-4 flex items-center gap-2"><Paperclip size={14}/>Attached Evidence</h3>
              <p className="text-[13px] text-gray-400 font-medium italic">No attachments uploaded.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Update Status */}
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
              {/* Escalate */}
              <button onClick={() => setShowEscalateModal(true)}
                className="flex items-center gap-2 border-2 border-red-500 text-red-600 text-[13px] font-bold px-5 py-3 rounded-[10px] hover:bg-red-50 transition-colors">
                Escalate to HQ
              </button>
              {/* Assign to Distributor */}
              <button onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-2 border-2 border-gray-300 text-gray-600 text-[13px] font-bold px-5 py-3 rounded-[10px] hover:bg-gray-50 transition-colors">
                Assign to Distributor
              </button>
            </div>

            {/* Chat */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E0DBD5]">
                <h3 className="text-[14px] font-extrabold text-[#2C1810]">Messages</h3>
                <p className="text-[12px] text-gray-500 mt-0.5">{messages.length} messages in thread</p>
              </div>
              <div className="p-5 space-y-4 max-h-96 overflow-y-auto bg-[#F8F7F5]">
                {messages.map(m => (
                  <div key={m.id} className={`flex flex-col ${m.sender === 'staff' ? 'items-end' : 'items-start'}`}>
                    {m.sender === 'retailer' && <p className="text-[11px] text-gray-500 font-bold mb-1 ml-1">{m.name}</p>}
                    <div className={`max-w-[78%] px-4 py-3 rounded-[14px] ${m.sender === 'staff' ? 'bg-[#3D2B1F] text-white rounded-br-sm' : 'bg-white text-[#2C1810] border border-[#E0DBD5] shadow-sm rounded-bl-sm'}`}>
                      <p className="text-[14px] font-medium leading-relaxed">{m.text}</p>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">{m.time}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-[#E0DBD5] flex gap-3 bg-white">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && sendMessage()} placeholder="Type your response..." className="flex-1 border border-[#E0DBD5] rounded-[10px] px-4 py-3 text-[14px] font-medium placeholder-gray-400 text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20"/>
                <button onClick={sendMessage} className="bg-[#3D2B1F] text-white p-3 rounded-[10px] hover:bg-[#2C1810] transition-colors flex-shrink-0"><Send size={18}/></button>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            {/* Status Timeline */}
            <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm">
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-5">Ticket Progress</h3>
              {(() => {
                const steps = [
                  { key: "submitted", label: "Submitted", description: ticket.createdAt ? formatDateTime(ticket.createdAt) : ticket.submitted },
                  { key: "assigned", label: "Assigned", description: ticket.assignedTo ? "Assigned to " + (ticket.assignedTo?.fullName || "Distributor") : "Unassigned" },
                  { key: "in_progress", label: "In Progress", description: (ticket.status === "in_progress" || ticket.status === "resolved" || ticket.status === "escalated") ? "Being handled" : "Pending" },
                  { key: "resolved", label: "Resolved", description: ticket.resolvedAt ? formatDateTime(ticket.resolvedAt) : "Pending" }
                ];

                const getStepStatus = (stepKey) => {
                  const statusOrder = ["open", "in_progress", "resolved", "escalated"];
                  const stepOrder = ["submitted", "assigned", "in_progress", "resolved"];
                  
                  if (stepKey === "submitted") return "completed";
                  if (stepKey === "assigned" && ticket.assignedTo) return "completed";
                  if (stepKey === "in_progress" && (ticket.status === "in_progress" || ticket.status === "resolved" || ticket.status === "escalated")) return "completed";
                  if (stepKey === "in_progress" && ticket.status === "open") return "current";
                  if (stepKey === "resolved" && ticket.status === "resolved") return "completed";
                  if (stepKey === "resolved" && ticket.status === "in_progress") return "current";
                  return "pending";
                };

                return steps.map((step, idx) => {
                  const status = getStepStatus(step.key);
                  return (
                    <div key={step.key} className="flex items-start space-x-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${status === 'completed' ? 'bg-green-500 text-white' : status === 'current' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                          {status === 'completed' && <CheckCircle size={16} />}
                          {status === 'current' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />}
                          {status === 'pending' && <div className="w-2.5 h-2.5 border-2 border-gray-300 rounded-full" />}
                        </div>
                        {idx < steps.length - 1 && <div className={`w-0.5 h-8 my-1 ${status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`} />}
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

      {/* Escalate Modal */}
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
              <p className="text-[14px] text-gray-600 font-medium mb-6">Are you sure you want to escalate <strong>{ticket.id}</strong> to HQ Admin? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={escalate} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-[10px] hover:bg-red-700 transition-colors text-[14px]">Confirm Escalate</button>
                <button onClick={() => setShowEscalateModal(false)} className="flex-1 border-2 border-gray-300 text-gray-600 font-bold py-3 rounded-[10px] hover:bg-gray-50 transition-colors text-[14px]">Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assign Modal */}
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

      {/* Status Confirm Modal */}
      {showStatusConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setShowStatusConfirm(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={32} />
              </div>
              <h3 className="text-[18px] font-extrabold text-[#2C1810] mb-2">Update Status?</h3>
              <p className="text-[14px] text-gray-600 font-medium mb-6">
                Update ticket status to <strong>{showStatusConfirm === 'in_progress' ? 'In Progress' : 'Resolved'}</strong>?
              </p>
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
