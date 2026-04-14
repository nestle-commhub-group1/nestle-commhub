import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Bell, Menu, FileText, User, 
  LogOut, X, LayoutDashboard, Radio, PlusCircle
} from 'lucide-react';

const PromotionManagerLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [user, setUser] = useState({ fullName: 'Promotion Manager', initials: 'PM', role: 'promotion_manager', staffCategory: 'Promotion Manager', email: '' });
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const name = parsedUser.fullName || parsedUser.name || 'User';
        const parts = name.split(' ');
        const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name[0];
        setUser({ ...parsedUser, fullName: name, initials: initials.toUpperCase(), role: 'promotion_manager' });
      } catch (e) {}
    }

    const fetchNotifications = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.notifications) {
          setNotificationCount(data.notifications.filter(n => !n.read).length);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', path: '/promotion-manager/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Create Promotion', path: '/promotion-manager/create', icon: <PlusCircle size={20} /> },
    { label: 'Promotions Dashboard', path: '/promotion-manager/promotions', icon: <FileText size={20} /> },
    { label: 'Notifications', path: '#', icon: <Bell size={20} />, badge: notificationCount, action: () => setIsNotificationsOpen(true) },
    { label: 'Profile', path: '/promotion-manager/profile', icon: <User size={20} /> },
  ];

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
        {notificationCount > 0 && (
          <span className="absolute top-1 right-1 bg-nestle-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
            {notificationCount}
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
          <div className="h-12 w-12 rounded-full bg-white text-nestle-brown border-2 border-white flex flex-shrink-0 items-center justify-center text-lg font-black shadow-inner">
            {user.initials}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-black truncate text-[15px] tracking-tight">{user.fullName}</span>
            <span className="bg-[#166534] text-white text-[9px] font-black px-2.5 py-1 rounded-full w-max mt-1 tracking-widest border border-white/20 uppercase shadow-sm">
              {user.staffCategory || 'PROMOTION MANAGER'}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 pb-4">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
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
              </Link>
            )
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5 mx-2">
          <div className="px-4 py-2 mb-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] opacity-50">System v1.2.0-LATEST</p>
          </div>
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
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-nestle-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white">
                {notificationCount}
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

      {/* Notifications Panel (Simplified) */}
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
                {notificationCount > 0 && (
                  <span className="bg-nestle-danger text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{notificationCount}</span>
                )}
              </div>
              <button onClick={() => setIsNotificationsOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-center text-gray-400 italic font-medium">
              No new notifications.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PromotionManagerLayout;
