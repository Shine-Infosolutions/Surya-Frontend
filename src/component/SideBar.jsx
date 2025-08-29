import React from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { Home, FileText, ShoppingCart, Package, AlertTriangle, LogOut, Users } from "lucide-react";
import { useAppContext } from "../context/AppContext"; // Apne context ka path adjust karna

const SideBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAppContext();

  const menuItems = [
    { name: "User Management", path: "/user", icon: <Users size={16} /> },
    { name: "Dashboard", path: "/", icon: <Home size={16} /> },
    { name: "Items List", path: "/items", icon: <Package size={16} /> },
    { name: "Orders", path: "/orders", icon: <ShoppingCart size={16} /> },
  ];

  const handleLogout = () => {
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white w-64 shadow-lg flex flex-col print:hidden h-full overflow-hidden">
        {/* Title */}
        <div className="p-5 border-b border-gray-700">
          <h1 className="text-lg font-bold tracking-wide">
            Surya Medical And Optical
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
      {/* Main content for nested routes */}
      <div className="flex-1 bg-gray-100 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default SideBar;
