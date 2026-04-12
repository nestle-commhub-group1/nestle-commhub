/**
 * SubmitIssue.jsx
 *
 * The ticket submission form for retailers to report issues to Nestlé support.
 *
 * Key responsibilities:
 * - Lets the retailer select a category, add a description, and attach optional files
 * - Priority is NOT set by the retailer — it defaults to 'low' and is assigned by HQ/Staff
 * - Converts uploaded files to base64 strings before sending (avoids multipart/form-data complexity)
 * - Posts the completed ticket to /api/tickets and shows a success confirmation screen
 * - In development mode, simulates submission without calling the real API
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';
import RetailerLayout from '../../components/layout/RetailerLayout';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

/* ─── Category constants ──────────────────────────────────────────────────── */

// Category options shown in the dropdown — values match the backend enum exactly
const CATEGORIES = [
  { value: '', label: 'Select a category...' },
  { value: 'stock_out',       label: 'Stock Out' },
  { value: 'product_quality', label: 'Product Quality' },
  { value: 'logistics_delay', label: 'Logistics Delay' },
  { value: 'pricing_issue',   label: 'Pricing Issue' },
  { value: 'other',           label: 'Other / General' },
];

const defaultForm = {
  category: '', description: '', files: [],
};

export default function SubmitIssue() {
  const navigate = useNavigate();
  const [form, setForm]   = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  // When submitted=true, the form is replaced by a success confirmation screen
  const [submitted, setSubmitted] = useState(false);
  // Store the ticket number returned by the server to display in the confirmation
  const [submittedTicketNumber, setSubmittedTicketNumber] = useState('');
  const [charCount, setCharCount] = useState(0); // Live character counter for the description field
  const [dragging, setDragging]   = useState(false); // Visual feedback during file drag-and-drop

  /* ── Form validation ──────────────────────────────────────────────────── */

  function validate() {
    const e = {};
    if (!form.category)           e.category    = 'Please select a category.';
    if (!form.description.trim()) e.description = 'Please describe your issue.';
    return e;
  }

  /* ── File to base64 converter ─────────────────────────────────────────── */

  // Converts a File object (from the file input) into a base64 data URL string.
  // Base64 allows files to be sent as part of a regular JSON request body,
  // avoiding the need for multipart/form-data handling on the backend.
  const toBase64 = (file) => new Promise(
    (resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload  = () => resolve(reader.result)
      reader.onerror = reject
    }
  )

  // True when in dev mode AND using a dev token — disables real API calls
  const isDevMode = import.meta.env.DEV && localStorage.getItem('token')?.startsWith('dev-token-');

  /* ── Form submission ─────────────────────────────────────────────────── */

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // These maps convert the human-readable label (e.g., "Stock Out")
      // back to the backend enum value (e.g., "stock_out") in case the
      // form value somehow contains the label instead of the slug.
      const categoryMap = {
        "Stock Out":       "stock_out",
        "Product Quality": "product_quality",
        "Logistics Delay": "logistics_delay",
        "Pricing Issue":   "pricing_issue"
      };

      const selectedCategoryLabel = CATEGORIES.find(c => c.value === form.category)?.label;

      // Convert all attached files to base64 arrays — this runs in parallel using Promise.all
      const base64Files = await Promise.all((form.files || []).map(file => toBase64(file)));

      const payload = {
        category:    categoryMap[selectedCategoryLabel] || form.category,
        // priority is intentionally omitted — backend defaults to 'low'
        // and only HQ Admin / Sales Staff can change it
        description: form.description.trim(),
        attachments: base64Files || []
      };

      console.log("Submitting:", { categoryLabel: selectedCategoryLabel, payload, API_URL, token: !!token });

      // Dev mode simulation — return a fake ticket number without calling the API
      if (isDevMode) {
        setTimeout(() => {
          setSubmittedTicketNumber('TKT-VERIFY');
          setSubmitted(true);
          setLoading(false);
        }, 800);
        return;
      }

      // Real API call — send the ticket to the backend
      const response = await axios.post(`${API_URL}/api/tickets`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Get the auto-generated ticket number from the backend response
        setSubmittedTicketNumber(response.data.ticket.ticketNumber);
        // Switch to the success screen — the form disappears
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Error submitting ticket:', err);
      setErrors({ submit: err.response?.data?.message || 'Failed to submit issue. Please try again.' });
    } finally {
      if (!isDevMode) setLoading(false);
    }
  }

  // Add newly selected/dropped files to the existing file list
  function handleFiles(fileList) {
    const arr = Array.from(fileList);
    setForm(f => ({ ...f, files: [...f.files, ...arr] }));
  }

  // Reset everything back to the empty form state (used by "Submit Another Issue" button)
  function reset() { setForm(defaultForm); setCharCount(0); setSubmitted(false); setSubmittedTicketNumber(''); setErrors({}); }

  /* ── Success State ────────────────────────────────────────────────────── */

  // Once the ticket is created, replace the form with a confirmation card
  // showing the ticket number, SLA response time, and navigation options
  if (submitted) {
    return (
      <RetailerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="bg-white border border-[#E0DBD5] rounded-[24px] shadow-sm p-12 max-w-md w-full">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-[#2D7A4F]" />
            </div>
            <h2 className="text-[24px] font-extrabold text-[#2C1810] mb-2">Issue Submitted Successfully!</h2>
            <p className="text-[15px] text-gray-500 font-medium mb-1">Your ticket number is</p>
            <p className="text-[28px] font-extrabold text-[#2563EB] mb-4">{submittedTicketNumber}</p>
            <p className="text-[14px] text-gray-500 mb-8">
              Our team will review and respond to your ticket shortly. You'll be notified when there's an update.
            </p>
            <Link
              to="/retailer/tickets"
              className="block w-full bg-[#3D2B1F] text-white font-bold py-3.5 rounded-[12px] hover:bg-[#2C1810] transition-colors mb-3 text-[15px]"
            >
              View My Tickets
            </Link>
            <Link
              to="/retailer/dashboard"
              className="block w-full border-2 border-[#3D2B1F] text-[#3D2B1F] font-bold py-3 rounded-[12px] hover:bg-[#F5F3F0] transition-colors text-[15px] text-center mb-3"
            >
              Go to Dashboard
            </Link>
            <button
              onClick={reset}
              className="w-full text-[14px] font-medium text-gray-400 hover:text-gray-600 transition-colors py-2"
            >
              Submit Another Issue
            </button>
          </div>
        </div>
      </RetailerLayout>
    );
  }

  /* ── Form State ─────────────────────────────────────────────────────────── */

  return (
    <RetailerLayout>
      <div className="pb-10">
        {/* Dev mode banner — warnings developers they are seeing simulated data */}
        {isDevMode && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-[10px] text-[12px] font-bold flex items-center">
            <span className="mr-2">ℹ️</span> Dev mode — showing sample data
          </div>
        )}

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">Submit an Issue</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">Report a problem and our team will get back to you</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-white border border-[#E0DBD5] rounded-[20px] shadow-sm p-8 space-y-8">

            {/* Backend error message (e.g., server down) */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[12px] text-[14px] font-medium flex items-center space-x-2">
                <AlertCircle size={18} />
                <span>{errors.submit}</span>
              </div>
            )}

            {/* Category dropdown */}
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] uppercase tracking-widest mb-2">
                Issue Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={e => { setForm(f => ({ ...f, category: e.target.value })); setErrors(er => ({ ...er, category: undefined, submit: undefined })); }}
                className={`w-full border rounded-[10px] px-4 py-3 text-[15px] font-medium text-[#2C1810] bg-white focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 transition-colors ${errors.category ? 'border-red-400' : 'border-[#E0DBD5]'}`}
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {errors.category && <p className="text-red-500 text-[12px] mt-1.5 font-medium">{errors.category}</p>}
            </div>

            {/* Priority is managed by HQ Admin / Sales Staff — not shown to retailers */}

            {/* Description textarea with live character counter */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[12px] font-bold text-[#3D2B1F] uppercase tracking-widest">
                  Issue Description <span className="text-red-500">*</span>
                </label>
                <span className="text-[12px] text-gray-400 font-medium">{charCount}/500</span>
              </div>
              <textarea
                rows={5}
                maxLength={500}
                placeholder="Describe your issue in detail — include product names, quantities, dates, and any relevant context..."
                value={form.description}
                onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setCharCount(e.target.value.length); setErrors(er => ({ ...er, description: undefined, submit: undefined })); }}
                className={`w-full border rounded-[10px] px-4 py-3 text-[15px] font-medium text-[#2C1810] placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 transition-colors ${errors.description ? 'border-red-400' : 'border-[#E0DBD5]'}`}
              />
              {errors.description && <p className="text-red-500 text-[12px] mt-1.5 font-medium">{errors.description}</p>}
            </div>

            {/* File attachment area — supports both click-to-upload and drag-and-drop */}
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] uppercase tracking-widest mb-3">
                Attach Evidence <span className="text-gray-400 font-medium normal-case tracking-normal">(optional)</span>
              </label>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                // When files are dropped, add them to the form's file list
                onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                className={`border-2 border-dashed rounded-[14px] p-8 text-center transition-colors cursor-pointer ${dragging ? 'border-[#3D2B1F] bg-[#F5F3F0]' : 'border-[#D5CFC8] hover:border-[#3D2B1F] hover:bg-[#F8F7F5]'}`}
                onClick={() => document.getElementById('file-upload').click()}
              >
                {/* Hidden native file input — triggered by the visible upload area above */}
                <input id="file-upload" type="file" multiple accept="image/*,video/*,audio/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
                <div className="text-4xl mb-3">📎</div>
                <p className="text-[14px] font-semibold text-[#3D2B1F]">Click to upload or drag and drop</p>
                <p className="text-[12px] text-gray-500 mt-1">Photos, videos, voice notes. Max 10MB per file</p>
              </div>
              {/* Show list of selected files with individual remove buttons */}
              {form.files.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.files.map((f, i) => (
                    <div key={i} className="bg-[#F5F3F0] border border-[#E0DBD5] rounded-lg px-3 py-1.5 flex items-center space-x-2">
                      <span className="text-[13px] font-medium text-[#2C1810] max-w-[140px] truncate">{f.name}</span>
                      {/* Remove this specific file from the list */}
                      <button type="button" onClick={() => setForm(ff => ({ ...ff, files: ff.files.filter((_, j) => j !== i) }))} className="text-gray-400 hover:text-red-500 transition-colors text-xs font-bold">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>


          </div>



          {/* Submit button — disabled while submitting to prevent duplicate tickets */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-[#3D2B1F] text-white font-bold text-[16px] py-4 rounded-[14px] hover:bg-[#2C1810] active:scale-[0.99] transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Issue</span>
            )}
          </button>
        </form>
      </div>
    </RetailerLayout>
  );
}
