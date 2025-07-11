const API_URL = "https://alarmaapi-xt3odlrbrq-uc.a.run.app"; // cambia esto por tu URL real

export async function obtenerAlarmas() {
  const res = await fetch(`${API_URL}/alarmas`);
  return await res.json();
}

export async function crearAlarma(data) {
  const res = await fetch(`${API_URL}/alarmas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function editarAlarma(id, data) {
  const res = await fetch(`${API_URL}/alarmas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function eliminarAlarma(id) {
  const res = await fetch(`${API_URL}/alarmas/${id}`, {
    method: "DELETE",
  });
  return await res.json();
}

export async function probarAlarma(id) {
  const res = await fetch(`${API_URL}/alarmas/${id}/probar`, {
    method: "POST",
  });
  return await res.json();
}
