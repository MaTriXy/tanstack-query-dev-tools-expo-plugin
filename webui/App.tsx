import { ReactQueryDevtools } from "@tanstack/react-query-devtools/src/production";
import { useDevToolsPluginClient } from "expo/devtools";
import * as Device from "expo-device";
import { useState } from "react";
import "./index.css";

import DeviceInfo from "./external-dash/DeviceInfo";
import { DeviceSelection } from "./external-dash/DeviceSelection";
import Providers from "./external-dash/providers";

export default function App() {
  const [devices, setDevices] = useState<(typeof Device)[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>(
    devices.length > 0 ? "All" : "No devices available"
  );
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

  const selectedDeviceData = devices.find(
    (device) => device.deviceName === selectedDevice
  );
  return (
    <Providers setDevices={setDevices}>
      <div className="flex flex-col w-full h-full bg-gray-900 text-gray-200">
        <header className="w-full px-4 py-3 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                client ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span className="text-sm font-mono">
              {client ? "Connected" : "Disconnected"}
            </span>
          </div>
          <DeviceSelection
            selectedDevice={selectedDevice}
            setSelectedDevice={setSelectedDevice}
            devices={devices}
          />
        </header>
        <main className="flex-1 p-4 overflow-auto">
          {selectedDeviceData && <DeviceInfo deviceData={selectedDeviceData} />}
          {/* Map over all devices if selectedDevice is "All" */}
          {selectedDevice === "All" &&
            devices.map((device) => (
              <DeviceInfo key={device.deviceName} deviceData={device} />
            ))}
        </main>
      </div>
      <ReactQueryDevtools initialIsOpen />
    </Providers>
  );
}
