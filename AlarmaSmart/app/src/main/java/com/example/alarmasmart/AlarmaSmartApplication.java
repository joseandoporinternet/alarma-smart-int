package com.example.alarmasmart;
import android.app.Application;
import com.google.firebase.FirebaseApp; // Importa FirebaseApp

/**
 * Esta clase personalizada extiende Application y se utiliza para
 * inicializar Firebase una vez al inicio de la aplicación.
 * Esto asegura que Firebase esté disponible para todas las Activities
 * y otros componentes de la aplicación tan pronto como sea necesario.
 */
public class AlarmaSmartApplication extends Application {

    @Override
    public void onCreate() {
        super.onCreate();
        // --- ¡AQUÍ ES DONDE SE DEBE INICIALIZAR FIREBASE! ---
        // Esto se ejecuta una vez, cuando la aplicación se inicia.
        FirebaseApp.initializeApp(this);
        // Puedes añadir cualquier otra inicialización global aquí.
    }
}