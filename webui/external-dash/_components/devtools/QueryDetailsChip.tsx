import { Query } from "@tanstack/react-query";
import React from "react";
import { getQueryStatusLabel } from "../../_util/getQueryStatusLabel";
import { statusToBorderColorClass } from "../../_util/statusToBorderColorClass";
import { statusToTextColorClass } from "../../_util/statusToTextColorClass";
import { statusToqueryDetailsbgColorClass } from "../../_util/statusToqueryDetailsbgColorClass copy";
interface Props {
  query: Query;
}
export default function QueryDetailsChip({ query }: Props) {
  return (
    <div
      className={`text-xs p-2 border  rounded font-medium  
    ${statusToqueryDetailsbgColorClass(getQueryStatusLabel(query))}
    ${statusToTextColorClass(getQueryStatusLabel(query))}
    ${statusToBorderColorClass(getQueryStatusLabel(query))}
    `}
    >
      {getQueryStatusLabel(query)}
    </div>
  );
}
