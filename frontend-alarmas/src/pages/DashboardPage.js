import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import AlarmasPage from "./AlarmasPage";
import AlertasPage from "./AlertasPage";
import UsuariosPage from "./UsuariosPage";
import { obtenerUsuarios } from "../api/usuarios";

export default function DashboardPage() {
  const [seccion, setSeccion] = useState("alarmas");
  const [rol, setRol] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setRol(null);
      setCargando(false);
      return;
    }
    // Buscar el usuario en la base de datos para obtener el rol
    obtenerUsuarios().then((usuarios) => {
      const usuarioDB = usuarios.find((u) => u.email === user.email);
      setRol(usuarioDB?.rol || "usuario");
      setCargando(false);
    });
  }, []);

  if (cargando) {
    return (
      <div className="dashboard-container">
        <header>
          <div className="logo-title-container">
            <img src="/alarmasmart.webp" width="150px" alt="Logo" className="logo" />
          </div>
        </header>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header>
        <div className="logo-title-container">
          <img src="/alarmasmart.webp" width="150px" alt="Logo" className="logo" />
        </div>
        <nav>
          {rol === "admin" && (
            <>
              <button onClick={() => setSeccion("alarmas")}>Alarmas</button>
              <button onClick={() => setSeccion("alertas")}>Alertas</button>
              <button onClick={() => setSeccion("usuarios")}>Usuarios</button>
            </>
          )}
          {rol === "cuerpo_sos" && (
            <button onClick={() => setSeccion("alertas")}>Alertas</button>
          )}
        </nav>
        <div className="user-info">
          <p>{auth.currentUser?.email || "Invitado"}</p>
          <button onClick={() => signOut(auth)}>Cerrar sesión</button>
        </div>
      </header>
      {rol === "admin" && (
        <>
          {seccion === "alarmas" && <AlarmasPage />}
          {seccion === "alertas" && <AlertasPage />}
          {seccion === "usuarios" && <UsuariosPage />}
        </>
      )}
      {rol === "cuerpo_sos" && <AlertasPage />}
      {rol === "usuario" && (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Acceso restringido</h2>
          <p>Por favor, dirígete a la aplicación móvil para acceder a tus funciones.</p>
        </div>
      )}
      <footer>
        <p>
          <b>
            © 2025 Alarma Smart. Todos los derechos reservados.
          </b>
        </p>
      </footer>
    </div>
  );
}
