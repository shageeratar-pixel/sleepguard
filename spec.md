# SleepGuard

## Current State
The SettingsPage has a Wearable Devices section with simple toggle switches for Fitbit and Apple Watch. No Bluetooth pairing flow, no available device list, and no connection instructions.

## Requested Changes (Diff)

### Add
- **Available Devices list** — show all supported wearable devices (Fitbit, Apple Watch/Galaxy Watch, Garmin, Whoop, Polar H10, Generic BLE Heart Rate Monitor) with icons, descriptions, and what data they provide (heart rate, SpO2, HRV, sleep stages, etc.)
- **Bluetooth Pairing Flow** — "Scan for Devices" button triggers Web Bluetooth API scan, shows discovered nearby devices in a list, allows user to select and pair
- **How-to-Connect Guide** — step-by-step instructions panel showing users how to enable Bluetooth on their device, enter pairing mode, and connect to the app
- **Paired Device Status** — show connected device with signal strength indicator, vitals data feed preview, and disconnect option
- **Connection Quality Badge** — show data accuracy level (Accurate / Standard / Estimated) based on whether a device is connected

### Modify
- Replace simple toggle switches with full pairing card UI per device
- Fitbit and Apple Watch cards now show "Pair via Bluetooth" instead of a toggle

### Remove
- Simple on/off toggle switches for Fitbit and Apple Watch (replaced by pairing flow)

## Implementation Plan
1. Rewrite the Wearable Devices section in SettingsPage.tsx
2. Add `BluetoothPairingModal` component inline with scan, device list, and pairing steps
3. Add `HowToConnectGuide` accordion panel with step-by-step instructions
4. Add supported devices catalog with icons, data types, and accuracy info
5. Wire Web Bluetooth API (`navigator.bluetooth.requestDevice`) with graceful fallback for unsupported browsers
6. Show paired device status card with real-time mock vitals preview
7. Validate and build
