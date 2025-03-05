import { QueryClient, hydrate } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import { useEffect } from "react";

interface Props {
  queryClient: QueryClient;
}

interface SyncMessage {
  type: "dehydrated-state";
  state: unknown;
}

// This hook runs on the web side to receive data from mobile
export function useSyncQueriesWeb({ queryClient }: Props) {
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

  useEffect(() => {
    if (!client) {
      console.log("no client");
      return;
    }
    console.log("web client connected, will receive from expo");

    // Handle incoming sync messages
    const subscription = client.addMessageListener(
      "query-sync",
      (message: SyncMessage) => {
        if (message.type === "dehydrated-state") {
          console.log("web received dehydrated state from expo");

          // Hydrate the incoming state
          hydrate(queryClient, message.state, {
            defaultOptions: {
              queries: {
                // Prevent refetching when hydrating
                // @ts-expect-error - Prevent refetching when hydrating this is a valid type hopefully
                staleTime: Infinity,
              },
            },
          });
        }
      }
    );

    return () => {
      subscription?.remove();
    };
  }, [queryClient, client]);

  return { isConnected: !!client };
}
