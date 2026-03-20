import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Bell, Menu, FileText, Users, Radio, User,
  LogOut, X, LayoutDashboard, Loader2
} from 'lucide-react';
import axios from 'axios';
import { formatTimeAgo } from '../../utils/dateUtils';

const StaffLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [user, setUser] = useState({ fullName: 'User', initials: 'U', role: 'Sales Staff', email: '' });
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
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    } else {
      setUser({ fullName: 'Nadeeka Perera', initials: 'NP', role: 'Sales Staff', email: 'nadeeka.perera@nestle.com' });
    }
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('http://localhost:5001/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5001/api/notifications/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5001/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', path: '/staff/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'My Tickets', path: '/staff/tickets', icon: <FileText size={20} /> },
    { label: 'Retailer Directory', path: '/staff/directory', icon: <Users size={20} /> },
    { label: 'Broadcasts', path: '/staff/broadcasts', icon: <Radio size={20} /> },
    { label: 'Notifications', path: '#', icon: <Bell size={20} />, badge: 3, action: () => setIsNotificationsOpen(true) },
    { label: 'Profile', path: '/staff/profile', icon: <User size={20} /> },
  ];


  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ticket': return <FileText size={16} className="text-blue-500" />;
      case 'alert': return <FileText size={16} className="text-blue-500" />;
      case 'warning': return <div className="text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg></div>;
      case 'broadcast': return <div className="text-purple-500"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" /><path d="M7 7h.01" /></svg></div>; // Tag icon
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  const nestleLogoUrl = "https://www.nestle.com/sites/default/files/asset-library/documents/library/pictures/nestlelogotype.png";

  const TopBar = () => (
    <div className="flex bg-nestle-brown text-white h-16 items-center justify-between px-4 lg:hidden sticky top-0 z-20">
      <button onClick={() => setIsSidebarOpen(true)} className="p-2">
        <Menu size={24} />
      </button>
      <div className="flex items-center justify-center h-full py-2">
        <img src={nestleLogoUrl} alt="Nestlé" className="h-full w-auto object-contain invert brightness-0" draggable="false" />
      </div>
      <button className="p-2 relative" onClick={() => setIsNotificationsOpen(true)}>
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-nestle-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center border-2 border-nestle-brown">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-nestle-gray font-sans overflow-hidden">
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
            <img src={nestleLogoUrl} alt="Nestlé" className="h-12 w-auto object-contain invert brightness-0" draggable="false" />
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-300 hover:text-white absolute right-4">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-4 flex items-center space-x-4 mb-2">
          <div className="h-12 w-12 rounded-full bg-nestle-brown-hover border border-nestle-border/20 flex flex-shrink-0 items-center justify-center text-lg font-bold">
            {user.initials}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold truncate text-[15px]">{user.fullName}</span>
            <span className="bg-[#DBEAFE] text-[#1D4ED8] text-[10px] font-bold px-2 py-0.5 rounded-full w-max mt-1 tracking-wide">
              Sales Staff
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 pb-4">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path || (item.label === 'Home' && location.pathname === '/staff/dashboard');
            return item.path === '#' ? (
              <button
                key={idx}
                onClick={item.action}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors text-gray-300 hover:bg-nestle-brown-hover hover:text-white"
              >
                <div className="flex items-center space-x-3.5">
                  {item.icon}
                  <span className="font-medium text-[15px]">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-nestle-danger text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ) : (
              <Link
                key={idx}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-[#3D2B1F] text-white shadow-sm' : 'text-gray-300 hover:bg-nestle-brown-hover hover:text-white'}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <div className="flex items-center space-x-3.5">
                  {item.icon}
                  <span className="font-medium text-[15px]">{item.label}</span>
                </div>
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="bg-nestle-danger text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3.5 px-4 py-3 w-full text-gray-300 hover:bg-nestle-brown-hover hover:text-white rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium text-[15px]">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <TopBar />

        {/* Top Right Desktop Notifications Icon */}
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

        <main className="flex-1 overflow-y-auto w-full p-4 lg:p-8">
          <div className="max-w-[1000px] mx-auto h-full pt-2 lg:pt-0">
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
                  className="text-sm font-medium text-gray-500 hover:text-nestle-brown disabled:opacity-50 transition-colors"
                >
                  Mark all as read
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
                      onClick={() => !notif.read && markAsRead(notif._id)}
                      className={`p-5 flex items-start space-x-4 transition-colors cursor-pointer hover:bg-gray-50 ${!notif.read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className={`p-2 rounded-full flex-shrink-0 mt-0.5 ${!notif.read ? 'bg-white shadow-sm border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <p className={`text-[14px] text-nestle-brown ${!notif.read ? 'font-medium' : ''} leading-snug`}>
                          {notif.text}
                        </p>
                        <p className="text-[12px] text-gray-500 mt-1.5">{formatTimeAgo(notif.createdAt)}</p>
                      </div>
                      {!notif.read && (
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

export default StaffLayout;
