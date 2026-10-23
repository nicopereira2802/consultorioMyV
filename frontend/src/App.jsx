/** @format */

// * IMPORTACION DE RECURSOS DE REACT
import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// * IMPORTACION DE CONTEXTS
import { PinLockProvider } from "./context/PinLockContext";
import { SidebarProvider } from "./context/SidebarProvider";
import { FloatingButtonProvider } from "./context/BotonFlotanteContext";

// * IMPORTACION DE COMPONENTES DE SEGURIDAD Y AUTENTICACIÓN
import PinLogin from "./components/PinLogin";
import LoginMaestro from "./components/LoginMaestro";

// * IMPORTACION DE COMPONENTES Y VISTAS DE NEGOCIO
import Layout from "./components/layout/Layout";
import AgendaDiaria from "./features/turnos/AgendaDiaria";
import GestionTurnos from "./features/turnos/GestionTurnos";
import GestionPacientes from "./features/pacientes/GestionPacientes";
import GestionObrasSociales from "./features/obrasSociales/GestionObraSocial";
import GestionPracticas from "./features/practicas/GestionPracticas";
import GestionCobros from "./features/cobros/GestionCobro";

// * CREACION DEL APP
function App() {
  // * useEffect QUE CARGA SPLASHSCREEN
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

  // * DEFINICION DE RUTAS
  const router = createBrowserRouter([
    {
      path: "/login",
      element: (
        <LoginMaestro
          onLoginSuccess={() => {
            window.location.href = "/";
          }}
        />
      ),
    },
    {
      path: "/pin",
      element: (
        <PinLogin
          onUnlock={() => {
            window.location.href = "/";
          }}
        />
      ),
    },
    {
      path: "/",
      element: <Layout />,
      children: [
        { path: "", element: <AgendaDiaria /> },
        { path: "/pacientes", element: <GestionPacientes /> },
        { path: "/turnos", element: <GestionTurnos /> },
        { path: "/cobros", element: <GestionCobros /> },
        {
          path: "/configuracion",
          children: [
            { path: "obras-sociales", element: <GestionObrasSociales /> },
            { path: "practicas", element: <GestionPracticas /> },
          ],
        },
      ],
    },
  ]);

  return (
    <PinLockProvider>
      <SidebarProvider>
        <FloatingButtonProvider>
          <RouterProvider router={router} />
        </FloatingButtonProvider>
      </SidebarProvider>
    </PinLockProvider>
  );
}

export default App;
