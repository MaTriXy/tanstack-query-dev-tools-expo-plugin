import { Socket } from "socket.io-client";
import { Command } from "../_types/Command";
interface Props {
  socket: Socket;
  socketID: string;
  command: Command;
  newValue?: any;
}

export default function sendClientCommand({
  socket,
  socketID,
  command,
}: Props) {
  socket.emit("sendToSpecificClient", {
    targetClientId: socketID,
    message: command,
  });
}
