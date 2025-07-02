import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  AlertTriangle, 
  Factory, 
  BarChart3, 
  Settings, 
  BookOpen,
  Menu
} from 'lucide-react';
import BriechLogo from './BriechLogo';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Flight Log', href: '/flight-log', icon: BookOpen },
    { name: 'Inspections', href: '/inspections', icon: Search },
    { name: 'Defects', href: '/defects', icon: AlertTriangle },
    { name: 'Production', href: '/production', icon: Factory },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Sidebar content
  const sidebarContent = (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 h-full flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <BriechLogo size={40} />
          <div>
            <p className="text-sm text-gray-500">Quality Control</p>
          </div>
        </div>
      </div>
      <nav className="mt-6 flex-1">
        <div className="px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setMobileOpen && setMobileOpen(false)}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="p-6 mt-auto">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-sm">BU</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Briech UAS</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block h-full">{sidebarContent}</div>
      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => setMobileOpen(false)}></div>
          <div className="relative z-50 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};

export default Sidebar; 