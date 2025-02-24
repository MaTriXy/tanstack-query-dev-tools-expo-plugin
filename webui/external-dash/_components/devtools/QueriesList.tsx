import { Query } from "@tanstack/react-query";
import { deepEqual } from "fast-equals";
import React, { useEffect, useState } from "react";

import QueryButton from "./QueryButton";
import QueryInformation from "./QueryInformation";
import { User } from "../../_types/User";
interface Props {
  allQueries: Query[];
  currentUser: User;
}
export default function QueriesList({ allQueries, currentUser }: Props) {
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
          selectedQuery={selectedQuery}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
