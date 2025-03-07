import { useQueryClient } from "@tanstack/react-query";
import { View, Button } from "react-native";

export default function Test() {
  const queryClient = useQueryClient();
  const mutationCache = queryClient.getMutationCache();

  const handleToggleDevTools = () => {
    const mutations = mutationCache.getAll();

    mutations.forEach((mutation) => {
      // Create a new state based on current state
      const newState = {
        ...mutation.state,
        status: "success" as const,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        error: null,
      };
      // Force update the mutation state
      mutation.state = newState;
    });
  };
  function notifyCache() {
    const mutations = mutationCache.getAll();

    // mutationCache.notify({
    //   mutation: mutations[0],
    //   type: "updated",
    //   action: {
    //     type: "success",
    //     data: "test",
    //   },
    // });
    // @ts-ignore - This works for devtools refresh despite type error
    mutationCache.notify({ type: "observerOptionsUpdated" });
  }
  return (
    <View style={{ marginTop: 100 }}>
      <Button title="Mark All Success" onPress={handleToggleDevTools} />
      <Button title="Notify cache" onPress={notifyCache} />
    </View>
  );
}
