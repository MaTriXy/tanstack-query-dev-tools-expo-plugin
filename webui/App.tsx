import { Query } from "@tanstack/react-query";
import { useDevToolsPluginClient, type EventSubscription } from "expo/devtools";
import React, { useEffect, useState } from "react";
import "./index.css";
interface ExtendedQuery extends Query {
  observersCount?: number; //  getObserversCount()
  isQueryStale?: boolean; // isStale()
}

export default function App() {
  const [allQueries, setAllQueries] = useState<ExtendedQuery[]>([]);
  // The template includes a simple example of sending and receiving messages
  // between the plugin and the app. useDevToolsPluginClient, imported from expo/devtools,
  //  provides functionality for sending and receiving messages between the plugin and the app.
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

  useEffect(() => {
    const subscriptions: EventSubscription[] = [];
    subscriptions.push(
      client?.addMessageListener("allQueries", (data) => {
        setAllQueries(data.queries);
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

  return (
    <div>
      <h1 className="text-3xl font-bold underline text-red-500">
        Hello world!
      </h1>
      <div>Connected: {client?.isConnected ? "true" : "false"}</div>
      <div>Dev Server: {client?.connectionInfo.devServer}</div>
      <div>Messages:</div>

      {allQueries.map((query, index) => (
        <div key={index}>{query.queryKey.join(", ")}</div>
      ))}
    </div>
  );
}
