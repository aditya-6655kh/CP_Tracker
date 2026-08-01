import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#0E0E16] border-b border-[#2D2D3F] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-mono text-sm font-semibold text-white">
          CP Tracker
        </span>
      </div>

      {/* Main content — offset for sidebar on desktop, offset for top bar on mobile */}
      <main className="lg:ml-60 min-h-screen pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;