import React, { useEffect, useState } from "react";
import {
  obtenerAlarmas,
  crearAlarma,
  editarAlarma,
  eliminarAlarma,
  probarAlarma,
} from "../api/alarmas";
import Mapa from "../components/Mapa";

export default function AlarmasPage() {
  const [alarmas, setAlarmas] = useState([]);
  const [nuevaAlarma, setNuevaAlarma] = useState({
    lat: "",
    lng: "",
    direccion: "",
  });
  const [modoEdicion, setModoEdicion] = useState(null);
  const [datosEditados, setDatosEditados] = useState({
    direccion: "",
    lat: "",
    lng: "",
    estado: "",
  });
  const [mostrarModal, setMostrarModal] = useState(false); // Nuevo estado para el modal

  useEffect(() => {
    cargarAlarmas();
  }, []);

  const cargarAlarmas = async () => {
    const datos = await obtenerAlarmas();
    setAlarmas(datos);
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    await crearAlarma(nuevaAlarma);
    setNuevaAlarma({ lat: "", lng: "", direccion: "" });
    setMostrarModal(false); // Cierra el modal al crear
    cargarAlarmas();
  };

  const handleEliminar = async (id) => {
    await eliminarAlarma(id);
    cargarAlarmas();
  };

  const handleProbar = async (id) => {
    await probarAlarma(id);
    cargarAlarmas();
  };

  const handleEditar = async (id) => {
    const nuevaDireccion = prompt("Nueva dirección:");
    if (nuevaDireccion) {
      await editarAlarma(id, { direccion: nuevaDireccion });
      cargarAlarmas();
    }
  };

  return (
    <div className="container">
      <div>
        <h2>Gestión de Alarmas</h2>

        <button
          style={{ marginBottom: "10px" }}
          onClick={() => setMostrarModal(true)}
        >
          Crear alarma
        </button>

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
              <h3>Nueva Alarma</h3>
              <form onSubmit={handleCrear}>
                <input
                  type="text"
                  placeholder="Latitud"
                  value={nuevaAlarma.lat}
                  onChange={(e) =>
                    setNuevaAlarma({
                      ...nuevaAlarma,
                      lat: parseFloat(e.target.value),
                    })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Longitud"
                  value={nuevaAlarma.lng}
                  onChange={(e) =>
                    setNuevaAlarma({
                      ...nuevaAlarma,
                      lng: parseFloat(e.target.value),
                    })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Dirección"
                  value={nuevaAlarma.direccion}
                  onChange={(e) =>
                    setNuevaAlarma({
                      ...nuevaAlarma,
                      direccion: e.target.value,
                    })
                  }
                  required
                />
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

        <ul className="scrollable-list">
          {alarmas.map((a) => (
            <li key={a.id}>
              {modoEdicion === a.id ? (
                <div className="alarma-item">
                  <input
                    value={datosEditados.direccion}
                    onChange={(e) =>
                      setDatosEditados({
                        ...datosEditados,
                        direccion: e.target.value,
                      })
                    }
                  />
                  <input
                    value={datosEditados.lat}
                    onChange={(e) =>
                      setDatosEditados({
                        ...datosEditados,
                        lat: parseFloat(e.target.value),
                      })
                    }
                  />
                  <input
                    value={datosEditados.lng}
                    onChange={(e) =>
                      setDatosEditados({
                        ...datosEditados,
                        lng: parseFloat(e.target.value),
                      })
                    }
                  />
                  <select
                    value={datosEditados.estado}
                    onChange={(e) =>
                      setDatosEditados({
                        ...datosEditados,
                        estado: e.target.value,
                      })
                    }
                  >
                    <option value="activa">Activa</option>
                    <option value="inactiva">Inactiva</option>
                  </select>
                  <div className="acciones-edicion">
                    <button onClick={() => setModoEdicion(null)}>
                      Cancelar
                    </button>

                    <button
                      onClick={async () => {
                        await editarAlarma(a.id, datosEditados);
                        setModoEdicion(null);
                        cargarAlarmas();
                      }}
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="alarma-item">
                  <spam className="id-alarma">
                    <strong>ID:</strong> {a.id}
                  </spam>
                  <spam className="direccion-alarma">{a.direccion}</spam>
                  <spam className="lat-long-alarma">
                    ({a.lat}, {a.lng})
                  </spam>
                  <spam className="estado-alarma">Estado: {a.estado}</spam>
                  <div className="acciones-alarma">
                    <button
                      onClick={() => {
                        setModoEdicion(a.id);
                        setDatosEditados({
                          direccion: a.direccion,
                          lat: a.lat,
                          lng: a.lng,
                          estado: a.estado,
                        });
                      }}
                    >
                      Editar
                    </button>
                    <button onClick={() => handleEliminar(a.id)}>
                      Eliminar
                    </button>
                    <button onClick={() => handleProbar(a.id)}>Probar</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div style={{display: "grid", gridTemplateRows: "auto 1fr"}}>
        <h3>Mapa de Alarmas</h3>
        <Mapa alarmas={alarmas} />
      </div>
    </div>
  );
}
