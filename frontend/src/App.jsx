/** @format */

// * IMPORTACION DE RECURSOS DE REACT
import { useEffect } from "react";
import { createBrowserRouter } from "react-router-dom";
import { RouterProvider } from "react-router-dom";

// * IMPORTACION DE CONTEXTS
import { SidebarProvider } from "./context/SidebarProvider";

// * IMPORTACION DE COMPONENTES
import Layout from "./components/layout/Layout";
import AgendaDiaria from "./features/turnos/AgendaDiaria";
import GestionTurnos from "./features/turnos/GestionTurnos";
import GestionPacientes from "./features/pacientes/GestionPacientes";
import GestionObrasSociales from "./features/obrasSociales/GestionObraSocial";
import GestionPracticas from "./features/practicas/GestionPracticas";
import GestionCobros from "./features/cobros/GestionCobro";
import GestionGastos from "./features/gastos/GestionGasto";
import GestionCaja from "./features/caja/GestionCaja";

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
            { path: "/cobros", element: <GestionCobros /> },
            { path: "/gastos", element: <GestionGastos /> },
            { path: "/caja", element: <GestionCaja /> },
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
