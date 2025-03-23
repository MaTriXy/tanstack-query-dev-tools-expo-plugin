import { onlineManager, QueryClient, QueryKey } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import * as Device from "expo-device";
import { useEffect, useRef } from "react";

import { Hydrate } from "./shared/hydration";
import { SyncMessage } from "./shared/types";

type QueryActions =
  | "ACTION-REFETCH"
  | "ACTION-INVALIDATE"
  | "ACTION-TRIGGER-ERROR"
  | "ACTION-RESTORE-ERROR"
  | "ACTION-RESET"
  | "ACTION-REMOVE"
  | "ACTION-TRIGGER-LOADING"
  | "ACTION-RESTORE-LOADING"
  | "ACTION-DATA-UPDATE"
  | "success";

interface QueryActionMessage {
  queryHash: string;
  queryKey: QueryKey;
  data: unknown;
  action: QueryActions;
  targetDevice: string;
}

interface Props {
  queryClient: QueryClient;
  setDevices: React.Dispatch<React.SetStateAction<(typeof Device)[]>>;
  selectedDevice: string;
  devices: (typeof Device)[];
}

export function useSyncQueriesWeb({
  queryClient,
  setDevices,
  selectedDevice,
  devices,
}: Props) {
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

  // Store selectedDevice in a ref to avoid effect re-runs
  const selectedDeviceRef = useRef(selectedDevice);

  // Update ref when selectedDevice changes and handle device switching
  useEffect(() => {
    selectedDeviceRef.current = selectedDevice;

    if (client) {
      // Clear all Query cache and mutations when device changes
      queryClient.clear();
      // Request fresh state from devices
      client.sendMessage("request-initial-state", {
        type: "initial-state-request",
      });
    }
  }, [selectedDevice, client, queryClient]);

  useEffect(() => {
    if (!client) {
      console.log("No client");
      return;
    }
    console.log("Connected");
    // Ping all connected devices for their device info
    client.sendMessage("device-request", {});

    // Subscribe to online manager changes
    onlineManager.subscribe((isOnline: boolean) => {
      client.sendMessage("online-manager", {
        action: isOnline
          ? "ACTION-ONLINE-MANAGER-ONLINE"
          : "ACTION-ONLINE-MANAGER-OFFLINE",
        targetDevice: selectedDeviceRef.current,
      });
    });
    // Subscribe to query changes
    const querySubscription = queryClient.getQueryCache().subscribe((event) => {
      switch (event.type) {
        case "updated":
          switch (event.action.type as QueryActions) {
            case "ACTION-REFETCH":
            case "ACTION-INVALIDATE":
            case "ACTION-TRIGGER-ERROR":
            case "ACTION-RESTORE-ERROR":
            case "ACTION-RESET":
            case "ACTION-REMOVE":
            case "ACTION-TRIGGER-LOADING":
            case "ACTION-RESTORE-LOADING":
              client.sendMessage("query-action", {
                queryHash: event.query.queryHash,
                queryKey: event.query.queryKey,
                action: event.action.type as QueryActions,
                targetDevice: selectedDeviceRef.current,
              } as QueryActionMessage);
              break;
            case "success":
              // @ts-ignore
              if (event.action.manual) {
                console.log(
                  "Sending manual query update to client targetDevice:",
                  selectedDeviceRef.current
                );
                client.sendMessage("query-action", {
                  queryHash: event.query.queryHash,
                  queryKey: event.query.queryKey,
                  data: event.query.state.data,
                  action: "ACTION-DATA-UPDATE",
                  targetDevice: selectedDeviceRef.current,
                } as QueryActionMessage);
              }
              break;
          }
      }
    });

    // Subscribe to query sync messages
    const syncSubscription = client.addMessageListener(
      "query-sync",
      (message: SyncMessage) => {
        if (message.type === "dehydrated-state") {
          // Only process data if it's from the selected device or if "all" is selected
          if (
            selectedDeviceRef.current === "All" ||
            message.Device.deviceName === selectedDeviceRef.current
          ) {
            // Sync online manager state
            onlineManager.setOnline(message.isOnlineManagerOnline);
            hydrateState(queryClient, message);
          }
        }
      }
    );

    // Subscribe to device changes
    const deviceSubscription = client.addMessageListener(
      "device-info",
      (response: { Device: typeof Device }) => {
        setDevices((prevDevices) => {
          const deviceExists = prevDevices.some(
            (device) => device.deviceName === response.Device.deviceName
          );
          if (!deviceExists) {
            return [...prevDevices, response.Device];
          }
          return prevDevices;
        });
      }
    );

    // Cleanup all subscriptions
    return () => {
      syncSubscription?.remove();
      deviceSubscription?.remove();
      querySubscription();
    };
  }, [queryClient, client]); // Keep dependencies minimal

  return { isConnected: !!client };
}

// Hydrate sets initial data state
function hydrateState(queryClient: QueryClient, message: SyncMessage) {
  Hydrate(queryClient as any, message.state, {
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      } as any,
    },
  });
}
