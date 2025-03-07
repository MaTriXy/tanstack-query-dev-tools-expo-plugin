import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useDevToolsPluginClient } from "expo/devtools";
import "./index.css";
import { View, Text } from "react-native";

import Test from "./external-dash/Test";
import Providers from "./external-dash/providers";

export default function App() {
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

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
        <Text>{client ? "Connected" : "Disconnected"}</Text>
        <Test />
      </View>
      <ReactQueryDevtools initialIsOpen />
    </Providers>
  );
}
