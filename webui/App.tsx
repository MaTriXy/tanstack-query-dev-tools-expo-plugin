import { Query, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useDevToolsPluginClient, type EventSubscription } from "expo/devtools";
import React, { useEffect, useState } from "react";

import "./index.css";
import { View, Text } from "react-native";

import { User } from "./external-dash/_types/User";
import Providers from "./external-dash/providers";
import { useSyncQueriesWeb } from "./external-dash/useSyncQueriesWeb";
interface ExtendedQuery extends Query {
  observersCount?: number; //  getObserversCount()
  isQueryStale?: boolean; // isStale()
}
const SYNC_QUERIES_MESSAGE_TYPE = "allQueries" as const;
interface SyncQueriesMessage {
  queries: ExtendedQuery[];
  device: "ios" | "android" | "web" | "windows" | "macos";
}
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
        <Text>Connected</Text>
      </View>
      {/* <ExternalDevTools users={users} /> */}
      <ReactQueryDevtools initialIsOpen={false} />
    </Providers>
  );
}
