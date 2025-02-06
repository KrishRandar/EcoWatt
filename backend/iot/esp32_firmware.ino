#include <WiFi.h>
#include <ESPAsyncWebServer.h>

// Replace with your network credentials
const char *ssid = "your_SSID"; //user wifi
const char *password = "your_PASSWORD";

// Create an instance of the server
AsyncWebServer server(80);//deployer server

// Pin configuration for battery sensor (modify according to your setup)
#define BATTERY_VOLTAGE_PIN 34  // Example: Pin for reading battery voltage

void setup() {
  // Start serial communication
  Serial.begin(115200);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");

  // Serve the battery status on a GET request
  server.on("/get-battery", HTTP_GET, [](AsyncWebServerRequest *request){
    // Read battery data
    int batteryVoltage = analogRead(BATTERY_VOLTAGE_PIN);
    float voltage = batteryVoltage * (3.3 / 4095.0);  // Convert ADC reading to voltage
    int capacity = map(batteryVoltage, 0, 4095, 0, 100);  // Map the value to a percentage (0-100%)

    String response = "Battery Voltage: " + String(voltage) + " V, Capacity: " + String(capacity) + "%";
    request->send(200, "text/plain", response);
  });

  // Start server
  server.begin();
}

void loop() {
  // Nothing to do here, the server handles requests asynchronously
}
