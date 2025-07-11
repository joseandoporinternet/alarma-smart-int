import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, clave);
      navigate("/");
    } catch (err) {
      alert("Error al iniciar sesión: " + err.message);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <div className="login-header">
          <img src="alarmasmart.webp" alt="Logo" className="login-logo" />
        </div>
        <div className="form-elements">
          <h2>Iniciar sesión</h2>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
          />
          <input
            type="password"
            required
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="Contraseña"
          />
          <button type="submit">Ingresar</button>
        </div>
      </form>
    </div>
  );
}
