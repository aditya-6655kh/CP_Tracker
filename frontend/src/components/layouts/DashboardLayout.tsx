import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const DashboardLayout: React.FC = () => (
    <div className="min-h-screen bg-[#0A0A0F]">
        <Sidebar/>
        <main className="ml-60 min-h-screen">
            <Outlet/>
        </main>
    </div>
);

export default DashboardLayout;