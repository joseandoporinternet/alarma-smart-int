package com.example.alarmasmart;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

public class LauncherActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();

        if (user != null) {                     // Sesión preservada
            startActivity(new Intent(this, HomeActivity.class));
        } else {                                // No hay sesión
            startActivity(new Intent(this, MainActivity.class)); // pantalla de login
        }
        finish(); // No queda en el back-stack
    }
}