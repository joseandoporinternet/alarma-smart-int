const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

/**
 * Ruta de prueba para verificar que la API está funcionando.
 */
app.get("/", (req, res) => {
  res.send("API de alarmas comunitarias funcionando");
});


// ==================== RUTAS DE USUARIOS ====================

/**
 * Crea un usuario en Firestore después del registro en Firebase Auth (desde el frontend).
 */
app.post("/crear-usuario", async (req, res) => {
  const { uid, nombre, email, rol, contactoEmergencia } = req.body;
  try {
    await db.collection("usuarios").doc(uid).set({
      nombre,
      email,
      rol,
      contactoEmergencia,
    });
    res.status(200).json({ message: "Usuario creado en Firestore" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Crea un usuario en Firebase Auth y en Firestore (desde el frontend).
 */
app.post("/usuarios", async (req, res) => {
  const { email, password, nombre, rol, cedula, telefono, contactoEmergencia } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    // contactoEmergencia debe ser un objeto: { nombre, telefono }
    await db.collection("usuarios").doc(userRecord.uid).set({
      email,
      nombre,
      rol,
      cedula,
      telefono,
      contactoEmergencia: contactoEmergencia ? [contactoEmergencia] : [],
    });

    res.status(200).json({ message: "Usuario creado correctamente", uid: userRecord.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtiene todos los usuarios.
 */
app.get("/usuarios", async (req, res) => {
  try {
    const snapshot = await db.collection("usuarios").get();
    const usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Actualiza el rol de un usuario.
 */
app.put("/usuarios/:uid", async (req, res) => {
  const { uid } = req.params;
  const { rol } = req.body;

  try {
    await db.collection("usuarios").doc(uid).update({ rol });
    res.status(200).json({ message: "Rol actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Elimina completamente un usuario: de Firestore y de Firebase Auth.
 */
app.delete("/usuarios/:uid/completo", async (req, res) => {
  const { uid } = req.params;

  try {
    await db.collection("usuarios").doc(uid).delete();
    await admin.auth().deleteUser(uid);
    res.status(200).json({ message: "Usuario eliminado completamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Actualiza los contactos de emergencia del usuario.
 * Espera un array de objetos: [{ nombre, telefono }, ...]
 */
app.put("/usuarios/:uid/contacto", async (req, res) => {
  const { uid } = req.params;
  const { contactosEmergencia } = req.body; // array de contactos

  if (!Array.isArray(contactosEmergencia)) {
    return res.status(400).json({ error: "contactosEmergencia debe ser un array" });
  }

  try {
    await db.collection("usuarios").doc(uid).update({ contactoEmergencia: contactosEmergencia });
    res.status(200).json({ message: "Contactos de emergencia actualizados" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtiene un usuario específico por su UID.
 */
app.get("/usuarios/:uid", async (req, res) => {
  const { uid } = req.params;

  try {
    const doc = await db.collection("usuarios").doc(uid).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ==================== RUTAS DE ALARMAS ====================

/**
 * Crea una nueva alarma en Firestore.
 */
app.post("/alarmas", async (req, res) => {
  const { lat, lng, direccion } = req.body;
  try {
    const ref = await db.collection("alarmas").add({
      lat,
      lng,
      direccion,
      estado: "inactiva",
      ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({ id: ref.id, message: "Alarma creada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtiene todas las alarmas.
 */
app.get("/alarmas", async (req, res) => {
  try {
    const snapshot = await db.collection("alarmas").get();
    const alarmas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(alarmas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Actualiza los datos de una alarma existente.
 */
app.put("/alarmas/:id", async (req, res) => {
  const { id } = req.params;
  const { lat, lng, direccion, estado } = req.body;
  try {
    await db.collection("alarmas").doc(id).update({
      lat, lng, direccion, estado,
      ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({ message: "Alarma actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Elimina una alarma por su ID.
 */
app.delete("/alarmas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection("alarmas").doc(id).delete();
    res.status(200).json({ message: "Alarma eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cambia el estado de una alarma (prueba de activación/desactivación).
 */
app.post("/alarmas/:id/probar", async (req, res) => {
  const { id } = req.params;
  try {
    const ref = db.collection("alarmas").doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new Error("No existe la alarma");

    const estadoActual = doc.data().estado;
    const nuevoEstado = estadoActual === "activa" ? "inactiva" : "activa";

    await ref.update({
      estado: nuevoEstado,
      ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: `Alarma ${nuevoEstado}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ==================== RUTAS DE ALERTAS ====================

/**
 * Obtiene todas las alertas ordenadas por fecha de creación.
 */
app.get("/alertas", async (req, res) => {
  try {
    const snapshot = await db.collection("alertas").orderBy("timestamp", "desc").get();
    const alertas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(alertas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Actualiza el estado de una alerta.
 */
app.put("/alertas/:id", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    await db.collection("alertas").doc(id).update({
      estado: estado,
    });
    res.status(200).json({ message: "Estado de alerta actualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ==================== RUTA DE SOS ====================

/**
 * Recibe una alerta SOS, busca la alarma más cercana y la activa.
 */
app.post("/sos", async (req, res) => {
  const { uid, lat, lng } = req.body;
  try {
    // Buscar la alarma más cercana (simplificado)
    const alarmasSnap = await db.collection("alarmas").get();
    let alarmaCercana = null;
    let distanciaMinima = Infinity;

    alarmasSnap.forEach(doc => {
      const a = doc.data();
      const dist = Math.sqrt(Math.pow(a.lat - lat, 2) + Math.pow(a.lng - lng, 2));
      if (dist < distanciaMinima) {
        distanciaMinima = dist;
        alarmaCercana = { id: doc.id, ...a };
      }
    });

    // Crear alerta y actualizar alarma
    const alerta = await db.collection("alertas").add({
      usuarioId: uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ubicacion: { lat, lng },
      alarmaId: alarmaCercana.id,
      estado: "pendiente",
    });

    await db.collection("alarmas").doc(alarmaCercana.id).update({ estado: "activa" });

    res.status(200).json({ message: "Alerta creada y alarma activada", alertaId: alerta.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ==================== EXPORTACIÓN DE LA API ====================

/**
 * Exporta la API como función de Firebase.
 */
exports.alarmaApi = functions.https.onRequest(app);
