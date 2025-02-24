import { useDevToolsPluginClient } from "expo/devtools";

import { Command } from "../_types/Command";
import { User } from "../_types/User";
interface Props {
  currentUser: User;
}

export default function useSendClientCommand({ currentUser }: Props) {
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );
  function sendClientCommand(command: Command) {
    client?.sendMessage("sendToSpecificClient", {
      targetClientId: currentUser.device,
      message: command,
    });
  }

  return { sendClientCommand };
}
