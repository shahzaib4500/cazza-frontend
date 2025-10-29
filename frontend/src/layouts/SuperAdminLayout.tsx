import { NavBar } from "@/components/ClientComponents/NavBar";
import { Header } from "@/components/Header";
import { useState } from "react";
import { Outlet } from "react-router-dom";

export const SuperAdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9]">
      <Header onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - Always visible on large screens */}
        <div className="hidden lg:block">
          <NavBar />
        </div>

        {/* Mobile Sidebar - Overlay on small screens */}
        <div
          className={`lg:hidden fixed inset-y-0 left-0 z-50 bg-card border-r border-border transform transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <NavBar onNavigate={toggleSidebar} />
        </div>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={toggleSidebar}
          />
        )}

        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
