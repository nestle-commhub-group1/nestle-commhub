import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RetailerLayout from '../../components/layout/RetailerLayout';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'Select a category...' },
  { value: 'stock_out', label: 'Stock Out' },
  { value: 'product_quality', label: 'Product Quality' },
  { value: 'logistics_delay', label: 'Logistics Delay' },
  { value: 'pricing_issue', label: 'Pricing Issue' },
];

const PRIORITIES = [
  { value: 'low',      label: 'Low',      border: 'border-gray-300',   sel: 'bg-gray-100 border-gray-400 text-gray-800',   dot: 'bg-gray-400' },
  { value: 'medium',   label: 'Medium',   border: 'border-yellow-400', sel: 'bg-yellow-50 border-yellow-500 text-yellow-800', dot: 'bg-yellow-400' },
  { value: 'high',     label: 'High',     border: 'border-orange-400', sel: 'bg-orange-50 border-orange-500 text-orange-800', dot: 'bg-orange-400' },
  { value: 'critical', label: 'Critical', border: 'border-red-400',    sel: 'bg-red-50 border-red-500 text-red-700',      dot: 'bg-red-500' },
];

const SLA_LABELS = { low: '24 hours', medium: '8 hours', high: '4 hours', critical: '2 hours' };

const defaultForm = {
  category: '', priority: '', description: '',
  sms: true, push: true, email: false, files: [],
};

export default function SubmitIssue() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedTicketNumber, setSubmittedTicketNumber] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [dragging, setDragging] = useState(false);

  function validate() {
    const e = {};
    if (!form.category)    e.category    = 'Please select a category.';
    if (!form.priority)    e.priority    = 'Please select a priority level.';
    if (!form.description.trim()) e.description = 'Please describe your issue.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const categoryMap = {
        "Stock Out": "stock_out",
        "Product Quality": "product_quality",
        "Logistics Delay": "logistics_delay",
        "Pricing Issue": "pricing_issue"
      };

      const priorityMap = {
        "Low": "low",
        "Medium": "medium",
        "High": "high",
        "Critical": "critical"
      };

      // Since the form values are already snake_case/lowercase, we check if we need the map
      // But the user requested to use the map explicitly: category: categoryMap[selectedCategory]
      // We'll map the current labels to the values to follow the requirement
      const selectedCategoryLabel = CATEGORIES.find(c => c.value === form.category)?.label;
      const selectedPriorityLabel = PRIORITIES.find(p => p.value === form.priority)?.label;

      const payload = {
        category: categoryMap[selectedCategoryLabel] || form.category,
        priority: priorityMap[selectedPriorityLabel] || form.priority,
        description: form.description.trim()
      };

      const response = await axios.post('http://localhost:5001/api/tickets', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSubmittedTicketNumber(response.data.ticket.ticketNumber);
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Error submitting ticket:', err);
      setErrors({ submit: err.response?.data?.message || 'Failed to submit issue. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  function handleFiles(fileList) {
    const arr = Array.from(fileList);
    setForm(f => ({ ...f, files: [...f.files, ...arr] }));
  }

  function reset() { setForm(defaultForm); setCharCount(0); setSubmitted(false); setSubmittedTicketNumber(''); setErrors({}); }

  // ── Success State ─────────────────────────────────────────────────────────────
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
              Our team will respond within <strong>{SLA_LABELS[form.priority] || '4 hours'}</strong>. You'll be notified when there's an update.
            </p>
            <Link
              to="/retailer/tickets"
              className="block w-full bg-[#3D2B1F] text-white font-bold py-3.5 rounded-[12px] hover:bg-[#2C1810] transition-colors mb-3 text-[15px]"
            >
              View My Tickets
            </Link>
            <button
              onClick={reset}
              className="w-full border-2 border-[#3D2B1F] text-[#3D2B1F] font-bold py-3 rounded-[12px] hover:bg-[#F5F3F0] transition-colors text-[15px]"
            >
              Submit Another Issue
            </button>
          </div>
        </div>
      </RetailerLayout>
    );
  }

  // ── Form State ────────────────────────────────────────────────────────────────
  return (
    <RetailerLayout>
      <div className="pb-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">Submit an Issue</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">Report a problem and our team will get back to you</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-white border border-[#E0DBD5] rounded-[20px] shadow-sm p-8 space-y-8">
            
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[12px] text-[14px] font-medium flex items-center space-x-2">
                <AlertCircle size={18} />
                <span>{errors.submit}</span>
              </div>
            )}

            {/* Category */}
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

            {/* Priority */}
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] uppercase tracking-widest mb-3">
                Priority Level <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRIORITIES.map(p => {
                  const isSelected = form.priority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, priority: p.value })); setErrors(er => ({ ...er, priority: undefined, submit: undefined })); }}
                      className={`border-2 rounded-[12px] py-4 px-3 flex flex-col items-center transition-all ${isSelected ? p.sel + ' shadow-md scale-[1.02]' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                      <div className={`w-3 h-3 rounded-full mb-2 ${p.dot}`} />
                      <span className="text-[14px] font-bold">{p.label}</span>
                      {p.value !== 'low' && (
                        <span className="text-[11px] text-gray-500 mt-0.5">{SLA_LABELS[p.value]}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {errors.priority && <p className="text-red-500 text-[12px] mt-1.5 font-medium">{errors.priority}</p>}
            </div>

            {/* Description */}
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

            {/* Attach Evidence */}
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] uppercase tracking-widest mb-3">
                Attach Evidence <span className="text-gray-400 font-medium normal-case tracking-normal">(optional)</span>
              </label>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                className={`border-2 border-dashed rounded-[14px] p-8 text-center transition-colors cursor-pointer ${dragging ? 'border-[#3D2B1F] bg-[#F5F3F0]' : 'border-[#D5CFC8] hover:border-[#3D2B1F] hover:bg-[#F8F7F5]'}`}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <input id="file-upload" type="file" multiple accept="image/*,video/*,audio/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
                <div className="text-4xl mb-3">📎</div>
                <p className="text-[14px] font-semibold text-[#3D2B1F]">Click to upload or drag and drop</p>
                <p className="text-[12px] text-gray-500 mt-1">Photos, videos, voice notes. Max 10MB per file</p>
              </div>
              {form.files.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.files.map((f, i) => (
                    <div key={i} className="bg-[#F5F3F0] border border-[#E0DBD5] rounded-lg px-3 py-1.5 flex items-center space-x-2">
                      <span className="text-[13px] font-medium text-[#2C1810] max-w-[140px] truncate">{f.name}</span>
                      <button type="button" onClick={() => setForm(ff => ({ ...ff, files: ff.files.filter((_, j) => j !== i) }))} className="text-gray-400 hover:text-red-500 transition-colors text-xs font-bold">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Preference */}
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] uppercase tracking-widest mb-4">Contact Preference</label>
              <div className="space-y-3">
                {[
                  { key: 'sms',   label: 'SMS Notifications',   desc: 'Receive updates via text message' },
                  { key: 'push',  label: 'Push Notifications',  desc: 'Receive updates in-app' },
                  { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between bg-[#F8F7F5] border border-[#E0DBD5] rounded-[12px] px-5 py-4">
                    <div>
                      <p className="text-[14px] font-bold text-[#2C1810]">{label}</p>
                      <p className="text-[12px] text-gray-500 font-medium mt-0.5">{desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form[key] ? 'bg-[#2D7A4F]' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form[key] ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Warning notice */}
          {form.priority === 'critical' && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-[12px] px-5 py-4 flex items-start space-x-3">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-700 font-medium">Critical priority tickets will be escalated to HQ Admin automatically if not resolved within 2 hours.</p>
            </div>
          )}
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
