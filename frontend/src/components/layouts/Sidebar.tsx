import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, User, LogOut, Trophy } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Profile", to: "/profile", icon: User },
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#0E0E16] border-r border-[#2D2D3F] flex flex-col">
      <div className="px-6 py-5 border-b border-[#2D2D3F]">
        <div className="flex item-center gap-2">
          <Trophy className="w-5 h-5 text-indigo-400" />
          <span className="font-mono text-sm font-semibold text-white tracking-wide">
            CP Tracker
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, to, icon: Icon }) => {
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2.5 rounded-lg text-sm font-mono transition-colors ${isActive ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[#2D2D3F] space-y-1">
        <div className="px-3 py-2">
          <p className="font-mono text-xs text-white truncate">{user?.name}</p>
          <p className="font-mono text-xs text-slate-500 truncate">
            {user?.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-colors"
        >
            <LogOut className="w-4 h-4"/>
            Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;