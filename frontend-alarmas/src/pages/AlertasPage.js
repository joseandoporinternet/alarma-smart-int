import React, { useState, useEffect } from "react";
import { obtenerAlertas, actualizarEstadoAlerta } from "../api/alertas";
import { obtenerAlarmas } from "../api/alarmas";
import Mapa from "../components/Mapa";
import GenerarSosManual from "../components/GenerarSosManual";
import { obtenerUsuarios } from "../api/usuarios";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Asegúrate de tener firebase configurado

export default function AlertasPage() {
  const [alertas, setAlertas] = useState([]);
  const [alarmas, setAlarmas] = useState([]);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [usuarios, setUsuarios] = useState([]); // Nuevo estado para lista de usuarios

  // Detectar usuario logueado con Firebase Auth
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const lista = await obtenerUsuarios();
        setUsuarios(lista); // Guardar la lista de usuarios para mostrar nombres
        const usuarioDB = lista.find((u) => u.email === user.email);
        setUsuarioActual(
          usuarioDB || {
            id: user.uid,
            nombre: user.displayName,
            email: user.email,
          }
        );
      } else {
        setUsuarioActual(null);
        setUsuarios([]); // Limpiar usuarios si no hay sesión
      }
    });
    return () => unsubscribe();
  }, []);

  // Cargar datos al montar y luego cada 3 segundos
  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 3000);
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    const a = await obtenerAlertas();
    const b = await obtenerAlarmas();
    setAlertas(a);
    setAlarmas(b);
  };

  const marcarAtendida = async (id) => {
    await actualizarEstadoAlerta(id, "atendida");
    cargarDatos();
  };

  // Función para obtener el nombre del usuario por su id
  const obtenerNombreUsuario = (usuarioId) => {
    const usuario = usuarios.find((u) => u.id === usuarioId);
    return usuario ? usuario.nombre : usuarioId;
  };

  return (
    <div className="container">
      <div>
        <h2>Alertas Pendientes</h2>
        <ul className="scrollable-list">
          {alertas
            .filter((a) => a.estado === "pendiente")
            .map((a) => (
              <li key={a.id}>
                <strong>Usuario:</strong> {obtenerNombreUsuario(a.usuarioId)} <br />
                <strong>Ubicación:</strong> {a.ubicacion?.lat},{" "}
                {a.ubicacion?.lng} <br />
                <strong>Alarma vinculada:</strong> {a.alarmaId} <br />
                <strong>Estado:</strong> {a.estado} <br />
                <strong>Fecha:</strong>{" "}
                {a.timestamp
                  ? new Date(a.timestamp._seconds * 1000).toLocaleString()
                  : "Sin fecha"}
                <br />
                <button onClick={() => marcarAtendida(a.id)}>
                  Marcar como atendida
                </button>
              </li>
            ))}
        </ul>
        <div className="generadorContainer">
          <GenerarSosManual usuario={usuarioActual} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr" }}>
        <h3>Mapa de alertas pendientes</h3>
        <Mapa
          alertas={alertas.filter((a) => a.estado === "pendiente")}
          alarmas={alarmas}
          usuarios={usuarios} // <-- Se pasa la lista de usuarios como prop
        />
      </div>
    </div>
  );
}
