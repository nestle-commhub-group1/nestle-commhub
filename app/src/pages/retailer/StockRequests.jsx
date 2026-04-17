import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../config/api';
import RetailerLayout from '../../components/layout/RetailerLayout';
import { ShoppingBag, Search, Plus, Minus, ShoppingCart, Trash2, CheckCircle, Tag, Clock, Heart } from 'lucide-react';

const StockRequests = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shop'); // 'shop', 'history', 'favorites'
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchOrders();
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

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.product._id === product._id);
    if (existing) {
      setCart(cart.map(item => 
        item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product._id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const setQuantity = (productId, val) => {
    if (val === '') {
        setCart(cart.map(item => 
            item.product._id === productId ? { ...item, quantity: '' } : item
        ));
        return;
    }
    const num = parseInt(val);
    if (isNaN(num)) return;
    setCart(cart.map(item => 
      item.product._id === productId ? { ...item, quantity: Math.max(1, num) } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product._id !== productId));
  };

  const calculateDiscount = (quantity) => {
    if (quantity >= 1500) return 15;
    if (quantity >= 1000) return 10;
    if (quantity >= 500) return 5;
    return 0;
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const discount = calculateDiscount(item.quantity);
      return total + (item.product.price * item.quantity * (1 - discount / 100));
    }, 0);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    
    // Validate all items have a valid quantity >= 1
    const invalidItem = cart.find(item => !item.quantity || parseInt(item.quantity) < 1);
    if (invalidItem) {
        alert(`Please enter a valid quantity for ${invalidItem.product.name}`);
        return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/orders`, {
        items: cart.map(item => ({ product: item.product._id, quantity: parseInt(item.quantity) })),
        notes: ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Order placed successfully!');
      setCart([]);
      fetchOrders();
      setActiveTab('history');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place order';
      alert(msg);
    }
  };

  const handleReorder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/orders/${orderId}/reorder`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Reordered successfully!');
      fetchOrders();
      setActiveTab('history');
    } catch (err) {
      alert('Reorder failed');
    }
  };

  const toggleFavorite = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/orders/${orderId}/favorite`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
    } catch (err) {
      alert('Toggle favorite failed');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RetailerLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-nestle-brown">Order Stock</h1>
        <p className="text-gray-500 font-medium tracking-tight">Replenish your inventory with original Nestlé products.</p>
      </div>

      <div className="flex space-x-1 p-1 bg-gray-100 rounded-2xl w-max mb-8">
        {[
          { id: 'shop', label: 'Order Products', icon: <ShoppingBag size={16} /> },
          { id: 'history', label: 'Order History', icon: <Clock size={16} /> },
          { id: 'favorites', label: 'Favorites', icon: <Heart size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === tab.id ? 'bg-white text-nestle-brown shadow-sm' : 'text-gray-500 hover:text-nestle-brown'}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'shop' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Grid */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search products by name or category..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-nestle-brown outline-none font-bold text-nestle-brown shadow-sm"
              />
            </div>

            {/* Bulk Discount Banner */}
            <div className="bg-gradient-to-r from-nestle-brown to-[#5C4033] p-6 rounded-3xl text-white shadow-xl shadow-nestle-brown/10 relative overflow-hidden">
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black mb-1">Bulk Savings Event</h3>
                        <p className="text-white/80 font-medium">Order more and save more on select products.</p>
                        <div className="flex space-x-4 mt-4 text-[10px] font-black uppercase tracking-widest">
                            <span className="bg-white/20 px-3 py-1.5 rounded-lg border border-white/20">500+ units: 5% OFF</span>
                            <span className="bg-white/20 px-3 py-1.5 rounded-lg border border-white/20">1000+ units: 10% OFF</span>
                            <span className="bg-white/20 px-3 py-1.5 rounded-lg border border-white/20">1500+ units: 15% OFF</span>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <Tag size={64} className="opacity-20 -rotate-12" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map(product => (
                <div key={product._id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-all group">
                  <div className="h-40 bg-gray-50 rounded-2xl mb-4 overflow-hidden relative">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-nestle-brown text-[10px] font-black rounded-full shadow-sm">
                        {product.category}
                    </span>
                    {product.stockQuantity < 20 && (
                        <span className="absolute top-3 right-3 px-2.5 py-1 bg-red-500 text-white text-[9px] font-black rounded-full uppercase tracking-tighter animate-pulse shadow-sm">
                            Limited Stock
                        </span>
                    )}
                  </div>
                  <h3 className="font-black text-nestle-brown text-lg">{product.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1 mb-3 font-medium">{product.description}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Price per unit</span>
                        <span className="text-xl font-black text-nestle-brown">LKR {product.price.toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      className="bg-nestle-brown text-white p-3 rounded-2xl hover:bg-nestle-brown-hover transition-colors shadow-lg shadow-nestle-brown/20"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-8">
              <h2 className="text-xl font-black text-nestle-brown mb-6 flex items-center">
                <ShoppingCart className="mr-2 text-nestle-brown" size={24} />
                Shopping Cart
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-5" />
                  <p className="font-medium italic">Your cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="max-h-[350px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {cart.map(item => {
                      const discount = calculateDiscount(item.quantity);
                      return (
                        <div key={item.product._id} className="flex space-x-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                          <img src={item.product.image} className="w-16 h-16 rounded-xl bg-gray-50 p-2 object-contain" alt="" />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-black text-nestle-brown text-sm leading-tight">{item.product.name}</h4>
                              <button onClick={() => removeFromCart(item.product._id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="flex items-center space-x-3 mt-2">
                                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    <button onClick={() => updateQuantity(item.product._id, -1)} className="p-1 hover:bg-white rounded-md transition-colors"><Minus size={12} /></button>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={item.quantity} 
                                        onChange={(e) => setQuantity(item.product._id, e.target.value)}
                                        onBlur={(e) => {
                                            if (!e.target.value || parseInt(e.target.value) < 1) {
                                                setQuantity(item.product._id, 1);
                                            }
                                        }}
                                        className="w-12 bg-transparent text-center text-xs font-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button onClick={() => updateQuantity(item.product._id, 1)} className="p-1 hover:bg-white rounded-md transition-colors"><Plus size={12} /></button>
                                </div>
                                {discount > 0 && (
                                    <span className="text-[10px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full">-{discount}% Bulk</span>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 space-y-2 border-t border-gray-100">
                    <div className="flex justify-between text-gray-500 font-medium">
                      <span>Subtotal</span>
                      <span className="font-black">LKR {cart.reduce((t, i) => t + (i.product.price * i.quantity), 0).toLocaleString()}</span>
                    </div>
                    {cart.some(i => calculateDiscount(i.quantity) > 0) && (
                        <div className="flex justify-between text-green-600 font-medium">
                            <span>Bulk Discount</span>
                            <span className="font-black">-LKR {(cart.reduce((t, i) => t + (i.product.price * i.quantity), 0) - calculateTotal()).toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-black text-nestle-brown pt-2">
                      <span>Total</span>
                      <span>LKR {calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handlePlaceOrder}
                    className="w-full py-4 bg-nestle-brown text-white rounded-2xl font-black text-lg shadow-xl shadow-nestle-brown/20 hover:-translate-y-1 transition-all flex items-center justify-center"
                  >
                    Confirm Order
                    <CheckCircle size={20} className="ml-2" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 shadow-sm">
              <ShoppingBag size={64} className="mx-auto mb-4 opacity-5 text-nestle-brown" />
              <p className="font-black text-nestle-brown text-xl">No orders found</p>
              <p className="text-gray-500">Your order history will appear here once you place your first order.</p>
              <button 
                onClick={() => setActiveTab('shop')}
                className="mt-6 px-8 py-3 bg-nestle-brown text-white rounded-xl font-black"
              >
                Go Shopping
              </button>
            </div>
          ) : (
            orders.map(order => (
              <div key={order._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-nestle-brown/30 transition-all group">
                <div className="flex items-center space-x-5">
                   <div className="p-4 bg-gray-50 rounded-2xl text-nestle-brown group-hover:bg-nestle-brown group-hover:text-white transition-colors">
                      <ShoppingBag size={24} />
                   </div>
                   <div>
                      <div className="flex items-center space-x-3">
                        <span className="font-black text-nestle-brown">Order #{order._id.substring(order._id.length-8).toUpperCase()}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                          order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          order.status === 'accepted' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-green-50 text-green-600 border-green-100'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      <p className="text-sm font-black text-nestle-brown mt-2">LKR {order.totalAmount.toLocaleString()} • {order.items.length} items</p>
                   </div>
                </div>

                <div className="flex items-center space-x-3">
                   <button 
                     onClick={() => toggleFavorite(order._id)}
                     className={`p-3 rounded-2xl transition-all ${order.isFavorite ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-gray-50 text-gray-300 border border-gray-100 hover:text-red-400'}`}
                   >
                     <Heart size={20} fill={order.isFavorite ? 'currentColor' : 'none'} />
                   </button>
                   <button 
                     onClick={() => handleReorder(order._id)}
                     className="px-6 py-3 bg-nestle-brown text-white rounded-2xl font-black shadow-lg shadow-nestle-brown/10 hover:shadow-nestle-brown/20 flex items-center"
                   >
                     Reorder
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="space-y-4">
           {orders.filter(o => o.isFavorite).length === 0 ? (
              <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 shadow-sm">
                <Heart size={64} className="mx-auto mb-4 opacity-5 text-red-500" />
                <p className="font-black text-nestle-brown text-xl">No favorites yet</p>
                <p className="text-gray-500">Mark your frequent orders as favorite for quick one-click reordering.</p>
              </div>
           ) : (
              orders.filter(o => o.isFavorite).map(order => (
                <div key={order._id} className="bg-white p-6 rounded-3xl border border-red-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Reuse history card layout or simplified version */}
                    <div className="flex items-center space-x-5">
                      <div className="p-4 bg-red-50 rounded-2xl text-red-500">
                          <Heart size={24} fill="currentColor" />
                      </div>
                      <div>
                          <span className="font-black text-nestle-brown text-lg">Quick Order</span>
                          <p className="text-sm text-gray-500 font-medium italic mt-0.5">Order #{order._id.substring(order._id.length-8).toUpperCase()}</p>
                          <div className="flex items-center space-x-4 mt-2">
                             <div className="flex -space-x-2">
                                {order.items.slice(0, 3).map((item, idx) => (
                                    <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 p-1">
                                        <img src={item.product?.image} className="w-full h-full object-contain" alt="" title={item.product?.name} />
                                    </div>
                                ))}
                                {order.items.length > 3 && (
                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-nestle-brown text-white text-[10px] font-black flex items-center justify-center">
                                        +{order.items.length - 3}
                                    </div>
                                )}
                             </div>
                             <span className="font-black text-nestle-brown">LKR {order.totalAmount.toLocaleString()}</span>
                          </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                        <button onClick={() => toggleFavorite(order._id)} className="text-xs font-black text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest px-4">Remove</button>
                        <button 
                            onClick={() => handleReorder(order._id)}
                            className="px-8 py-3 bg-nestle-brown text-white rounded-2xl font-black shadow-lg shadow-nestle-brown/10 hover:shadow-nestle-brown/20"
                        >
                            Order Now
                        </button>
                    </div>
                </div>
              ))
           )}
        </div>
      )}
    </RetailerLayout>
  );
};

export default StockRequests;
