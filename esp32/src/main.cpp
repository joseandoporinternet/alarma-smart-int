#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // Descomenta esta línea

// Reemplaza con tus credenciales de red
const char* ssid = "ONLINET_ESCOBAR";
const char* password = "27984276";

// URL del servidor donde está el archivo api.php
const char* serverUrl = "http://192.168.100.3:8000/alarmas";

// Identificador únic o del ESP32 (puede ser un nombre o código único)
const String espID = "esp3";

// Pin al que está conectado el LED
// ¡¡¡IMPORTANTE!!! El pin 35 es SOLO ENTRADA. NO PUEDES USARLO PARA UN LED.
// Usa un pin de salida válido, por ejemplo GPIO2, GPIO4, GPIO18, GPIO19, GPIO23, etc.
// Volvemos a GPIO2 como ejemplo válido. Cambia si es necesario a OTRO pin de SALIDA.
const int ledPin = 32;

// Define si el LED es activo en nivel alto (true) o nivel bajo (false)
const bool LED_ACTIVE_HIGH = true;

// Variables para el control de la conexión
unsigned long lastConnectionTime = 0;
const unsigned long connectionInterval = 10000; // 10 segundos

void checkLEDState();

void setup() {
  delay(2000);
  Serial.begin(9600);
  delay(1000);

  Serial.print("DEBUG: Pin seleccionado para el LED (ledPin): ");
  Serial.println(ledPin);
  
  // Verifica si el pin seleccionado es uno de los que son solo entrada (como 34, 35, 36, 39)
  if (ledPin == 34 || ledPin == 35 || ledPin == 36 || ledPin == 39) {
    Serial.println("ERROR FATAL: El pin seleccionado es SOLO ENTRADA. No se puede usar para controlar un LED.");
    Serial.println("Por favor, elige un pin de SALIDA válido.");
    while(1) { delay(1000); } // Detiene la ejecución
  }

  pinMode(ledPin, OUTPUT);
  
  if (LED_ACTIVE_HIGH) {
    digitalWrite(ledPin, LOW); 
  } else {
    digitalWrite(ledPin, HIGH); 
  }
  Serial.println("LED configurado como apagado al inicio");

  Serial.println("\nConectando a WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConectado a WiFi!");
    Serial.print("Dirección IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nNo se pudo conectar a WiFi. Verifica las credenciales.");
  }
  Serial.print("DEBUG: Free Heap al final de setup: ");
  Serial.println(ESP.getFreeHeap());
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Conexión WiFi perdida, intentando reconectar...");
    WiFi.reconnect(); // Intenta reconectar
    delay(5000); // Espera antes de reintentar o verificar estado
    return; // Sal de esta iteración de loop mientras reconecta
  }
  
  unsigned long currentMillis = millis();
  if (currentMillis - lastConnectionTime >= connectionInterval) { // Usar >= es más robusto
    lastConnectionTime = currentMillis;
    checkLEDState();
  }
}

void checkLEDState() {
  Serial.print("DEBUG: Free Heap al inicio de checkLEDState: ");
  Serial.println(ESP.getFreeHeap());

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    String url = String(serverUrl) + "?id=" + espID;
    
    Serial.print("Consultando al servidor: ");
    Serial.println(url);
    
    http.begin(url); 
    
    int httpCode = http.GET();
    
    Serial.print("Código de respuesta HTTP: ");
    Serial.println(httpCode);
    
    if (httpCode > 0) {
      if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        Serial.println("Respuesta del servidor:");
        Serial.println(payload);
        Serial.print("DEBUG: Longitud del payload: ");
        Serial.println(payload.length());
        Serial.print("DEBUG: Free Heap después de http.getString(): ");
        Serial.println(ESP.getFreeHeap());

        // --- NUEVO: Parseo de JSON y control por "estado" ---
        StaticJsonDocument<1024> doc; // Aumenta el tamaño para arreglos grandes
        DeserializationError error = deserializeJson(doc, payload);
        if (error) {
          Serial.print("Error al parsear JSON: ");
          Serial.println(error.c_str());
        } else {
          bool encontrado = false;
          for (JsonObject obj : doc.as<JsonArray>()) {
            const char* id = obj["id"];
            if (id && espID == id) {
              const char* estado = obj["estado"];
              if (estado && strcmp(estado, "activo") == 0) {
                Serial.println("Encendiendo el LED (estado: activo)...");
                if (LED_ACTIVE_HIGH) {
                  digitalWrite(ledPin, HIGH);
                } else {
                  digitalWrite(ledPin, LOW); 
                }
                Serial.print("LED encendido - Estado del pin (después de digitalWrite): ");
                Serial.println(digitalRead(ledPin));
              } else if (estado && strcmp(estado, "inactivo") == 0) {
                Serial.println("Apagando el LED (estado: inactivo)...");
                if (LED_ACTIVE_HIGH) {
                  digitalWrite(ledPin, LOW); 
                } else {
                  digitalWrite(ledPin, HIGH);
                }
                Serial.print("LED apagado - Estado del pin (después de digitalWrite): ");
                Serial.println(digitalRead(ledPin));
              } else {
                Serial.println("Estado no reconocido para este dispositivo.");
              }
              encontrado = true;
              break;
            }
          }
          if (!encontrado) {
            Serial.println("No se encontró el ID de este dispositivo en la respuesta JSON.");
          }
        }
        // --- FIN NUEVO ---
      } else {
        // Otros códigos HTTP exitosos pero no OK, o errores del cliente/servidor
        Serial.print("Respuesta HTTP no fue OK, código: ");
        Serial.println(httpCode);
        String payload = http.getString();
        Serial.println("Cuerpo de la respuesta (si existe):");
        Serial.println(payload);
      }
    } else {
      Serial.print("Error en la solicitud HTTP (http.GET() falló): ");
      Serial.println(http.errorToString(httpCode).c_str());
    }
    
    http.end();
  } else {
    Serial.println("No conectado a WiFi. No se puede consultar el estado del LED.");
  }
  Serial.print("DEBUG: Free Heap al final de checkLEDState: ");
  Serial.println(ESP.getFreeHeap());
}