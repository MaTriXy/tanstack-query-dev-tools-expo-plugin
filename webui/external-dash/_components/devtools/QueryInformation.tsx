import { Query } from "@tanstack/react-query";
import React from "react";

import DataExplorer from "./Explorer";
import QueryActions from "./QueryActions";
import QueryDetails from "./QueryDetails";
import { User } from "../../_types/User";
interface Props {
  selectedQuery: Query | undefined;
  currentUser: User;
}
export default function QueryInformation({
  selectedQuery,
  currentUser,
}: Props) {
  return (
    <div className="flex flex-col w-full ">
      <QueryDetails query={selectedQuery} />
      <QueryActions query={selectedQuery} currentUser={currentUser} />
      <h3 className="text-left bg-[#EAECF0] p-1 w-full text-xs">
        Data Explorer
      </h3>
      <div className="p-2">
        <DataExplorer
          currentUser={currentUser}
          editable
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
          label="Query"
          value={selectedQuery}
          defaultExpanded={["Query", "queryKey"]}
          activeQuery={selectedQuery}
        />
      </div>
    </div>
  );
}
