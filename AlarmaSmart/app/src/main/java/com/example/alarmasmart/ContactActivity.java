package com.example.alarmasmart;

import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.AppCompatImageButton;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.android.volley.Request;
import com.android.volley.toolbox.JsonArrayRequest;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ContactActivity extends AppCompatActivity {

    private static final int MAX_CONTACTS = 3;
    private static final String API_BASE = "https://alarmaapi-xt3odlrbrq-uc.a.run.app";

    private EditText inputNombre, inputTelefono;
    private Button btnAgregar, btnGuardarTodos;
    private RecyclerView recyclerContactos;
    private ProgressBar progressBar;
    private ContactAdapter adapter;
    private FirebaseUser currentUser;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_contact);

        // Inicializar vistas
        inputNombre = findViewById(R.id.inputNombre);
        inputTelefono = findViewById(R.id.inputTelefono);
        btnAgregar = findViewById(R.id.btnAgregar);
        btnGuardarTodos = findViewById(R.id.btnGuardarTodos);
        recyclerContactos = findViewById(R.id.recyclerContactos);
        progressBar = findViewById(R.id.progressBarContacto);
        AppCompatImageButton btnBack = findViewById(R.id.btnBack);

        currentUser = FirebaseAuth.getInstance().getCurrentUser();
        if (currentUser == null) {
            Toast.makeText(this, "Usuario no autenticado", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        // Configurar RecyclerView
        setupRecyclerView();

        // Cargar contactos existentes del servidor
        cargarContactos();

        // Configurar listeners de los botones
        btnBack.setOnClickListener(v -> finish());
        btnAgregar.setOnClickListener(v -> agregarContactoLocalmente());
        btnGuardarTodos.setOnClickListener(v -> guardarTodosLosContactos());
    }

    private void setupRecyclerView() {
        adapter = new ContactAdapter(new ArrayList<>(), this::eliminarContactoLocalmente);
        recyclerContactos.setLayoutManager(new LinearLayoutManager(this));
        recyclerContactos.setAdapter(adapter);
    }

    private void verificarLimiteContactos() {
        btnAgregar.setEnabled(adapter.getItemCount() < MAX_CONTACTS);
        if (adapter.getItemCount() >= MAX_CONTACTS) {
            Toast.makeText(this, "Puedes agregar un máximo de " + MAX_CONTACTS + " contactos.", Toast.LENGTH_SHORT).show();
        }
    }

    // --- Lógica de la Interfaz de Usuario (Local) ---

    private void agregarContactoLocalmente() {
        String nombre = inputNombre.getText().toString().trim();
        String telefono = inputTelefono.getText().toString().trim();

        if (nombre.isEmpty() || telefono.isEmpty()) {
            Toast.makeText(this, "Completa nombre y teléfono", Toast.LENGTH_SHORT).show();
            return;
        }

        if (adapter.getItemCount() >= MAX_CONTACTS) {
            verificarLimiteContactos();
            return;
        }

        // Se usa un ID aleatorio solo para poder borrarlo de la lista local
        String tempId = UUID.randomUUID().toString();
        Contact nuevoContacto = new Contact(tempId, nombre, telefono);
        adapter.addContact(nuevoContacto);

        inputNombre.setText("");
        inputTelefono.setText("");
        verificarLimiteContactos();
    }

    private void eliminarContactoLocalmente(Contact contacto) {
        adapter.removeContact(contacto.getId());
        verificarLimiteContactos();
    }

    // --- Lógica de Red (Comunicación con la API) ---

    private void cargarContactos() {
        progressBar.setVisibility(ProgressBar.VISIBLE);
        // Usar el nuevo endpoint para obtener un usuario específico
        String url = API_BASE + "/usuarios/" + currentUser.getUid();

        JsonObjectRequest request = new JsonObjectRequest(Request.Method.GET, url, null,
                response -> {
                    progressBar.setVisibility(ProgressBar.GONE);
                    try {
                        // Obtener el array de contactos del usuario
                        JSONArray contactosArray = response.getJSONArray("contactoEmergencia");
                        List<Contact> contactList = new ArrayList<>();
                        for (int i = 0; i < contactosArray.length(); i++) {
                            JSONObject obj = contactosArray.getJSONObject(i);
                            contactList.add(new Contact(
                                    UUID.randomUUID().toString(),
                                    obj.getString("nombre"),
                                    obj.getString("telefono")
                            ));
                        }
                        adapter.setData(contactList);
                        verificarLimiteContactos();
                    } catch (JSONException e) {
                        // El usuario no tiene contactos o el campo no existe
                        adapter.setData(new ArrayList<>());
                        verificarLimiteContactos();
                    }
                },
                error -> {
                    progressBar.setVisibility(ProgressBar.GONE);
                    String errorMessage = "Error al cargar contactos";
                    if (error.networkResponse != null) {
                        int statusCode = error.networkResponse.statusCode;
                        if (statusCode == 404) {
                            // Usuario no encontrado
                            errorMessage = "Usuario no encontrado";
                        } else if (statusCode >= 500) {
                            errorMessage = "Error del servidor. Intenta más tarde.";
                        } else if (statusCode == 401) {
                            errorMessage = "Error de autenticación";
                        }
                    } else {
                        errorMessage = "Error de conexión. Verifica tu internet.";
                    }
                    Toast.makeText(this, errorMessage, Toast.LENGTH_SHORT).show();
                });

        Volley.newRequestQueue(this).add(request);
    }

    private void guardarTodosLosContactos() {
        progressBar.setVisibility(ProgressBar.VISIBLE);

        // Se construye el array de contactos desde el adaptador
        JSONArray contactosJsonArray = new JSONArray();
        for (Contact contacto : adapter.getData()) {
            JSONObject contactoJson = new JSONObject();
            try {
                contactoJson.put("nombre", contacto.getNombre());
                contactoJson.put("telefono", contacto.getTelefono());
                contactosJsonArray.put(contactoJson);
            } catch (JSONException e) {
                // No debería ocurrir
            }
        }

        // Se crea el cuerpo de la petición
        JSONObject payload = new JSONObject();
        try {
            payload.put("contactosEmergencia", contactosJsonArray);
        } catch (JSONException e) {
            progressBar.setVisibility(ProgressBar.GONE);
            Toast.makeText(this, "Error al construir la petición", Toast.LENGTH_SHORT).show();
            return;
        }

        String url = API_BASE + "/usuarios/" + currentUser.getUid() + "/contacto";

        JsonObjectRequest request = new JsonObjectRequest(Request.Method.PUT, url, payload,
                response -> {
                    progressBar.setVisibility(ProgressBar.GONE);
                    Toast.makeText(this, "Contactos guardados correctamente", Toast.LENGTH_LONG).show();
                    finish(); // Regresar a la pantalla anterior tras guardar
                },
                error -> {
                    progressBar.setVisibility(ProgressBar.GONE);
                    String errorMessage = "Error al guardar los contactos";
                    if (error.networkResponse != null) {
                        int statusCode = error.networkResponse.statusCode;
                        if (statusCode >= 500) {
                            errorMessage = "Error del servidor. Intenta más tarde.";
                        } else if (statusCode == 401) {
                            errorMessage = "Error de autenticación";
                        }
                    } else {
                        errorMessage = "Error de conexión. Verifica tu internet.";
                    }
                    Toast.makeText(this, errorMessage, Toast.LENGTH_LONG).show();
                });

        Volley.newRequestQueue(this).add(request);
    }
}