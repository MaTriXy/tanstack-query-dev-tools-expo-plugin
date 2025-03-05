import { QueryClient, dehydrate } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import { useEffect } from "react";

interface Props {
  queryClient: QueryClient;
}

interface SyncMessage {
  type: "dehydrated-state";
  state: unknown;
}

// This hook runs on the Expo/mobile side to send data to web
export function useSyncQueries({ queryClient }: Props) {
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

  useEffect(() => {
    if (!client) {
      console.log("no client");
      return;
    }
    console.log("expo client connected, will sync to web");

    // Subscribe to cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      // Dehydrate the current state
      const dehydratedState = dehydrate(queryClient, {
        shouldDehydrateQuery: () => true, // Include all queries
        shouldDehydrateMutation: () => true, // Include all mutations
      });

      const syncMessage: SyncMessage = {
        type: "dehydrated-state",
        state: dehydratedState,
      };

      console.log("expo sending dehydrated state to web");
      client.sendMessage("query-sync", syncMessage);
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, client]);

  return { isConnected: !!client };
}
