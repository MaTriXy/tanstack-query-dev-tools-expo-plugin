import io, { Socket } from "socket.io-client";
import { ClientQuery } from "../_types/ClientQuery";
import { useEffect, useState } from "react";
import { User } from "../_types/User";
interface Props {
  query: ClientQuery;
  socketURL: string;
}
let socket = null as Socket | null; // Module-level variable to store the socket instance
export default function useConnectedUsers({ query, socketURL }: Props) {
  const [isConnected, setIsConnected] = useState(!!socket?.connected);
  const [users, setUsers] = useState<User[]>([]);

  if (!socket) {
    // Initialize the socket only if it hasn't been already initialized
    socket = io(socketURL, {
      autoConnect: false, // Initially prevent automatic connection
      query,
    });
  }

  function connect() {
    socket?.connect();
  }
  function disconnect() {
    socket?.disconnect();
  }
  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
    }
    !socket.connected && connect();
    // Global user list returned from server whenever a new user is added
    socket.on("users-update", (newUsers: User[]) => {
      setUsers(newUsers);
    });
    socket?.on("connect", onConnect);
    socket?.on("disconnect", onDisconnect);

    return () => {
      socket.off("users-update");
      socket.off("connect");
      socket.off("disconnect");
      onDisconnect();
      disconnect();
    };
  }, []);
  return { socket, connect, disconnect, isConnected, users };
}
