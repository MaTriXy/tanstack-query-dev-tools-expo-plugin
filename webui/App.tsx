import { Query } from "@tanstack/react-query";
import { useDevToolsPluginClient, type EventSubscription } from "expo/devtools";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
    <View style={styles.container}>
      <View style={styles.messagesContainer}>
        <View>
          <Text>Connected: {client?.isConnected ? "true" : "false"}</Text>
          <Text>Dev Server: {client?.connectionInfo.devServer}</Text>
        </View>

        <Text style={styles.text}>Messages:</Text>

        {allQueries.map((query, index) => (
          <Text key={index} style={styles.text}>
            {query.queryKey.join(", ")}
          </Text>
        ))}
      </View>
      <Text style={styles.text}>
        That's the Web UI of the DevTools plugin. You can now edit the UI in the
        App.tsx.
      </Text>
      <Text style={[styles.text, styles.devHint]}>
        For development, you can also add `devServer` query string to specify
        the WebSocket target to the app's dev server.
      </Text>
      <Text style={[styles.text, styles.devHint]}>For example:</Text>
      <Pressable
        onPress={() => {
          window.location.href =
            window.location.href + "?devServer=localhost:8080";
        }}
      >
        <Text style={[styles.text, styles.textLink]}>
          {`${window.location.href}?devServer=localhost:8080`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    marginBottom: 16,
  },
  devHint: {
    color: "#666",
  },
  textLink: {
    color: "#007AFF",
    textDecorationLine: "underline",
  },
});
