import React from "react";
import QueryDetailsChip from "./QueryDetailsChip";
import { ExtendedQuery } from "../../_types/QueryExternal";
interface Props {
  query: ExtendedQuery | undefined;
}
export default function QueryDetails({ query }: Props) {
  if (query === undefined) {
    return null;
  }
  // Convert the timestamp to a Date object and format it
  const lastUpdated = new Date(query.state.dataUpdatedAt).toLocaleTimeString();

  return (
    <div className=" min-w-[200px] text-xs">
      <h3 className="text-left bg-[#EAECF0]  p-1">Query Details</h3>
      <div className="flex justify-between p-1">
        <div className="max-w-1/2 overflow-auto flex flex-wrap items-center">{`[ "${query.queryKey}" ]`}</div>
        <QueryDetailsChip query={query} />
      </div>
      <div className="flex justify-between p-1 ">
        <p> Observers:</p>
        {query.observersCount}
      </div>
      <div className="flex justify-between p-1">
        <p> Last Updated:</p>
        {`${lastUpdated}`}
      </div>
    </div>
  );
}
