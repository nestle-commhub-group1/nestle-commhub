import React, { useState } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreatePromotion = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'seasonal',
    startDate: '',
    endDate: '',
    discount: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/promotions', {
        ...formData,
        discount: formData.discount ? Number(formData.discount) : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Promotion created successfully');
      navigate('/promotion-manager/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create promotion');
      setLoading(false);
    }
  };

  return (
    // Reusing ManagerLayout since promotion manager is essentially a dashboard user
    <ManagerLayout>
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-3xl font-extrabold text-[#2C1810] mb-6">Create New Promotion</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
            <input 
              required type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
            <textarea 
              required className="w-full border border-gray-300 rounded-xl px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <select 
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="seasonal">Seasonal</option>
                <option value="discount">Discount</option>
                <option value="bundled">Bundled</option>
                <option value="flash_sale">Flash Sale</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Discount (%) (Optional)</label>
              <input 
                type="number" min="0" max="100" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
              <input 
                required type="date" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
              <input 
                required type="date" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button 
              type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Promotion'}
            </button>
          </div>
        </form>
      </div>
    </ManagerLayout>
  );
};

export default CreatePromotion;
