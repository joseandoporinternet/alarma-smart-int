const API_URL = "https://alarmaapi-xt3odlrbrq-uc.a.run.app"; 

export async function obtenerUsuarios() {
  const res = await fetch(`${API_URL}/usuarios`);
  return await res.json();
}

export async function actualizarRol(uid, nuevoRol) {
  const res = await fetch(`${API_URL}/usuarios/${uid}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rol: nuevoRol }),
  });
  return await res.json();
}

export async function eliminarUsuario(uid) {
  const res = await fetch(`${API_URL}/usuarios/${uid}`, {
    method: "DELETE",
  });
  return await res.json();
}
export async function crearUsuario(data) {
  const res = await fetch(`${API_URL}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function eliminarUsuarioCompletamente(uid) {
  const res = await fetch(`${API_URL}/usuarios/${uid}/completo`, {
    method: "DELETE",
  });
  return await res.json();
}