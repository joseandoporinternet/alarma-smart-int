package com.example.alarmasmart;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.content.*;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsManager;
import android.util.Log;
import android.webkit.*;
import android.widget.Button;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.android.volley.Request;
import com.android.volley.toolbox.JsonArrayRequest;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

public class HomeActivity extends AppCompatActivity {

    // --- Constantes ---
    private static final String API_BASE_URL = "https://alarmaapi-xt3odlrbrq-uc.a.run.app";
    private static final String SOS_ENDPOINT   = "/sos";
    private static final String USERS_ENDPOINT = "/usuarios";
    private static final int    REQUEST_PERMISSIONS_CODE = 1002;
    private static final String SMS_SENT_ACTION = "SMS_SENT";
    private static final String MAP_ASSET_URL  = "file:///android_asset/mapa.html";

    // --- Vistas y clientes ---
    private Button btnSOS, btnEditarContacto, btnLogout;
    private WebView webViewMap;
    private FusedLocationProviderClient locationProvider;

    // --- Firebase ---
    private FirebaseAuth mAuth;
    private FirebaseUser user;

    // --- Receiver SMS enviado ---
    private BroadcastReceiver smsSentReceiver;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        // --- Firebase ---
        mAuth  = FirebaseAuth.getInstance();
        user   = mAuth.getCurrentUser();
        if (user == null) {
            startActivity(new Intent(this, MainActivity.class));
            finish();
            return;
        }

        // --- Vistas ---
        btnSOS            = findViewById(R.id.btnSOS);
        btnEditarContacto = findViewById(R.id.btnEditarContacto);
        btnLogout         = findViewById(R.id.btnLogout);
        webViewMap        = findViewById(R.id.webViewMap);

        // --- Ubicación ---
        locationProvider  = LocationServices.getFusedLocationProviderClient(this);

        setupWebViewMap();
        setupListeners();
        registerSmsReceiver();
    }

    /* ---------------------------------------------------------------
     *   1. WebView  (Leaflet + geolocalización)
     * ------------------------------------------------------------- */
    private void setupWebViewMap() {
        WebSettings settings = webViewMap.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setGeolocationEnabled(true);

        // Concedemos permisos de geolocalización dentro del WebView
        webViewMap.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(
                    String origin, GeolocationPermissions.Callback callback) {
                // Otorgamos permiso automáticamente (el Runtime Permission lo pide el sistema)
                callback.invoke(origin, true, false);
            }
        });

        // Pedimos permisos de ubicación si aún no se han otorgado
        if (ContextCompat.checkSelfPermission(
                this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

            ActivityCompat.requestPermissions(
                    this,
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION},
                    REQUEST_PERMISSIONS_CODE);
        }

        webViewMap.loadUrl(MAP_ASSET_URL);
    }

    /* ---------------------------------------------------------------
     *   2. Listeners UI
     * ------------------------------------------------------------- */
    private void setupListeners() {
        btnSOS.setOnClickListener(v -> enviarSOS());

        btnEditarContacto.setOnClickListener(
                v -> startActivity(new Intent(this, ContactActivity.class)));

        btnLogout.setOnClickListener(v -> {
            mAuth.signOut();
            startActivity(new Intent(this, MainActivity.class));
            finish();
        });
    }

    /* ---------------------------------------------------------------
     *   3. Envío de SMS: Receiver para feedback
     * ------------------------------------------------------------- */
    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    private void registerSmsReceiver() {
        smsSentReceiver = new BroadcastReceiver() {
            @Override public void onReceive(Context ctx, Intent intent) {
                String msg;
                switch (getResultCode()) {
                    case RESULT_OK:                         msg = "SMS enviado correctamente.";              break;
                    case SmsManager.RESULT_ERROR_GENERIC_FAILURE: msg = "Falla genérica al enviar SMS."; break;
                    case SmsManager.RESULT_ERROR_NO_SERVICE:      msg = "Sin servicio de SMS.";           break;
                    case SmsManager.RESULT_ERROR_NULL_PDU:        msg = "PDU nulo al enviar SMS.";        break;
                    case SmsManager.RESULT_ERROR_RADIO_OFF:       msg = "Radio apagada.";                 break;
                    default:                                      msg = "Error desconocido al enviar SMS.";
                }
                Toast.makeText(ctx, msg, Toast.LENGTH_LONG).show();
            }
        };

        IntentFilter f = new IntentFilter(SMS_SENT_ACTION);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(smsSentReceiver, f, RECEIVER_EXPORTED);
        } else {
            registerReceiver(smsSentReceiver, f);
        }
    }

    /* ---------------------------------------------------------------
     *   4. Flujo SOS (permisos → ubicación → backend + SMS)
     * ------------------------------------------------------------- */
    private void enviarSOS() {
        boolean locOK  = ContextCompat.checkSelfPermission(
                this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean smsOK  = ContextCompat.checkSelfPermission(
                this, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED;

        if (!locOK || !smsOK) {
            ActivityCompat.requestPermissions(this,
                    new String[]{ Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.SEND_SMS },
                    REQUEST_PERMISSIONS_CODE);
        } else {
            obtenerUbicacionYEnviarAlerta();
        }
    }

    private void obtenerUbicacionYEnviarAlerta() {
        try {
            locationProvider.getLastLocation()
                    .addOnSuccessListener(this, loc -> {
                        if (loc != null) {
                            enviarDatosAlBackend(user.getUid(), loc);
                            obtenerContactoYEnviarSMS(loc);
                        } else {
                            Toast.makeText(this,
                                    "No se pudo obtener la ubicación. Activa GPS.",
                                    Toast.LENGTH_LONG).show();
                        }
                    })
                    .addOnFailureListener(this,
                            e -> Toast.makeText(this,
                                    "Error de ubicación: " + e.getMessage(),
                                    Toast.LENGTH_SHORT).show());
        } catch (SecurityException e) {
            Log.e("LocationError", "Permiso de ubicación faltante.", e);
        }
    }

    /* ---------------------------------------------------------------
     *   5. Contacto → SMS
     * ------------------------------------------------------------- */
    private void obtenerContactoYEnviarSMS(Location loc) {
        String url = API_BASE_URL + USERS_ENDPOINT;

        JsonArrayRequest req = new JsonArrayRequest(Request.Method.GET, url, null,
                response -> {
                    for (int i = 0; i < response.length(); i++) {
                        try {
                            JSONObject u = response.getJSONObject(i);
                            if (u.getString("id").equals(user.getUid())) {
                                if (u.has("contactoEmergencia")) {
                                    // Verifica si es un arreglo
                                    if (u.get("contactoEmergencia") instanceof org.json.JSONArray) {
                                        org.json.JSONArray contactos = u.getJSONArray("contactoEmergencia");

                                        if (contactos.length() == 0) {
                                            Toast.makeText(this, "No hay contactos de emergencia configurados.",
                                                    Toast.LENGTH_LONG).show();
                                            return;
                                        }

                                        for (int j = 0; j < contactos.length(); j++) {
                                            JSONObject contacto = contactos.getJSONObject(j);
                                            String numero = contacto.optString("telefono", "");
                                            if (!numero.isEmpty()) {
                                                enviarSMS(numero, loc);
                                            }
                                        }
                                        Toast.makeText(this, "Alertas enviadas a contactos de emergencia.",
                                                Toast.LENGTH_SHORT).show();
                                    } else {
                                        Log.e("TipoContacto", "contactoEmergencia no es un arreglo");
                                    }
                                } else {
                                    Toast.makeText(this, "Sin contactos de emergencia configurados.",
                                            Toast.LENGTH_LONG).show();
                                }
                                return;
                            }
                        } catch (JSONException ex) {
                            Log.e("JSONParseError", "Error procesando usuario " + i, ex);
                        }
                    }
                    Toast.makeText(this,
                            "No se encontraron datos del usuario.",
                            Toast.LENGTH_SHORT).show();
                },
                err -> {
                    Log.e("VolleyError", "Error lista usuarios: " + err);
                    Toast.makeText(this,
                            "No se pudo obtener el contacto.",
                            Toast.LENGTH_SHORT).show();
                });

        Volley.newRequestQueue(this).add(req);
    }

    private void enviarSMS(String numero, Location loc) {
        String msg = "⚠️ Alerta SOS desde la app.\n" +
                "Ubicación:\nhttps://maps.google.com/?q=" +
                loc.getLatitude() + "," + loc.getLongitude();

        String clean = numero.replaceAll("[^+0-9]", "");
        PendingIntent sentPI = PendingIntent.getBroadcast(
                this, 0, new Intent(SMS_SENT_ACTION),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        SmsManager man      = SmsManager.getDefault();
        ArrayList<String> parts = man.divideMessage(msg);
        ArrayList<PendingIntent> sentIntents = new ArrayList<>();
        for (int i = 0; i < parts.size(); i++) sentIntents.add(sentPI);

        man.sendMultipartTextMessage(clean, null, parts, sentIntents, null);
        Toast.makeText(this, "Enviando alerta al contacto...", Toast.LENGTH_SHORT).show();
    }

    /* ---------------------------------------------------------------
     *   6. Backend SOS
     * ------------------------------------------------------------- */
    private void enviarDatosAlBackend(String uid, Location loc) {
        JSONObject data = new JSONObject();
        try {
            data.put("uid", uid);
            data.put("lat", loc.getLatitude());
            data.put("lng", loc.getLongitude());
        } catch (JSONException e) {
            Log.e("JSONError", "Creando JSON SOS", e);
            return;
        }

        JsonObjectRequest req = new JsonObjectRequest(
                Request.Method.POST, API_BASE_URL + SOS_ENDPOINT, data,
                r -> Toast.makeText(this,
                        "Alerta SOS enviada al servidor.",
                        Toast.LENGTH_LONG).show(),
                err -> {
                    Log.e("VolleyError", "SOS backend: " + err);
                    Toast.makeText(this,
                            "Error al enviar la alerta al servidor.",
                            Toast.LENGTH_LONG).show();
                });

        Volley.newRequestQueue(this).add(req);
    }

    /* ---------------------------------------------------------------
     *   7. Permisos runtime
     * ------------------------------------------------------------- */
    @Override
    public void onRequestPermissionsResult(
            int requestCode, @NonNull String[] perms, @NonNull int[] res) {
        super.onRequestPermissionsResult(requestCode, perms, res);

        if (requestCode == REQUEST_PERMISSIONS_CODE) {
            boolean locOK = res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED;
            boolean smsOK = res.length > 1 && res[1] == PackageManager.PERMISSION_GRANTED;

            if (locOK && smsOK) {
                obtenerUbicacionYEnviarAlerta();
            } else {
                Toast.makeText(this,
                        "Se necesitan permisos de ubicación y SMS para SOS.",
                        Toast.LENGTH_LONG).show();
            }
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (smsSentReceiver != null) unregisterReceiver(smsSentReceiver);
    }
}