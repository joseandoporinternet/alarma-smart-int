const API_URL = "https://alarmaapi-xt3odlrbrq-uc.a.run.app"; // cambia esto por tu URL real


export async function obtenerAlertas() {
  const res = await fetch(`${API_URL}/alertas`);
  return await res.json();
}
export async function actualizarEstadoAlerta(id, estado) {
  const res = await fetch(`${API_URL}/alertas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado }),
  });
  return await res.json();
}

export async function enviarSos(uid, lat, lng) {
  const res = await fetch(`${API_URL}/sos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, lat, lng }),
  });
  return await res.json();
}