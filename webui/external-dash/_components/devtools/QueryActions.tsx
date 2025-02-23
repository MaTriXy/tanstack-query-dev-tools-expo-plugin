import { Query, QueryKey } from "@tanstack/react-query";
import React from "react";
import ActionButton from "./ActionButton";
import { getQueryStatusLabel } from "../../_util/getQueryStatusLabel";
import sendClientCommand from "../../_util/sendClientCommand";
import { Socket } from "socket.io-client";
import { User } from "../../_types/User";
interface Props {
  query: Query<unknown, Error, unknown, QueryKey> | undefined;
  socket: Socket;
  currentUser: User;
}
type DevToolsErrorType = {
  name: string;
  initializer: (query: Query<unknown, Error, unknown, QueryKey>) => Error;
};

export default function QueryActions({ query, socket, currentUser }: Props) {
  if (query === undefined) {
    return null;
  }
  const queryStatus = query.state.status;
  function sendCommand(
    coomand:
      | "Refetch"
      | "Invalidate"
      | "Reset"
      | "Remove"
      | "Trigger Loading"
      | "Trigger Error"
      | "Data Update"
  ) {
    if (!query) {
      console.error("Query not found");
      return;
    }
    // Send client trigger loading command
    const socketID = currentUser && currentUser.id;
    if (!socketID) return;
    sendClientCommand({
      socket: socket,
      socketID: socketID,
      command: {
        queryKey: query.queryKey.toString(),
        command: coomand,
      },
    });
  }
  // Define the actions
  const handleRefetch = () => {
    sendCommand("Refetch");
  };
  const handleInvalidate = () => {
    sendCommand("Invalidate");
  };
  const handleReset = () => {
    sendCommand("Reset");
  };
  const handleRemove = () => {
    sendCommand("Remove");
  };
  const handleTriggerLoading = () => {
    sendCommand("Trigger Loading");
  };
  const handleTriggerError = () => {
    sendCommand("Trigger Error");
  };

  return (
    <div className="min-w-[200px] text-xs flex flex-wrap">
      <h3 className="text-left bg-[#EAECF0] p-1 w-full">Actions</h3>
      <ActionButton
        disabled={getQueryStatusLabel(query) === "fetching"}
        onClick={handleRefetch}
        bgColorClass="bg-btnRefetch"
        text="Refetch"
        textColorClass="text-btnRefetch"
      />
      <ActionButton
        disabled={queryStatus === "pending"}
        onClick={handleInvalidate}
        bgColorClass="bg-btnInvalidate"
        text="Invalidate"
        textColorClass="text-btnInvalidate"
      />
      <ActionButton
        disabled={queryStatus === "pending"}
        onClick={handleReset}
        bgColorClass="bg-btnReset"
        text="Reset"
        textColorClass="text-btnReset"
      />
      <ActionButton
        disabled={getQueryStatusLabel(query) === "fetching"}
        onClick={handleRemove}
        bgColorClass="bg-btnRemove"
        text="Remove"
        textColorClass="text-btnRemove"
      />
      <ActionButton
        disabled={false}
        onClick={handleTriggerLoading}
        bgColorClass="bg-btnTriggerLoading"
        text={
          query.state.data === undefined ? "Restore Loading" : "Trigger Loading"
        }
        textColorClass="text-btnTriggerLoading"
      />
      <ActionButton
        disabled={queryStatus === "pending"}
        onClick={handleTriggerError}
        bgColorClass="bg-btnTriggerLoadiError"
        text={queryStatus === "error" ? "Restore" : "Trigger Error"}
        textColorClass="text-btnTriggerLoadiError"
      />
    </div>
  );
}
