import React from "react";
import { Query } from "@tanstack/react-query";
import QueryDetails from "./QueryDetails";
import QueryActions from "./QueryActions";
import DataExplorer from "./Explorer";
import { Socket } from "socket.io-client";
import { User } from "../../_types/User";
interface Props {
  selectedQuery: Query | undefined;
  socket: Socket;
  currentUser: User;
}
export default function QueryInformation({
  selectedQuery,
  socket,
  currentUser,
}: Props) {
  return (
    <div className="flex flex-col w-full ">
      <QueryDetails query={selectedQuery} />
      <QueryActions
        query={selectedQuery}
        socket={socket}
        currentUser={currentUser}
      />
      <h3 className="text-left bg-[#EAECF0] p-1 w-full text-xs">
        Data Explorer
      </h3>
      <div className="p-2">
        <DataExplorer
          currentUser={currentUser}
          socket={socket}
          editable={true}
          label="Data"
          value={selectedQuery?.state.data}
          defaultExpanded={["Data"]}
          activeQuery={selectedQuery}
        />
      </div>
      <h3 className="text-left bg-[#EAECF0] p-1 w-full text-xs">
        Query Explorer
      </h3>
      <div className="p-2">
        <DataExplorer
          currentUser={currentUser}
          socket={socket}
          label="Query"
          value={selectedQuery}
          defaultExpanded={["Query", "queryKey"]}
          activeQuery={selectedQuery}
        />
      </div>
    </div>
  );
}
