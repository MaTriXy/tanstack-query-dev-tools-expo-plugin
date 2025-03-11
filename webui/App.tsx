import { ReactQueryDevtools } from "@tanstack/react-query-devtools/src/production";
import { useDevToolsPluginClient } from "expo/devtools";
import { View, Text } from "react-native";

import Providers from "./external-dash/providers";

export default function App() {
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );
  const envMode = process.env.NODE_ENV || "development";

  return (
    <Providers>
      <View
        style={{
          flex: 1,
          height: 25,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: client ? "lightgreen" : "lightcoral",
        }}
      >
        <Text>
          {client ? "Connected" : "Disconnected"} ({envMode})
        </Text>
      </View>
      <ReactQueryDevtools initialIsOpen />
    </Providers>
  );
}
