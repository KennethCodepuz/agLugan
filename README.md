<div align="center">
  <img src="./frontend/agLugan/assets/logo-2.png" alt="agLugan Logo" width="150" />
  <h1>agLugan App</h1>
  <p><strong>A Real-time Public Utility Vehicle (PUV) & Commuter Monitoring Platform</strong></p>
  <p>
    <img src="https://img.shields.io/badge/status-active_development-success.svg" alt="Status: Active Development" />
    <img src="https://img.shields.io/badge/platform-Android%20%7C%20iOS-blue.svg" alt="Platform" />
    <img src="https://img.shields.io/badge/backend-Spring%20Boot-green.svg" alt="Backend" />
  </p>
</div>

---

## 📖 Overview

**agLugan** bridges the gap between public utility drivers and daily commuters by providing real-time visibility. Commuters can view approaching jeeps, buses, and modern PUVs on a live map along with accurate ETAs. Conversely, drivers are empowered with real-time analytics showing where commuter demand is actively forming (at waiting sheds and terminals), allowing them to optimize their routes and help alleviate traffic congestion.

## ✨ Core Features

### 🔐 Authentication & Session Management
- **Google OAuth2 Integration**: Secure, one-tap login and registration flow via Google.
- **Role-Based Access Control**: Distinct profiles and capabilities for **Commuters** and **Drivers**.
- **Secure JWT Sessions**: Long-lived, cryptographically secure sessions utilizing `expo-secure-store` for persistent native device storage.
- **Robust Registration Flow**: Multi-step registration to capture role-specific metadata (e.g., driver's license, plate number, etc.).

### 🗺️ Live Mapping & Tracking (Powered by Google Maps)
- **Custom Aesthetic Maps**: Beautifully customized dark-themed map styles for excellent contrast and low-light visibility.
- **Real-Time Websocket Telemetry**: Bi-directional, highly-performant WebSocket connections to broadcast and receive live GPS coordinates.
- **Smooth Animations**: Animated markers (`MarkerAnimated`) that smoothly interpolate movement as drivers and commuters travel.
- **Custom Map Markers**: Unique iconography for waiting sheds, terminals, drivers, and commuters.

### 📊 Smart Zones & Analytics
- **Dynamic ETA Calculations**: Real-time Estimated Time of Arrival (ETA) updates calculated using distance vectors and speeds, pushed live to commuters.
- **Smart Zone Assignment**: Backend spatial algorithms dynamically group commuters into specific geographic zones (Waiting Sheds, Terminals).
- **Live Occupancy Badges**: Real-time badges floating over terminals showing exactly how many commuters are waiting there, allowing drivers to make data-driven routing decisions.

---

## 🛠️ Technology Stack

### **Frontend (Mobile App)**
- **Framework**: React Native with Expo
- **Mapping**: `react-native-maps` with Google Maps Provider
- **State & Routing**: Expo Router, React Context API
- **Local Storage**: `expo-secure-store`
- **Auth**: `@react-native-google-signin/google-signin`

### **Backend (API & WebSockets)**
- **Framework**: Java + Spring Boot
- **Database**: PostgreSQL
- **Real-time Protocol**: Spring WebSockets
- **Security**: JWT (JSON Web Tokens), Google API Client
- **Spatial Processing**: Distance and ETA calculation algorithms

---

## 🚀 Planned Capabilities & Roadmap
- [ ] **Waiting Shed Detail View**: Detailed drill-downs to see exact commuter demographics and projected wait times per terminal.
- [ ] **Payment Integration**: Seamless digital wallet integration for fare payments directly inside the app.
- [ ] **Driver Analytics Dashboard**: Heatmaps and historical data for drivers to identify peak locations and times.
- [ ] **Trip History**: A log of past commutes and driver shifts for accountability and tracking.

---

> 🚧 **Disclaimer:** This project is currently in active development. Features are subject to change, and payment integrations are currently disabled.
