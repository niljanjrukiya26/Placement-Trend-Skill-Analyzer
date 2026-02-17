import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authUtils } from '../utils/auth';
import { 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  User, 
  TrendingUp, 
  Code,
  Brain,
  Zap
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = authUtils.getUserRole();
  const userEmail = authUtils.getUserEmail();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    authUtils.clearAuthData();
    navigate('/login');
  };

  const handleProfileClick = () => {
    if (userRole === 'Student') {
      navigate('/student-profile');
      setMobileOpen(false);
      setShowProfileMenu(false);
    }
  };

  // Get initials from email
  const getInitials = (email) => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const isActive = (path) => location.pathname === path;

  const navItems = userRole === 'Student' ? [
    { path: '/student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/placement-trend', label: 'Placement Trends', icon: TrendingUp },
    { path: '/skill-demand', label: 'Domain Wise Skills', icon: Code },
    { path: '/skill-gap', label: 'Skill Gap Analysis', icon: Brain },
    { path: '/placement-prediction', label: 'Placement Prediction', icon: Zap },
  ] : [
    { path: '/tpo-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transition"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r-2 border-gray-200 z-40 shadow-xl w-72 ${mobileOpen ? 'translate-x-0 lg:translate-x-0' : '-translate-x-full lg:translate-x-0'} lg:block`}
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo */}
          <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 relative">
            <div className="flex items-center">
              {/* Logo Section */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden"
                >
                  <LayoutDashboard className="w-6 h-6 text-white relative z-10" />
                </div>
                
                <div className="flex flex-col">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    PlacementHub
                  </h1>
                  <p className="text-xs text-gray-600 font-medium">Analytics Platform</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-blue-50/30 to-indigo-50/30">
            <div className="space-y-2">
              {navItems.map((item, i) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium
                      ${active 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Avatar Profile at Bottom with Popup Menu */}
          <div className="p-4 border-t-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 relative" ref={menuRef}>
            {/* Popup Menu */}
            {showProfileMenu && (
              <div className="absolute bottom-full mb-2 left-4 right-4 bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                <div className="p-3 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <p className="text-sm font-bold text-gray-900 truncate">{userEmail?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-gray-600 truncate">{userEmail}</p>
                  <p className="text-xs text-blue-600 font-semibold mt-1">{userRole}</p>
                </div>
                
                {userRole === 'Student' && (
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 transition text-left"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">View Profile</span>
                  </button>
                )}
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition text-left border-t-2 border-gray-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}

            {/* Avatar Button */}
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`
                w-full flex items-center gap-3 p-3 rounded-xl transition-all
                hover:bg-white border-2 hover:shadow-md
                ${showProfileMenu ? 'bg-white border-blue-300 shadow-md' : 'border-transparent'}
              `}
            >
              <div className="relative">
                <div 
                  className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg ring-2 ring-blue-200"
                >
                  {getInitials(userEmail)}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold text-gray-900 truncate">{userEmail?.split('@')[0] || 'User'}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {userRole}
                </p>
              </div>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
