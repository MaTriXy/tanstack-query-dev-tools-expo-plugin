import { Query, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDevToolsPluginClient, type EventSubscription } from "expo/devtools";
import React, { useEffect, useState } from "react";

import "./index.css";
import { ExternalDevTools } from "./external-dash";
import { User } from "./external-dash/_types/User";
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
  const queryClient = new QueryClient();
  const [users, setUsers] = useState<User[]>([]);
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

  useEffect(() => {
    const subscriptions: EventSubscription[] = [];
    subscriptions.push(
      client?.addMessageListener(
        SYNC_QUERIES_MESSAGE_TYPE,
        (data: SyncQueriesMessage) => {
          console.log("device", data.device);
          console.log("queries", data.queries);
          setUsers((prevUsers) => {
            // Filter out any existing user with the same device
            const otherUsers = prevUsers.filter(
              (user) => user.device !== data.device
            );
            // Add the new user data
            return [
              ...otherUsers,
              {
                device: data.device,
                allQueries: data.queries,
              },
            ];
          });
        }
      )
    );

    return () => {
      for (const subscription of subscriptions) {
        subscription?.remove();
      }
    };
  }, [client]);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1>No client not found</h1>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ExternalDevTools users={users} />
    </QueryClientProvider>
  );
}
