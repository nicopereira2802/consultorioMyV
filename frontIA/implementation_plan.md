# Plan de Implementación: Frontend Odontológico (React + Vite + Tailwind + Schedule-X)

Implementación del frontend en la carpeta `frontIA` (con enlace a `frotIA`), consumiendo el backend Node/Express/MySQL existente, integrando `@schedule-x/react` para la visualización de agenda y replicando con precisión de píxel las pantallas de las 4 imágenes provistas.

---

## 1. Análisis de Requerimientos y Diseño

### Pantallas de Referencia (según imágenes):
1. **Calendario Principal (Imagen 1)**:
   - Encabezado: Logo de muela estilizada en cian/azul, título "Calendario", botón rojo "Volver", y botón hamburguesa para navegar entre pantallas.
   - Selector de vistas: `[Diaria]`, `[Semanal]`, `[Mensual]`.
   - Navegación de mes: "Septiembre 2026:" con botones circulares/redondeados `<` y `>`.
   - Grilla mensual idéntica a la imagen: celdas redondeadas con borde sutil, indicación de fecha ("15/09"), y etiqueta de estado con color semántico:
     - **Gris**: Días previos / sin actividad.
     - **Verde suave** (`#A7F3D0`): `Libre`
     - **Amarillo suave** (`#FDE047`): `Ocupado`
     - **Rojo coral** (`#FCA5A5`): `Lleno`
   - En vistas **Diaria** y **Semanal**: integración interactiva con **Schedule-X** (`@schedule-x/react`) mostrando los turnos con franjas horarias, datos del paciente y estado.
   - **Botón flotante verde con '+'**: para registrar un turno de forma rápida.

2. **Registrar Turno (Imagen 2)**:
   - Encabezado: Logo + "Registrar turno", botones superiores `[Cancelar]` (rojo) y `[Confirmar]` (verde claro).
   - Fila de paciente: Campo de búsqueda autocompletable con placeholder `Ej: "Gómez" o "38456789"...` y botón verde azulado `[Registrar nuevo]`.
   - Sección "Día:": Calendario interactivo mensual en el que se hace clic sobre el día deseado.
   - Controles inferiores:
     - "Hora de Inicio:": selector con visualizador (ej. `9:00`) y botones `[-]` (rojo) y `[+]` (verde).
     - "N° de módulos:": contador con visualizador (ej. `1`) y botones `[-]` (rojo) y `[+]` (verde).
   - Guarda el turno vía `POST /api/turnos`.

3. **Pacientes (Imagen 3)**:
   - Encabezado: Logo + "Pacientes", botones `[Volver]` (rojo) y `[Registrar nuevo]` (verde claro).
   - Barra de búsqueda: `Buscar:` con input `“12345678” o “Gomez”...` y botón `[Buscar]`.
   - Tabla con cabecera gris: `DNI`, `Nombre`, `Saldo`, `Obra Social`, `Turnos`.
   - Filas con botón verde azulado `[Historial]` para ver turnos del paciente.

4. **Registrar Paciente (Imagen 4)**:
   - Encabezado: Logo + "Registrar Paciente", botones `[Volver]` (rojo) y `[Confirmar]` (verde claro).
   - Formulario en dos columnas:
     - Columna izquierda: `Nombre`, `DNI`, `Fecha de Nacimiento`, `Telefono`, `Domicilio`.
     - Columna derecha: `Obra social` (desplegable con obras sociales reales del backend), `N° de socio`, `Grupo familiar`.
   - Guarda vía `POST /api/pacientes` y asocia la obra social en `paciente_obra_social`.

---

## 2. Ajustes Clave en el Backend para Soporte Completo

> [!NOTE]
> Detectamos dos inconsistencias en el backend existente que deben corregirse para que la comunicación funcione perfectamente:
> 1. En `backend/models/Turno.model.js`: La tabla en MySQL se llama `turno` (singular), pero Sequelize tenía configurado `tableName: "turnos"`. Se alineará a `tableName: "turno"`.
> 2. En `backend/controllers/Turno.controller.js`: El método `createTurno` recibía campos incompatibles (`profesionalId`, `fecha`, etc.) en lugar de `id_paciente`, `fecha_hora_inicio`, `fecha_hora_fin`, `precio_final`, `notas_consulta`. Se adaptará para recibir ambos formatos con total compatibilidad.
> 3. En `backend/controllers/Paciente.controller.js`: Se incluirá la relación con `PacienteObraSocial` y `ObraSocial` para devolver la obra social y número de afiliado de cada paciente.

---

## 3. Estructura del Proyecto Frontend (`frontIA`)

```
frontIA/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   └── DentalLogo.jsx           # SVG idéntico al logo de la imagen
│   ├── components/
│   │   ├── Layout.jsx               # Contenedor centralizado, marco, navegación hamburguesa
│   │   ├── NavigationDrawer.jsx     # Menú hamburguesa lateral deslizante
│   │   ├── CalendarView.jsx         # Grilla mensual exacta de la imagen + toggle a Schedule-X diaria/semanal
│   │   ├── ScheduleXIntegration.jsx # Vista Schedule-X para Diaria y Semanal
│   │   ├── TurnoRegistration.jsx    # Pantalla Imagen 2: Registrar turno con selección de día y módulos
│   │   ├── PatientsList.jsx         # Pantalla Imagen 3: Tabla de pacientes, búsqueda e historial
│   │   ├── PatientRegistration.jsx  # Pantalla Imagen 4: Formulario de 2 columnas para nuevo paciente
│   │   └── PatientHistoryModal.jsx  # Modal de historial de turnos por paciente
│   ├── services/
│   │   └── api.js                   # Cliente Axios / Fetch hacia http://localhost:3000/api
│   ├── styles/
│   │   └── index.css                # Configuración Tailwind v4 / v3 + estilos de Schedule-X
│   ├── App.jsx                      # Router / Gestor de pantallas y estado global
│   └── main.jsx
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 4. Plan de Verificación

### Pruebas de Integración y UI:
1. **Verificación visual**:
   - Comparar pixel a pixel las 4 vistas con las capturas adjuntas (colores `#2EAF85`, `#F87171`, `#86EFAC`, fondos `#FDE047`, `#FCA5A5`, bordes redondeados y tipografías).
2. **Flujo de Turnos**:
   - Crear un paciente desde la pantalla "Registrar Paciente".
   - Verificar que aparezca en la lista de "Pacientes" con su obra social.
   - Registrar un turno para ese paciente seleccionando día en el calendario, hora con `+ / -` y módulos.
   - Comprobar que el calendario mensual cambie de estado ("Libre" -> "Ocupado" / "Lleno") y que en la vista Diaria/Semanal de Schedule-X se visualice el bloque del turno.
3. **Navegación**:
   - Comprobar que el botón flotante verde `+` abre el registro de turnos.
   - Comprobar que el menú hamburguesa permite ir fluidamente a Calendario, Registrar Turno, Pacientes y Registrar Paciente.
