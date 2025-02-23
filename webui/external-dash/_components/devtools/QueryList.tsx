import React from "react";
import QueryButton from "./QueryButton";
import useAllQueries from "../../_hooks/useAllQueries";
import { Query, QueryKey } from "@tanstack/react-query";
interface Props {
  selectedQuery: Query | undefined;
  setSelectedQuery: React.Dispatch<
    React.SetStateAction<Query<unknown, Error, unknown, QueryKey> | undefined>
  >;
}
export default function QueryList({ selectedQuery, setSelectedQuery }: Props) {
  // Holds all query keys
  const queryKeys = useAllQueries();
  return (
    <div className="flex flex-col w-full ">
      {queryKeys.map((query, inex) => {
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
  );
}
