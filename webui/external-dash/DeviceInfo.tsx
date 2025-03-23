import * as Device from "expo-device";
import React from "react";

interface DeviceInfoItemProps {
  label: string;
  value: string | number | null | undefined;
}
interface DeviceInfoProps {
  deviceData: typeof Device;
}
function DeviceInfoItem({ label, value }: DeviceInfoItemProps) {
  const displayValue =
    value === null || value === undefined ? "N/A" : value.toString();

  return (
    <div className="flex justify-between py-2 border-b border-gray-700 last:border-0">
      <span className="text-gray-400 font-mono text-sm">{label}</span>
      <span className="text-gray-200 font-mono text-sm truncate max-w-[60%] text-right">
        {displayValue}
      </span>
    </div>
  );
}

export function DeviceInfo({ deviceData }: DeviceInfoProps) {
  const device = deviceData;

  function getDeviceTypeLabel(deviceType: number | null) {
    if (deviceType === null) return null;

    const typeMap = {
      [device.DeviceType.UNKNOWN]: "Unknown",
      [device.DeviceType.PHONE]: "Phone",
      [device.DeviceType.TABLET]: "Tablet",
      [device.DeviceType.DESKTOP]: "Desktop",
      [device.DeviceType.TV]: "TV",
    };

    return typeMap[deviceType as keyof typeof typeMap] || "Unknown";
  }

  function formatMemory(bytes: number | null) {
    if (!bytes) return null;

    if (bytes >= 1024 * 1024 * 1024) {
      return `${Math.round(bytes / (1024 * 1024 * 1024))} GB`;
    }
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  }

  if (!device) {
    return (
      <div className="bg-gray-800 rounded-md border border-gray-700 p-4">
        <p className="text-gray-400 font-mono text-sm">
          No device information available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-md border border-gray-700 p-4 my-4">
      <h2 className="text-gray-200 font-mono text-md mb-3 font-semibold">
        Device Information
      </h2>
      <div className="divide-y divide-gray-700">
        <DeviceInfoItem label="Device Name" value={device.deviceName} />
        <DeviceInfoItem label="Model" value={device.modelName} />
        <DeviceInfoItem label="Manufacturer" value={device.manufacturer} />
        <DeviceInfoItem label="Brand" value={device.brand} />
        <DeviceInfoItem
          label="OS"
          value={`${device.osName} ${device.osVersion}`}
        />
        <DeviceInfoItem
          label="Device Type"
          value={getDeviceTypeLabel(device.deviceType)}
        />
        <DeviceInfoItem
          label="Memory"
          value={formatMemory(device.totalMemory)}
        />

        {device.deviceYearClass && (
          <DeviceInfoItem label="Year Class" value={device.deviceYearClass} />
        )}

        {device.platformApiLevel && (
          <DeviceInfoItem label="API Level" value={device.platformApiLevel} />
        )}

        {device.modelId && (
          <DeviceInfoItem label="Model ID" value={device.modelId} />
        )}

        {device.osBuildId && (
          <DeviceInfoItem label="OS Build" value={device.osBuildId} />
        )}

        {device.supportedCpuArchitectures &&
          device.supportedCpuArchitectures.length > 0 && (
            <DeviceInfoItem
              label="CPU Architecture"
              value={device.supportedCpuArchitectures.join(", ")}
            />
          )}

        {device.isDevice !== undefined && (
          <DeviceInfoItem
            label="Physical Device"
            value={device.isDevice ? "Yes" : "No (Simulator/Emulator)"}
          />
        )}
      </div>
    </div>
  );
}

export default DeviceInfo;
