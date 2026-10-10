/** @format */

import { useEffect } from "react";
import { createBrowserRouter } from "react-router-dom";
import { RouterProvider } from "react-router-dom";
import { SidebarProvider } from "./context/SidebarProvider";

import Layout from "./components/Layout";
import AgendaDiaria from "./pages/AgendaDiaria";
import GestionPacientes from "./pages/GestionPacientes";
import GestionObrasSociales from "./pages/master/GestionObraSocial";
import GestionPracticas from "./pages/master/GestionPracticas";
import GestionTurnos from "./pages/GestionTurnos";

/**
 * App - Enrutador Principal Operativo (Sprint 1)
 * Conecta todas las pantallas operativas de M&V Turnos sin barreras de autenticación.
 */
function App() {
  useEffect(() => {
    const splash = document.getElementById("splash-screen");
    if (splash) {
      const timer = setTimeout(() => {
        splash.classList.add("oculto");
        setTimeout(() => splash.remove(), 400);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, []);

  const router = createBrowserRouter([
    //{ path: "/login", element: <Login />}

    {
      //element: <ProtectedRoutes />,
      children: [
        {
          path: "/",
          element: <Layout />,
          children: [
            { path: "", element: <AgendaDiaria /> },
            { path: "/pacientes", element: <GestionPacientes /> },
            { path: "/turnos", element: <GestionTurnos /> },
            {
              path: "/configuracion",
              children: [
                { path: "obras-sociales", element: <GestionObrasSociales /> },
                { path: "practicas", element: <GestionPracticas /> },
              ],
            },
          ],
        },
      ],
    },
  ]);

  return (
    //<AuthProvider>
    <SidebarProvider>
      <RouterProvider router={router} />
    </SidebarProvider>
    //</AuthProvider>
  );
}

export default App;
