import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Bell, Menu, FileText, User, 
  LogOut, X, LayoutDashboard, Package, ShoppingBag, Truck, Map
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../../config/api';
import { formatTimeAgo } from '../../utils/dateUtils';

const StockManagerLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [user, setUser] = useState({ fullName: 'Stock Manager', initials: 'SM', role: 'stock_manager' });
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const name = parsedUser.fullName || parsedUser.name || 'User';
        const parts = name.split(' ');
        const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name[0];
        setUser({ ...parsedUser, fullName: name, initials: initials.toUpperCase() });
      } catch (e) {}
    }
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/notifications/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    
    setIsNotificationsOpen(false);

    // Navigation logic for Stock Manager
    if (notif.type === 'order') {
      navigate('/stock-manager/orders');
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/notifications/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.notifications) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { label: 'Dashboard', path: '/stock-manager/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Manage Inventory', path: '/stock-manager/inventory', icon: <Package size={20} /> },
    { label: 'Manage Orders', path: '/stock-manager/orders', icon: <ShoppingBag size={20} /> },
    { label: 'Profile', path: '/stock-manager/profile', icon: <User size={20} /> },
  ];

  const TopBar = () => (
    <div className="flex bg-nestle-brown text-white h-16 items-center justify-between px-4 lg:hidden sticky top-0 z-20">
      <button onClick={() => setIsSidebarOpen(true)} className="p-2">
        <Menu size={24} />
      </button>
      <div className="flex items-center justify-center h-full py-2">
        <img src="/nestle-logo.png" alt="Nestlé" className="h-full w-auto object-contain invert brightness-0" draggable="false" />
      </div>
      <button className="p-2 relative" onClick={() => setIsNotificationsOpen(true)}>
        <Bell size={24} />
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-nestle-brown text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between lg:justify-center h-[90px]">
          <div className="flex items-center justify-center w-full h-full">
            <img src="/nestle-logo.png" alt="Nestlé" className="h-12 w-auto object-contain invert brightness-0" draggable="false" />
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-300 hover:text-white absolute right-4">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-4 flex items-center space-x-4 mb-2">
          <div className="h-12 w-12 rounded-full bg-white text-nestle-brown border-2 border-white flex flex-shrink-0 items-center justify-center text-lg font-black">
            {user.initials}
          </div>
          <div className="flex flex-col">
            <span className="font-bold truncate text-[15px]">{user.fullName}</span>
            <span className="text-[10px] text-gray-300 uppercase tracking-wider font-bold">Stock Manager</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1 mt-4">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={idx} 
                to={item.path}
                className={`flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-white/10 text-white font-bold' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                {item.icon}
                <span className="text-[15px]">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5 mx-2">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3.5 px-4 py-3 w-full text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-bold text-[14px]"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <TopBar />
        
        <div className="hidden lg:flex absolute top-6 right-8 z-10">
          <button className="p-2 relative bg-white rounded-full shadow-sm hover:bg-gray-50 border border-gray-100 text-nestle-brown" onClick={() => setIsNotificationsOpen(true)}>
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-nestle-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <main className="flex-1 overflow-y-auto w-full p-4 lg:p-8 bg-[#F8F9FA]">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>
      {/* Notifications Panel */}
      {isNotificationsOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 transition-opacity backdrop-blur-sm"
            onClick={() => setIsNotificationsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col translate-x-0 transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between px-6 py-5 border-b border-nestle-border">
              <div className="flex items-center space-x-2">
                <Bell size={20} className="text-nestle-brown" />
                <h2 className="text-lg font-bold text-nestle-brown">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-nestle-danger text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="text-[11px] font-black text-nestle-brown-light hover:text-nestle-brown disabled:opacity-30 transition-colors uppercase tracking-widest bg-nestle-brown/5 px-3 py-1.5 rounded-lg"
                >
                  Mark all as read
                </button>
                <button 
                  onClick={clearAllNotifications}
                  className="text-[11px] font-black text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg border border-red-100/50"
                >
                  Clear All
                </button>
                <button onClick={() => setIsNotificationsOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-nestle-border">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Bell size={40} className="mb-2 opacity-20" />
                    <p className="text-sm font-medium italic">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-5 flex items-start space-x-4 transition-colors cursor-pointer hover:bg-gray-50 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className={`p-2 rounded-full flex-shrink-0 mt-0.5 ${!notif.isRead ? 'bg-white shadow-sm border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                        <Bell size={16} className={notif.type === 'order' ? "text-green-500" : "text-gray-500"} />
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <p className={`text-[14px] text-nestle-brown ${!notif.isRead ? 'font-medium' : ''} leading-snug`}>
                          {notif.message}
                        </p>
                        <p className="text-[12px] text-gray-500 mt-1.5">{formatTimeAgo(notif.createdAt)}</p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StockManagerLayout;
