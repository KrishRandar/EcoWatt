# P2P Energy Trading & Carbon Credit Marketplace

## Overview  
The energy sector is grappling with three critical challenges: **ensuring energy security, promoting energy equity, and achieving environmental sustainability**. Traditional energy systems, which rely on **centralized distribution networks**, often result in **inefficient energy access** and **lack transparency** in carbon credit trading. Moreover, **small-scale renewable energy producers** face significant barriers to entry, making it difficult for them to participate in the market.

To address these issues, we’re introducing a **decentralized Peer-to-Peer (P2P) Energy Trading Platform and Carbon Credit Marketplace**, built on the **zkSync Sepolia Testnet**. This innovative platform allows **energy producers (prosumers) and consumers** to trade energy **directly with each other**, cutting out the middleman. By leveraging **blockchain technology**, the platform ensures that transactions are **transparent, efficient, and secure**. Additionally, it uses **ZK-SNARKs** to **protect user data privacy**, making it a **trustworthy solution for modern energy trading**.

# Installation & Setup

## Clone the Repository

To get started, clone the GitHub repository:

```bash
git clone https://github.com/Kriti2025.git
```
```bash
cd backend
```
```bash
node server.js
```

```bash
npm install
```

```bash
npx hardhat compile
```

```bash
npx hardhat node
```

```bash
npx hardhat run ./scripts/deploy.js --network localhost
```
```bash
cd ..
cd frontend
npm install
npm run dev
```
```bash
npx hardhat compile
npx hardhat deploy-zksync --network zkSyncSepolia
```

```bash
npx hardhat verify --network zkSyncSepolia YOUR_CONTRACT_ADDRESS
```

## Key Features

 - **P2P Energy Trading** with dynamic order-matching and geohash-based pricing.  
 - **Carbon Credit Marketplace** for buying, selling, and trading carbon credits as ERC-20 tokens (**CCTokens**).  
 - **IoT-Based Battery Monitoring** to validate storage capacity before approving buy orders.  
 - **zk-SNARK Validation** ensures privacy and security in transaction verification.  
 - **Layer 2 Scaling** on **zkSync** for fast, low-cost, and Ethereum-secured transactions.  

---  

## Features  

### P2P Energy Trading Platform  
1. **User Profile & Authentication**  
   - Unique user profile with username, geolocation (converted to **geohash**), and IoT ID.  
   - **JWT-based authentication** for secure access.  

2. **Sell Order Placement (6-8 AM Window)**  
   - Sellers place orders in multiples of **10 kWh** at a specified **ETH/unit** price.  
   - **Geohash-based transaction fees** ensure fair energy pricing.  
   - No new sell orders allowed after **8 AM**.  

3. **Buy Order Execution (8-10 AM Window)**  
   - Buyers manually pick sell orders based on:  
     - Price per unit  
     - 5% commission  
     - Transfer fee (geohash-based distance cost)  
   - Partial order fulfillment supported.  

4. **Automated Order Matching (Post-10 AM)**  
   - System automatically **matches buy orders** based on:  
     - Quantity requested (**multiples of 10 kWh**)  
     - Maximum ETH/unit the buyer is willing to pay  

5. **Order Management & Cancellation**  
   - **Sell Orders**: Cancelable if unpicked.  
   - **Buy Orders**: Cancelable only if **5 places away** in the queue.  

6. **User Dashboard**  
   - Track active & completed trades, pending buy orders, and trade history.

![image alt](https://github.com/aadityas024/kriti/blob/6dd5686353f0de2ad3d16218abc9f4c672504b19/Screenshot%202025-02-04%20220610.png)

---

### Carbon Credit Marketplace  
1. **Selling Carbon Credits (ERC-20 CCTokens)**  
   - Sellers list **CCTokens** with a fixed price per token in **ETH**.  
   - Tokens are **escrowed** until the sale is finalized.  

2. **Buying Carbon Credits**  
   - Buyers purchase credits in exchange for ETH.  
   - Smart contract handles **automated settlement**.  

3. **Market Features**  
   - View active listings, retrieve order details, and cancel unfulfilled orders.  

4. **Commissions & Fees**  
   - **1% commission** from the bidder (refundable if the bid is unsuccessful).  
   - **2% commission** from the seller upon finalization.  

---

# IoT-Based Battery Capacity Monitoring for Buy Order Processing

## Overview

This document describes how we use an IoT-enabled ESP32 device to monitor the leftover battery storage capacity of a buyer before processing their buy order for energy trading.

Our system ensures that buyers can only place orders if they have sufficient battery capacity to store the purchased energy. The ESP32 IoT device reports real-time battery storage data to our backend server before an order is processed.

---

## 1. How the IoT System Works
### Step 1: ESP32 Collects Battery Capacity Data
Each buyer is equipped with an ESP32 IoT device, which is connected to a battery voltage sensor. This device:
- Measures the current battery voltage.
- Estimates the remaining storage capacity (percentage).
- Hosts a local HTTP server to respond with battery data on request.

### Step 2: The Server Requests Battery Data
- When a buyer attempts to place a buy order, our backend server sends an HTTP request to the ESP32 device installed at the buyer's location.
- The request is sent to:
http://<BUYER_ESP32_IP>/get-battery

Here is your README.md file explaining how your IoT system is used to receive battery storage capacity and check it before processing a buy order in your system.

markdown
Copy
Edit
# IoT-Based Battery Capacity Monitoring for Buy Order Processing

## Overview

This document describes how we use an IoT-enabled ESP32 device to monitor the leftover battery storage capacity of a buyer before processing their buy order for energy trading.

Our system ensures that buyers can only place orders if they have sufficient battery capacity to store the purchased energy. The ESP32 IoT device reports real-time battery storage data to our backend server before an order is processed.

---

## 1. How the IoT System Works
### Step 1: ESP32 Collects Battery Capacity Data
Each buyer is equipped with an ESP32 IoT device, which is connected to a battery voltage sensor. This device:
- Measures the current battery voltage.
- Estimates the remaining storage capacity (percentage).
- Hosts a local HTTP server to respond with battery data on request.

### Step 2: The Server Requests Battery Data
- When a buyer attempts to place a buy order, our backend server sends an HTTP request to the ESP32 device installed at the buyer's location.
- The request is sent to:
http://<BUYER_ESP32_IP>/get-battery

arduino
Copy
Edit
- The ESP32 device responds with battery voltage and available capacity.

### Step 3: Validating Buy Order
- Before processing the buy order, our ***ZK-SNARK*** the battery capacity from the ESP32 response.
- If the remaining capacity is sufficient, the order proceeds.
- If the battery is nearly full, the order is rejected to prevent overflow.

Each buyer must configure their ESP32 device to connect to Wi-Fi and serve battery data.
The description for user end configuring the ESP32 device is provided in the next section.

![image alt](https://github.com/aadityas024/kriti/blob/c40b2aa97ccb092193d45842b29bdaff9922ac07/Screenshot%202025-02-04%20220635.png)

---
# IoT-Based Battery Capacity Monitoring for Buy Order Processing

## Overview

This document describes how we use an **IoT-enabled ESP32 device** to monitor the **leftover battery storage capacity** of a buyer before processing their **buy order** for energy trading.

Our system ensures that buyers can only place orders if they have sufficient battery capacity to store the purchased energy. The ESP32 IoT device reports real-time battery storage data to our backend server before an order is processed.

---

## **1. How the IoT System Works**
### **Step 1: ESP32 Collects Battery Capacity Data**
Each buyer is equipped with an **ESP32 IoT device**, which is connected to a **battery voltage sensor**. This device:
- Measures the **current battery voltage**.
- Estimates the **remaining storage capacity** (percentage).
- Hosts a **local HTTP server** to respond with battery data on request.

### **Step 2: The Server Requests Battery Data**
- When a **buyer attempts to place a buy order**, our **backend server** sends an HTTP request to the ESP32 device installed at the buyer's location.
- The request is sent to:
```yaml
http://<BUYER_ESP32_IP>/get-battery
```

Here is your README.md file explaining how your IoT system is used to receive battery storage capacity and check it before processing a buy order in your system.

markdown
Copy
Edit
# IoT-Based Battery Capacity Monitoring for Buy Order Processing

## Overview

This document describes how we use an **IoT-enabled ESP32 device** to monitor the **leftover battery storage capacity** of a buyer before processing their **buy order** for energy trading.

Our system ensures that buyers can only place orders if they have sufficient battery capacity to store the purchased energy. The ESP32 IoT device reports real-time battery storage data to our backend server before an order is processed.

---

## **1. How the IoT System Works**
### **Step 1: ESP32 Collects Battery Capacity Data**
Each buyer is equipped with an **ESP32 IoT device**, which is connected to a **battery voltage sensor**. This device:
- Measures the **current battery voltage**.
- Estimates the **remaining storage capacity** (percentage).
- Hosts a **local HTTP server** to respond with battery data on request.

### **Step 2: The Server Requests Battery Data**
- When a **buyer attempts to place a buy order**, our **backend server** sends an HTTP request to the ESP32 device installed at the buyer's location.
- The request is sent to:
http://<BUYER_ESP32_IP>/get-battery

arduino
Copy
Edit
- The ESP32 device **responds with battery voltage and available capacity**.

### **Step 3: Validating Buy Order**
- Before **processing the buy order**, our ***ZK-SNARK*** the **battery capacity** from the ESP32 response.
- If the **remaining capacity is sufficient**, the order proceeds.
- If the **battery is nearly full**, the order is **rejected** to prevent overflow.

Each buyer must configure their **ESP32 device** to connect to Wi-Fi and serve battery data.
The description for user end configuring the ESP32 device is provided in the next section.

---
# IoT Device Setup for User-end

## Overview

This guide will help you connect your **ESP32 IoT device** to your **Wi-Fi network** and enable it to serve battery status information (e.g., voltage and capacity) via an **HTTP server**.

### Prerequisites:
- An **ESP32 microcontroller**.
- A **Wi-Fi network** with the SSID (network name) and password.
- A **battery voltage sensor** connected to the ESP32 (e.g., via the **ADC** pins).

In this guide, you will:
1. Connect your **ESP32 IoT device** to your Wi-Fi.
2. Set up the **IoT device** to serve the battery data (voltage and capacity).
3. Send the data from the **IoT device** to the **backend server**.

---

## 1. **Setting Up the IoT Device (ESP32)**

Follow these steps to get your **ESP32** connected to your Wi-Fi and ready to communicate with the backend server:

### Step 1: Download the Code

Download the **Arduino code** for the ESP32 from this repository (or copy the code provided below). This code configures your ESP32 to connect to a Wi-Fi network and serve battery data on request.

### Step 2: Update Wi-Fi Credentials

Before uploading the code to your ESP32, you need to **update the Wi-Fi credentials** in the `#define` section of the code. Replace the `your_SSID` and `your_PASSWORD` with your actual **Wi-Fi network name** (SSID) and **password**.

```cpp
// Replace with your network credentials
const char *ssid = "your_SSID";      // Your Wi-Fi SSID
const char *password = "your_PASSWORD"; // Your Wi-Fi password
```
### Step 3: Upload the Code to ESP32
1. Open Arduino IDE or PlatformIO.
2. Select your ESP32 board from the Tools > Board menu.
3. Connect your ESP32 to your computer via USB.
4. Click on Upload to upload the code to your ESP32.
### Code for the ESP32:

```cpp
#include <WiFi.h>
#include <ESPAsyncWebServer.h>

// Replace with your Wi-Fi credentials
const char *ssid = "your_SSID";      // Your Wi-Fi network name
const char *password = "your_PASSWORD"; // Your Wi-Fi password

// Create an HTTP server instance
AsyncWebServer server(80);

// Pin for battery voltage reading
#define BATTERY_VOLTAGE_PIN 34  

void setup() {
  Serial.begin(115200);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected! ESP32 IP: " + WiFi.localIP().toString());

  // Handle battery status request
  server.on("/get-battery", HTTP_GET, [](AsyncWebServerRequest *request){
    int batteryVoltage = analogRead(BATTERY_VOLTAGE_PIN);
    float voltage = batteryVoltage * (3.3 / 4095.0);
    int capacity = map(batteryVoltage, 0, 4095, 0, 100);

    String response = "Voltage: " + String(voltage) + "V, Capacity: " + String(capacity) + "%";
    request->send(200, "text/plain", response);
  });

  server.begin();
}

void loop() {
  // The server handles requests asynchronously
}
```
1. Click the "Upload" button (⭮ arrow icon in the Arduino IDE).
2. Wait for the upload to complete. You will see "Done uploading" in the bottom console.
3. Open Serial Monitor:
    Go to Tools > Serial Monitor.
    Set the baud rate to 115200.
### Step 4: Find the ESP32 IP Address
1. After connecting to Wi-Fi, the ESP32 will display its IP address in the Serial Monitor.
2.Copy the IP address (e.g., 192.168.1.100).
3.Test the connection by entering the following URL in a web browser:
```arduino
http://<ESP32_IP_ADDRESS>/get-battery
```
Example:
```arduino
http://192.168.1.100/get-battery
```
Expected response:
```yaml
Voltage: 3.7V, Capacity: 85%
```
### Step 5: Register Your IoT Device with Our Server
1. Send us your ESP32’s IP Address (displayed in Serial Monitor).
2. We will link your device ID to your account on our backend system.
Our server will request battery status updates from your ESP32 whenever needed.
### Step 6: Troubleshooting
#### ESP32 Not Connecting to Wi-Fi?
1. Double-check your Wi-Fi SSID and password.
2. Ensure your Wi-Fi is 2.4 GHz (ESP32 does not support 5 GHz).
3. Restart the ESP32 by unplugging and replugging it.
4. Try moving closer to the router.
#### Not Getting Battery Data?
1. Ensure the battery sensor is properly connected to pin 34.
2. Check the Serial Monitor for any error messages.
Restart the ESP32.
---

# Zero-Knowledge Proof for Energy Market Transactions

## Input Description

- `a` → Corresponds to the **buy order quantity** that the buyer is placing.
- `b` → Corresponds to the **sum of all pending buy orders** in the market queue (for post-10 AM transactions) or **0** (for 8-10 AM buying).
- `c` → **Storage capacity left** as informed by IoT devices.
- **Output (`valid`)**:
  - `1` → **Exceeds limit** → Transaction **blocked**.
  - `0` → **Under limit** → Transaction **proceeds**.
