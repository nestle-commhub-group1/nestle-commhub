import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../config/api';
import RetailerLayout from '../../components/layout/RetailerLayout';
import { ShoppingBag, Search, Plus, Minus, ShoppingCart, Trash2, CheckCircle, Tag, Clock, Heart, TrendingUp, Flame } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const StockRequests = () => {
  const { language, t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shop'); // 'shop', 'history', 'favorites'
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userCredits, setUserCredits] = useState(0);
  const [useCredits, setUseCredits] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchUserCredits();
  }, []);

  const fetchUserCredits = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUserCredits(res.data.user?.credits || 0);
        // Also sync to localStorage for other components
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
    }
  };

  // Refetch when user navigates back or tab gains focus
  useEffect(() => {
    const handleFocus = () => fetchUserCredits();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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
    const cartTotal = cart.reduce((total, item) => {
      const discount = calculateDiscount(item.quantity);
      return total + (item.product.price * item.quantity * (1 - discount / 100));
    }, 0);

    if (useCredits) {
      return Math.max(0, cartTotal - userCredits);
    }
    return cartTotal;
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
        notes: '',
        useCredits: useCredits
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(t('Order placed successfully!'));
      setCart([]);
      setUseCredits(false);
      fetchOrders();
      fetchUserCredits();
      setActiveTab('history');
    } catch (err) {
      const msg = err.response?.data?.message || t('Failed to place order');
      alert(msg);
    }
  };

  const handleReorder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/orders/${orderId}/reorder`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(t('Reordered successfully!'));
      fetchOrders();
      setActiveTab('history');
    } catch (err) {
      alert(t('Reorder failed'));
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
      alert(t('Toggle favorite failed'));
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const locale = language === 'si' ? 'si-LK' : language === 'ta' ? 'ta-LK' : 'en-LK';
  const formatDate = (date) => new Intl.DateTimeFormat(locale).format(new Date(date));

  return (
    <RetailerLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-nestle-brown">{t('Order Stock')}</h1>
          <p className="text-gray-500 font-medium tracking-tight">{t('Replenish your inventory with original Nestlé products.')}</p>
        </div>
        
        {/* Points Display Card */}
        <div className="bg-white border border-nestle-brown/20 rounded-[24px] p-5 flex items-center space-x-4 shadow-sm min-w-[240px]">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Available Points')}</p>
            <p className="text-2xl font-black text-nestle-brown">{userCredits.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-full sm:w-max mb-8 overflow-x-auto">
        {[
          { id: 'shop', label: t('Order Products'), icon: <ShoppingBag size={16} /> },
          { id: 'history', label: t('Order History'), icon: <Clock size={16} /> },
          { id: 'favorites', label: t('Favorites'), icon: <Heart size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex items-center space-x-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === tab.id ? 'bg-white text-nestle-brown shadow-sm' : 'text-gray-500 hover:text-nestle-brown'}`}
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
                placeholder={t('Search products by name or category...')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-nestle-brown outline-none font-bold text-nestle-brown shadow-sm"
              />
            </div>

            {/* Bulk Discount Banner */}
            <div className="bg-gradient-to-r from-nestle-brown to-[#5C4033] p-6 rounded-3xl text-white shadow-xl shadow-nestle-brown/10 relative overflow-hidden">
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black mb-1">{t('Bulk Savings Event')}</h3>
                        <p className="text-white/80 font-medium">{t('Order more and save more on select products.')}</p>
                        <div className="flex space-x-4 mt-4 text-[10px] font-black uppercase tracking-widest">
                            <span className="bg-white/20 px-3 py-1.5 rounded-lg border border-white/20">500+ {t('Items')}: 5% {t('OFF')}</span>
                            <span className="bg-white/20 px-3 py-1.5 rounded-lg border border-white/20">1000+ {t('Items')}: 10% {t('OFF')}</span>
                            <span className="bg-white/20 px-3 py-1.5 rounded-lg border border-white/20">1500+ {t('Items')}: 15% {t('OFF')}</span>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <Tag size={64} className="opacity-20 -rotate-12" />
                    </div>
                </div>
            </div>

           {/* High Demand Section (Separated) */}
        {products.some(p => p.howStatus?.isHOW) && !searchQuery && (
          <div className="mb-10 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <Flame size={20} className="text-orange-600" />
                </div>
                <h2 className="text-[18px] font-black text-[#2C1810] uppercase tracking-wider">{t('High Demand Items')}</h2>
              </div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                {t('Trending Now')}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.filter(p => p.howStatus?.isHOW).map(product => (
                <div key={product._id} className="stock-product-card stock-product-card-hot bg-gradient-to-br from-orange-50/50 to-white p-5 rounded-[28px] border-2 border-orange-100 shadow-sm flex flex-col hover:shadow-lg transition-all group relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-orange-100/50 rounded-full blur-2xl group-hover:bg-orange-200/50 transition-colors"></div>
                  
                  <div className="stock-product-image h-40 bg-white/60 backdrop-blur-sm rounded-2xl mb-4 overflow-hidden relative text-[#2C1810]">
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-orange-600 text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-orange-600/20 flex items-center z-20 animate-pulse">
                      <TrendingUp size={10} className="mr-1" />
                      {t('Hot Item')}
                    </span>
                    <span className="stock-category-chip absolute top-10 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-nestle-brown text-[10px] font-black rounded-full shadow-sm">
                        {product.category}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h3 className="stock-product-title text-[16px] font-black text-[#2C1810] group-hover:text-orange-600 transition-colors line-clamp-1">{product.name}</h3>
                    <p className="stock-product-desc text-[12px] text-gray-500 mt-1 line-clamp-2 leading-relaxed h-8 font-medium">
                        {product.description}
                    </p>
                    
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="stock-product-meta text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('Price per unit')}</p>
                        <p className="stock-product-price text-[17px] font-black text-[#2C1810]">LKR {product.price.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => addToCart(product)}
                        className="w-10 h-10 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group-hover:rotate-12"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 border-b border-gray-100"></div>
          </div>
        )}

        {/* Regular Products Grid */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-black text-[#2C1810] uppercase tracking-wider">
            {searchQuery ? t('Search Results') : t('Regular Products')}
          </h2>
          <p className="text-[12px] text-gray-400 font-bold">{filteredProducts.filter(p => !p.howStatus?.isHOW || searchQuery).length} {t('Items')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.filter(p => !p.howStatus?.isHOW || searchQuery).map((product) => (
                <div key={product._id} className="stock-product-card bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-all group">
                  <div className="stock-product-image h-40 bg-gray-50 rounded-2xl mb-4 overflow-hidden relative text-[#2C1810]">
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                    />
                    <span className="stock-category-chip absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-nestle-brown text-[10px] font-black rounded-full shadow-sm">
                        {product.category}
                    </span>
                    {product.stockQuantity < 20 && (
                        <span className="absolute top-3 right-3 px-2.5 py-1 bg-red-500 text-white text-[9px] font-black rounded-full uppercase tracking-tighter animate-pulse shadow-sm">
                            {t('Limited Stock')}
                        </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h3 className="stock-product-title text-[16px] font-black text-[#2C1810] group-hover:text-nestle-brown transition-colors line-clamp-1">{product.name}</h3>
                    <p className="stock-product-desc text-[12px] text-gray-500 mt-1 line-clamp-2 leading-relaxed h-8 font-medium">
                        {product.description}
                    </p>
                    
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="stock-product-meta text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('Price per unit')}</p>
                        <p className="stock-product-price text-[17px] font-black text-[#2C1810]">LKR {product.price.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => addToCart(product)}
                        className="w-10 h-10 bg-[#3D2B1F] hover:bg-[#2C1810] text-white rounded-xl shadow-lg shadow-[#3D2B1F]/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
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
                {t('Shopping Cart')}
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-5" />
                  <p className="font-medium italic">{t('Your cart is empty.')}</p>
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
                    {/* NEW: Credit System */}
                    <div className="bg-nestle-brown/5 p-4 rounded-2xl border border-nestle-brown/10 mb-4">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-nestle-brown font-black uppercase tracking-widest">{t('Loyalty Points')}</span>
                          <span className="text-[15px] font-black text-nestle-brown">{userCredits.toLocaleString()} {t('Points Available')}</span>
                        </div>
                        <button 
                          onClick={() => setUseCredits(!useCredits)}
                          disabled={userCredits === 0}
                          className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                            useCredits ? 'bg-nestle-brown text-white' : 'bg-white border border-nestle-brown text-nestle-brown hover:bg-nestle-brown/5'
                          } ${userCredits === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {useCredits ? t('Applied') : t('Apply')}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between text-gray-500 font-medium">
                      <span>{t('Subtotal')}</span>
                      <span className="font-black">LKR {cart.reduce((t, i) => t + (i.product.price * i.quantity), 0).toLocaleString()}</span>
                    </div>
                    {cart.some(i => calculateDiscount(i.quantity) > 0) && (
                        <div className="flex justify-between text-green-600 font-medium">
                            <span>{t('Bulk Discount')}</span>
                            <span className="font-black">-LKR {(cart.reduce((t, i) => t + (i.product.price * i.quantity), 0) - cart.reduce((total, item) => {
                              const discount = calculateDiscount(item.quantity);
                              return total + (item.product.price * item.quantity * (1 - discount / 100));
                            }, 0)).toLocaleString()}</span>
                        </div>
                    )}
                    {useCredits && userCredits > 0 && (
                        <div className="flex justify-between text-nestle-brown font-medium">
                            <span>{t('Points Discount')}</span>
                            <span className="font-black">-LKR {Math.min(userCredits, cart.reduce((total, item) => {
                              const discount = calculateDiscount(item.quantity);
                              return total + (item.product.price * item.quantity * (1 - discount / 100));
                            }, 0)).toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-black text-nestle-brown pt-2">
                      <span>{t('Total')}</span>
                      <span>LKR {calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handlePlaceOrder}
                    className="w-full py-4 bg-nestle-brown text-white rounded-2xl font-black text-lg shadow-xl shadow-nestle-brown/20 hover:-translate-y-1 transition-all flex items-center justify-center"
                  >
                    {t('Confirm Order')}
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
              <p className="font-black text-nestle-brown text-xl">{t('No orders found')}</p>
              <p className="text-gray-500">{t('Your order history will appear here once you place your first order.')}</p>
              <button 
                onClick={() => setActiveTab('shop')}
                className="mt-6 px-8 py-3 bg-nestle-brown text-white rounded-xl font-black"
              >
                {t('Go Shopping')}
              </button>
            </div>
          ) : (
            orders.map(order => (
              <div 
                key={order._id} 
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-nestle-brown/30 transition-all group cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
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
                      <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-widest">{formatDate(order.createdAt)} {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      <p className="text-sm font-black text-nestle-brown mt-2">LKR {order.totalAmount.toLocaleString()} • {order.items.length} {t('Items')}</p>
                   </div>
                </div>

                <div className="flex items-center space-x-3" onClick={e => e.stopPropagation()}>
                   <button 
                     onClick={() => toggleFavorite(order._id)}
                     className={`p-3 rounded-2xl transition-all ${order.isFavorite ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-gray-50 text-gray-300 border border-gray-100 hover:text-red-400'}`}
                   >
                     <Heart size={20} fill={order.isFavorite ? 'currentColor' : 'none'} />
                   </button>
                   <button 
                     onClick={() => setSelectedOrder(order)}
                     className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-black hover:bg-gray-200 transition-all"
                   >
                     {t('View Details')}
                   </button>
                   <button 
                     onClick={() => handleReorder(order._id)}
                     className="px-6 py-3 bg-nestle-brown text-white rounded-2xl font-black shadow-lg shadow-nestle-brown/10 hover:shadow-nestle-brown/20 flex items-center"
                   >
                     {t('Reorder')}
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="bg-[#3D2B1F] p-6 text-white flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">{t('Order Details')}</p>
                <h3 className="text-xl font-black">#{selectedOrder._id.substring(selectedOrder._id.length-8).toUpperCase()}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-16 h-16 bg-white rounded-xl p-2 border border-gray-100 shrink-0">
                      <img src={item.product?.image} className="w-full h-full object-contain" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[#2C1810] text-[15px] truncate">{item.product?.name}</p>
                      <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">{item.product?.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#2C1810] text-[15px]">{item.quantity} {t('Items')}</p>
                      <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">LKR {(item.priceAtTime * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-[#FAFAF9] border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 px-3 py-1 bg-white rounded-full border border-gray-100 shadow-sm">
                   <div className={`w-2 h-2 rounded-full ${
                      selectedOrder.status === 'pending' ? 'bg-amber-500' :
                      selectedOrder.status === 'accepted' ? 'bg-blue-500' : 'bg-green-500'
                   }`}></div>
                   <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">{selectedOrder.status}</span>
                </div>
                <p className="text-[20px] font-black text-[#2C1810]">{t('Total')}: LKR {selectedOrder.totalAmount.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => { handleReorder(selectedOrder._id); setSelectedOrder(null); }}
                className="w-full py-4 bg-[#3D2B1F] hover:bg-[#2C1810] text-white rounded-2xl font-black transition-all flex items-center justify-center space-x-2 shadow-lg shadow-black/10"
              >
                <Plus size={18} />
                <span>{t('Reorder All Items')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="space-y-4">
           {orders.filter(o => o.isFavorite).length === 0 ? (
              <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 shadow-sm">
                <Heart size={64} className="mx-auto mb-4 opacity-5 text-red-500" />
                <p className="font-black text-nestle-brown text-xl">{t('No favorites yet')}</p>
                <p className="text-gray-500">{t('Mark your frequent orders as favorite for quick one-click reordering.')}</p>
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
                          <span className="font-black text-nestle-brown text-lg">{t('Quick Order')}</span>
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
                        <button onClick={() => toggleFavorite(order._id)} className="text-xs font-black text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest px-4">{t('Remove')}</button>
                        <button 
                            onClick={() => handleReorder(order._id)}
                            className="px-8 py-3 bg-nestle-brown text-white rounded-2xl font-black shadow-lg shadow-nestle-brown/10 hover:shadow-nestle-brown/20"
                        >
                            {t('Order Now')}
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
