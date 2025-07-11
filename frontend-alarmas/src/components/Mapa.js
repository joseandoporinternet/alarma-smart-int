import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import React, { useEffect, useMemo, useRef, useState } from "react";

// Calcula el centro promedio de un conjunto de puntos
function calcularCentro(puntos) {
  if (puntos.length === 0) return [-1.2, -78.5];
  const lat = puntos.reduce((sum, p) => sum + p[0], 0) / puntos.length;
  const lng = puntos.reduce((sum, p) => sum + p[1], 0) / puntos.length;
  return [lat, lng];
}

// Componente para centrar y hacer zoom al seleccionar un marcador
function CentrarYZoom({ centro, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (centro && zoom) {
      map.setView(centro, zoom, { animate: true });
    }
  }, [centro, zoom, map]);
  return null;
}

export default function Mapa({ alarmas = [], alertas = [], usuarios = [] }) {
  const puntosAlarmas = useMemo(() => alarmas.map(a => [a.lat, a.lng]), [alarmas]);
  const centroInicial = useMemo(() => calcularCentro(puntosAlarmas), [puntosAlarmas]);
  const [centro, setCentro] = useState(centroInicial);
  const [zoom, setZoom] = useState(13); // Zoom inicial más cercano
  const [centradoInicial, setCentradoInicial] = useState(false);

  // Función para obtener el nombre del usuario por su id
  const obtenerNombreUsuario = (usuarioId) => {
    const usuario = usuarios.find((u) => u.id === usuarioId);
    return usuario ? usuario.nombre : usuarioId;
  };

  // Solo centrar el mapa la primera vez que hay datos
  useEffect(() => {
    if (!centradoInicial && puntosAlarmas.length > 0) {
      setCentro(centroInicial);
      setZoom(13); // Puedes ajustar el zoom inicial aquí
      setCentradoInicial(true);
    }
    // eslint-disable-next-line
  }, [centroInicial, puntosAlarmas, centradoInicial]);

  const iconAlarma = new L.Icon({
    iconUrl: "alarma-icon.png",
    iconSize: [30, 30],
  });

  const iconAlerta = new L.Icon({
    iconUrl: "alertas.gif",
    iconSize: [40, 40],
  });

  // Al hacer click en un marcador, centra y aumenta el zoom
  const handleMarkerClick = (lat, lng) => {
    setCentro([lat, lng]);
    setZoom(16); // Zoom más cercano al seleccionar
  };

  return (
    <MapContainer center={centro} zoom={zoom} style={{ height: "auto", width: "100%" }}>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {alarmas.map((a) => (
        <Marker
          key={a.id}
          position={[a.lat, a.lng]}
          icon={iconAlarma}
          eventHandlers={{
            click: () => handleMarkerClick(a.lat, a.lng),
          }}
        >
          <Popup>
            <strong>Alarma:</strong> {a.direccion}<br />
            Estado: {a.estado}
          </Popup>
        </Marker>
      ))}

      {alertas.map((a) =>
        a.ubicacion && a.ubicacion.lat && a.ubicacion.lng && (
          <Marker
            key={a.id}
            position={[a.ubicacion.lat, a.ubicacion.lng]}
            icon={iconAlerta}
            eventHandlers={{
              click: () => handleMarkerClick(a.ubicacion.lat, a.ubicacion.lng),
            }}
          >
            <Popup>
              <strong>Alerta:</strong> {obtenerNombreUsuario(a.usuarioId)}<br />
              Estado: {a.estado}
            </Popup>
          </Marker>
        )
      )}

      <CentrarYZoom centro={centro} zoom={zoom} />
    </MapContainer>
  );
}