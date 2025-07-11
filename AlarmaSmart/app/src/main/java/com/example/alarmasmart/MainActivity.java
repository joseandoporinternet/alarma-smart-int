package com.example.alarmasmart;

import android.content.Intent;
import android.os.Bundle;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;

// Ya no necesitamos importar FirebaseApp aquí, ya que se inicializa
// en la clase Application
// import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth; // Sigue necesitando FirebaseAuth

public class MainActivity extends AppCompatActivity {

    EditText emailInput, passwordInput;
    Button loginBtn, goToRegisterBtn;
    FirebaseAuth mAuth; // Declaración de FirebaseAuth

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // --- ¡IMPORTANTE! ELIMINA esta línea de aquí ---
        // FirebaseApp.initializeApp(this); // Esta línea ya NO VA AQUÍ

        setContentView(R.layout.activity_main);

        // Ahora es seguro obtener la instancia de FirebaseAuth.
        // Se inicializa en la clase AlarmSmartApplication que se ejecuta primero.
        mAuth = FirebaseAuth.getInstance();

        // Inicialización de las vistas de tu layout
        emailInput = findViewById(R.id.inputEmail);
        passwordInput = findViewById(R.id.inputPassword);
        loginBtn = findViewById(R.id.btnLogin);
        goToRegisterBtn = findViewById(R.id.btnGoRegister);

        // Listener para el botón de Ingresar
        loginBtn.setOnClickListener(v -> {
            String email = emailInput.getText().toString().trim();
            String password = passwordInput.getText().toString().trim();

            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Completa los campos", Toast.LENGTH_SHORT).show();
                return;
            }

            // Intento de inicio de sesión con Firebase Authentication
            mAuth.signInWithEmailAndPassword(email, password)
                    .addOnSuccessListener(authResult -> {
                        Toast.makeText(this, "Sesión iniciada", Toast.LENGTH_SHORT).show();
                        // Redirige al usuario a HomeActivity después de iniciar sesión exitosamente
                        startActivity(new Intent(this, HomeActivity.class));
                        finish(); // Finaliza MainActivity para que el usuario no pueda volver con el botón atrás
                    })
                    .addOnFailureListener(e ->
                            // Muestra un mensaje de error si el inicio de sesión falla
                            Toast.makeText(this, "Error: " + e.getMessage(), Toast.LENGTH_SHORT).show()
                    );
        });

        // Listener para el botón de Ir a Registrarse
        goToRegisterBtn.setOnClickListener(v -> {
            // Redirige al usuario a RegisterActivity
            startActivity(new Intent(this, RegisterActivity.class));
        });
    }
}
