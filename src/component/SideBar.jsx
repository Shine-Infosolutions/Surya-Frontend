import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { Home, FileText, ShoppingCart, Package, AlertTriangle, LogOut, Menu, X } from "lucide-react";
import { useAppContext } from "../context/AppContext"; // Apne context ka path adjust karna

const SideBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Get user role from localStorage
  const userRole = parseInt(localStorage.getItem("userRole")) || 2;
  
  // Define menu items based on role
  const allMenuItems = [
    { name: "Dashboard", path: "/", icon: <Home size={16} />, adminOnly: true },
    { name: "Items List", path: "/items", icon: <Package size={16} />, adminOnly: false },
    { name: "Orders", path: "/orders", icon: <ShoppingCart size={16} />, adminOnly: false },
  ];
  
  // Filter menu items based on role
  const menuItems = userRole === 1 
    ? allMenuItems // Admin sees all
    : allMenuItems.filter(item => !item.adminOnly); // Staff sees only non-admin items

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 z-50 shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-xs font-bold">
            {userRole === 1 ? "Surya Medical And Optical" : "Surya Medical And Optical Staff"}
          </h1>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-600 rounded-lg transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block bg-gradient-to-b from-gray-900 to-gray-800 text-white w-64 shadow-lg print:hidden h-full overflow-hidden">
        <div className="flex flex-col h-full">
        {/* Title */}
        <div className="p-5 border-b border-gray-700">
          <h1 className="text-lg font-bold tracking-wide">
            {userRole === 1 ? "Surya Medical And Optical" : "Surya Medical And Optical Staff"}
          </h1>
        </div>
        
        {/* Menu */}
        <div className="flex-1 p-5">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={index}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-all duration-200 w-full
                      ${isActive ? "bg-blue-600 shadow-md" : "hover:bg-gray-700"}
                    `}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        
        {/* Logout */}
        <div className="p-5 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition w-full justify-center"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-lg z-50 transform transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h1 className="text-xs font-bold">
            {userRole === 1 ? "Surya Medical And Optical" : "Surya Medical And Optical Staff"}
          </h1>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Mobile Menu */}
        <div className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={index}>
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-all duration-200 w-full
                      ${isActive ? "bg-blue-600 shadow-md" : "hover:bg-gray-700"}
                    `}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        
        {/* Mobile Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition w-full justify-center"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main content for nested routes */}
      <div className="flex-1 bg-gray-100 overflow-auto pt-16 md:pt-0">
        <Outlet />
      </div>
    </div>
  );
};

export default SideBar;
