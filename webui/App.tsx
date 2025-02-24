import { Query, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDevToolsPluginClient, type EventSubscription } from "expo/devtools";
import React, { useEffect, useState } from "react";

import "./index.css";
interface ExtendedQuery extends Query {
  observersCount?: number; //  getObserversCount()
  isQueryStale?: boolean; // isStale()
}

export default function App() {
  const queryClient = new QueryClient();

  const [allQueries, setAllQueries] = useState<any>();

  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

  useEffect(() => {
    console.log("client", client?.connectionInfo);
    const subscriptions: EventSubscription[] = [];
    subscriptions.push(
      client?.addMessageListener("allQueries", (data) => {
        console.log("allQueries", data);
        setAllQueries(data);
        // alert(`Received ping from ${data.from}`);
        // client?.sendMessage("ping", { from: "web" });
      })
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
      <div className="flex flex-col items-center justify-center h-screen">
        <h1>{client?.isConnected() ? "Connected" : "Not Connected"}</h1>
        <p>{allQueries?.queries?.length || 0}</p>
      </div>
    </QueryClientProvider>
  );
}
