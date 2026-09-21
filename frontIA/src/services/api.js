const API_BASE_URL = '/api';

export const api = {
  // PACIENTES
  async getPacientes() {
    const res = await fetch(`${API_BASE_URL}/pacientes`);
    if (!res.ok) {
      throw new Error(`Error al obtener pacientes: HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getPacienteById(id) {
    const res = await fetch(`${API_BASE_URL}/pacientes/${id}`);
    if (!res.ok) {
      throw new Error(`Error al obtener paciente #${id}: HTTP ${res.status}`);
    }
    return await res.json();
  },

  async createPaciente(pacienteData) {
    const res = await fetch(`${API_BASE_URL}/pacientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pacienteData)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.mensaje || errorData.error || `HTTP ${res.status}`);
    }
    return await res.json();
  },

  // TURNOS
  async getTurnos() {
    const res = await fetch(`${API_BASE_URL}/turnos`);
    if (!res.ok) {
      throw new Error(`Error al obtener turnos: HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async createTurno(turnoData) {
    const res = await fetch(`${API_BASE_URL}/turnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(turnoData)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.mensaje || `HTTP ${res.status}`);
    }
    return await res.json();
  },

  async updateTurno(id, turnoData) {
    const res = await fetch(`${API_BASE_URL}/turnos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(turnoData)
    });
    if (!res.ok) {
      throw new Error(`Error al actualizar turno #${id}: HTTP ${res.status}`);
    }
    return await res.json();
  },

  async deleteTurno(id) {
    const res = await fetch(`${API_BASE_URL}/turnos/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      throw new Error(`Error al eliminar turno #${id}: HTTP ${res.status}`);
    }
    return await res.json();
  },

  // OBRAS SOCIALES
  async getObrasSociales() {
    const res = await fetch(`${API_BASE_URL}/obras-sociales`);
    if (!res.ok) {
      throw new Error(`Error al obtener obras sociales: HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }
};

export default api;
