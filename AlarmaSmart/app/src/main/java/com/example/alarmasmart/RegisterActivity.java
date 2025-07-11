package com.example.alarmasmart;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.MotionEvent;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.widget.NestedScrollView;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONException;
import org.json.JSONObject;

public class RegisterActivity extends AppCompatActivity {

    private EditText inputNombre, inputCedula, inputEmail, inputTelefono, inputPassword, inputNombreContacto, inputContacto;
    private Button btnRegistrar;
    private ProgressBar progressBar;

    private static final String API_URL = "https://alarmaapi-xt3odlrbrq-uc.a.run.app/usuarios"; // Reemplaza por tu URL real

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        // Ocultar teclado cuando se toca fuera del EditText
        findViewById(R.id.rootLayout).setOnTouchListener((v, event) -> {
            hideKeyboard(this);
            return false;
        });

        inputNombre = findViewById(R.id.inputNombre);
        inputCedula = findViewById(R.id.inputCedula);
        inputEmail = findViewById(R.id.inputEmail);
        inputTelefono = findViewById(R.id.inputTelefono);
        inputPassword = findViewById(R.id.inputPassword);
        inputNombreContacto = findViewById(R.id.inputNombreContacto);
        inputContacto = findViewById(R.id.inputContacto);
        btnRegistrar = findViewById(R.id.btnRegistrar);
        progressBar = findViewById(R.id.progressBar);

        btnRegistrar.setOnClickListener(v -> registrarUsuario());
    }

    private void registrarUsuario() {
        String nombre = inputNombre.getText().toString().trim();
        String cedula = inputCedula.getText().toString().trim();
        String email = inputEmail.getText().toString().trim();
        String telefono = inputTelefono.getText().toString().trim();
        String password = inputPassword.getText().toString().trim();
        String nombreContacto = inputNombreContacto.getText().toString().trim();
        String contacto = inputContacto.getText().toString().trim();

        if (TextUtils.isEmpty(nombre) || TextUtils.isEmpty(cedula) || TextUtils.isEmpty(email) ||
                TextUtils.isEmpty(telefono) || TextUtils.isEmpty(password) || TextUtils.isEmpty(nombreContacto) ||
                TextUtils.isEmpty(contacto)) {
            Toast.makeText(this, "Por favor, completa todos los campos", Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);

        JSONObject contactoEmergencia = new JSONObject();
        try {
            contactoEmergencia.put("nombre", nombreContacto);
            contactoEmergencia.put("telefono", contacto);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        JSONObject data = new JSONObject();
        try {
            data.put("nombre", nombre);
            data.put("cedula", cedula);
            data.put("email", email);
            data.put("telefono", telefono);
            data.put("password", password);
            data.put("rol", "usuario"); // valor por defecto
            data.put("contactoEmergencia", contactoEmergencia);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        JsonObjectRequest request = new JsonObjectRequest(
                Request.Method.POST,
                API_URL,
                data,
                response -> {
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(this, "Usuario registrado correctamente", Toast.LENGTH_LONG).show();
                    finish(); // Cierra la actividad
                },
                error -> {
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(this, "Error: " + error.getMessage(), Toast.LENGTH_LONG).show();
                });

        RequestQueue queue = Volley.newRequestQueue(this);
        queue.add(request);
    }

    public static void hideKeyboard(Activity activity) {
        View view = activity.getCurrentFocus();
        if (view != null) {
            InputMethodManager imm = (InputMethodManager)
                    activity.getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
        }
    }
}