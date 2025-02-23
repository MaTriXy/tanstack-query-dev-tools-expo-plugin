import { Query } from "@tanstack/react-query";
import QueriesList from "./QueriesList";
import React from "react";
import { Socket } from "socket.io-client";
import { User } from "../../_types/User";
interface Props {
  socket: Socket;
  allQueries: Query[] | undefined;
  currentUser: User | undefined;
}
export default function DevTools({ allQueries, socket, currentUser }: Props) {
  if (!allQueries || !currentUser) return null;
  return (
    <div className="bg-white min-w-[300px] h-[200px]">
      <QueriesList
        allQueries={allQueries}
        socket={socket}
        currentUser={currentUser}
      />
    </div>
  );
}
