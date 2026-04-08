/**
 * MyTickets.jsx  (retailer)
 *
 * Displays all support tickets submitted by the currently logged-in retailer.
 *
 * Key responsibilities:
 * - Fetches real tickets from /api/tickets/my on mount
 * - Refetches automatically when the user returns to this tab/window
 * - Allows filtering by status tab and text search by ticket number or description
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';
import RetailerLayout from '../../components/layout/RetailerLayout';
import { Search, Loader2, AlertCircle } from 'lucide-react';

// Status filter tabs shown at the top of the ticket list
const TABS = ['All', 'Open', 'In Progress', 'Resolved', 'Escalated'];

/* ─── Styling helper functions ───────────────────────────────────────────── */

// Returns a Tailwind class string for the priority badge colour
const priorityClass = (p) => ({
  critical: 'bg-red-100 text-red-700 border border-red-200',
  high:     'bg-orange-100 text-orange-700 border border-orange-200',
  medium:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
  low:      'bg-gray-100 text-gray-600 border border-gray-200',
}[p?.toLowerCase()] || 'bg-gray-100 text-gray-600');

// Returns a Tailwind class string for the status badge colour
const statusClass = (s) => ({
  'open':        'bg-red-50 text-red-700 border border-red-200',
  'in_progress': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  'resolved':    'bg-green-50 text-green-700 border border-green-200',
  'escalated':   'bg-purple-100 text-purple-700 border border-purple-200',
}[s?.toLowerCase()] || 'bg-gray-50 text-gray-600');

// Returns a Tailwind class string for the category chip colour
const categoryColor = (c) => ({
  'stock_out':       'bg-red-50 text-red-600',
  'pricing_issue':   'bg-blue-50 text-blue-600',
  'logistics_delay': 'bg-orange-50 text-orange-600',
  'product_quality': 'bg-green-50 text-green-600',
}[c?.toLowerCase()] || 'bg-gray-50 text-gray-600');

/* ─── Display formatting helpers ─────────────────────────────────────────── */

// Convert "stock_out" → "Stock Out", "logistics_delay" → "Logistics Delay", etc.
const formatCategory = (cat) => {
  if (!cat) return "Unknown"
  return cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

// Convert "in_progress" → "In Progress", "open" → "Open", etc.
const formatStatus = (status) => {
  if (!status) return "Open"
  return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

// Capitalise the first letter of the priority: "medium" → "Medium"
const formatPriority = (priority) => {
  if (!priority) return "Medium"
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState('');
  const [activeTab, setActiveTab] = useState('All');

  // True only in local development when using a dev token (bypasses real API)
  const isDevMode = import.meta.env.DEV && localStorage.getItem('token')?.startsWith('dev-token-');

  /* ── Data fetching ────────────────────────────────────────────────────── */

  const fetchTickets = async () => {
    // In dev mode, return hardcoded sample tickets so the UI can be tested
    // without a running backend
    if (isDevMode) {
      setTickets([
        { _id: 'dev-1', ticketNumber: 'TKT-VERIFY', category: 'quality_issue', priority: 'medium', status: 'open', description: 'Final verification ticket', createdAt: new Date().toISOString() },
        { _id: 'dev-2', ticketNumber: 'TKT-1037', category: 'stock_out', priority: 'high', status: 'in_progress', description: 'Testing no attachment fix', createdAt: new Date().toISOString() }
      ]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // /api/tickets/my returns only tickets where retailerId === current user's ID
      const response = await axios.get(`${API_URL}/api/tickets/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data.tickets || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tickets when the component first loads (page visit or route change)
  useEffect(() => {
    fetchTickets();
  }, [isDevMode]);

  // Refetch tickets when the user switches back to this browser tab or window.
  // This ensures they see the latest status without needing to manually refresh,
  // e.g., after submitting a new ticket in another tab.
  useEffect(() => {
    const handleFocus = () => fetchTickets();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus); // Cleanup on unmount
  }, []);

  /* ── Summary counts for the four stat cards ──────────────────────────── */

  const summary = {
    total:    tickets.length,
    open:     tickets.filter(t => t.status === 'open').length,
    progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  /* ── Filtering logic ──────────────────────────────────────────────────── */

  const filtered = tickets.filter(t => {
    // Match the active status tab — "All" shows everything
    const statusTab = activeTab === 'All' ? true : formatStatus(t.status) === activeTab;

    // Text search matches against ticket number, description, or category
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (t.ticketNumber  || "").toLowerCase().includes(q) ||
      (t.description   || "").toLowerCase().includes(q) ||
      (t.category      || "").toLowerCase().includes(q);

    return statusTab && matchSearch;
  });

  return (
    <RetailerLayout>
      <div className="pb-10 space-y-6">
        {/* Dev mode warning banner */}
        {isDevMode && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-[10px] text-[12px] font-bold flex items-center">
            <span className="mr-2">ℹ️</span> Dev mode — showing sample data
          </div>
        )}

        {/* Page header */}
        <div>
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">My Tickets</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">Track all your submitted issues</p>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total',       value: summary.total,    accent: 'bg-[#F5F3F0]', text: 'text-[#2C1810]' },
            { label: 'Open',        value: summary.open,     accent: 'bg-red-50',    text: 'text-red-700' },
            { label: 'In Progress', value: summary.progress, accent: 'bg-yellow-50', text: 'text-yellow-700' },
            { label: 'Resolved',    value: summary.resolved, accent: 'bg-green-50',  text: 'text-green-700' },
          ].map(c => (
            <div key={c.label} className={`${c.accent} border border-[#E0DBD5] rounded-[16px] p-5`}>
              <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1">{c.label}</p>
              <p className={`text-[32px] font-extrabold leading-none ${c.text}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Search bar and "Submit Issue" shortcut button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ticket ID or description..."
              className="w-full pl-10 pr-4 py-3 border border-[#E0DBD5] rounded-[10px] text-[14px] font-medium text-[#2C1810] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 focus:border-[#3D2B1F] bg-white"
            />
          </div>
          <Link
            to="/retailer/submit-issue"
            className="bg-[#3D2B1F] text-white font-bold text-[14px] px-5 py-3 rounded-[10px] hover:bg-[#2C1810] transition-colors whitespace-nowrap flex items-center justify-center"
          >
            + Submit Issue
          </Link>
        </div>

        {/* Status filter tabs — each shows a count badge of matching tickets */}
        <div className="flex space-x-1 border-b border-[#E0DBD5] overflow-x-auto pb-px">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-[13px] font-bold whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab
                  ? 'border-[#3D2B1F] text-[#3D2B1F]'       // Active tab
                  : 'border-transparent text-gray-500 hover:text-[#3D2B1F]' // Inactive tab
                }`}
            >
              {tab}
              {/* Show count badge for non-All tabs */}
              {tab !== 'All' && (
                <span className="ml-1.5 bg-gray-100 text-gray-600 text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                  {tickets.filter(t => formatStatus(t.status) === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Ticket list — switches between loading, error, empty, and list states */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#E0DBD5] rounded-[20px]">
            <Loader2 className="w-10 h-10 text-[#3D2B1F] animate-spin mb-4" />
            <p className="text-[15px] font-bold text-gray-500">Loading your tickets...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-red-50 border border-red-100 rounded-[20px]">
            <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
            <p className="text-[16px] font-bold text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-[14px] font-bold text-[#3D2B1F] underline"
            >
              Try Again
            </button>
          </div>
        ) : tickets.length === 0 ? (
          // No tickets at all — show an empty state with a prompt to submit
          <div className="text-center py-20 bg-white border border-[#E0DBD5] rounded-[20px]">
            <p className="text-[40px] mb-3">🎫</p>
            <p className="text-[18px] font-bold text-[#2C1810]">No tickets yet.</p>
            <p className="text-[15px] text-gray-500 mt-2 mb-8">Submit your first issue to see it here!</p>
            <Link
              to="/retailer/submit-issue"
              className="bg-[#3D2B1F] text-white font-bold text-[15px] px-8 py-3.5 rounded-[12px] hover:bg-[#2C1810] transition-colors shadow-md inline-block"
            >
              + Submit Your First Issue
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          // Tickets exist but none match the current search/filter
          <div className="text-center py-16 bg-white border border-[#E0DBD5] rounded-[20px]">
            <p className="text-[40px] mb-3">🔍</p>
            <p className="text-[16px] font-bold text-[#2C1810]">No search results found</p>
            <p className="text-[14px] text-gray-500 mt-1">Try a different filter or search term</p>
          </div>
        ) : (
          // Ticket cards
          <div className="space-y-3">
            {filtered.map(ticket => (
              <div key={ticket._id} className="bg-white border border-[#E0DBD5] rounded-[16px] p-5 shadow-sm hover:shadow-md transition-shadow">
                {/* Top row: ticket number, category, priority, date */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[15px] font-extrabold text-[#2563EB]">{ticket.ticketNumber}</span>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${categoryColor(ticket.category)}`}>
                    {formatCategory(ticket.category)}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${priorityClass(ticket.priority)}`}>
                    {formatPriority(ticket.priority)}
                  </span>
                  <span className="text-[12px] text-gray-400 font-medium ml-auto">
                    {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {/* Description preview — clamped to 2 lines */}
                <p className="text-[14px] text-gray-600 font-medium line-clamp-2 mb-3 leading-relaxed">{ticket.description}</p>
                {/* Bottom row: status badge and "View Details" link */}
                <div className="flex items-center justify-between">
                  <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${statusClass(ticket.status)}`}>
                    {formatStatus(ticket.status)}
                  </span>
                  <Link
                    to={`/retailer/tickets/${ticket._id}`}
                    className="text-[13px] font-bold text-[#3D2B1F] hover:text-[#2C1810] transition-colors flex items-center space-x-1 group"
                  >
                    <span>View Details</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">›</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RetailerLayout>
  );
}
