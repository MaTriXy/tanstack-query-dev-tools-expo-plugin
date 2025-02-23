import { ExtendedQuery } from "../../_types/QueryExternal";
import { getQueryStatusLabel } from "../../_util/getQueryStatusLabel";
import { statusTobgColorClass } from "../../_util/statusTobgColorClass";
import React from "react";
interface Props {
  query: ExtendedQuery;
  setSelected: React.Dispatch<React.SetStateAction<ExtendedQuery | undefined>>;
  selected: ExtendedQuery | undefined;
}
export default function QueryButton({ query, setSelected, selected }: Props) {
  return (
    <button
      onClick={() => {
        setSelected(query === selected ? undefined : query);
      }}
      className={`
    flex items-center cursor-pointer
     text-[#344054] bg-white border-b-[1px] border-[#d0d5dd] hover:bg-[#EAECF0]
      text-xs
      ${selected?.queryKey == query.queryKey ? "bg-[#eaecf0]" : ""}
      `}
    >
      <div
        className={`p-3  w-[18px] h-[23px] flex items-center justify-center
      ${statusTobgColorClass(getQueryStatusLabel(query))}
      `}
      >
        {query.observersCount}
      </div>
      <div className="flex justify-between w-full  ">
        <span className="py-1 px-2">{`["${query.queryKey}"]`}</span>{" "}
        {false && ( //query.isDisabled() &&
          <p className="text-xs self-stretch flex items-center p-0 px-2 text-[#1d2939] bg-[#d0d5dd] border-b border-[#d0d5dd]">
            disabled
          </p>
        )}
      </div>
    </button>
  );
}
