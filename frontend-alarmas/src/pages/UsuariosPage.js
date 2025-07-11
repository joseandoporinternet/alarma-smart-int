import React, { useEffect, useState } from "react";
import {
  obtenerUsuarios,
  actualizarRol,
  eliminarUsuarioCompletamente,
  crearUsuario,
} from "../api/usuarios";
import GenerarSosManual from "../components/GenerarSosManual";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "usuario",
  });
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busqueda, setBusqueda] = useState(""); // Estado para el buscador

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    const lista = await obtenerUsuarios();
    setUsuarios(lista);
  };

  const handleActualizarRol = async (uid, nuevoRol) => {
    await actualizarRol(uid, nuevoRol);
    cargarUsuarios();
  };

  const handleEliminar = async (uid) => {
    if (
      window.confirm("¿Eliminar completamente este usuario (Auth y Firestore)?")
    ) {
      await eliminarUsuarioCompletamente(uid);
      cargarUsuarios();
    }
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    await crearUsuario(nuevoUsuario);
    setNuevoUsuario({
      nombre: "",
      email: "",
      password: "",
      rol: "usuario",
    });
    setMostrarModal(false);
    cargarUsuarios();
  };

  // Filtrado de usuarios por nombre o email
  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ padding: "1.5rem" }}>
      <div>
        <h2>Gestión de Usuarios</h2>
        <button onClick={() => setMostrarModal(true)}>Crear usuario</button>

        {/* Buscador */}
        <div style={{ margin: "1rem 0" }}>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              width: "100%",
              maxWidth: "350px",
              fontSize: "1rem",
            }}
          />
        </div>

        {/* Modal */}
        {mostrarModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: "2rem",
                borderRadius: "8px",
                minWidth: "300px",
                position: "relative",
              }}
            >
              <h3>Crear nuevo usuario</h3>
              <form onSubmit={handleCrearUsuario}>
                <input
                  placeholder="Nombre"
                  value={nuevoUsuario.nombre}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })
                  }
                  required
                />
                <input
                  placeholder="Email"
                  value={nuevoUsuario.email}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })
                  }
                  required
                />
                <input
                  placeholder="Contraseña"
                  type="password"
                  value={nuevoUsuario.password}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })
                  }
                  required
                />
                <select
                  value={nuevoUsuario.rol}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })
                  }
                >
                  <option value="usuario">usuario</option>
                  <option value="admin">admin</option>
                  <option value="cuerpo_sos">cuerpo_sos</option>
                </select>
                <div style={{ marginTop: "1rem" }}>
                  <button type="submit">Crear</button>
                  <button
                    type="button"
                    onClick={() => setMostrarModal(false)}
                    style={{ marginLeft: "1rem" }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tarjetas de usuarios */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          {usuariosFiltrados.map((u) => (
            <div
              key={u.id}
              style={{
                background: "#f9f9f9",
                border: "1px solid #e0e0e0",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                padding: "1.2rem 1.5rem",
                minWidth: "250px",
                maxWidth: "300px",
                flex: "1 1 250px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong>Nombre:</strong> {u.nombre} <br />
                <strong>Email:</strong> {u.email} <br />
                <strong>Rol:</strong>{" "}
                <select
                  value={u.rol}
                  onChange={(e) => handleActualizarRol(u.id, e.target.value)}
                  style={{
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    marginTop: "0.2rem",
                  }}
                >
                  <option value="usuario">usuario</option>
                  <option value="admin">admin</option>
                  <option value="cuerpo_sos">cuerpo_sos</option>
                </select>
              </div>
              <button
                onClick={() => handleEliminar(u.id)}
                style={{
                  marginTop: "1rem",
                  background: "#e74c3c",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  padding: "0.5rem",
                  cursor: "pointer",
                  fontWeight: "bold",
                  transition: "background 0.2s",
                }}
                onMouseOver={e => e.currentTarget.style.background = "#c0392b"}
                onMouseOut={e => e.currentTarget.style.background = "#e74c3c"}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
