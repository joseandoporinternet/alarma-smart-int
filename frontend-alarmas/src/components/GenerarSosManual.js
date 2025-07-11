import React, { useState, useEffect } from "react";
import { enviarSos } from "../api/alertas";

// Recibe el usuario logueado como prop
export default function GenerarSosManual({ usuario }) {
  const [sosData, setSosData] = useState({
    uid: "",
    lat: "",
    lng: "",
  });

  // Al montar, asigna el uid del usuario logueado
  useEffect(() => {
    if (usuario && usuario.id) {
      setSosData((prev) => ({ ...prev, uid: usuario.id }));
    }
  }, [usuario]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sosData.uid || !sosData.lat || !sosData.lng) {
      alert("Completa todos los campos");
      return;
    }

    try {
      const res = await enviarSos(
        sosData.uid,
        parseFloat(sosData.lat),
        parseFloat(sosData.lng)
      );
      alert("SOS enviado: " + res.message);
      setSosData({ uid: usuario.id, lat: "", lng: "" });
    } catch (err) {
      alert("Error al enviar SOS");
    }
  };

  return (
    <div>
      <h3>Generar SOS manual</h3>
      <form className="formGenerator" onSubmit={handleSubmit}>
        <div>
          <strong>Usuario:</strong> {usuario?.nombre} ({usuario?.email})
        </div>
        <input
          type="text"
          placeholder="Latitud"
          value={sosData.lat}
          onChange={(e) => setSosData({ ...sosData, lat: e.target.value })}
        />
        <input
          type="text"
          placeholder="Longitud"
          value={sosData.lng}
          onChange={(e) => setSosData({ ...sosData, lng: e.target.value })}
        />
        <button type="submit">Enviar SOS</button>
      </form>
    </div>
  );
}
