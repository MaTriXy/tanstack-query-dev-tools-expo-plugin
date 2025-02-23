import React, { useEffect, useState } from "react";
import { Query } from "@tanstack/react-query";
import QueryInformation from "./QueryInformation";
import QueryButton from "./QueryButton";
import { deepEqual } from "fast-equals";
import { Socket } from "socket.io-client";
import { User } from "../../_types/User";
interface Props {
  allQueries: Query[];
  socket: Socket;
  currentUser: User;
}
export default function QueriesList({
  allQueries,
  socket,
  currentUser,
}: Props) {
  const [selectedQuery, setSelectedQuery] = useState<Query>();
  useEffect(() => {
    const foundQuery = allQueries.find((query) => {
      if (!selectedQuery) return;
      const isMatching = deepEqual(
        query.options.queryKey,
        selectedQuery?.options.queryKey
      );
      return isMatching;
    });
    if (!foundQuery) return;
    setSelectedQuery(foundQuery);
  }, [allQueries, selectedQuery]);
  if (!allQueries) return null;
  return (
    <div className="flex overflow-auto divide-x-2 w-full">
      <div className="flex flex-col w-full ">
        {allQueries.map((query, inex) => {
          return (
            <QueryButton
              selected={selectedQuery}
              setSelected={setSelectedQuery}
              query={query}
              key={inex}
            />
          );
        })}
      </div>
      {selectedQuery && (
        <QueryInformation
          socket={socket}
          selectedQuery={selectedQuery}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
