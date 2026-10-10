/** @format */

import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useSidebar } from "../context/SidebarProvider";

export default function Layout() {
  const { isOpen } = useSidebar();
  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Sidebar PC */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Contenido principal */}
      <main
        className={`flex-1 w-full transition-all text-black duration-300 ${isOpen ? "md:pl-72.5" : "md:pl-20"}`}
      >
        <Outlet />
      </main>

      {/* Navegación móvil */}
          <div className="block md:hidden">
            <BottomNav />
          </div>
    </div>
  );
}
