# Table Frontend Application Development Guide

**Authors:** Milo Dennehy — Mobile App Lead · Yang Liu — Backend Lead

This guide will help you get your local development environment set up. 

---

##  Prerequisites

To begin development ensure you have the following installed on your machine    

For Mobile Development:

* **Node.js**: LTS version (v18 or v20+ recommended).
* **NPM**: `npm`.
* **Expo Go App (optional)**: Download it on your physical device ([iOS](https://apps.apple.com/us/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)) for quick testing.
* **IDE**: [VS Code](https://code.visualstudio.com/) is highly recommended, along with the **Expo Tools (optional)** extension.

---

## Getting Started

To run the application locally:

### 1. Install the required NPM packages
```bash
# From the repo root
cd ./frontend/mobile-app
npm install
```

### 2. Start the Expo development server
Launch the Metro bundler by running:

```bash
npm start mobile
```

### Viewing the development view
Once the server starts, a QR code will appear in your terminal. You can open the app using one of these methods:

Physical Device: Open your phone's camera (iOS) or the Expo Go app (Android) and scan the QR code. (Note: Your phone and computer must be on the same Wi-Fi network).

iOS Simulator: Press i in the terminal (requires macOS and Xcode).

Android Emulator: Press a in the terminal (requires Android Studio).

Browser View: Press w in the terminal.

### Quick Tips
Installing New Packages: Always use npm exec -w mobile -- expo install <package-name> instead of npm install <package-name>. This ensures the library version you install is fully compatible with the project's current Expo SDK version. Using a shared workspace, this means dependencies are hoisted to the root (./frontend).

Clearing Cache: If you experience unexpected layout or bundling issues, restart the server and clear the cache using:

```bash
npm run mobile:clean
```

```bash
npm run web:dev
```