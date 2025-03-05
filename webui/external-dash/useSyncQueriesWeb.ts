import { QueryClient } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import { useEffect } from "react";
import { Platform } from "react-native";

interface Props {
  queryClient: QueryClient;
}

export function useSyncQueriesWeb({ queryClient }: Props) {
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

  useEffect(() => {
    if (!client) {
      console.log("no client");
      return;
    }
    console.log("client is connected");

    // Subscribe to cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.query) {
        console.log("outgoing query", event);
        client.sendMessage("query-sync", {
          type: "query",
          action: "updated",
          device: Platform.OS,
          query: {
            queryHash: event.query.queryHash,
            queryKey: event.query.queryKey,
            state: event.query.state,
          },
        });
      }
    });

    // Handle incoming sync messages
    const subscription = client.addMessageListener(
      "query-sync",
      (message: any) => {
        if (
          message.type === "query" &&
          message.action === "updated" &&
          message.device !== Platform.OS // Prevent echo
        ) {
          console.log("incoming query", message);
          queryClient.setQueryData(
            message.query.queryKey,
            message.query.state.data
          );
        }
      }
    );

    return () => {
      unsubscribe();
      subscription?.remove();
    };
  }, [queryClient, client]);

  return { isConnected: !!client };
}
