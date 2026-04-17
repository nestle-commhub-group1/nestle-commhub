import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../config/api';
import StockManagerLayout from '../../components/layout/StockManagerLayout';
import { Package, Plus, Search, Edit2, Trash2, X, Check } from 'lucide-react';

const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Dairy',
    stockQuantity: '',
    image: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingProduct) {
        await axios.put(`${API_URL}/api/products/${editingProduct._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/products`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', category: 'Dairy', stockQuantity: '', image: '' });
      fetchProducts();
    } catch (err) {
      alert('Operation failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stockQuantity: product.stockQuantity,
      image: product.image
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <StockManagerLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-nestle-brown">Manage Inventory</h1>
          <p className="text-gray-500 font-medium">Add, edit, or update Nestlé products and stock levels.</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="bg-nestle-brown text-white px-6 py-3 rounded-xl font-black flex items-center shadow-lg shadow-nestle-brown/20 hover:-translate-y-1 transition-all"
        >
          <Plus size={20} className="mr-2" />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price (LKR)</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0">
                        <img src={product.image} alt="" className="w-full h-full object-cover rounded-lg" />
                      </div>
                      <div>
                        <p className="font-bold text-nestle-brown">{product.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-nestle-brown">
                    {product.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${product.stockQuantity < 20 ? 'bg-red-500' : 'bg-green-500'}`}></span>
                      <span className="font-black text-nestle-brown">{product.stockQuantity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleEdit(product)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(product._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-8 py-6 bg-nestle-brown text-white flex justify-between items-center">
              <h2 className="text-xl font-black">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Product Name</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nestle-brown outline-none font-bold text-nestle-brown"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Description</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nestle-brown outline-none font-medium text-nestle-brown h-24"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Price (LKR)</label>
                  <input 
                    type="number" 
                    name="price" 
                    value={formData.price} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nestle-brown outline-none font-bold text-nestle-brown"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Category</label>
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nestle-brown outline-none font-bold text-nestle-brown appearance-none"
                  >
                    <option>Dairy</option>
                    <option>Confectionery</option>
                    <option>Beverages</option>
                    <option>Nutrition</option>
                    <option>Coffee</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Initial Stock</label>
                  <input 
                    type="number" 
                    name="stockQuantity" 
                    value={formData.stockQuantity} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nestle-brown outline-none font-bold text-nestle-brown"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Image URL</label>
                  <input 
                    name="image" 
                    value={formData.image} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nestle-brown outline-none font-medium text-nestle-brown text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <button className="w-full py-4 bg-nestle-brown text-white rounded-xl font-black text-lg mt-4 shadow-xl shadow-nestle-brown/20 flex items-center justify-center">
                <Check size={20} className="mr-2" />
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </StockManagerLayout>
  );
};

export default InventoryManagement;
