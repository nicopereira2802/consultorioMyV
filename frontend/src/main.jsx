import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import './App.css'
import './styles/global.css'

if (typeof window !== 'undefined' && window.localStorage) {
  const legacyKeys = [
    'myv_pacientes',
    'myv_pacientes_db',
    'myv_pacientes_db_v2',
    'myv_catalogo_practicas_db_v2',
    'myv_catalogo_practicas'
  ];
  legacyKeys.forEach((key) => {
    localStorage.removeItem(key);
  });
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && k.startsWith('myv_turnos_rel_db_')) {
      localStorage.removeItem(k);
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)